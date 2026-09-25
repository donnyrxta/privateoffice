import {RETENTION_MS} from './contracts';
import {evaluateHealth,sequenceStatus} from './integrity';
import {opsLog} from './ops-log';

type SharingVisit={id:string;agent_id:string|null;status:string;share_epoch:string|null;share_until:number|null;share_started_at:number|null;expires_at:number;revoked_at:number|null;tracking_health:string|null;missing_observations:number|null;health_reason:string|null};
type LatestRow={recorded_at:number;received_at:number;integrity_flags:string|null};

/** Cron expressions. Keep in sync with `triggers.crons` in vite.config.ts. */
export const WATCHDOG_CRON='* * * * *';
/** 03:00 Africa/Harare (UTC+2, no DST) = 01:00 UTC. */
export const RETENTION_CRON='0 1 * * *';

export const RETENTION_POLICY={telemetryMs:RETENTION_MS,securityEventsMs:RETENTION_MS,visitEventsMs:RETENTION_MS,visitsMs:RETENTION_MS,closedSessionsMs:RETENTION_MS,enquiriesMs:90*86400000};
const RETENTION_OVERDUE_MS=26*3600000;
const ALERT_STATES=new Set(['degraded','stale','interrupted']);

async function setOps(d1:D1Database,key:string,value:unknown,now:number){await d1.prepare('INSERT INTO ops_state (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind(key,JSON.stringify(value),now).run()}
export async function getOps(d1:D1Database,key:string){return d1.prepare('SELECT value,updated_at FROM ops_state WHERE key=?').bind(key).first<{value:string;updated_at:number}>()}

/** Policy-driven deletion. Runs from the daily Cron Trigger; the office dashboard only calls it if the scheduler is overdue. */
export async function runRetention(d1:D1Database,now=Date.now()){
  const p=RETENTION_POLICY;
  const results=await d1.batch([
    d1.prepare('DELETE FROM points WHERE received_at < ?').bind(now-p.telemetryMs),
    d1.prepare('DELETE FROM observation_rejections WHERE received_at < ?').bind(now-p.telemetryMs),
    d1.prepare('DELETE FROM security_events WHERE received_at < ?').bind(now-p.securityEventsMs),
    d1.prepare('DELETE FROM events WHERE at < ?').bind(now-p.visitEventsMs),
    d1.prepare('DELETE FROM enquiries WHERE created_at < ?').bind(now-p.enquiriesMs),
    d1.prepare('DELETE FROM visits WHERE created_at < ?').bind(now-p.visitsMs),
    d1.prepare('DELETE FROM agent_sessions WHERE ended_at IS NOT NULL AND ended_at < ?').bind(now-p.closedSessionsMs),
    d1.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now),
  ]);
  const names=['points','observation_rejections','security_events','events','enquiries','visits','agent_sessions','rate_limits'];
  const deleted=Object.fromEntries(names.map((n,i)=>[n,results[i]?.meta?.changes??0]));
  await setOps(d1,'retention_last_run',{deleted},now);
  opsLog('info','retention_completed',{deleted});
  return deleted;
}

export async function retentionIfOverdue(d1:D1Database,now=Date.now()){const last=await getOps(d1,'retention_last_run');if(!last||now-Number(last.updated_at)>RETENTION_OVERDUE_MS){opsLog('warn','retention_scheduler_overdue',{last_run_at:last?.updated_at??null});return runRetention(d1,now)}return null}

/**
 * Evaluates every sharing visit independently of any dashboard being open. Health transitions are written
 * to the visit audit trail (events) and emitted as structured logs for alerting.
 */
export async function runWatchdog(d1:D1Database,now=Date.now()){
  const rows=await d1.prepare("SELECT * FROM visits WHERE status='sharing' AND revoked_at IS NULL ORDER BY share_started_at DESC LIMIT 500").all<SharingVisit>();
  const transitions:{visit_id:string;from:string|null;to:string}[]=[];const statements:D1PreparedStatement[]=[];let alerts=0;
  for(const v of rows.results){
    const latest=v.share_epoch?await d1.prepare('SELECT recorded_at,received_at,integrity_flags FROM points WHERE visit_id=? AND share_epoch=? ORDER BY sequence_number DESC LIMIT 1').bind(v.id,v.share_epoch).first<LatestRow>():null;
    const seq=v.share_epoch?await sequenceStatus(d1,v.id,v.share_epoch):null;
    const h=evaluateHealth(v,latest,seq,now);
    const reason=h.reasons.join(',')||null;
    if(ALERT_STATES.has(h.state)){alerts++;opsLog('warn','active_visit_unhealthy',{visit_id:v.id,agent_id:v.agent_id,state:h.state,reasons:h.reasons,age_ms:h.age_ms,missing_observations:h.missing_observations,last_sequence:h.last_sequence})}
    if(h.state!==v.tracking_health||h.missing_observations!==Number(v.missing_observations??0)||reason!==(v.health_reason??null)){
      statements.push(d1.prepare("UPDATE visits SET tracking_health=?,missing_observations=?,health_reason=?,health_evaluated_at=? WHERE id=? AND status='sharing'").bind(h.state,h.missing_observations,reason,now,v.id));
      if(h.state!==v.tracking_health){
        transitions.push({visit_id:v.id,from:v.tracking_health??null,to:h.state});
        statements.push(d1.prepare('INSERT INTO events (id,visit_id,kind,actor,at,detail) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),v.id,'tracking_health_changed','watchdog',now,JSON.stringify({from:v.tracking_health??null,to:h.state,reasons:h.reasons,age_ms:h.age_ms,missing_observations:h.missing_observations,last_sequence:h.last_sequence,contiguous_through:h.contiguous_through})));
      }
    }
  }
  statements.push(d1.prepare("UPDATE visits SET health_evaluated_at=? WHERE status='sharing' AND revoked_at IS NULL").bind(now));
  statements.push(d1.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now));
  await d1.batch(statements);
  await setOps(d1,'watchdog_last_run',{evaluated:rows.results.length,transitions:transitions.length,alerts},now);
  return {evaluated:rows.results.length,transitions,alerts};
}

export async function runScheduled(cron:string,d1:D1Database|undefined,now=Date.now()){
  if(!d1){opsLog('error','scheduled_without_database',{cron});return}
  try{
    if(cron===RETENTION_CRON)await runRetention(d1,now);
    else await runWatchdog(d1,now);
  }catch(e){opsLog('error','scheduled_failed',{cron,error:e instanceof Error?e.message:'unknown'});throw e}
}
