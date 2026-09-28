import {body,db,hash,HttpError,json,optionalStr,rate,str,wrap} from '@/lib/server';
import {classifyScreening,publicScreening,SCREENING_QUESTIONS,SCREENING_VERSION,screeningComplete} from '@/lib/screening';

function emailValue(value:unknown){const v=str(value,160).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw new HttpError(400,'Enter a valid professional email address.');return v}
function list(value:unknown,max=12){if(!Array.isArray(value))throw new HttpError(400,'Please complete the requested profile fields.');const out=[...new Set(value.map(v=>str(v,80)).filter(Boolean))];if(out.length<1||out.length>max)throw new HttpError(400,'Please complete the requested profile fields.');return out}
function parse<T>(raw:string|null,fallback:T):T{try{return raw?JSON.parse(raw) as T:fallback}catch{return fallback}}
async function inviteFor(rawToken:string){
  if(!/^[0-9a-f]{64}$/i.test(rawToken))throw new HttpError(404,'This onboarding link is invalid.');
  const tokenHash=await hash(rawToken);
  const row=await db().prepare('SELECT * FROM agent_onboarding_invites WHERE token_hash=?').bind(tokenHash).first<any>();
  if(!row)throw new HttpError(404,'This onboarding link is invalid.');
  if(row.revoked_at||row.status==='revoked')throw new HttpError(410,'This onboarding invitation has been withdrawn.');
  if(Date.now()>Number(row.expires_at))throw new HttpError(410,'This onboarding invitation has expired.');
  return row;
}
async function applicationFor(inviteId:string){
  return db().prepare(`SELECT a.*,s.version AS screening_version,s.answers_json,s.classification_json,s.completed_at
    FROM agent_applications a LEFT JOIN agent_screening_sessions s ON s.application_id=a.id
    WHERE a.invite_id=?`).bind(inviteId).first<any>();
}
function safeApplication(row:any){
  if(!row)return null;
  return {
    id:row.id,status:row.status,full_name:row.full_name,email:row.email,phone:row.phone,city:row.city,country:row.country,
    current_company:row.current_company,years_experience:row.years_experience,
    languages:parse(row.languages_json,[]),markets:parse(row.markets_json,[]),specialisms:parse(row.specialisms_json,[]),
    experience_summary:row.experience_summary,motivation:row.motivation,submitted_at:row.submitted_at,
    answers:parse(row.answers_json,{}),classification:parse(row.classification_json,null)
  };
}

export async function GET(_:Request,{params}:{params:Promise<{token:string}>}){return wrap(async()=>{
  const {token}=await params,invite=await inviteFor(token),application=await applicationFor(invite.id);
  return json({invite:{status:invite.status,intended_email:invite.intended_email,expires_at:invite.expires_at},application:safeApplication(application),screening:publicScreening()});
})}

