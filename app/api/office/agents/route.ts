import {owner,body,db,json,wrap,str,rate,HttpError} from '@/lib/server';
import {generateAgentPassword,normalizeAgentUsername,passwordRecord} from '@/lib/agent-auth';

function email(value:unknown){const v=str(value,160).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw new HttpError(400,'Enter a valid agent email address.');return v}

export async function GET(){return wrap(async()=>{await owner();const rows=await db().prepare('SELECT id,username,email,full_name,active,created_at,last_login_at FROM agent_accounts ORDER BY active DESC,full_name ASC').all();return json({agents:rows.results})})}

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
