import {json,wrap} from '@/lib/server';
import {clearAgentCookie,revokeCurrentAgentSession} from '@/lib/agent-auth';
export async function POST(){return wrap(async()=>{await revokeCurrentAgentSession();const r=json({ok:true});r.headers.set('Set-Cookie',clearAgentCookie());return r})}
