import {redirect} from 'next/navigation';
import {getAgentSession} from '@/lib/agent-auth';
import AgentOnboarding from '@/components/agent-introduction';
export const dynamic='force-dynamic';
export default async function Page(){if(!await getAgentSession())redirect('/agent/sign-in');return <AgentOnboarding/>}
