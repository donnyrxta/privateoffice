import vinext from 'vinext';
import {defineConfig} from 'vite';
import hostingConfig from './.openai/hosting.json';
import {sites} from './build/sites-vite-plugin';

const PLACEHOLDER='00000000-0000-4000-8000-000000000000';
const {d1,r2}=hostingConfig;
const standalone=process.env.PRIVATE_OFFICE_STANDALONE==='1';
const remoteD1=process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
// Escape hatch for local contract-test builds ONLY (tests inject an isolated Miniflare D1). Never set in Workers Builds.
const previewBranch=process.env.WORKERS_CI==='1'&&!!process.env.WORKERS_CI_BRANCH&&process.env.WORKERS_CI_BRANCH!=='main';
const allowMissingD1=process.env.PRIVATE_OFFICE_ALLOW_MISSING_D1==='1'||previewBranch;
const D1_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if(standalone&&!allowMissingD1){
  if(!remoteD1)throw new Error('CLOUDFLARE_D1_DATABASE_ID is required for production deployment. Private Office must never deploy a Worker without its evidence store.');
  if(!D1_ID.test(remoteD1)||remoteD1===PLACEHOLDER)throw new Error('CLOUDFLARE_D1_DATABASE_ID must be the real D1 database UUID (see `npx wrangler d1 list`).');
}

const bindingConfig={
  name:'private-office',
  main:'./worker/index.ts',
  compatibility_date:'2026-09-25',
  compatibility_flags:['nodejs_compat'],
  vars:{PRIVATE_OFFICE_STANDALONE:standalone?'1':'0'},
  // Keep in sync with WATCHDOG_CRON / RETENTION_CRON in lib/maintenance.ts.
  triggers:{crons:['* * * * *','0 1 * * *']},
  d1_databases:d1
    ? standalone
      ? remoteD1
        ? [{binding:d1,database_name:'private-office-d1',database_id:remoteD1}]
        : []
      : [{binding:d1,database_name:'site-creator-d1',database_id:PLACEHOLDER}]
    : [],
  r2_buckets:r2?[{binding:r2,bucket_name:'site-creator-r2'}]:[],
};

export default defineConfig(async({command})=>{
  process.env.CLOUDFLARE_CF_FETCH_ENABLED??='false';
  process.env.WRANGLER_SEND_METRICS??='false';
  const {cloudflare}=await import('@cloudflare/vite-plugin');
  // Local dev only: the pinned workerd may not support the production compatibility date yet. Builds are unchanged.
  const config=command==='serve'?{...bindingConfig,compatibility_date:await localCompatibilityDate(bindingConfig.compatibility_date)}:bindingConfig;
  return {
    plugins:[
      vinext(),
      ...(!standalone?[sites({mockAuth:true})]:[]),
      cloudflare({
        viteEnvironment:{name:'rsc',childEnvironments:['ssr']},
        inspectorPort:false,
        config,
      }),
    ],
  };
});

async function localCompatibilityDate(target:string){
  try{const {createRequire}=await import('node:module');const req=createRequire(import.meta.url);const mf=req(req.resolve('miniflare',{paths:[req.resolve('wrangler/package.json')]}));const supported:string|undefined=mf.supportedCompatibilityDate;return supported&&supported<target?supported:target}catch{return target}
}
