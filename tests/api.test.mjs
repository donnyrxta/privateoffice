import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash,webcrypto} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=wranglerRequire('miniflare');
const setup='test-only-setup-secret-not-for-production';
const mf=new Miniflare({modules:['index.js',...readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js')].map(p=>({type:'ESModule',path:resolve('dist/server',p)})),modulesRoot:resolve('dist/server'),compatibilityDate:'2026-09-25',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'test-db'},bindings:{OFFICE_SETUP_HASH:createHash('sha256').update(setup).digest('hex')},log:undefined});
let assertions=0;
const users={owner:['owner-test','owner@example.invalid'],agent:['agent-test','agent@example.invalid'],other:['other-test','other@example.invalid']};
function canonical(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'}
function b64(bytes){return Buffer.from(bytes).toString('base64url')}
async function device(){const pair=await webcrypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);return {id:'device-'+crypto.randomUUID(),session:'session-'+crypto.randomUUID(),privateKey:pair.privateKey,publicJwk:await webcrypto.subtle.exportKey('jwk',pair.publicKey)}}
async function sign(d,envelope){return b64(new Uint8Array(await webcrypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},d.privateKey,new TextEncoder().encode(canonical(envelope)))))}
async function request(path,{as,data,token,origin='http://site.test'}={}){const headers={'Content-Type':'application/json',Origin:origin};if(as){headers['oai-authenticated-user-id']=users[as][0];headers['oai-authenticated-user-email']=users[as][1]}if(token)headers.Authorization='Bearer '+token;const r=await mf.dispatchFetch('http://site.test'+path,{method:data?'POST':'GET',headers,...(data?{body:JSON.stringify(data)}:{})});let body;try{body=await r.json()}catch{body=null}return {status:r.status,body,headers:r.headers}}
function eq(actual,expected,label){assert.equal(actual,expected,label);assertions++;console.log('PASS '+label)}
try{
  const db=await mf.getD1Database('DB');
  for(const migration of ['drizzle/0000_huge_blizzard.sql','drizzle/0001_durable_telemetry.sql'])for(const sql of readFileSync(migration,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  let r=await request('/api/office/visits');eq(r.status,401,'anonymous office denied');
  r=await request('/api/office/setup',{as:'owner',data:{key:setup}});eq(r.status,200,'owner setup succeeds');
  r=await request('/api/office/visits',{as:'other'});eq(r.status,403,'other authenticated user denied office');
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
  r=await request(a,{as:'agent',data:{action:'arrive',device_id:d.id,epoch:epoch2,final_sequence:0}});eq(r.status,200,'arrival closes tracking after ACKed final sequence');
  r=await request('/api/client/'+id,{token:client,data:{property_confirmed:'yes',comment:'Synthetic confirmation.'}});eq(r.status,200,'client can independently confirm arrival outcome');
  r=await request(a,{as:'agent',data:{action:'complete'}});eq(r.status,200,'arrived visit can be completed without reopening tracking');
  r=await request('/api/office/visits',{as:'owner'});eq(Array.isArray(r.body.activity),true,'office dashboard receives recent agent security activity');
  console.log(`\n${assertions} assertions passed. All coordinates and identities were synthetic.`);
}finally{await mf.dispose()}
