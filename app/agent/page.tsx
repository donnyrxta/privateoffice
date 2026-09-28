import {redirect} from 'next/navigation';
import {getAgentSession} from '@/lib/agent-auth';
import {getOnboarding} from '@/lib/onboarding';
import AgentWorkspace from '@/components/agent-workspace';
export const dynamic='force-dynamic';
export default async function Page(){const session=await getAgentSession();if(!session)redirect('/agent/sign-in');const profile=await getOnboarding(session.user.userId);if(profile.status!=='approved')redirect('/agent/onboarding');return <AgentWorkspace/>}
