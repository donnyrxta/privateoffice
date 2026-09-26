import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getAgentUser} from './agent-auth';
import {retentionIfOverdue} from './maintenance';
import {evaluateHealth,isSharing,sequenceStatus} from './integrity';
import {canonicalJson,fromBase64url,qualityFromAccuracy} from './telemetry/shared';
import {FRESH_MS,RETENTION_MS,SHARE_MS,CONSENT_VERSION} from './contracts';
export {FRESH_MS,RETENTION_MS,SHARE_MS,CONSENT_VERSION,qualityFromAccuracy};
export class HttpError extends Error{constructor(public status:number,message:string,public code?:string){super(message)}}
export function db(){if(!env.DB)throw new HttpError(503,'The office database is not configured yet.');return env.DB}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Permissions-Policy':'geolocation=(self)'}})}
export async function wrap(fn:()=>Promise<Response>){try{return await fn()}catch(e){if(e instanceof HttpError)return json({error:e.message,...(e.code?{code:e.code}:{})},e.status);console.error('Request failed',e instanceof Error?e.name:'unknown');return json({error:'This could not be saved. Please retry.'},503)}}
export async function body(req:Request){if(req.headers.get('origin')!==new URL(req.url).origin)throw new HttpError(403,'This request must come from the website.');if(!req.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'JSON required.');const raw=await req.text();if(raw.length>128000)throw new HttpError(413,'Request too large.');try{const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error();return parsed}catch{throw new HttpError(400,'Invalid request.')}}
export function str(v:unknown,n:number,min=1){if(typeof v!=='string'||v.trim().length<min||v.trim().length>n)throw new HttpError(400,'Please complete all fields with valid details.');return v.trim()}
export function optionalStr(v:unknown,n:number){if(v===null||v===undefined||v==='')return null;return str(v,n)}
export function num(v:unknown,min:number,max:number){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new HttpError(400,'Please enter valid coordinates, times and measurements.');return v}
export function optionalNum(v:unknown,min:number,max:number){if(v===null||v===undefined)return null;return num(v,min,max)}
export async function hash(s:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('')}
export function token(){const a=crypto.getRandomValues(new Uint8Array(32));return [...a].map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function user(){const a=await getAgentUser();if(a)return a;const u=await getChatGPTUser();if(!u)throw new HttpError(401,'Please sign in to continue.');return u}
export async function officeUser(){const u=await getChatGPTUser();if(!u)throw new HttpError(401,'Please sign in to the Private Office.');return u}
export async function owner(){const u=await officeUser();const o=await db().prepare('SELECT owner_id FROM office WHERE id=1').first<{owner_id:string}>();if(!o||o.owner_id!==u.userId)throw new HttpError(403,'Only the office owner can access this.');return u}
export async function rate(key:string,limit:number,window=60000){const n=Date.now(),bucket=Math.floor(n/window),k=key+':'+bucket;const r=await db().prepare('INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(k,n+window).first<{count:number}>();if(!r||r.count>limit)throw new HttpError(429,'Too many requests. Please try again shortly.');}
/** Fallback only: retention is driven by the daily Cron Trigger (lib/maintenance.ts). Runs here only if the scheduler is overdue. */
export async function prune(){await retentionIfOverdue(db())}
export async function getVisit(id:string){const v=await db().prepare('SELECT * FROM visits WHERE id=? AND created_at>=?').bind(id,Date.now()-RETENTION_MS).first<any>();if(!v)throw new HttpError(404,'Visit not found or no longer available.');return v}
export function active(v:any){if(v.revoked_at||v.status==='revoked')throw new HttpError(410,'This visit has been cancelled.');if(Date.now()>v.expires_at)throw new HttpError(410,'This visit has expired.');if(v.status==='completed')throw new HttpError(409,'This visit is complete.');}
export async function agentVisit(id:string){const u=await user(),v=await getVisit(id);if(v.agent_id!==u.userId)throw new HttpError(403,'This visit is assigned to another agent.');return {u,v}}
export async function clientVisit(req:Request,id:string){const t=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!t||t.length>200)throw new HttpError(401,'Open the private arrival link from the office.');const v=await getVisit(id);if(await hash(t)!==v.client_hash)throw new HttpError(404,'This arrival link is invalid.');if(v.revoked_at||Date.now()>v.expires_at)throw new HttpError(410,'This arrival link has ended.');return v}
export function publicVisit(v:any){const {invite_hash,client_hash,owner_id,agent_id,share_epoch,active_device_id,...safe}=v;return safe}
const pointColumns='id,device_id,share_epoch,sequence_number,lat,lng,accuracy,altitude,altitude_accuracy,heading,speed,simulated,quality_class,plausibility_state,integrity_flags,recorded_at,queued_at,received_at';
export async function decorated(v:any,history=false){
  const now=Date.now();
  const p=await db().prepare(`SELECT ${pointColumns} FROM points WHERE visit_id=? AND received_at>=? ORDER BY sequence_number DESC,received_at DESC LIMIT 1`).bind(v.id,now-RETENTION_MS).first<any>();
  const sharing=isSharing(v,now);
  const fresh=!!(sharing&&p&&now-Number(p.recorded_at)<FRESH_MS&&now-Number(p.received_at)<FRESH_MS);
  // Health is evaluated against the active epoch only; sequence continuity is per-epoch.
  const epochPoint=sharing&&p&&p.share_epoch===v.share_epoch?p:null;
  const seq=sharing&&v.share_epoch?await sequenceStatus(db(),v.id,v.share_epoch):null;
  const health=evaluateHealth(v,epochPoint,seq,now);
  const out={...publicVisit(v),status:v.expires_at<now?'expired':v.status==='sharing'&&v.share_until<now?'paused':v.status,point:p,fresh,tracking_health:health.state,health};
  if(!history)return out;
  const [points,events,security,rejections]=await Promise.all([
    db().prepare(`SELECT ${pointColumns} FROM points WHERE visit_id=? AND received_at>=? ORDER BY recorded_at ASC,sequence_number ASC LIMIT 3000`).bind(v.id,now-RETENTION_MS).all(),
    db().prepare('SELECT kind,at,detail FROM events WHERE visit_id=? AND at>=? ORDER BY at DESC LIMIT 250').bind(v.id,now-RETENTION_MS).all(),
    db().prepare('SELECT kind,device_at,received_at,detail FROM security_events WHERE visit_id=? AND received_at>=? ORDER BY received_at DESC LIMIT 250').bind(v.id,now-RETENTION_MS).all(),
    db().prepare('SELECT id,share_epoch,sequence_number,code,received_at FROM observation_rejections WHERE visit_id=? AND received_at>=? ORDER BY received_at DESC LIMIT 250').bind(v.id,now-RETENTION_MS).all(),
  ]);
  return {...out,points:points.results,events:events.results,security_events:security.results,observation_rejections:rejections.results};
}
export async function agentDecorated(v:any){const d=await decorated(v);return {...d,share_epoch:v.share_epoch,active_device_id:v.active_device_id}}
export function event(id:string,kind:string,actor:string,detail:string|null=null){return db().prepare('INSERT INTO events (id,visit_id,kind,actor,at,detail) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),id,kind,actor,Date.now(),detail)}
export function setupHash(){return env.OFFICE_SETUP_HASH?.trim().toLowerCase()||undefined}
export type DeviceRow={id:string;agent_id:string;public_key_jwk:string;platform:string;app_version:string|null;created_at:number;last_seen_at:number;revoked_at:number|null};
export async function getDeviceForAgent(deviceId:string,agentId:string){const d=await db().prepare('SELECT * FROM devices WHERE id=?').bind(deviceId).first<DeviceRow>();if(!d||d.agent_id!==agentId||d.revoked_at)throw new HttpError(403,'This device is not registered for the signed-in agent.','DEVICE_NOT_REGISTERED');return d}
function validPublicJwk(jwk:any){return jwk&&jwk.kty==='EC'&&jwk.crv==='P-256'&&typeof jwk.x==='string'&&typeof jwk.y==='string'&&!('d' in jwk)}
export async function enrollDevice(agentId:string,input:any){const id=str(input.device_id,100),platform=str(input.platform||'web',40),appVersion=optionalStr(input.app_version,80),jwk=input.public_key_jwk;if(!validPublicJwk(jwk))throw new HttpError(400,'A valid P-256 public device key is required.');try{await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify'])}catch{throw new HttpError(400,'The device public key is invalid.')}const now=Date.now(),existing=await db().prepare('SELECT agent_id,public_key_jwk,revoked_at FROM devices WHERE id=?').bind(id).first<any>();if(existing&&existing.agent_id!==agentId)throw new HttpError(409,'This device identifier is already registered.','DEVICE_ID_CONFLICT');if(existing&&existing.public_key_jwk!==JSON.stringify(jwk))throw new HttpError(409,'The registered device key does not match.','DEVICE_KEY_CONFLICT');if(existing?.revoked_at)throw new HttpError(403,'This device registration has been revoked.','DEVICE_REVOKED');if(existing)await db().prepare('UPDATE devices SET last_seen_at=?,platform=?,app_version=? WHERE id=?').bind(now,platform,appVersion,id).run();else await db().prepare('INSERT INTO devices (id,agent_id,public_key_jwk,platform,app_version,created_at,last_seen_at) VALUES (?,?,?,?,?,?,?)').bind(id,agentId,JSON.stringify(jwk),platform,appVersion,now,now).run();return id}
export async function verifyDeviceSignature(device:DeviceRow,envelope:unknown,signature:string){if(typeof signature!=='string'||signature.length>512)throw new HttpError(400,'A device signature is required.','SIGNATURE_REQUIRED');let jwk;try{jwk=JSON.parse(device.public_key_jwk)}catch{throw new HttpError(500,'The registered device key is unavailable.')}const key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);let sig:Uint8Array<ArrayBuffer>;try{sig=fromBase64url(signature) as Uint8Array<ArrayBuffer>}catch{throw new HttpError(400,'The device signature is invalid.','SIGNATURE_INVALID')}const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,sig,new TextEncoder().encode(canonicalJson(envelope)));if(!ok)throw new HttpError(403,'The telemetry signature could not be verified.','SIGNATURE_INVALID');await db().prepare('UPDATE devices SET last_seen_at=? WHERE id=?').bind(Date.now(),device.id).run();}
export async function payloadHash(value:unknown){return hash(canonicalJson(value))}
