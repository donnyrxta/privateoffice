import {getAgentUser} from '@/lib/agent-auth';
import AgentWorkspace from '@/components/agent-workspace';
import SignInPanel from '@/components/sign-in-panel';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getAgentUser();return user?<AgentWorkspace/>:<SignInPanel kind="agent"/>}
