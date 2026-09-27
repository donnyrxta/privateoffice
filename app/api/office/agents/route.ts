import {owner,body,db,json,wrap,str,rate,HttpError} from '@/lib/server';
import {generateAgentPassword,normalizeAgentUsername,passwordRecord} from '@/lib/agent-auth';

function email(value:unknown){const v=str(value,160).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw new HttpError(400,'Enter a valid agent email address.');return v}

export async function GET(){return wrap(async()=>{await owner();const since=Date.now()-24*60*60*1000;
const rows=await db().prepare(`SELECT a.id,a.username,a.email,a.full_name,a.active,a.created_at,a.last_login_at,
  (SELECT s.last_seen_at FROM agent_web_sessions s WHERE s.agent_id=a.id ORDER BY s.last_seen_at DESC LIMIT 1) AS session_last_seen_at,
  (SELECT s.last_lat FROM agent_web_sessions s WHERE s.agent_id=a.id ORDER BY s.last_seen_at DESC LIMIT 1) AS last_lat,
  (SELECT s.last_lng FROM agent_web_sessions s WHERE s.agent_id=a.id ORDER BY s.last_seen_at DESC LIMIT 1) AS last_lng,
  (SELECT s.last_accuracy FROM agent_web_sessions s WHERE s.agent_id=a.id ORDER BY s.last_seen_at DESC LIMIT 1) AS last_accuracy,
  (SELECT s.last_location_at FROM agent_web_sessions s WHERE s.agent_id=a.id ORDER BY s.last_seen_at DESC LIMIT 1) AS last_location_at,
  (SELECT s.current_path FROM agent_web_sessions s WHERE s.agent_id=a.id ORDER BY s.last_seen_at DESC LIMIT 1) AS current_path,
  (SELECT ap.years_experience FROM agent_applications ap WHERE ap.approved_agent_id=a.id AND ap.status='approved' ORDER BY ap.reviewed_at DESC LIMIT 1) AS profile_years_experience,
  (SELECT ap.markets_json FROM agent_applications ap WHERE ap.approved_agent_id=a.id AND ap.status='approved' ORDER BY ap.reviewed_at DESC LIMIT 1) AS profile_markets_json,
  (SELECT ap.specialisms_json FROM agent_applications ap WHERE ap.approved_agent_id=a.id AND ap.status='approved' ORDER BY ap.reviewed_at DESC LIMIT 1) AS profile_specialisms_json,
  (SELECT ap.languages_json FROM agent_applications ap WHERE ap.approved_agent_id=a.id AND ap.status='approved' ORDER BY ap.reviewed_at DESC LIMIT 1) AS profile_languages_json,
  (SELECT ap.experience_summary FROM agent_applications ap WHERE ap.approved_agent_id=a.id AND ap.status='approved' ORDER BY ap.reviewed_at DESC LIMIT 1) AS profile_experience_summary,
  (SELECT ss.classification_json FROM agent_applications ap JOIN agent_screening_sessions ss ON ss.application_id=ap.id WHERE ap.approved_agent_id=a.id AND ap.status='approved' ORDER BY ap.reviewed_at DESC LIMIT 1) AS profile_classification_json
  FROM agent_accounts a ORDER BY a.active DESC,a.full_name ASC`).all<any>();
const activity=await db().prepare('SELECT agent_id,path,SUM(duration_ms) AS duration_ms,MAX(at) AS last_at FROM agent_page_activity WHERE at>=? GROUP BY agent_id,path ORDER BY agent_id,duration_ms DESC').bind(since).all<any>();
const byAgent=new Map<string,any[]>();for(const row of activity.results){const list=byAgent.get(row.agent_id)||[];list.push({path:row.path,duration_ms:Number(row.duration_ms||0),last_at:Number(row.last_at||0)});byAgent.set(row.agent_id,list)}
function parsed(raw:any,fallback:any){try{return raw?JSON.parse(raw):fallback}catch{return fallback}}
return json({agents:rows.results.map((a:any)=>{
  const classification=parsed(a.profile_classification_json,null);
  const profile=a.profile_classification_json?{source:'screening',years_experience:a.profile_years_experience==null?null:Number(a.profile_years_experience),markets:parsed(a.profile_markets_json,[]),specialisms:parsed(a.profile_specialisms_json,[]),languages:parsed(a.profile_languages_json,[]),experience_summary:a.profile_experience_summary??null,classification}:null;
  const {profile_markets_json,profile_specialisms_json,profile_languages_json,profile_experience_summary,profile_classification_json,profile_years_experience,...safe}=a;
  return {...safe,profile,activity_24h:(byAgent.get(a.id)||[]).slice(0,8)}
})})})}

export async function POST(req:Request){return wrap(async()=>{
  const u=await owner(),b=await body(req);await rate('office-agents:'+u.userId,30,3600000);
  if(b.action==='reset'){
    const id=str(b.agent_id,100),row=await db().prepare('SELECT id,username,full_name FROM agent_accounts WHERE id=?').bind(id).first<any>();if(!row)throw new HttpError(404,'Agent account not found.');
    const password=generateAgentPassword(),record=await passwordRecord(password),now=Date.now();
    await db().batch([
      db().prepare('UPDATE agent_accounts SET password_salt=?,password_hash=?,password_iterations=?,updated_at=? WHERE id=?').bind(record.salt,record.hash,record.iterations,now,id),
      db().prepare('UPDATE agent_web_sessions SET revoked_at=? WHERE agent_id=? AND revoked_at IS NULL').bind(now,id)
    ]);
    return json({ok:true,agent:row,password});
  }
  const username=normalizeAgentUsername(str(b.username,80,3)),agentEmail=email(b.email),fullName=str(b.full_name,100);
  if(!/^[a-z0-9._-]{3,80}$/.test(username))throw new HttpError(400,'Use 3–80 lowercase letters, numbers, dots, dashes or underscores for the username.');
  const id=crypto.randomUUID(),password=generateAgentPassword(),record=await passwordRecord(password),now=Date.now();
  try{
    await db().prepare('INSERT INTO agent_accounts (id,username,email,full_name,password_salt,password_hash,password_iterations,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,username,agentEmail,fullName,record.salt,record.hash,record.iterations,1,now,now).run();
  }catch(e){if(e instanceof Error&&/UNIQUE/i.test(e.message))throw new HttpError(409,'That username or email is already assigned to an agent.');throw e}
  return json({ok:true,agent:{id,username,email:agentEmail,full_name:fullName,active:1,created_at:now,last_login_at:null},password},201);
})}
