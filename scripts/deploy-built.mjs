import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd(),dist=resolve(root,'dist');
if(!existsSync(dist)){
  console.error('No dist directory found. Run npm run build:cloudflare first.');
  process.exit(1);
}
const found=[];
function walk(dir){
  for(const e of readdirSync(dir,{withFileTypes:true})){
    const p=resolve(dir,e.name);
    if(e.isDirectory())walk(p);
    else if(e.name==='wrangler.json'||e.name==='wrangler.jsonc')found.push(p);
  }
}
walk(dist);
const preferred=
  found.find(p=>/[/\\]dist[/\\]server[/\\]wrangler\.jsonc?$/.test(p))||
  found.find(p=>/[/\\]dist[/\\][^/\\]+[/\\]wrangler\.jsonc?$/.test(p))||
  found[0];
if(!preferred){
  console.error('Vinext build completed without a generated Wrangler deployment config under dist/.');
  process.exit(1);
}
// Deployment gate: refuse any Worker config that lacks the production evidence store or scheduler.
let config;
try{config=JSON.parse(readFileSync(preferred,'utf8'))}catch{console.error(`Could not parse ${relative(root,preferred)}.`);process.exit(1)}
const db=(config.d1_databases||[]).find(d=>d.binding==='DB');
const problems=[];
if(!db)problems.push('The generated Worker has no D1 binding named DB.');
else if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(db.database_id||'')||db.database_id==='00000000-0000-4000-8000-000000000000')problems.push('The DB binding does not reference a real D1 database ID.');
if(config.vars?.PRIVATE_OFFICE_STANDALONE!=='1')problems.push('The generated Worker is not a standalone production build (PRIVATE_OFFICE_STANDALONE!=1).');
const crons=config.triggers?.crons||[];
if(!crons.includes('* * * * *')||!crons.includes('0 1 * * *'))problems.push('The watchdog/retention Cron Triggers are missing from the generated config.');
if(problems.length){console.error('\nERROR: refusing to deploy.\n- '+problems.join('\n- ')+'\n\nRun npm run build:cloudflare with CLOUDFLARE_D1_DATABASE_ID set.\n');process.exit(1)}
const wrangler=resolve(root,'node_modules/wrangler/bin/wrangler.js');
if(!existsSync(wrangler)){
  console.error('Local Wrangler is not installed. Install project dependencies before deploying.');
  process.exit(1);
}
console.log(`Deploying generated Worker config: ${relative(root,preferred)}`);
if(process.env.DEPLOY_DRY_RUN==='1'){console.log('DEPLOY_DRY_RUN=1: deployment gate passed; skipping wrangler deploy.');process.exit(0)}
const result=spawnSync(process.execPath,[wrangler,'deploy','--config',preferred],{stdio:'inherit',env:process.env});
if(result.error)throw result.error;
process.exit(result.status??1);
