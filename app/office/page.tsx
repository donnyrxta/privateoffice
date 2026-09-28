import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {officeLoginURL} from '@/lib/access-entry';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import OfficeWorkspace from '@/components/office-workspace';
import OfficeAccessPanel from '@/components/office-access-panel';

export const dynamic='force-dynamic';

export default async function Page(){
  const user=await getChatGPTUser();
  if(!user){
    const runtime=env as unknown as {PRIVATE_OFFICE_STANDALONE?:string;CF_ACCESS_TEAM_DOMAIN?:string;CF_ACCESS_AUD?:string};
    const login=runtime.PRIVATE_OFFICE_STANDALONE==='1'?officeLoginURL(runtime.CF_ACCESS_TEAM_DOMAIN,runtime.CF_ACCESS_AUD):null;
    if(login)redirect(login);
    return <OfficeAccessPanel mode="missing_auth"/>;
  }
  const d1=env.DB;
  if(!d1)return <OfficeAccessPanel mode="error" email={user.email}/>;
  const owner=await d1.prepare('SELECT owner_id,owner_email FROM office WHERE id=1').first<{owner_id:string;owner_email:string}>();
  if(!owner)return <OfficeAccessPanel mode="setup" email={user.email}/>;
  if(owner.owner_id!==user.userId)return <OfficeAccessPanel mode="denied" email={user.email}/>;
  return <><div className="app-main" style={{paddingBottom:0}}><a className="text-link" href="/office/reviews">Review agent introductions →</a></div><OfficeWorkspace/></>;
}
