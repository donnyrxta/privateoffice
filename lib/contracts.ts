import type {QualityClass} from './telemetry/shared';
export const CONSENT_VERSION='2026-09-25.v2';
export const CONSENT_SUMMARY='When a Private Office security or customer-visit session is active, the platform records device-reported location observations, reported accuracy, timestamps and tracking-health events. During an active customer visit, the office receives the full visit evidence trail and the client receives the latest persisted position, its age and reported accuracy. Visit tracking ends on an explicit terminal action, revocation or expiry.';
export const RETENTION_MS=30*24*60*60*1000;
export const SHARE_MS=4*60*60*1000;
export const FRESH_MS=30*1000;
export const STALE_MS=90*1000;
export type Point={id?:string;device_id?:string;share_epoch?:string;sequence_number?:number;lat:number;lng:number;accuracy:number;altitude?:number|null;altitude_accuracy?:number|null;heading?:number|null;speed?:number|null;simulated?:boolean;quality_class?:QualityClass|string;plausibility_state?:string;integrity_flags?:string|null;recorded_at:number;queued_at?:number;received_at:number};
export type Visit={id:string;health?:HealthDetail;agent_name:string;agent_email?:string;client_name?:string;property:string;meeting:string;lat:number;lng:number;scheduled_at:number;expires_at:number;status:string;consent_at?:number;consent_version?:string;share_started_at?:number;share_until?:number;share_epoch?:string;active_device_id?:string;last_sequence?:number;last_received_at?:number;stopped_at?:number;revoked_at?:number;eta_minutes?:number;client_confirmed_at?:number;property_confirmed?:string;client_comment?:string;tracking_health?:string;point?:Point|null;points?:Point[];events?:{kind:string;at:number;detail?:string}[];security_events?:{kind:string;device_at:number;received_at:number;detail?:string}[];fresh?:boolean;demo?:boolean};
export function distanceMetres(a:{lat:number;lng:number},b:{lat:number;lng:number}){const rad=Math.PI/180,dl=(b.lat-a.lat)*rad,dn=(b.lng-a.lng)*rad;const q=Math.sin(dl/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dn/2)**2;return 6371000*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}
export function statusLabel(s:string){return ({scheduled:'Visit scheduled',accepted:'Ready for visit',sharing:'On the way',paused:'Sharing stopped',arrived:'Arrival reported',completed:'Visit completed',revoked:'Visit cancelled',expired:'Visit expired'} as Record<string,string>)[s]||s}
// Production readiness contract. Bump SCHEMA_VERSION with every migration that the Worker depends on.
export const SCHEMA_VERSION='0004_agent_presence_gate';
// Server-side tracking-health thresholds measured from the latest persisted position (field-tune before go-live).
export const HEALTH_THRESHOLDS={delayedMs:15_000,staleMs:45_000,interruptedMs:90_000};
export type TrackingHealthState='idle'|'acquiring'|'healthy'|'delayed'|'degraded'|'stale'|'interrupted'|'window_elapsed'|'completed'|'revoked';
export type SequenceGap={from:number;to:number};
export type HealthDetail={state:TrackingHealthState;reasons:string[];age_ms:number|null;last_sequence:number;contiguous_through:number;missing_observations:number;gaps:SequenceGap[];rejected_observations:number;flagged_observations:number};
export function healthLabel(state:string|undefined){return ({idle:'Idle',acquiring:'Acquiring location',healthy:'Healthy',delayed:'Delayed',degraded:'Tracking degraded',stale:'Location stale',interrupted:'Tracking interrupted',window_elapsed:'Sharing window elapsed',completed:'Completed',revoked:'Revoked'} as Record<string,string>)[state||'']||'Unknown'}
