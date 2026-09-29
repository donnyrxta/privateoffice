import AgentOnboarding from '@/components/agent-onboarding';

export const metadata={robots:{index:false,follow:false},referrer:'no-referrer' as const};
export const dynamic='force-dynamic';

export default async function Page({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  return <AgentOnboarding token={token}/>;
}
