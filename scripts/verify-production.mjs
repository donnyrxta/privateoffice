// Post-deploy verification against a live Private Office deployment (gates #1, #2, #4, #23).
//
//   npm run verify:production -- https://arrival.example.com
//   npm run verify:production -- https://arrival.example.com --client-link 'https://arrival.example.com/visit/<id>#key=<token>'
//
// Runs anonymously: it proves what an unauthenticated visitor can and cannot reach. Authenticated checks
// (issued agent session A vs B, owner-only export) must be run with real test accounts — see docs/GO_LIVE.md.
const args=process.argv.slice(2);
const base=(args.find(a=>/^https?:\/\//.test(a)&&!a.includes('#key='))||'').replace(/\/$/,'');
const clientLinkIdx=args.indexOf('--client-link');
const clientLink=clientLinkIdx>=0?args[clientLinkIdx+1]:null;
if(!base){console.error('Usage: npm run verify:production -- <https://your-domain> [--client-link <full client URL with #key=>]');process.exit(2)}

let failures=0,warnings=0;
const pass=m=>console.log('  PASS  '+m),fail=m=>{failures++;console.log('  FAIL  '+m)},warn=m=>{warnings++;console.log('  WARN  '+m)};
async function get(path,init={}){return fetch(base+path,{redirect:'manual',...init,headers:{'User-Agent':'private-office-verify/1',...(init.headers||{})}})}

console.log(`\nPrivate Office production verification: ${base}\n`);

if(!base.startsWith('https://'))fail('Deployment is not served over HTTPS (required for geolocation, crypto and secure credentials).');
else if(/\.workers\.dev$/i.test(new URL(base).hostname))warn('Using a workers.dev hostname. Use the branded production domain for client links (gate #22).');
else pass('HTTPS on a custom domain');

console.log('\nReadiness');
try{
  const r=await get('/api/health');const b=await r.json().catch(()=>null);
  if(r.status===200&&b?.status==='ready')pass(`/api/health ready (schema ${b.schema?.version}, access ${b.access}, office ${b.office})`);
  else if(r.status===200&&b?.status==='degraded')warn(`/api/health degraded: scheduler ${JSON.stringify(b.scheduler)}`);
  else fail(`/api/health ${r.status}: ${JSON.stringify(b)}`);
  if(b?.access&&b.access!=='configured')fail(`Cloudflare Access runtime config is "${b.access}" (need CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD).`);
  if(b?.office==='awaiting_setup')warn('Office has not been bootstrapped yet (gate #5).');
}catch(e){fail('/api/health unreachable: '+e.message)}

console.log('\nOwner/admin surfaces must deny anonymous visitors (gate #4)');
for(const path of ['/office','/api/office/visits']){
  try{
    const r=await get(path);const loc=r.headers.get('location')||'';
    if(r.status>=300&&r.status<400&&/cloudflareaccess\.com/i.test(loc))pass(`${path} → ${r.status} Cloudflare Access login`);
    else if(r.status===401||r.status===403)warn(`${path} → ${r.status} from the application. Denied, but Cloudflare Access does not appear to be in front of this path.`);
    else if(r.status>=300&&r.status<400)warn(`${path} → ${r.status} redirect to ${loc||'(none)'} — confirm this is the Access login.`);
    else fail(`${path} → ${r.status} for an anonymous visitor`);
  }catch(e){fail(`${path} unreachable: ${e.message}`)}
}
console.log('\nAgent surface uses Private Office credentials');
try{let r=await get('/agent');r.status===200?pass('/agent login page → 200'):fail(`/agent → ${r.status}`);r=await get('/api/agent');[401,403].includes(r.status)?pass(`/api/agent anonymous → ${r.status}`):fail(`/api/agent anonymous → ${r.status}`)}catch(e){fail('agent login boundary check failed: '+e.message)}
try{
  const r=await get('/api/office/visits',{headers:{'oai-authenticated-user-id':'spoofed','oai-authenticated-user-email':'spoof@example.invalid','cf-access-jwt-assertion':'e30.e30.invalid'}});
  if(r.status===200)fail('Spoofed identity headers were accepted by /api/office/visits.');else pass(`Spoofed identity headers rejected (${r.status})`);
}catch(e){fail('Header-spoofing check failed: '+e.message)}

console.log('\nPublic surfaces must stay reachable');
for(const path of ['/','/residences','/privacy','/gps-test']){try{const r=await get(path);r.status===200?pass(`${path} → 200`):fail(`${path} → ${r.status}`)}catch(e){fail(`${path}: ${e.message}`)}}

console.log('\nCapability links (gate #23)');
const fakeId=crypto.randomUUID();
try{let r=await get('/api/client/'+fakeId);[401,404].includes(r.status)?pass(`client API without token → ${r.status}`):fail(`client API without token → ${r.status}`);
  r=await get('/api/client/'+fakeId,{headers:{Authorization:'Bearer '+'0'.repeat(64)}});[401,404].includes(r.status)?pass(`client API with wrong token → ${r.status}`):fail(`client API with wrong token → ${r.status}`);
  if(r.headers.get('cache-control')?.includes('no-store'))pass('client API responses are no-store');else warn('client API response is cacheable');
  if(r.headers.get('referrer-policy')==='no-referrer')pass('client API sends Referrer-Policy: no-referrer');else warn('Referrer-Policy is not no-referrer');
}catch(e){fail('client API checks failed: '+e.message)}
if(clientLink){
  try{const u=new URL(clientLink),id=u.pathname.split('/').pop(),key=new URLSearchParams(u.hash.slice(1)).get('key');
    if(!key)fail('--client-link has no #key= fragment');else{
      let r=await get('/api/client/'+id,{headers:{Authorization:'Bearer '+key}});
      if(r.status===200)pass('correct client token → 200');else if(r.status===410)pass('client token → 410 (visit revoked/expired, as expected if ended)');else fail(`correct client token → ${r.status}`);
      const wrong=key.slice(0,-1)+(key.endsWith('0')?'1':'0');r=await get('/api/client/'+id,{headers:{Authorization:'Bearer '+wrong}});r.status===404?pass('one-character-wrong token → 404'):fail(`one-character-wrong token → ${r.status}`);
      const page=await get(u.pathname);page.status===200?pass('client page loads without the key in the request (fragment stays client-side)'):fail(`client page → ${page.status}`);
    }
  }catch(e){fail('--client-link checks failed: '+e.message)}
}else console.log('  SKIP  pass --client-link to verify correct/wrong token handling for a real visit');

console.log(`\n${failures?'NOT READY':'OK'} — ${failures} failure(s), ${warnings} warning(s).\n`);
process.exit(failures?1:0);
