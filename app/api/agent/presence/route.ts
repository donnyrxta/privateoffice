import {body,db,json,wrap,num,str,rate,HttpError} from '@/lib/server';
import {AGENT_ACCESS_MAX_ACCURACY_M,AGENT_LOCATION_FRESH_MS,getAgentSession,hasFreshPreciseLocation} from '@/lib/agent-auth';

function safePath(v:unknown){const p=str(v??'/agent',180);if(!p.startsWith('/')||p.startsWith('//'))throw new HttpError(400,'Invalid agent path.');return p}

export async function GET(){return wrap(async()=>{const s=await getAgentSession();if(!s)throw new HttpError(401,'Sign in to Private Office first.');return json({authenticated:true,location_ready:hasFreshPreciseLocation(s),max_accuracy_m:AGENT_ACCESS_MAX_ACCURACY_M,fresh_for_ms:AGENT_LOCATION_FRESH_MS,last_location:s.lastLocationAt?{lat:s.lastLat,lng:s.lastLng,accuracy:s.lastAccuracy,recorded_at:s.lastLocationAt}:null,current_path:s.currentPath})})}

export async function POST(req:Request){return wrap(async()=>{
  const s=await getAgentSession();if(!s)throw new HttpError(401,'Sign in to Private Office first.');
  const b=await body(req),now=Date.now();await rate('agent-presence:'+s.user.userId,80,5*60*1000);
  const lat=num(b.lat,-90,90),lng=num(b.lng,-180,180),accuracy=num(b.accuracy,0.1,10000),recordedAt=num(b.recorded_at,now-120000,now+15000),path=safePath(b.path),duration=Math.round(num(b.duration_ms??0,0,60000)),precise=accuracy<=AGENT_ACCESS_MAX_ACCURACY_M,pathChanged=s.currentPath!==path,verifiedAt=precise?now:s.locationVerifiedAt;
  await db().batch([
    db().prepare(`UPDATE agent_web_sessions SET last_seen_at=?,last_lat=?,last_lng=?,last_accuracy=?,last_location_at=?,location_verified_at=?,current_path=?,current_path_since=CASE WHEN current_path IS NULL OR current_path<>? THEN ? ELSE current_path_since END WHERE token_hash=?`).bind(now,lat,lng,accuracy,recordedAt,verifiedAt,path,path,now,s.tokenHash),
    db().prepare('INSERT INTO agent_page_activity (id,agent_id,session_token_hash,path,kind,at,duration_ms,lat,lng,accuracy) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),s.user.userId,s.tokenHash,path,pathChanged?'PAGE_ENTER':'PAGE_HEARTBEAT',now,duration,lat,lng,accuracy)
  ]);
  if(!precise)return json({ok:false,code:'PRECISION_REQUIRED',accuracy,max_accuracy_m:AGENT_ACCESS_MAX_ACCURACY_M},409);
  return json({ok:true,location_ready:true,accuracy,max_accuracy_m:AGENT_ACCESS_MAX_ACCURACY_M,expires_at:recordedAt+AGENT_LOCATION_FRESH_MS});
})}
