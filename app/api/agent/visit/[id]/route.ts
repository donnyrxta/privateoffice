import {agentVisit,body,db,json,wrap,active,CONSENT_VERSION,SHARE_MS,str,num,HttpError,event,rate,decorated,getDeviceForAgent} from '@/lib/server';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){return wrap(async()=>{const {v}=await agentVisit((await params).id);return json({...await decorated(v,true),share_epoch:v.share_epoch,active_device_id:v.active_device_id})})}
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){return wrap(async()=>{const {u,v}=await agentVisit((await params).id),b=await body(req),now=Date.now();await rate('agent:'+v.id,80);
if(['pause','arrive','complete'].includes(b.action)){const target=b.action==='pause'?'paused':b.action==='arrive'?'arrived':'completed';if(v.status===target)return json({ok:true,replayed:true,persisted_sequence:Number(v.last_sequence??-1)});}
active(v);
if(b.action==='start'){
  if(b.consent!==true||b.version!==CONSENT_VERSION||!v.consent_at)throw new HttpError(400,'Confirm location sharing for this visit.');
  if(v.status==='arrived')throw new HttpError(409,'This visit has already arrived.');
  if(!['accepted','paused','sharing'].includes(v.status))throw new HttpError(409,'This visit is not ready to start.');
  const deviceId=str(b.device_id,100);await getDeviceForAgent(deviceId,u.userId);
  const epoch=crypto.randomUUID(),until=Math.min(now+SHARE_MS,v.expires_at);
  await db().batch([
    db().prepare("UPDATE visits SET status='paused',share_epoch=NULL,share_until=NULL,stopped_at=?,tracking_health='idle' WHERE agent_id=? AND status='sharing' AND id<>?").bind(now,u.userId,v.id),
    db().prepare("UPDATE visits SET status='sharing',share_started_at=?,share_epoch=?,share_until=?,stopped_at=NULL,eta_minutes=?,active_device_id=?,last_sequence=-1,tracking_health='acquiring' WHERE id=? AND revoked_at IS NULL AND status NOT IN ('completed','arrived') AND expires_at>?").bind(now,epoch,until,num(b.eta_minutes,1,240),deviceId,v.id,now),
    event(v.id,'sharing_started',u.userId,JSON.stringify({consent_version:CONSENT_VERSION,device_id:deviceId,share_epoch:epoch}))
  ]);
  return json({epoch,until,device_id:deviceId,last_sequence:-1});
}
if(b.action==='point')throw new HttpError(410,'Single-point uploads are retired. Use the durable observation batch endpoint.','BATCH_REQUIRED');
if(['pause','arrive','complete'].includes(b.action)){
  if(b.action==='complete'&&v.status==='arrived'){
    await db().batch([db().prepare("UPDATE visits SET status='completed',stopped_at=?,tracking_health='completed' WHERE id=? AND revoked_at IS NULL").bind(now,v.id),event(v.id,'complete',u.userId)]);
    return json({ok:true});
  }
  if(!['sharing','paused'].includes(v.status))throw new HttpError(409,'This visit does not have an active tracking epoch.');
  const deviceId=str(b.device_id,100),epoch=str(b.epoch,100),finalSequence=num(b.final_sequence,-1,1_000_000_000);await getDeviceForAgent(deviceId,u.userId);
  if(v.active_device_id!==deviceId||v.share_epoch!==epoch)throw new HttpError(409,'The terminal action does not match the active tracking epoch.','EPOCH_MISMATCH');
  const persisted=await db().prepare('SELECT COALESCE(MAX(sequence_number),-1) AS max_sequence FROM points WHERE visit_id=? AND share_epoch=?').bind(v.id,epoch).first<{max_sequence:number}>();
  const maxSequence=Number(persisted?.max_sequence??-1);
  if(finalSequence>maxSequence)return json({error:'Telemetry is still pending. Upload the remaining observations before closing this tracking epoch.',code:'TELEMETRY_PENDING',persisted_sequence:maxSequence},409);
  const status=b.action==='pause'?'paused':b.action==='arrive'?'arrived':'completed';
  if(b.action==='arrive'&&v.status!=='sharing')throw new HttpError(409,'Start the visit before reporting arrival.');
  await db().batch([
    db().prepare('UPDATE visits SET status=?,share_epoch=NULL,share_until=NULL,stopped_at=?,tracking_health=? WHERE id=? AND revoked_at IS NULL AND status!=?').bind(status,now,status==='completed'?'completed':'idle',v.id,'completed'),
    event(v.id,b.action,u.userId,JSON.stringify({device_id:deviceId,share_epoch:epoch,final_sequence:finalSequence,persisted_sequence:maxSequence}))
  ]);
  return json({ok:true,persisted_sequence:maxSequence});
}
throw new HttpError(400,'Unknown action.');})}
