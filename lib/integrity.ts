import {HEALTH_THRESHOLDS,type HealthDetail,type SequenceGap,type TrackingHealthState} from './contracts';

/**
 * Sequence accounting for one tracking epoch.
 *
 * A sequence number is "accounted for" when the server holds either a persisted observation
 * (points) or a persisted rejection record (observation_rejections) for it. Rejections keep
 * the raw evidence plus the reason, so a malformed fix never silently disappears and never
 * blocks the epoch from closing.
 */
export type SequenceStatus={count:number;min:number|null;max:number;contiguousThrough:number;missing:number;gaps:SequenceGap[];rejected:number;flagged:number};

const ACCOUNTED=`SELECT sequence_number AS n FROM points WHERE visit_id=?1 AND share_epoch=?2 AND sequence_number IS NOT NULL
UNION SELECT sequence_number AS n FROM observation_rejections WHERE visit_id=?1 AND share_epoch=?2`;

export async function sequenceStatus(d1:D1Database,visitId:string,epoch:string,finalSequence?:number):Promise<SequenceStatus>{
  const agg=await d1.prepare(`WITH s AS (${ACCOUNTED}) SELECT COUNT(*) AS count,MIN(n) AS min,COALESCE(MAX(n),-1) AS max,
    (SELECT COUNT(*) FROM observation_rejections WHERE visit_id=?1 AND share_epoch=?2) AS rejected,
    (SELECT COUNT(*) FROM points WHERE visit_id=?1 AND share_epoch=?2 AND integrity_flags IS NOT NULL) AS flagged FROM s`)
    .bind(visitId,epoch).first<{count:number;min:number|null;max:number;rejected:number;flagged:number}>();
  const count=Number(agg?.count??0),min=agg?.min==null?null:Number(agg.min),max=Number(agg?.max??-1);
  const expectedThrough=Math.max(max,finalSequence??-1);
  let gaps:SequenceGap[]=[];
  // Unique (visit, epoch, sequence) indexes guarantee: COUNT = MAX+1 and MIN = 0  <=>  0..MAX has no gaps.
  if(count>0&&(count!==max+1||min!==0)){
    const rows=await d1.prepare(`WITH s AS (${ACCOUNTED}), o AS (SELECT n,LAG(n,1,-1) OVER (ORDER BY n) AS prev FROM s)
      SELECT prev+1 AS gap_from,n-1 AS gap_to FROM o WHERE n-prev>1 ORDER BY n LIMIT 25`).bind(visitId,epoch).all<{gap_from:number;gap_to:number}>();
    gaps=rows.results.map(r=>({from:Number(r.gap_from),to:Number(r.gap_to)}));
  }
  if(expectedThrough>max)gaps.push({from:max+1,to:expectedThrough});
  const missing=expectedThrough+1-count;
  const contiguousThrough=gaps.length?gaps[0].from-1:max;
  return {count,min,max,contiguousThrough,missing,gaps,rejected:Number(agg?.rejected??0),flagged:Number(agg?.flagged??0)};
}

/** Terminal rule: 0..final_sequence must all be accounted for and nothing may exist beyond it. */
export function terminalVerdict(s:SequenceStatus,finalSequence:number):{ok:true}|{ok:false;code:'TELEMETRY_PENDING'|'FINAL_SEQUENCE_MISMATCH'}{
  if(s.max>finalSequence)return {ok:false,code:'FINAL_SEQUENCE_MISMATCH'};
  if(finalSequence===-1)return s.count===0?{ok:true}:{ok:false,code:'FINAL_SEQUENCE_MISMATCH'};
  if(s.count===finalSequence+1&&s.min===0&&s.max===finalSequence)return {ok:true};
  return {ok:false,code:'TELEMETRY_PENDING'};
}

type LatestPoint={recorded_at:number;received_at:number;integrity_flags?:string|null}|null|undefined;
type VisitLike={status:string;share_until?:number|null;share_started_at?:number|null;expires_at:number;revoked_at?:number|null;tracking_health?:string|null};

export function isSharing(v:VisitLike,now=Date.now()){return v.status==='sharing'&&!!v.share_until&&v.share_until>now&&v.expires_at>now&&!v.revoked_at}

/**
 * Server-side health state for an epoch. Precedence:
 * interrupted > stale > degraded (sequence gap / flagged current fix) > delayed > healthy.
 */
export function evaluateHealth(v:VisitLike,latest:LatestPoint,seq:SequenceStatus|null,now=Date.now()):HealthDetail{
  const base={age_ms:null as number|null,last_sequence:seq?.max??-1,contiguous_through:seq?.contiguousThrough??-1,missing_observations:Math.max(0,seq?.missing??0),gaps:seq?.gaps.slice(0,10)??[],rejected_observations:seq?.rejected??0,flagged_observations:seq?.flagged??0};
  if(v.revoked_at||v.status==='revoked')return {...base,state:'revoked',reasons:[]};
  if(v.status==='completed')return {...base,state:'completed',reasons:[]};
  if(v.status!=='sharing')return {...base,state:((v.tracking_health as TrackingHealthState)||'idle'),reasons:[]};
  if(!isSharing(v,now))return {...base,state:'window_elapsed',reasons:['share_window_elapsed']};
  const reasons:string[]=[];
  if(base.missing_observations>0)reasons.push('sequence_gap');
  if(base.rejected_observations>0)reasons.push('observations_rejected');
  const currentFlags=parseFlags(latest?.integrity_flags);
  if(currentFlags.length)reasons.push(...currentFlags.map(f=>'current_fix_'+f));
  if(!latest){
    const since=now-Number(v.share_started_at||now);
    if(since>HEALTH_THRESHOLDS.interruptedMs)return {...base,state:'interrupted',reasons:['no_position_received',...reasons]};
    return {...base,state:reasons.includes('sequence_gap')?'degraded':'acquiring',reasons};
  }
  const age=Math.max(now-Number(latest.recorded_at),now-Number(latest.received_at),0);
  let state:TrackingHealthState=age>HEALTH_THRESHOLDS.interruptedMs?'interrupted':age>HEALTH_THRESHOLDS.staleMs?'stale':age>HEALTH_THRESHOLDS.delayedMs?'delayed':'healthy';
  if((state==='healthy'||state==='delayed')&&(base.missing_observations>0||currentFlags.length>0))state='degraded';
  if(state==='delayed'||state==='stale'||state==='interrupted')reasons.unshift('position_age');
  return {...base,state,reasons,age_ms:age};
}

export function parseFlags(value:unknown):string[]{if(typeof value!=='string'||!value)return [];try{const v=JSON.parse(value);return Array.isArray(v)?v.filter(x=>typeof x==='string'):[]}catch{return []}}
