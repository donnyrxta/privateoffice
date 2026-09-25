import {owner,db,getVisit,HttpError,wrap,event,json} from '@/lib/server';
import {sequenceStatus} from '@/lib/integrity';
import {canonicalJson} from '@/lib/telemetry/shared';
import {CONSENT_VERSION,SCHEMA_VERSION} from '@/lib/contracts';

const MAX_OBSERVATIONS=20000;

/**
 * Human-readable incident / evidence package for one visit. Owner-only. Contains no capability tokens or
 * token hashes. The package hash lets a recipient detect later modification of the exported file.
 */
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){return wrap(async()=>{
  const u=await owner(),v=await getVisit((await params).id);
  if(v.owner_id!==u.userId)throw new HttpError(403,'Visit not accessible.');
  const d=db(),now=Date.now();
  const [points,rejections,events,security,epochRows]:any[]=await Promise.all([
    d.prepare('SELECT id,device_id,share_epoch,sequence_number,lat,lng,accuracy,altitude,altitude_accuracy,heading,speed,simulated,quality_class,plausibility_state,integrity_flags,recorded_at,queued_at,received_at,payload_hash FROM points WHERE visit_id=? ORDER BY share_epoch,sequence_number LIMIT ?').bind(v.id,MAX_OBSERVATIONS).all(),
    d.prepare('SELECT id,device_id,share_epoch,sequence_number,code,raw_payload,payload_hash,received_at FROM observation_rejections WHERE visit_id=? ORDER BY share_epoch,sequence_number').bind(v.id).all(),
    d.prepare('SELECT kind,actor,at,detail FROM events WHERE visit_id=? ORDER BY at ASC').bind(v.id).all(),
    d.prepare('SELECT id,agent_id,device_id,session_id,share_epoch,kind,device_at,received_at,detail,payload_hash FROM security_events WHERE visit_id=? ORDER BY device_at ASC LIMIT 5000').bind(v.id).all(),
    d.prepare(`SELECT share_epoch,device_id,COUNT(*) AS observations,MIN(recorded_at) AS first_recorded_at,MAX(recorded_at) AS last_recorded_at FROM points WHERE visit_id=?1 AND share_epoch IS NOT NULL GROUP BY share_epoch,device_id
      UNION SELECT share_epoch,device_id,0,NULL,NULL FROM observation_rejections WHERE visit_id=?1 AND share_epoch NOT IN (SELECT DISTINCT share_epoch FROM points WHERE visit_id=?1 AND share_epoch IS NOT NULL) GROUP BY share_epoch,device_id`).bind(v.id).all<any>(),
  ]);
  const epochs=await Promise.all(epochRows.results.map(async (e:any)=>{const s=await sequenceStatus(d,v.id,e.share_epoch);return {...e,sequence:{accounted:s.count,min:s.min,max:s.max,contiguous_through:s.contiguousThrough,missing_observations:Math.max(0,s.missing),gaps:s.gaps,rejected_observations:s.rejected,flagged_observations:s.flagged,contiguous:s.missing<=0&&(s.count===0||s.min===0)}}}));
  const deviceIds=[...new Set([v.active_device_id,...epochRows.results.map((e:any)=>e.device_id)].filter(Boolean))];
  const devices=deviceIds.length?(await d.prepare(`SELECT id,agent_id,platform,app_version,public_key_jwk,created_at,last_seen_at,revoked_at FROM devices WHERE id IN (${deviceIds.map(()=>'?').join(',')})`).bind(...deviceIds).all()).results:[];
  const pkg={
    format:'private-office.visit-evidence.v1',
    generated_at:new Date(now).toISOString(),
    generated_by:{user_id:u.userId,email:u.email},
    schema_version:SCHEMA_VERSION,
    notice_version:CONSENT_VERSION,
    note:'Location observations are device-reported and can be inaccurate or spoofed. Integrity flags and sequence gaps indicate where the record needs review; they are not conclusions.',
    visit:{id:v.id,property:v.property,meeting:v.meeting,meeting_lat:v.lat,meeting_lng:v.lng,client_name:v.client_name,scheduled_at:v.scheduled_at,expires_at:v.expires_at,created_at:v.created_at,status:v.status,consent_at:v.consent_at,consent_version:v.consent_version,share_started_at:v.share_started_at,stopped_at:v.stopped_at,revoked_at:v.revoked_at,eta_minutes:v.eta_minutes,tracking_health:v.tracking_health,health_reason:v.health_reason},
    agent:{agent_id:v.agent_id,name:v.agent_name,email:v.agent_email},
    devices,
    epochs,
    client_confirmation:{confirmed_at:v.client_confirmed_at,property_confirmed:v.property_confirmed,comment:v.client_comment},
    observations:points.results,
    observations_truncated:points.results.length>=MAX_OBSERVATIONS,
    observation_rejections:rejections.results,
    events:events.results,
    security_events:security.results,
  };
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalJson(pkg))))].map(b=>b.toString(16).padStart(2,'0')).join('');
  await event(v.id,'evidence_exported',u.userId,JSON.stringify({package_sha256:digest,observations:points.results.length})).run();
  const res=json({...pkg,integrity:{algorithm:'SHA-256 over canonical JSON of all fields except integrity',package_sha256:digest}});
  res.headers.set('Content-Disposition',`attachment; filename="private-office-visit-${v.id}-${new Date(now).toISOString().slice(0,10)}.json"`);
  return res;
})}
