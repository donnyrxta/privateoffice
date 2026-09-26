import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash,webcrypto} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare,supportedCompatibilityDate}=wranglerRequire('miniflare');
// The deployed Worker targets 2026-09-25; the pinned local workerd may lag behind, so clamp for local contract runs only.
const compatibilityDate=['2026-09-25',supportedCompatibilityDate].sort()[0];
const setup='test-only-setup-secret-not-for-production';
const mf=new Miniflare({modules:['index.js',...readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js')].map(p=>({type:'ESModule',path:resolve('dist/server',p)})),modulesRoot:resolve('dist/server'),compatibilityDate,compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'test-db'},bindings:{OFFICE_SETUP_HASH:createHash('sha256').update(setup).digest('hex')},log:undefined});
let assertions=0;
const users={owner:['owner-test','owner@example.invalid'],agent:['agent-test','agent@example.invalid'],other:['other-test','other@example.invalid']};
function canonical(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'}
function b64(bytes){return Buffer.from(bytes).toString('base64url')}
async function device(){const pair=await webcrypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);return {id:'device-'+crypto.randomUUID(),session:'session-'+crypto.randomUUID(),privateKey:pair.privateKey,publicJwk:await webcrypto.subtle.exportKey('jwk',pair.publicKey)}}
async function sign(d,envelope){return b64(new Uint8Array(await webcrypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},d.privateKey,new TextEncoder().encode(canonical(envelope)))))}
async function request(path,{as,data,token,cookie,origin='http://site.test'}={}){const headers={'Content-Type':'application/json',Origin:origin};if(as){headers['oai-authenticated-user-id']=users[as][0];headers['oai-authenticated-user-email']=users[as][1]}if(token)headers.Authorization='Bearer '+token;if(cookie)headers.Cookie=cookie;const r=await mf.dispatchFetch('http://site.test'+path,{method:data?'POST':'GET',headers,...(data?{body:JSON.stringify(data)}:{})});let body;try{body=await r.json()}catch{body=null}return {status:r.status,body,headers:r.headers}}
async function upload(d,visitId,epoch,observations){const envelope={device_id:d.id,visit_id:visitId,share_epoch:epoch,observations};return request('/api/agent/visit/'+visitId+'/observations',{as:'agent',data:{device_id:d.id,share_epoch:epoch,observations,signature:await sign(d,envelope)}})}
async function waitFor(fn,label,tries=40){for(let i=0;i<tries;i++){if(await fn())return true;await new Promise(r=>setTimeout(r,50))}throw new Error('Timed out waiting for '+label)}
const MIGRATIONS=['drizzle/0000_huge_blizzard.sql','drizzle/0001_durable_telemetry.sql','drizzle/0002_production_readiness.sql','drizzle/0003_agent_credentials.sql','drizzle/0004_agent_presence_gate.sql'];
function eq(actual,expected,label){assert.equal(actual,expected,label);assertions++;console.log('PASS '+label)}
try{
  const db=await mf.getD1Database('DB');
  let h=await request('/api/health');eq(h.status,503,'readiness is 503 before migrations');eq(h.body.database,'connected','readiness reports D1 connected');eq(h.body.schema.ok,false,'readiness detects missing schema');eq(h.body.schema.missing_tables.includes('observation_rejections'),true,'readiness lists missing tables');
  for(const migration of MIGRATIONS)for(const sql of readFileSync(migration,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  h=await request('/api/health');eq(h.status,200,'readiness is 200 after migrations');eq(h.body.status,'ready','readiness status ready');eq(h.body.schema.version,'0004_agent_presence_gate','readiness verifies required schema version');eq(h.body.schema.missing_columns.length,0,'enriched telemetry columns present');eq(h.body.telemetry,'available','telemetry available');eq(h.body.office,'awaiting_setup','office awaits bootstrap with a valid setup hash');eq(h.headers.get('cache-control'),'no-store','readiness is not cached');
  let r=await request('/api/office/visits');eq(r.status,401,'anonymous office denied');
  r=await request('/api/office/setup',{as:'owner',data:{key:setup}});eq(r.status,200,'owner setup succeeds');
  r=await request('/api/office/visits',{as:'other'});eq(r.status,403,'other authenticated user denied office');
  r=await request('/api/office/agents',{as:'owner',data:{full_name:'Credential Agent',username:'credential.agent',email:'credential.agent@example.invalid'}});eq(r.status,201,'office issues contracted agent account');const issued=r.body;eq(typeof issued.password,'string','agent password returned once');
  r=await request('/api/agent/login',{data:{username:'credential.agent',password:'wrong-password'}});eq(r.status,401,'wrong agent password denied');
  r=await request('/api/agent/login',{data:{username:'credential.agent',password:issued.password}});eq(r.status,200,'issued agent credentials authenticate');const agentCookie=r.headers.get('set-cookie')?.split(';')[0];eq(agentCookie?.startsWith('po_agent_session='),true,'agent receives HttpOnly web session cookie');
  const directInput={agent_username:'credential.agent',client_name:'Direct client',property:'Direct assigned property',meeting:'Direct meeting point',lat:-17.79,lng:31.06,scheduled_at:Date.now()+7200000};
  r=await request('/api/office/visits',{as:'owner',data:directInput});eq(r.status,201,'office assigns visit directly to contracted agent');eq(r.body.direct_agent,true,'direct assignment skips invitation acceptance');const directId=r.body.id;
  r=await request('/api/agent',{cookie:agentCookie});eq(r.status,428,'agent dashboard locked until precise location is supplied');eq(r.body.code,'LOCATION_REQUIRED','locked dashboard names location precondition');
  r=await request('/api/agent/presence',{cookie:agentCookie,data:{lat:-17.833,lng:31.041,accuracy:80,recorded_at:Date.now(),path:'/agent/location',duration_ms:0}});eq(r.status,409,'imprecise fix does not unlock agent session');eq(r.body.code,'PRECISION_REQUIRED','imprecise gate reports precision requirement');
  r=await request('/api/agent',{cookie:agentCookie});eq(r.status,428,'imprecise fix leaves dashboard locked');
  r=await request('/api/agent/presence',{cookie:agentCookie,data:{lat:-17.833,lng:31.041,accuracy:5,recorded_at:Date.now(),path:'/agent/location',duration_ms:0}});eq(r.status,200,'precise presence unlocks contracted agent session');
  r=await request('/api/agent',{cookie:agentCookie});eq(r.status,200,'verified agent session opens assigned workspace');eq(r.body.visits.some(v=>v.id===directId),true,'contracted agent sees directly assigned visit');
  eq(!!(await db.prepare("SELECT 1 AS x FROM agent_page_activity WHERE agent_id=? AND path='/agent/location'").bind(issued.agent.id).first()),true,'location gate activity is persisted');
  r=await request('/api/enquiries',{data:{name:'QA',contact:'qa@example.invalid',interest:'Synthetic test',consent:true}});eq(r.status,201,'enquiry persisted');
  const input={agent_name:'QA agent',agent_email:'agent@example.invalid',client_name:'QA client',property:'Synthetic property',meeting:'Synthetic meeting point',lat:-17.78,lng:31.04,scheduled_at:Date.now()+3600000};
  r=await request('/api/office/visits',{as:'owner',data:input});eq(r.status,201,'visit assigned');const {id,agent_path,client_path}=r.body;const invite=agent_path.split('=')[1],client=client_path.split('=')[1],a='/api/agent/visit/'+id;
  r=await request('/api/agent/accept',{as:'agent',data:{invite,consent:true,version:'2026-09-25.v2'}});eq(r.status,200,'agent accepts current tracking notice');
  const d=await device();
  r=await request('/api/agent/device',{as:'agent',data:{device_id:d.id,session_id:d.session,public_key_jwk:d.publicJwk,platform:'test',app_version:'test'}});eq(r.status,200,'device key enrolled');
  const event={id:'event-1',kind:'APP_OPEN',device_at:Date.now(),visit_id:null,share_epoch:null,detail:'{}'};let envelope={device_id:d.id,session_id:d.session,events:[event]};
  r=await request('/api/agent/activity',{as:'agent',data:{...envelope,signature:await sign(d,envelope)}});eq(r.status,200,'signed security event accepted');eq(r.body.processed_ids[0],'event-1','security event explicitly ACKed');
  r=await request(a,{as:'agent',data:{action:'start',consent:true,version:'2026-09-25.v2',eta_minutes:15,device_id:d.id}});eq(r.status,200,'visit tracking epoch starts on registered device');const epoch=r.body.epoch;
  const obs={id:'obs-1',sequence_number:0,lat:-17.79,lng:31.05,accuracy:7.5,altitude:null,altitude_accuracy:null,heading:42,speed:12,simulated:false,recorded_at:Date.now(),queued_at:Date.now()};envelope={device_id:d.id,visit_id:id,share_epoch:epoch,observations:[obs]};
  r=await request(a+'/observations',{as:'agent',data:{device_id:d.id,share_epoch:epoch,observations:[obs],signature:await sign(d,envelope)}});eq(r.status,200,'signed observation batch accepted');eq(r.body.processed_ids[0],'obs-1','persisted observation explicitly ACKed');eq(r.body.last_sequence,0,'server records sequence continuity');
  r=await request(a+'/observations',{as:'agent',data:{device_id:d.id,share_epoch:epoch,observations:[obs],signature:await sign(d,envelope)}});eq(r.status,200,'lost-ACK retry is idempotent');eq(r.body.processed_ids[0],'obs-1','exact duplicate is ACKed again');
  const changed={...obs,lat:-17.5};envelope={device_id:d.id,visit_id:id,share_epoch:epoch,observations:[changed]};r=await request(a+'/observations',{as:'agent',data:{device_id:d.id,share_epoch:epoch,observations:[changed],signature:await sign(d,envelope)}});eq(r.body.rejected[0].code,'OBSERVATION_ID_CONFLICT','same UUID with changed payload rejected');
  const collision={...obs,id:'obs-collision'};envelope={device_id:d.id,visit_id:id,share_epoch:epoch,observations:[collision]};r=await request(a+'/observations',{as:'agent',data:{device_id:d.id,share_epoch:epoch,observations:[collision],signature:await sign(d,envelope)}});eq(r.body.rejected[0].code,'SEQUENCE_CONFLICT','different UUID cannot reuse sequence');
  r=await request('/api/client/'+id,{token:client});eq(r.body.point.lat,-17.79,'client receives latest persisted position');eq(r.body.point.quality_class,'excellent','client receives accuracy quality class');eq(r.body.fresh,true,'freshness derived from persisted timestamps');eq(r.body.points,undefined,'client receives no route history');
  r=await request('/api/office/visit/'+id,{as:'owner'});eq(r.body.points.length,1,'office receives raw route history');eq(r.body.security_events.length>=0,true,'office projection includes security event stream');
  r=await request(a,{as:'agent',data:{action:'pause',device_id:d.id,epoch,final_sequence:1}});eq(r.status,409,'terminal state waits for declared final sequence');eq(r.body.code,'TELEMETRY_PENDING','terminal gap has explicit error code');
  r=await request(a,{as:'agent',data:{action:'pause',device_id:d.id,epoch,final_sequence:0}});eq(r.status,200,'pause succeeds after final sequence is persisted');
  r=await request(a,{as:'agent',data:{action:'pause',device_id:d.id,epoch,final_sequence:0}});eq(r.status,200,'terminal retry after lost response is idempotent');
  r=await request('/api/client/'+id,{token:client});eq(r.body.point,null,'client position hidden when visit is paused');
  r=await request(a,{as:'agent',data:{action:'start',consent:true,version:'2026-09-25.v2',eta_minutes:10,device_id:d.id}});eq(r.status,200,'new tracking epoch can start after pause');const epoch2=r.body.epoch;
  const obs2={...obs,id:'obs-2',sequence_number:0,lat:-17.785,lng:31.048,accuracy:18,recorded_at:Date.now(),queued_at:Date.now()};envelope={device_id:d.id,visit_id:id,share_epoch:epoch2,observations:[obs2]};r=await request(a+'/observations',{as:'agent',data:{device_id:d.id,share_epoch:epoch2,observations:[obs2],signature:await sign(d,envelope)}});eq(r.status,200,'second epoch observation accepted');
  const at=Date.now(),mk=(n,extra={})=>({...obs,id:'e2-'+n,sequence_number:n,lat:-17.785+n*0.0001,lng:31.048,accuracy:9,recorded_at:at+n*1000,queued_at:at+n*1000,...extra});
  r=await upload(d,id,epoch2,[mk(1),mk(3)]);eq(r.status,200,'out-of-order batch persisted');eq(r.body.last_sequence,3,'MAX sequence is 3');eq(r.body.missing_observations,1,'server detects one missing observation');eq(JSON.stringify(r.body.gaps),JSON.stringify([{from:2,to:2}]),'server identifies the exact gap');eq(r.body.contiguous_through,1,'contiguous high-water mark stops before the gap');eq(r.body.tracking_health,'degraded','SEQUENCE_GAP degrades tracking health');
  r=await request('/api/office/visit/'+id,{as:'owner'});eq(r.body.tracking_health,'degraded','office sees TRACKING DEGRADED');eq(r.body.health.missing_observations,1,'office sees 1 observation missing');eq(r.body.health.reasons.includes('sequence_gap'),true,'office sees sequence_gap reason');
  r=await request('/api/client/'+id,{token:client});eq(r.body.health,undefined,'client projection does not expose evidence health detail');
  r=await request(a,{as:'agent',data:{action:'arrive',device_id:d.id,epoch:epoch2,final_sequence:3}});eq(r.status,409,'MAX>=final is no longer sufficient: 0,1,3 cannot close at 3');eq(r.body.code,'TELEMETRY_PENDING','gap refusal is TELEMETRY_PENDING');eq(JSON.stringify(r.body.gaps),JSON.stringify([{from:2,to:2}]),'refusal names the missing sequence');eq(r.body.persisted_sequence,1,'refusal reports contiguous persisted sequence');
  r=await request(a,{as:'agent',data:{action:'arrive',device_id:d.id,epoch:epoch2,final_sequence:1}});eq(r.status,409,'cannot close below persisted MAX');eq(r.body.code,'FINAL_SEQUENCE_MISMATCH','observations beyond final are flagged');
  r=await upload(d,id,epoch2,[mk(4),mk(4,{id:'e2-4-dup'})]);eq(r.status,200,'in-batch duplicate sequence does not fail the batch');eq(r.body.rejected[0].code,'SEQUENCE_CONFLICT','in-batch duplicate sequence rejected');
  const bad=mk(2,{recorded_at:at-86400000,queued_at:at-86400000});r=await upload(d,id,epoch2,[bad]);eq(r.body.rejected[0].code,'INVALID_TIME','invalid observation rejected');eq(r.body.rejected[0].recorded,true,'rejected observation is persisted as evidence');eq(r.body.missing_observations,0,'rejection record accounts for the sequence');
  r=await upload(d,id,epoch2,[bad]);eq(r.body.rejected[0].code,'INVALID_TIME','rejection replay is idempotent');eq(r.body.rejected[0].recorded,true,'rejection replay not duplicated');
  r=await upload(d,id,epoch2,[mk(5,{simulated:true})]);eq(r.status,200,'simulated observation persisted, not dropped');
  r=await request('/api/office/visit/'+id,{as:'owner'});const sim=r.body.points.find(p=>p.id==='e2-5');eq(sim.integrity_flags,'["simulated_location"]','simulated_location flag stored with raw evidence');eq(r.body.tracking_health,'degraded','current simulated fix degrades health');eq(r.body.observation_rejections.length,1,'office sees rejection records');
  r=await upload(d,id,epoch2,[mk(6,{recorded_at:at+1000,queued_at:at+1000})]);eq(JSON.parse(r.status===200?(await request('/api/office/visit/'+id,{as:'owner'})).body.points.find(p=>p.id==='e2-6').integrity_flags:'[]').includes('timestamp_anomaly'),true,'timestamp_anomaly flag derived');
  r=await request(a,{as:'agent',data:{action:'arrive',device_id:d.id,epoch:epoch2,final_sequence:6}});eq(r.status,200,'arrival closes once 0..final are all accounted for');
  r=await request('/api/client/'+id,{token:client,data:{property_confirmed:'yes',comment:'Synthetic confirmation.'}});eq(r.status,200,'client can independently confirm arrival outcome');
  r=await request(a,{as:'agent',data:{action:'complete'}});eq(r.status,200,'arrived visit can be completed without reopening tracking');
  r=await request('/api/office/visits',{as:'owner'});eq(Array.isArray(r.body.activity),true,'office dashboard receives recent agent security activity');
  r=await request('/api/office/visit/'+id+'/export',{as:'owner'});eq(r.status,200,'office exports evidence package');eq(r.body.format,'private-office.visit-evidence.v1','evidence package format');eq(r.headers.get('content-disposition')?.startsWith('attachment'),true,'evidence package downloads as attachment');eq(r.body.epochs.length,2,'package lists both tracking epochs');eq(r.body.epochs.every(e=>e.sequence.contiguous),true,'package proves sequence contiguity per epoch');eq(r.body.observation_rejections[0].raw_payload.includes('e2-2'),true,'package includes raw rejected evidence');eq(r.body.devices[0].id,d.id,'package includes device identity');eq(JSON.stringify(r.body).includes(client),false,'package never contains the client capability token');eq(/^[0-9a-f]{64}$/.test(r.body.integrity.package_sha256),true,'package carries a SHA-256 digest');
  r=await request('/api/office/visit/'+id+'/export',{as:'other'});eq(r.status,403,'non-owner cannot export evidence');
  // Watchdog: a second visit whose last persisted fix is two minutes old.
  r=await request('/api/office/visits',{as:'owner',data:{...input,property:'Watchdog property'}});const w=r.body,wInvite=w.agent_path.split('=')[1],wa='/api/agent/visit/'+w.id;
  await request('/api/agent/accept',{as:'agent',data:{invite:wInvite,consent:true,version:'2026-09-25.v2'}});
  r=await request(wa,{as:'agent',data:{action:'start',consent:true,version:'2026-09-25.v2',eta_minutes:12,device_id:d.id}});const wEpoch=r.body.epoch;
  r=await upload(d,w.id,wEpoch,[{...obs,id:'w-0',sequence_number:0,recorded_at:Date.now(),queued_at:Date.now()}]);eq(r.body.tracking_health,'healthy','fresh fix is healthy');
  const old=Date.now()-120000;await db.prepare('UPDATE points SET recorded_at=?,queued_at=?,received_at=? WHERE id=?').bind(old,old,old,'w-0').run(); // simulate two minutes of silence
  const worker=await mf.getWorker();await worker.scheduled({cron:'* * * * *'});
  await waitFor(async()=>(await db.prepare('SELECT tracking_health FROM visits WHERE id=?').bind(w.id).first())?.tracking_health==='interrupted','watchdog');
  eq((await db.prepare('SELECT tracking_health FROM visits WHERE id=?').bind(w.id).first()).tracking_health,'interrupted','watchdog marks >90s visit TRACKING INTERRUPTED without any dashboard');
  eq(!!(await db.prepare("SELECT 1 AS x FROM events WHERE visit_id=? AND kind='tracking_health_changed' AND actor='watchdog'").bind(w.id).first()),true,'watchdog writes health transition to the audit trail');
  r=await request('/api/office/visit/'+w.id,{as:'owner'});eq(r.body.health.state,'interrupted','office projection reports interrupted');eq(r.body.health.age_ms>90000,true,'office sees last persisted position age');
  const wClient=w.client_path.split('=')[1];
  r=await request(wa,{as:'other'});eq(r.status,403,'access matrix: agent cannot read another agent\'s visit');
  r=await request('/api/client/'+w.id,{token:wClient});eq(r.status,200,'access matrix: correct client link allowed');
  r=await request('/api/client/'+w.id,{token:client});eq(r.status,404,'access matrix: another visit\'s client token denied');
  r=await request('/api/client/'+w.id,{token:wClient.slice(0,-1)+(wClient.endsWith('0')?'1':'0')});eq(r.status,404,'access matrix: wrong client token denied');
  r=await request('/api/office/visit/'+w.id,{as:'owner',data:{action:'revoke'}});eq(r.status,200,'office revokes active visit');
  r=await request('/api/client/'+w.id,{token:wClient});eq(r.status,410,'access matrix: revoked visit client link denied');
  r=await upload(d,w.id,wEpoch,[{...obs,id:'w-after-revoke',sequence_number:1,recorded_at:Date.now(),queued_at:Date.now()}]);eq(r.status,410,'revoked visit rejects further telemetry');
  await db.prepare('UPDATE visits SET expires_at=? WHERE id=?').bind(Date.now()-1000,id).run();
  r=await request('/api/client/'+id,{token:client});eq(r.status,410,'access matrix: expired client link denied');
  h=await request('/api/health');eq(h.body.scheduler.watchdog,'running','readiness reports watchdog heartbeat');
  await db.prepare('INSERT INTO rate_limits (key,count,expires_at) VALUES (?,?,?)').bind('stale-test',1,1).run();
  await worker.scheduled({cron:'0 1 * * *'});
  await waitFor(async()=>!!(await db.prepare("SELECT 1 AS x FROM ops_state WHERE key='retention_last_run'").first()),'retention');
  eq(await db.prepare("SELECT 1 AS x FROM rate_limits WHERE key='stale-test'").first(),null,'daily retention cron deletes per policy');
  h=await request('/api/health');eq(h.body.scheduler.retention,'running','readiness reports retention heartbeat');eq(h.body.office,'bootstrapped','readiness confirms office bootstrapped');
  const bare=new Miniflare({modules:[{type:'ESModule',path:resolve('dist/server/index.js')},...readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js').map(p=>({type:'ESModule',path:resolve('dist/server',p)}))],modulesRoot:resolve('dist/server'),compatibilityDate,compatibilityFlags:['nodejs_compat'],bindings:{PRIVATE_OFFICE_STANDALONE:'1'}});
  try{const r=await bare.dispatchFetch('http://site.test/api/health');const b=await r.json();eq(r.status,503,'readiness is 503 without a DB binding');eq(b.database,'missing','readiness reports database missing');eq(b.access,'missing','standalone readiness flags missing Cloudflare Access config');}finally{await bare.dispose()}
  console.log(`\n${assertions} assertions passed. All coordinates and identities were synthetic.`);
}finally{await mf.dispose()}
