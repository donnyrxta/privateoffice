import {getChatGPTUser} from '@/app/chatgpt-auth';
import OfficeWorkspace from '@/components/office-workspace';
import SignInPanel from '@/components/sign-in-panel';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return user?<OfficeWorkspace/>:<SignInPanel kind="office"/>}
