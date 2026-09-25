import {active,agentVisit,body,db,event,getDeviceForAgent,json,num,optionalNum,payloadHash,qualityFromAccuracy,rate,str,verifyDeviceSignature,wrap} from '@/lib/server';
import {distanceMetres} from '@/lib/contracts';
import {evaluateHealth,sequenceStatus} from '@/lib/integrity';

type Rejected={id:string;code:string;recorded?:boolean};
type Normalized={id:string;sequence_number:number;lat:number;lng:number;accuracy:number;altitude:number|null;altitude_accuracy:number|null;heading:number|null;speed:number|null;simulated:boolean;recorded_at:number;queued_at:number};
type Prev={lat:number;lng:number;accuracy:number;recorded_at:number;sequence_number:number};

const MAX_RAW_EVIDENCE=4000;

/** Server-derived integrity flags. Suspicious fixes are persisted with flags, never silently dropped. */
function integrityFlags(o:Normalized,previous:Prev|null){
  const flags:string[]=[];
  if(o.simulated)flags.push('simulated_location');
  if(previous&&o.sequence_number>previous.sequence_number){
    const dt=(o.recorded_at-Number(previous.recorded_at))/1000;
    if(dt>0){const implied=distanceMetres({lat:Number(previous.lat),lng:Number(previous.lng)},o)/dt;if(implied>100&&o.accuracy<250&&Number(previous.accuracy)<250)flags.push('implausible_speed')}
    // A later sequence number recorded materially earlier than its predecessor.
    if(o.recorded_at<Number(previous.recorded_at)-1000)flags.push('timestamp_anomaly');
  }
  // Queued before it was recorded (device clock / pipeline inconsistency).
  if(!flags.includes('timestamp_anomaly')&&o.queued_at<o.recorded_at-5000)flags.push('timestamp_anomaly');
  return flags;
}
function plausibilityFrom(flags:string[]){return flags.includes('simulated_location')?'simulated':flags.includes('implausible_speed')?'implausible_speed':flags.includes('timestamp_anomaly')?'timestamp_anomaly':'normal'}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){return wrap(async()=>{
  const id=(await params).id,{u,v}=await agentVisit(id),b=await body(req),now=Date.now();
  active(v);
  await rate('obs:'+v.id,180);
  const deviceId=str(b.device_id,100),epoch=str(b.share_epoch,100),device=await getDeviceForAgent(deviceId,u.userId);
  if(v.status!=='sharing'||v.share_epoch!==epoch)return json({error:'This tracking epoch is no longer active.',code:'EPOCH_NOT_ACTIVE'},409);
  if(v.active_device_id&&v.active_device_id!==deviceId)return json({error:'This visit is bound to another registered device.',code:'DEVICE_MISMATCH'},409);
  if(!Array.isArray(b.observations)||b.observations.length<1||b.observations.length>100)return json({error:'Send between 1 and 100 observations.'},400);
  const envelope={device_id:deviceId,visit_id:v.id,share_epoch:epoch,observations:b.observations};
  await verifyDeviceSignature(device,envelope,b.signature);

  const processed:string[]=[],rejected:Rejected[]=[],accepted:(Normalized&{payload_hash:string})[]=[],rejectionInserts:D1PreparedStatement[]=[];
  const batchIds=new Map<string,string>(),batchSequences=new Set<number>();
  const start=Number(v.share_started_at||v.created_at)-300000,end=Number(v.share_until||v.expires_at)+60000;

  for(const raw of b.observations){
    let oid='unknown',sequence=NaN;
    try{
      oid=str(raw?.id,100);
      sequence=Number(raw?.sequence_number);
      if(!Number.isSafeInteger(sequence)||sequence<0||sequence>1_000_000_000)throw new Error('INVALID_SEQUENCE');
      const recorded=Number(raw?.recorded_at),queued=Number(raw?.queued_at||recorded);
      if(!Number.isFinite(recorded)||recorded<start||recorded>end||recorded>now+60000)throw new Error('INVALID_TIME');
      const normalized:Normalized={id:oid,sequence_number:sequence,lat:num(raw?.lat,-90,90),lng:num(raw?.lng,-180,180),accuracy:num(raw?.accuracy,0,50000),altitude:optionalNum(raw?.altitude,-2000,20000),altitude_accuracy:optionalNum(raw?.altitude_accuracy,0,50000),heading:optionalNum(raw?.heading,0,360),speed:optionalNum(raw?.speed,0,500),simulated:raw?.simulated===true,recorded_at:recorded,queued_at:Number.isFinite(queued)?queued:recorded};
      const h=await payloadHash(normalized);
      // In-batch duplicates would otherwise violate the unique index and fail the whole batch.
      if(batchIds.has(oid)){if(batchIds.get(oid)===h)processed.push(oid);else rejected.push({id:oid,code:'OBSERVATION_ID_CONFLICT'});continue}
      const existing=await db().prepare('SELECT payload_hash FROM points WHERE id=?').bind(oid).first<{payload_hash:string|null}>();
      if(existing){if(existing.payload_hash===h)processed.push(oid);else rejected.push({id:oid,code:'OBSERVATION_ID_CONFLICT'});continue}
      const priorRejection=await db().prepare('SELECT code FROM observation_rejections WHERE id=?').bind(oid).first<{code:string}>();
      if(priorRejection){rejected.push({id:oid,code:priorRejection.code,recorded:true});continue}
      if(batchSequences.has(sequence)||await sequenceTaken(v.id,epoch,sequence)){rejected.push({id:oid,code:'SEQUENCE_CONFLICT'});continue}
      batchIds.set(oid,h);batchSequences.add(sequence);
      accepted.push({...normalized,payload_hash:h});
    }catch(e){
      const m=e instanceof Error?e.message:'';
      const code=m==='INVALID_SEQUENCE'||m==='INVALID_TIME'?m:'INVALID_OBSERVATION';
      // Account for the sequence number with a persisted rejection record (raw evidence + reason) so the
      // epoch can still prove contiguity. Unusable IDs/sequences cannot be accounted and are only reported.
      if(oid!=='unknown'&&Number.isSafeInteger(sequence)&&sequence>=0&&sequence<=1_000_000_000&&!batchIds.has(oid)&&!batchSequences.has(sequence)){
        const exists=await db().prepare('SELECT code FROM observation_rejections WHERE id=?').bind(oid).first<{code:string}>();
        if(exists){rejected.push({id:oid,code:exists.code,recorded:true});continue}
        const inPoints=await db().prepare('SELECT 1 AS x FROM points WHERE id=?').bind(oid).first();
        if(!inPoints&&!await sequenceTaken(v.id,epoch,sequence)){
          let rawText='';try{rawText=JSON.stringify(raw).slice(0,MAX_RAW_EVIDENCE)}catch{rawText=''}
          rejectionInserts.push(db().prepare('INSERT INTO observation_rejections (id,visit_id,device_id,share_epoch,sequence_number,code,raw_payload,payload_hash,received_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(oid,v.id,deviceId,epoch,sequence,code,rawText,await payloadHash(raw??null),now));
          batchIds.set(oid,'rejected');batchSequences.add(sequence);
          rejected.push({id:oid,code,recorded:true});continue;
        }
      }
      rejected.push({id:oid,code});
    }
  }

  accepted.sort((a,b)=>a.sequence_number-b.sequence_number);
  const inserts:D1PreparedStatement[]=[];
  let previous:Prev|null=accepted.length?await db().prepare('SELECT lat,lng,accuracy,recorded_at,sequence_number FROM points WHERE visit_id=? AND share_epoch=? AND sequence_number<? ORDER BY sequence_number DESC LIMIT 1').bind(v.id,epoch,accepted[0].sequence_number).first<Prev>():null;
  for(const o of accepted){
    const flags=integrityFlags(o,previous);
    inserts.push(db().prepare('INSERT INTO points (id,visit_id,device_id,share_epoch,sequence_number,lat,lng,accuracy,altitude,altitude_accuracy,heading,speed,simulated,recorded_at,queued_at,received_at,quality_class,plausibility_state,payload_hash,integrity_flags) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(o.id,v.id,deviceId,epoch,o.sequence_number,o.lat,o.lng,o.accuracy,o.altitude,o.altitude_accuracy,o.heading,o.speed,o.simulated?1:0,o.recorded_at,o.queued_at,now,qualityFromAccuracy(o.accuracy),plausibilityFrom(flags),o.payload_hash,flags.length?JSON.stringify(flags):null));
    processed.push(o.id);
    previous=o;
  }
  if(inserts.length||rejectionInserts.length)await db().batch([...inserts,...rejectionInserts]);

  const seq=await sequenceStatus(db(),v.id,epoch);
  const latest=await db().prepare('SELECT recorded_at,received_at,integrity_flags FROM points WHERE visit_id=? AND share_epoch=? ORDER BY sequence_number DESC LIMIT 1').bind(v.id,epoch).first<{recorded_at:number;received_at:number;integrity_flags:string|null}>();
  const health=evaluateHealth(v,latest,seq,now);
  if((inserts.length||rejectionInserts.length)&&health.state!==v.tracking_health)await event(v.id,'tracking_health_changed','server',JSON.stringify({from:v.tracking_health??null,to:health.state,reasons:health.reasons,missing_observations:health.missing_observations,last_sequence:seq.max,contiguous_through:seq.contiguousThrough})).run();
  if(inserts.length||rejectionInserts.length)await db().prepare('UPDATE visits SET last_received_at=?,last_sequence=?,missing_observations=?,tracking_health=?,health_reason=?,health_evaluated_at=? WHERE id=? AND share_epoch=?').bind(inserts.length?now:v.last_received_at,seq.max,health.missing_observations,health.state,health.reasons.join(',')||null,now,v.id,epoch).run();
  return json({processed_ids:processed,rejected,last_sequence:seq.max,contiguous_through:seq.contiguousThrough,missing_observations:health.missing_observations,gaps:seq.gaps.slice(0,10),tracking_health:health.state,server_time:now});
})}

async function sequenceTaken(visitId:string,epoch:string,sequence:number){
  const r=await db().prepare('SELECT 1 AS x FROM points WHERE visit_id=?1 AND share_epoch=?2 AND sequence_number=?3 UNION ALL SELECT 1 FROM observation_rejections WHERE visit_id=?1 AND share_epoch=?2 AND sequence_number=?3 LIMIT 1').bind(visitId,epoch,sequence).first();
  return !!r;
}
