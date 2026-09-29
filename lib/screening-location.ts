import {db,HttpError} from './server';
export const SCREENING_LOCATION_VERSION='2026-09-28.screening.v1';
export const SCREENING_LOCATION_FRESH_MS=15*60*1000;
export type ScreeningLocation={status:'required'|'acquired'|'manual_pending'|'manual_approved';accuracy:number|null;received_at:number|null;expires_at:number|null};
export async function screeningLocation(inviteId:string):Promise<ScreeningLocation>{
 const rows=await db().prepare('SELECT kind,accuracy,received_at FROM screening_location_checks WHERE invite_id=? ORDER BY received_at DESC LIMIT 100').bind(inviteId).all<{kind:string;accuracy:number|null;received_at:number}>();
 if(rows.results.some(r=>r.kind==='manual_approved'))return {status:'manual_approved',accuracy:null,received_at:null,expires_at:null};
 const fix=rows.results.find(r=>r.kind==='location');
 if(fix&&Number(fix.accuracy)<=100&&fix.received_at>Date.now()-SCREENING_LOCATION_FRESH_MS)return {status:'acquired',accuracy:fix.accuracy,received_at:fix.received_at,expires_at:fix.received_at+SCREENING_LOCATION_FRESH_MS};
 return {status:rows.results.some(r=>r.kind==='manual_requested')?'manual_pending':'required',accuracy:null,received_at:null,expires_at:null};
}
export async function requireScreeningLocation(inviteId:string,maxAge=SCREENING_LOCATION_FRESH_MS){
 const state=await screeningLocation(inviteId);
 if(state.status!=='manual_approved'&&(state.status!=='acquired'||!state.received_at||state.received_at<Date.now()-maxAge))throw new HttpError(428,'Refresh your screening location check, or ask the office to approve a manual interview.','SCREENING_LOCATION_REQUIRED');
}
