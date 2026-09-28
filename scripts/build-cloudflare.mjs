import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const cli=resolve(root,'node_modules/vinext/dist/cli.js');
if(!existsSync(cli)){
  console.error('Vinext is not installed. Install project dependencies before building.');
  process.exit(1);
}
const D1_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const previewBranch=process.env.WORKERS_CI==='1'&&!!process.env.WORKERS_CI_BRANCH&&process.env.WORKERS_CI_BRANCH!=='main';
const allowMissing=process.env.PRIVATE_OFFICE_ALLOW_MISSING_D1==='1'||previewBranch;
const d1=process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
if(!d1||!D1_ID.test(d1)){
  if(!allowMissing){
    console.error('\nERROR:\n'+(d1?'CLOUDFLARE_D1_DATABASE_ID is not a valid D1 database UUID.':'CLOUDFLARE_D1_DATABASE_ID is required for production deployment.')+'\n\nCreate the database (npx wrangler d1 create private-office-d1), add its ID as a Workers Builds\nbuild variable, then rebuild. Private Office must never deploy without its evidence store.\n');
    process.exit(1);
  }
  console.warn(previewBranch?`Preview branch ${process.env.WORKERS_CI_BRANCH}: compiling without a D1 binding. Production main remains hard-gated.`:'PRIVATE_OFFICE_ALLOW_MISSING_D1=1: building WITHOUT a D1 binding. This output is for local contract tests only and deploy:built will refuse it.');
}
const result=spawnSync(process.execPath,[cli,'build'],{
  stdio:'inherit',
  env:{...process.env,PRIVATE_OFFICE_STANDALONE:'1'},
});
if(result.error)throw result.error;
process.exit(result.status??1);
