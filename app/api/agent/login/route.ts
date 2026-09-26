import {body,db,json,wrap,str,rate,HttpError} from '@/lib/server';
import {agentCookie,newAgentSession,normalizeAgentUsername,verifyPassword} from '@/lib/agent-auth';

export async function POST(req:Request){return wrap(async()=>{
  const b=await body(req),username=normalizeAgentUsername(str(b.username,80)),password=str(b.password,200,8);
  const ip=req.headers.get('cf-connecting-ip')||'unknown';
  await rate('agent-login-ip:'+ip,12,15*60*1000);await rate('agent-login-user:'+username,8,15*60*1000);
  const row=await db().prepare('SELECT id,username,email,full_name,password_salt,password_hash,password_iterations,active FROM agent_accounts WHERE username=?').bind(username).first<any>();
  if(!row||!row.active||!await verifyPassword(password,row))throw new HttpError(401,'The username or password is incorrect.');
  const session=await newAgentSession(db(),row.id),now=Date.now();
  await db().prepare('UPDATE agent_accounts SET last_login_at=?,updated_at=? WHERE id=?').bind(now,now,row.id).run();
  const r=json({ok:true,name:row.full_name,username:row.username});r.headers.set('Set-Cookie',agentCookie(session.token));return r;
})}
