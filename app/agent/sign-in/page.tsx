import {redirect} from 'next/navigation';
import {getAgentSession} from '@/lib/agent-auth';
import {Brand} from '@/components/landing';
import AgentLoginForm from '@/components/agent-login-form';
export const dynamic='force-dynamic';
export default async function Page(){
 if(await getAgentSession())redirect('/agent');
 return <main className="portal-landing agent-entry">
  <img className="portal-hero-image" src="/assets/villa-hero-2000.webp" srcSet="/assets/villa-hero-720.webp 720w, /assets/villa-hero-1280.webp 1280w, /assets/villa-hero-2000.webp 2000w" sizes="100vw" alt="Tierra Viva architectural impression" width={2000} height={1171}/>
  <div className="portal-shade"/><div className="portal-top"><Brand/><a className="portal-office-link" href="/residences">Explore residences</a></div>
  <section className="portal-copy"><p className="eyebrow">PRIVATE OFFICE · AGENT ACCESS</p><h1>Exceptional property.<br/><em>Personal attention.</em></h1><p>Your professional workspace for considered introductions and private client appointments.</p><div className="portal-index"><span>INVITED REPRESENTATIVES</span><span>TIERRA VIVA · ARTIST’S IMPRESSION</span></div></section>
  <section className="portal-login-card" aria-labelledby="agent-entry-title"><p className="eyebrow">WELCOME</p><h2 id="agent-entry-title">Enter your private office.</h2><p className="portal-login-intro">Use the credentials provided by our team.</p><AgentLoginForm className="portal-login-form"/><p className="portal-location-note">First visit? Your professional introduction and interview stages will be ready after sign-in. For access assistance, contact the office representative who invited you.</p></section>
  <div className="portal-bottom"><span>ACCESS BY INVITATION</span><a href="/privacy">Privacy notice</a></div>
 </main>
}
