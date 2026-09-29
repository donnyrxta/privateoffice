import {body,db,hash,HttpError,json,optionalStr,owner,rate,str,token,wrap} from '@/lib/server';
import {generateAgentPassword,normalizeAgentUsername,passwordRecord} from '@/lib/agent-auth';

function emailValue(value:unknown,required=false){if(value===undefined||value===null||value===''){if(required)throw new HttpError(400,'Enter a valid email address.');return null}const v=str(value,160).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw new HttpError(400,'Enter a valid email address.');return v}
function parse<T>(raw:string|null,fallback:T):T{try{return raw?JSON.parse(raw) as T:fallback}catch{return fallback}}
function applicationOut(row:any){return {...row,languages:parse(row.languages_json,[]),markets:parse(row.markets_json,[]),specialisms:parse(row.specialisms_json,[]),answers:parse(row.answers_json,{}),classification:parse(row.classification_json,null)}}
function baseUsername(fullName:string,email:string){
  const local=email.split('@')[0].replace(/[^a-z0-9._-]/gi,'.');
  const byName=fullName.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g,'').trim().split(/\s+/).filter(Boolean);
  const name=(byName.length>1?(byName[0][0]+byName.at(-1)):byName[0]||local).replace(/[^a-z0-9._-]/g,'');
  return normalizeAgentUsername(name.length>=3?name:local).slice(0,68);
}

export async function GET(){return wrap(async()=>{await owner();
  const apps=await db().prepare(`SELECT a.*,i.intended_email,i.expires_at AS invite_expires_at,i.status AS invite_status,s.version AS screening_version,s.answers_json,s.classification_json,s.completed_at
    FROM agent_applications a
    JOIN agent_onboarding_invites i ON i.id=a.invite_id
    LEFT JOIN agent_screening_sessions s ON s.application_id=a.id
    ORDER BY CASE a.status WHEN 'submitted' THEN 0 WHEN 'draft' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,a.updated_at DESC LIMIT 100`).all<any>();
  const invites=await db().prepare(`SELECT i.id,i.intended_email,i.status,i.created_at,i.expires_at,i.opened_at,i.submitted_at,
    (SELECT a.id FROM agent_applications a WHERE a.invite_id=i.id LIMIT 1) AS application_id
    FROM agent_onboarding_invites i ORDER BY i.created_at DESC LIMIT 40`).all<any>();
  const [checks,observations]=await Promise.all([
    db().prepare('SELECT * FROM screening_location_checks ORDER BY received_at DESC LIMIT 300').all<any>(),
    db().prepare('SELECT id,invite_id,lat,lng,accuracy,recorded_at,received_at,consent_version,session_id,sequence_number FROM screening_location_observations ORDER BY received_at DESC LIMIT 300').all<any>()
  ]);
  const locationChecks=[...checks.results,...observations.results.map(row=>({...row,kind:'location'}))].sort((a,b)=>Number(b.received_at)-Number(a.received_at)).slice(0,500);
  return json({applications:apps.results.map(applicationOut),invites:invites.results,location_checks:locationChecks});
})}

