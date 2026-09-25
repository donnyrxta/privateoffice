import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const cli=resolve(root,'node_modules/vinext/dist/cli.js');
if(!existsSync(cli)){
  console.error('Vinext is not installed. Install project dependencies before building.');
  process.exit(1);
}
if(!process.env.CLOUDFLARE_D1_DATABASE_ID){
  console.warn('CLOUDFLARE_D1_DATABASE_ID is not set. The generated Worker will not include the DB binding until this build variable is configured.');
}
const result=spawnSync(process.execPath,[cli,'build'],{
  stdio:'inherit',
  env:{...process.env,PRIVATE_OFFICE_STANDALONE:'1'},
});
if(result.error)throw result.error;
process.exit(result.status??1);