export async function POST(req:Request,{params}:{params:Promise<{token:string}>}){return wrap(async()=>{
  const {token}=await params,invite=await inviteFor(token),b=await body(req),ip=req.headers.get('cf-connecting-ip')||'unknown';
  await rate('onboarding:'+invite.id+':'+ip,120,60*60*1000);
  let application=await applicationFor(invite.id);
  if(application&&application.status!=='draft')throw new HttpError(409,'This application has already been submitted for review.');

  if(b.action==='save_profile'){
    const agentEmail=emailValue(b.email);
    if(invite.intended_email&&String(invite.intended_email).toLowerCase()!==agentEmail)throw new HttpError(403,'Use the email address this invitation was issued to.');
    const years=Number(b.years_experience);if(!Number.isInteger(years)||years<0||years>60)throw new HttpError(400,'Enter a valid number of years of property experience.');
    const values={
      full_name:str(b.full_name,100),email:agentEmail,phone:str(b.phone,60),city:str(b.city,80),country:str(b.country,80),
      current_company:optionalStr(b.current_company,120),years_experience:years,
      languages:list(b.languages),markets:list(b.markets),specialisms:list(b.specialisms),
      experience_summary:str(b.experience_summary,1400,40),motivation:str(b.motivation,1200,30)
    };
    const now=Date.now();
    if(!application){
      const id=crypto.randomUUID(),screeningId=crypto.randomUUID();
      await db().batch([
        db().prepare(`INSERT INTO agent_applications
          (id,invite_id,full_name,email,phone,city,country,current_company,years_experience,languages_json,markets_json,specialisms_json,experience_summary,motivation,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'draft',?,?)`).bind(id,invite.id,values.full_name,values.email,values.phone,values.city,values.country,values.current_company,values.years_experience,JSON.stringify(values.languages),JSON.stringify(values.markets),JSON.stringify(values.specialisms),values.experience_summary,values.motivation,now,now),
        db().prepare('INSERT INTO agent_screening_sessions (id,application_id,version,answers_json,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind(screeningId,id,SCREENING_VERSION,'{}',now,now),
        db().prepare("UPDATE agent_onboarding_invites SET status='opened',opened_at=COALESCE(opened_at,?) WHERE id=?").bind(now,invite.id)
      ]);
    }else{
      await db().prepare(`UPDATE agent_applications SET full_name=?,email=?,phone=?,city=?,country=?,current_company=?,years_experience=?,languages_json=?,markets_json=?,specialisms_json=?,experience_summary=?,motivation=?,updated_at=? WHERE id=?`)
        .bind(values.full_name,values.email,values.phone,values.city,values.country,values.current_company,values.years_experience,JSON.stringify(values.languages),JSON.stringify(values.markets),JSON.stringify(values.specialisms),values.experience_summary,values.motivation,now,application.id).run();
    }
    application=await applicationFor(invite.id);
    return json({ok:true,application:safeApplication(application)});
  }

  if(b.action==='save_answers'){
    if(!application)throw new HttpError(409,'Complete your professional profile before the screening.');
    const submitted=b.answers;if(!submitted||typeof submitted!=='object'||Array.isArray(submitted))throw new HttpError(400,'Screening answers are required.');
    const current=parse<Record<string,string>>(application.answers_json,{});
    for(const [questionId,answer] of Object.entries(submitted)){
      const q=SCREENING_QUESTIONS.find(x=>x.id===questionId);if(!q)throw new HttpError(400,'An unknown screening question was supplied.');
      if(!q.choices.some(c=>c.id===String(answer)))throw new HttpError(400,'Choose one of the available responses for every screening question.');
      current[questionId]=String(answer);
    }
    await db().prepare('UPDATE agent_screening_sessions SET answers_json=?,updated_at=? WHERE application_id=?').bind(JSON.stringify(current),Date.now(),application.id).run();
    application=await applicationFor(invite.id);
    return json({ok:true,application:safeApplication(application)});
  }

  if(b.action==='submit'){
    if(!application)throw new HttpError(409,'Complete your professional profile before submitting.');
    const answers=parse<Record<string,string>>(application.answers_json,{});
    if(!screeningComplete(answers))throw new HttpError(400,'Complete every screening question before submitting.');
    if(b.declaration!==true)throw new HttpError(400,'Confirm that the information supplied is accurate before submitting.');
    const now=Date.now(),classification=classifyScreening(answers,now);
    await db().batch([
      db().prepare("UPDATE agent_applications SET status='submitted',submitted_at=?,updated_at=? WHERE id=? AND status='draft'").bind(now,now,application.id),
      db().prepare('UPDATE agent_screening_sessions SET classification_json=?,completed_at=?,updated_at=? WHERE application_id=?').bind(JSON.stringify(classification),now,now,application.id),
      db().prepare("UPDATE agent_onboarding_invites SET status='submitted',submitted_at=? WHERE id=?").bind(now,invite.id)
    ]);
    application=await applicationFor(invite.id);
    return json({ok:true,application:safeApplication(application)});
  }

  throw new HttpError(400,'Unknown onboarding action.');
})}
