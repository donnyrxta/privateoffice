import {env} from 'cloudflare:workers';
import {checkReadiness} from '@/lib/readiness';
/** Production readiness probe. 200 = ready/degraded, 503 = not_ready. Contains no visit, client or agent data. */
export async function GET(){const r=await checkReadiness(env);return Response.json(r,{status:r.status==='not_ready'?503:200,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
