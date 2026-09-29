import {db,HttpError} from './server';
import {emptyScreening,type ScreeningData} from './interview';
export type Onboarding={agent_id:string;status:'draft'|'submitted'|'changes_requested'|'approved';data:ScreeningData;revision:number;updated_at:number|null;submitted_at:number|null;feedback:string|null;classification:string|null;reviewed_at:number|null};
export async function getOnboarding(agentId:string):Promise<Onboarding>{
 const row=await db().prepare('SELECT agent_id,status,data_json,revision,updated_at,submitted_at,feedback,classification,reviewed_at FROM agent_onboarding WHERE agent_id=?').bind(agentId).first<Omit<Onboarding,'data'>&{data_json:string}>();
 if(!row)return {agent_id:agentId,status:'draft',data:emptyScreening,revision:0,updated_at:null,submitted_at:null,feedback:null,classification:null,reviewed_at:null};
 const {data_json,...rest}=row;const stored=JSON.parse(data_json) as Partial<ScreeningData>;return {...rest,data:{profile:stored.profile??{},answers:stored.answers??{},acknowledged:stored.acknowledged===true}};
}
export async function requireApprovedAgent(agentId:string){const record=await getOnboarding(agentId);if(record.status!=='approved')throw new HttpError(403,'Finish your professional introduction and wait for our team to confirm activation before taking visits.','ONBOARDING_REQUIRED')}
