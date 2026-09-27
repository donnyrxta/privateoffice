import AgentOnboarding from '@/components/agent-onboarding';

export const dynamic='force-dynamic';

export default async function Page({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  return <AgentOnboarding token={token}/>;
}
