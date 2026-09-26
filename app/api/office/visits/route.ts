import {owner,body,db,json,wrap,str,num,token,hash,prune,HttpError,decorated,event,RETENTION_MS} from '@/lib/server';
export async function GET(){return wrap(async()=>{const u=await owner();await prune();const v=await db().prepare('SELECT * FROM visits WHERE owner_id=? ORDER BY created_at DESC LIMIT 100').bind(u.userId).all();const enquiries=await db().prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 100').all();const activity=await db().prepare("SELECT s.kind,s.device_at,s.received_at,s.detail,s.agent_id,s.device_id,(SELECT agent_name FROM visits v2 WHERE v2.agent_id=s.agent_id ORDER BY v2.created_at DESC LIMIT 1) AS agent_name FROM security_events s WHERE s.received_at>=? ORDER BY s.received_at DESC LIMIT 120").bind(Date.now()-RETENTION_MS).all();return json({visits:await Promise.all(v.results.map(v=>decorated(v))),enquiries:enquiries.results,activity:activity.results})})}
export async function POST(req:Request){return wrap(async()=>{
  const u=await owner(),b=await body(req),now=Date.now(),when=num(b.scheduled_at,now-3600000,now+28*86400000),id=crypto.randomUUID(),a=token(),c=token();
  let agentName:string,agentEmail:string,agentId:string|null=null,status='scheduled';
  if(typeof b.agent_username==='string'&&b.agent_username.trim()){
    const username=str(b.agent_username,80).toLowerCase();
    const account=await db().prepare('SELECT id,full_name,email FROM agent_accounts WHERE username=? AND active=1').bind(username).first<{id:string;full_name:string;email:string}>();
    if(!account)throw new HttpError(404,'No active contracted agent uses that username.');
    agentName=account.full_name;agentEmail=account.email;agentId=account.id;status='accepted';
  }else{
    agentEmail=str(b.agent_email,160).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agentEmail))throw new HttpError(400,'Enter the email the agent uses to sign in.');
    agentName=str(b.agent_name,100);
  }
  await db().batch([
    db().prepare('INSERT INTO visits (id,owner_id,agent_name,agent_email,agent_id,client_name,property,meeting,lat,lng,scheduled_at,expires_at,created_at,invite_hash,client_hash,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,u.userId,agentName,agentEmail,agentId,str(b.client_name,100),str(b.property,200),str(b.meeting,240),num(b.lat,-90,90),num(b.lng,-180,180),when,when+86400000,now,await hash(a),await hash(c),status),
    event(id,'assigned',u.userId,agentId?'contracted_agent:'+agentId:null)
  ]);
  return json({id,agent_path:agentId?'/agent':'/agent#invite='+a,client_path:'/visit/'+id+'#key='+c,direct_agent:!!agentId},201);
})}