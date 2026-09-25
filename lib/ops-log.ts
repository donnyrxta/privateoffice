/**
 * Structured operational log line for Cloudflare Workers Observability / Logpush.
 * Never pass capability tokens, invite keys, signatures or raw coordinates here.
 */
export type OpsLevel='info'|'warn'|'error';
export function opsLog(level:OpsLevel,event:string,fields:Record<string,unknown>={}){
  const line=JSON.stringify({level,event,service:'private-office',at:new Date().toISOString(),...fields});
  if(level==='error')console.error(line);else if(level==='warn')console.warn(line);else console.log(line);
}
