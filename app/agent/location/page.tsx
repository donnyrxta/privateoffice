import {redirect} from 'next/navigation';
import {getAgentSession,hasFreshPreciseLocation} from '@/lib/agent-auth';
import AgentLocationGate from '@/components/agent-location-gate';
export const dynamic='force-dynamic';
export default async function Page(){const session=await getAgentSession();if(!session)redirect('/');if(hasFreshPreciseLocation(session))redirect('/agent');return <AgentLocationGate name={session.user.displayName}/>}
