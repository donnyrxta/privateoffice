import {existsSync,readdirSync} from 'node:fs';
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
const wrangler=resolve(root,'node_modules/wrangler/bin/wrangler.js');
if(!existsSync(wrangler)){
  console.error('Local Wrangler is not installed. Install project dependencies before deploying.');
  process.exit(1);
}
console.log(`Deploying generated Worker config: ${relative(root,preferred)}`);
const result=spawnSync(process.execPath,[wrangler,'deploy','--config',preferred],{stdio:'inherit',env:process.env});
if(result.error)throw result.error;
process.exit(result.status??1);