export async function POST(req:Request){return wrap(async()=>{
  const u=await owner(),b=await body(req);await rate('office-onboarding:'+u.userId,60,60*60*1000);

  if(b.action==='allow_manual_screening'){
    const id=str(b.invite_id,100),note=str(b.review_note,600,10);
    const invite=await db().prepare("SELECT id FROM agent_onboarding_invites WHERE id=? AND revoked_at IS NULL AND expires_at>? AND status IN ('issued','opened')").bind(id,Date.now()).first();
    if(!invite)throw new HttpError(409,'This invitation is not active.');
    const requested=await db().prepare("SELECT id FROM screening_location_checks WHERE invite_id=? AND kind='manual_requested' LIMIT 1").bind(id).first();
    if(!requested)throw new HttpError(409,'The candidate must request manual screening first.');
    await db().prepare("INSERT INTO screening_location_checks (id,invite_id,kind,received_at,note,reviewer_id) VALUES (?,?,'manual_approved',?,?,?)").bind(crypto.randomUUID(),id,Date.now(),note,u.userId).run();
    return json({ok:true});
  }
  if(b.action==='invite'){
    const intendedEmail=emailValue(b.email),raw=token(),id=crypto.randomUUID(),now=Date.now(),expires=now+7*86400000;
    await db().prepare('INSERT INTO agent_onboarding_invites (id,token_hash,intended_email,status,created_at,expires_at) VALUES (?,?,?,?,?,?)').bind(id,await hash(raw),intendedEmail,'issued',now,expires).run();
    return json({ok:true,invite:{id,intended_email:intendedEmail,expires_at:expires,path:'/onboarding/'+raw}},201);
  }

  if(b.action==='revoke'){
    const id=str(b.invite_id,100),now=Date.now();
    const result=await db().prepare("UPDATE agent_onboarding_invites SET status='revoked',revoked_at=? WHERE id=? AND status IN ('issued','opened')").bind(now,id).run();
    if(!result.meta.changes)throw new HttpError(409,'That invitation can no longer be revoked.');
    return json({ok:true});
  }

  if(b.action==='decline'){
    const id=str(b.application_id,100),note=str(b.review_note,800,3),now=Date.now();
    const app=await db().prepare("SELECT id,invite_id,status FROM agent_applications WHERE id=?").bind(id).first<any>();
    if(!app)throw new HttpError(404,'Application not found.');if(app.status!=='submitted')throw new HttpError(409,'Only a submitted application can be reviewed.');
    await db().batch([
      db().prepare("UPDATE agent_applications SET status='declined',reviewed_at=?,reviewed_by=?,review_note=?,updated_at=? WHERE id=?").bind(now,u.userId,note,now,id),
      db().prepare("UPDATE agent_onboarding_invites SET status='completed' WHERE id=?").bind(app.invite_id)
    ]);
    return json({ok:true});
  }

  if(b.action==='approve'){
    const id=str(b.application_id,100),note=optionalStr(b.review_note,800),app=await db().prepare("SELECT * FROM agent_applications WHERE id=?").bind(id).first<any>();
    if(!app)throw new HttpError(404,'Application not found.');if(app.status!=='submitted')throw new HttpError(409,'Only a submitted application can be approved.');
    const fullName=str(app.full_name,100),agentEmail=emailValue(app.email,true)!;
    let username=baseUsername(fullName,agentEmail);
    if(!/^[a-z0-9._-]{3,80}$/.test(username))username='agent-'+id.slice(0,8).toLowerCase();
    const collision=await db().prepare('SELECT 1 AS x FROM agent_accounts WHERE username=? OR email=?').bind(username,agentEmail).first();
    if(collision){
      const emailCollision=await db().prepare('SELECT 1 AS x FROM agent_accounts WHERE email=?').bind(agentEmail).first();
      if(emailCollision)throw new HttpError(409,'An agent account already uses this application email.');
      username=(username.slice(0,70)+'-'+id.slice(0,6).toLowerCase()).slice(0,80);
    }
    const password=generateAgentPassword(),record=await passwordRecord(password),agentId=crypto.randomUUID(),now=Date.now();
    await db().batch([
      db().prepare('INSERT INTO agent_accounts (id,username,email,full_name,password_salt,password_hash,password_iterations,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(agentId,username,agentEmail,fullName,record.salt,record.hash,record.iterations,1,now,now),
      db().prepare("UPDATE agent_applications SET status='approved',reviewed_at=?,reviewed_by=?,review_note=?,approved_agent_id=?,updated_at=? WHERE id=?").bind(now,u.userId,note,agentId,now,id),
      db().prepare("UPDATE agent_onboarding_invites SET status='completed' WHERE id=?").bind(app.invite_id)
    ]);
    return json({ok:true,agent:{id:agentId,username,email:agentEmail,full_name:fullName},password});
  }

  throw new HttpError(400,'Unknown onboarding action.');
})}
