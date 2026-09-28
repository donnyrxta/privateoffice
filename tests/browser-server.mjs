// Isolated loopback-only verification server. Never used by production builds.
// Run after npm run build:test. Database and test credentials disappear on exit.
import {createRequire} from 'node:module';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare,supportedCompatibilityDate}=wranglerRequire('miniflare');
const setup='local-browser-test-setup',origin='http://localhost:4173';
const mf=new Miniflare({modules:['index.js',...readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js')].map(p=>({type:'ESModule',path:resolve('dist/server',p)})),modulesRoot:resolve('dist/server'),compatibilityDate:['2026-09-25',supportedCompatibilityDate].sort()[0],compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'browser-test-db'},bindings:{OFFICE_SETUP_HASH:createHash('sha256').update(setup).digest('hex')}});
const db=await mf.getD1Database('DB');
for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())for(const sql of readFileSync('drizzle/'+name,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
async function api(path,data){const r=await mf.dispatchFetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','oai-authenticated-user-id':'browser-owner','oai-authenticated-user-email':'owner@example.invalid'},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw new Error(path+': '+JSON.stringify(result));return result}
await api('/api/office/setup',{key:setup});
const invited=await api('/api/office/agents',{full_name:'Browser Test Agent',username:'browser.agent',email:'agent@example.invalid'});
const visit=await api('/api/office/visits',{agent_username:'browser.agent',client_name:'Test Client',property:'Synthetic QA appointment',meeting:'Synthetic test meeting',lat:-17.79,lng:31.06,scheduled_at:Date.now()+7200000});
const mime={'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{try{
const url=new URL(req.url,origin);if(url.pathname==='/__test/fixture'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({username:'browser.agent',password:invited.password,agentId:invited.agent.id,visitId:visit.id}));return}
const relative=decodeURIComponent(url.pathname),asset=resolve('dist/client','.'+relative),assetRoot=resolve('dist/client')+'/';if(asset.startsWith(assetRoot)&&existsSync(asset)&&extname(asset)){res.setHeader('Content-Type',mime[extname(asset)]||'application/octet-stream');res.end(readFileSync(asset));return}
const headers=new Headers();for(const [name,value] of Object.entries(req.headers)){if(name.startsWith('oai-')||name==='host')continue;if(value)headers.set(name,Array.isArray(value)?value.join(','):value)}
// Reviewer identity is available only through this loopback-only test harness.
if((req.headers.cookie||'').includes('qa_reviewer=1')){headers.set('oai-authenticated-user-id','browser-owner');headers.set('oai-authenticated-user-email','owner@example.invalid')}
const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const response=await mf.dispatchFetch(origin+req.url,{method:req.method,headers,...(body.length?{body}:{}),redirect:'manual'});res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(Buffer.from(await response.arrayBuffer()));
}catch(e){res.statusCode=500;res.end(String(e));console.error(e)}});
server.listen(4173,'127.0.0.1',()=>console.log('Local browser verification: '+origin+' (ephemeral synthetic records only)'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await mf.dispose();process.exit(0)}));
