import vinext from 'vinext';
import {defineConfig} from 'vite';
import hostingConfig from './.openai/hosting.json';
import {sites} from './build/sites-vite-plugin';

const PLACEHOLDER='00000000-0000-4000-8000-000000000000';
const {d1,r2}=hostingConfig;
const standalone=process.env.PRIVATE_OFFICE_STANDALONE==='1';
const remoteD1=process.env.CLOUDFLARE_D1_DATABASE_ID;

const bindingConfig={
  name:'private-office',
  main:'vinext/server/fetch-handler',
  compatibility_date:'2026-09-25',
  compatibility_flags:['nodejs_compat'],
  vars:{PRIVATE_OFFICE_STANDALONE:standalone?'1':'0'},
  d1_databases:d1
    ? standalone
      ? remoteD1
        ? [{binding:d1,database_name:'private-office-d1',database_id:remoteD1}]
        : []
      : [{binding:d1,database_name:'site-creator-d1',database_id:PLACEHOLDER}]
    : [],
  r2_buckets:r2?[{binding:r2,bucket_name:'site-creator-r2'}]:[],
};

export default defineConfig(async()=>{
  process.env.CLOUDFLARE_CF_FETCH_ENABLED??='false';
  process.env.WRANGLER_SEND_METRICS??='false';
  const {cloudflare}=await import('@cloudflare/vite-plugin');
  return {
    plugins:[
      vinext(),
      ...(!standalone?[sites({mockAuth:true})]:[]),
      cloudflare({
        viteEnvironment:{name:'rsc',childEnvironments:['ssr']},
        inspectorPort:false,
        config:bindingConfig,
      }),
    ],
  };
});
