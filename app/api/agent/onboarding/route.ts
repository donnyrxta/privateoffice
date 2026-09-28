import {getAgentSession} from '@/lib/agent-auth';
import {getOnboarding} from '@/lib/onboarding';
import {answerKeys,profileKeys,completeness,requiredCount,type ScreeningData} from '@/lib/interview';
import {body,db,HttpError,json,rate,wrap} from '@/lib/server';
async function agent(){const s=await getAgentSession();if(!s)throw new HttpError(401,'Sign in with your office-issued credentials.');return s.user}
export async function GET(){return wrap(async()=>{const u=await agent();return json({onboarding:await getOnboarding(u.userId),name:u.fullName})})}
export async function POST(req:Request){return wrap(async()=>{
 const u=await agent(),b=await body(req);await rate('onboarding:'+u.userId,60);
 if(!['save','submit'].includes(b.action))throw new HttpError(400,'Choose save or submit.');
 if(!Number.isInteger(b.revision)||b.revision<0)throw new HttpError(400,'Reload your current profile before saving.');
 const prior=await getOnboarding(u.userId);if(prior.status==='approved'||prior.status==='submitted')throw new HttpError(409,'This interview is locked for office review. Contact the office to request changes.');
 const data:ScreeningData={profile:{},answers:{},acknowledged:b.data?.acknowledged===true};
 for(const [group,keys,max] of [['profile',profileKeys,200],['answers',answerKeys,4000]] as const){for(const key of keys){const value=b.data?.[group]?.[key]??'';if(typeof value!=='string'||value.length>max)throw new HttpError(400,'Some answers are too long or invalid.');data[group][key]=value.trim()}}
 if(b.action==='submit'&&completeness(data)!==requiredCount)throw new HttpError(400,'Complete your profile, every interview question and the acknowledgement before submitting.');
 const now=Date.now(),status=b.action==='submit'?'submitted':prior.status;
 await db().prepare("INSERT OR IGNORE INTO agent_onboarding(agent_id,updated_at) VALUES(?,?)").bind(u.userId,now).run();
 const result=await db().prepare('UPDATE agent_onboarding SET data_json=?,status=?,revision=revision+1,updated_at=?,submitted_at=? WHERE agent_id=? AND revision=? AND status IN (\'draft\',\'changes_requested\')').bind(JSON.stringify(data),status,now,b.action==='submit'?now:null,u.userId,b.revision).run();
 if(result.meta.changes!==1)throw new HttpError(409,'A newer version exists. Reload before saving; your current answers remain on screen.');
 return json({onboarding:await getOnboarding(u.userId)});
})}
