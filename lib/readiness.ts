import {SCHEMA_VERSION} from './contracts';
import {getOps} from './maintenance';

type RuntimeEnv={DB?:D1Database;OFFICE_SETUP_HASH?:string;CF_ACCESS_TEAM_DOMAIN?:string;CF_ACCESS_AUD?:string;PRIVATE_OFFICE_STANDALONE?:string};

export const REQUIRED_TABLES=['office','enquiries','visits','points','events','rate_limits','devices','agent_sessions','security_events','observation_rejections','schema_migrations','ops_state','agent_accounts','agent_web_sessions','agent_page_activity'] as const;
export const REQUIRED_COLUMNS:Record<string,string[]>={
  visits:['active_device_id','last_sequence','tracking_health','missing_observations','health_reason','health_evaluated_at'],
  points:['device_id','share_epoch','sequence_number','altitude','altitude_accuracy','heading','speed','simulated','queued_at','quality_class','plausibility_state','payload_hash','integrity_flags'],
  observation_rejections:['visit_id','share_epoch','sequence_number','code','raw_payload','payload_hash'],
  agent_web_sessions:['last_lat','last_lng','last_accuracy','last_location_at','location_verified_at','current_path','current_path_since'],
};
const WATCHDOG_STALE_MS=5*60000,RETENTION_STALE_MS=26*3600000;

export type Readiness={
  status:'ready'|'degraded'|'not_ready';
  database:'connected'|'missing'|'error';
  schema:{required:string;version:string|null;ok:boolean;missing_tables:string[];missing_columns:string[]};
  telemetry:'available'|'unavailable';
  access:'configured'|'missing'|'platform';
  office:'bootstrapped'|'awaiting_setup'|'setup_unavailable'|'unknown';
  scheduler:{watchdog:'running'|'stale'|'pending';retention:'running'|'stale'|'pending'};
  checked_at:string;
};

export async function checkReadiness(env:RuntimeEnv,now=Date.now()):Promise<Readiness>{
  const standalone=env.PRIVATE_OFFICE_STANDALONE==='1';
  const accessOk=!!(env.CF_ACCESS_TEAM_DOMAIN&&/^(https:\/\/)?[a-z0-9-]+\.cloudflareaccess\.com\/?$/i.test(env.CF_ACCESS_TEAM_DOMAIN.trim())&&env.CF_ACCESS_AUD&&env.CF_ACCESS_AUD.trim().length>=16);
  const access:Readiness['access']=standalone?(accessOk?'configured':'missing'):'platform';
  const r:Readiness={status:'not_ready',database:'missing',schema:{required:SCHEMA_VERSION,version:null,ok:false,missing_tables:[],missing_columns:[]},telemetry:'unavailable',access,office:'unknown',scheduler:{watchdog:'pending',retention:'pending'},checked_at:new Date(now).toISOString()};
  const d1=env.DB;
  if(!d1)return r;
  try{
    await d1.prepare('SELECT 1 AS ok').first();
    r.database='connected';
    const tables=new Set((await d1.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{name:string}>()).results.map(t=>t.name));
    r.schema.missing_tables=REQUIRED_TABLES.filter(t=>!tables.has(t));
    const inspect=Object.keys(REQUIRED_COLUMNS).filter(t=>tables.has(t));
    const infos=inspect.length?await d1.batch(inspect.map(t=>d1.prepare(`PRAGMA table_info("${t}")`))):[];
    inspect.forEach((t,i)=>{const cols=new Set(((infos[i]?.results??[]) as {name:string}[]).map(c=>c.name));for(const c of REQUIRED_COLUMNS[t])if(!cols.has(c))r.schema.missing_columns.push(`${t}.${c}`)});
    if(tables.has('schema_migrations'))r.schema.version=(await d1.prepare('SELECT version FROM schema_migrations WHERE version=?').bind(SCHEMA_VERSION).first<{version:string}>())?.version??null;
    r.schema.ok=!r.schema.missing_tables.length&&!r.schema.missing_columns.length&&r.schema.version===SCHEMA_VERSION;
    r.telemetry=r.schema.ok?'available':'unavailable';
    if(tables.has('office')){
      const owner=await d1.prepare('SELECT 1 AS x FROM office WHERE id=1').first();
      r.office=owner?'bootstrapped':/^[0-9a-f]{64}$/i.test(env.OFFICE_SETUP_HASH?.trim()??'')?'awaiting_setup':'setup_unavailable';
    }
    if(tables.has('ops_state')){
      const [w,ret]=await Promise.all([getOps(d1,'watchdog_last_run'),getOps(d1,'retention_last_run')]);
      r.scheduler.watchdog=!w?'pending':now-Number(w.updated_at)>WATCHDOG_STALE_MS?'stale':'running';
      r.scheduler.retention=!ret?'pending':now-Number(ret.updated_at)>RETENTION_STALE_MS?'stale':'running';
    }
  }catch(e){
    if(r.database!=='connected')r.database='error';
    console.error(JSON.stringify({level:'error',event:'readiness_check_failed',error:e instanceof Error?e.message:'unknown'}));
    return r;
  }
  const blocking=r.database!=='connected'||!r.schema.ok||r.access==='missing'||r.office==='setup_unavailable'||r.office==='unknown';
  const degraded=r.scheduler.watchdog==='stale'||r.scheduler.retention==='stale';
  r.status=blocking?'not_ready':degraded?'degraded':'ready';
  return r;
}
