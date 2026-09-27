import {getOnboarding} from '@/lib/onboarding';
import {classification,rubric} from '@/lib/interview';
import {body,db,HttpError,json,owner,rate,str,wrap} from '@/lib/server';
export async function GET(){return wrap(async()=>{await owner();const rows=await db().prepare('SELECT a.id,a.full_name,a.email,o.status,o.updated_at,o.review_json FROM agent_accounts a LEFT JOIN agent_onboarding o ON o.agent_id=a.id WHERE a.active=1 ORDER BY o.submitted_at DESC,a.full_name').all<{id:string;full_name:string;email:string;review_json:string|null}>();return json({agents:await Promise.all(rows.results.map(async ({review_json,...a})=>({...a,review:review_json?JSON.parse(review_json):null,onboarding:await getOnboarding(a.id)})))})})}
export async function POST(req:Request){return wrap(async()=>{
 const u=await owner(),b=await body(req);await rate('review:'+u.userId,30);const id=str(b.agent_id,100);const account=await db().prepare('SELECT email FROM agent_accounts WHERE id=?').bind(id).first<{email:string}>();if(!account)throw new HttpError(404,'Agent account not found.');if(id===u.userId||account.email.toLowerCase()===u.email?.toLowerCase())throw new HttpError(403,'An agent cannot review their own profile.');const record=await getOnboarding(id);
 if(record.status!=='submitted'||record.revision!==b.revision)throw new HttpError(409,'This submission has changed or is not awaiting review. Reload the review queue.');
 if(!['approved','changes_requested'].includes(b.decision))throw new HttpError(400,'Select a review decision.');
 const scores:Record<string,number>={},evidence:Record<string,string>={};for(const r of rubric){const score=b.scores?.[r.id];if(!Number.isInteger(score)||score<0||score>3)throw new HttpError(400,'Rate every assessed dimension.');scores[r.id]=score;evidence[r.id]=str(b.evidence?.[r.id],2000,10)}
 const feedback=str(b.feedback,3000,10);if(b.decision==='approved'&&(b.contract_verified!==true||b.identity_verified!==true||Object.values(scores).includes(0)))throw new HttpError(400,'Approval requires verified contract and identity, and evidence for every assessment dimension.');
 const eventId=crypto.randomUUID(),level=classification(scores),now=Date.now(),review={event_id:eventId,scores,evidence,feedback,classification:level,contract_verified:b.contract_verified===true,identity_verified:b.identity_verified===true};
 // Atomic guarded update and matching audit insertion. A concurrent review cannot overwrite a decision.
 const results=await db().batch([
 db().prepare('UPDATE agent_onboarding SET status=?,reviewed_at=?,reviewed_by=?,feedback=?,classification=?,review_json=?,revision=revision+1,updated_at=? WHERE agent_id=? AND status=\'submitted\' AND revision=?').bind(b.decision,now,u.userId,feedback,level,JSON.stringify(review),now,id,b.revision),
 db().prepare('INSERT INTO agent_review_events(id,agent_id,reviewer_id,decision,review_json,at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM agent_onboarding WHERE agent_id=? AND revision=? AND reviewed_at=? AND reviewed_by=? AND review_json=?)').bind(eventId,id,u.userId,b.decision,JSON.stringify(review),now,id,b.revision+1,now,u.userId,JSON.stringify(review))]);
 if(results[0].meta.changes!==1)throw new HttpError(409,'Another reviewer already handled this submission.');
 return json({ok:true,classification:level});
})}
