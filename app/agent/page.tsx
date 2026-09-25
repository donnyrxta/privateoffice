import {getChatGPTUser} from '@/app/chatgpt-auth';
import AgentWorkspace from '@/components/agent-workspace';
import SignInPanel from '@/components/sign-in-panel';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return user?<AgentWorkspace/>:<SignInPanel kind="agent"/>}
