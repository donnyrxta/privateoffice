import {redirect} from 'next/navigation';
import {getAgentSession,hasFreshPreciseLocation} from '@/lib/agent-auth';
import AgentWorkspace from '@/components/agent-workspace';
export const dynamic='force-dynamic';
export default async function Page(){const session=await getAgentSession();if(!session)redirect('/');if(!hasFreshPreciseLocation(session))redirect('/agent/location');return <AgentWorkspace/>}
