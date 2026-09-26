import {redirect} from 'next/navigation';
import {ArrowRight} from 'lucide-react';
import AgentHeader from '@/components/agent-header';
import AgentPresenceGuard from '@/components/agent-presence-guard';
import {getAgentSession,hasFreshPreciseLocation} from '@/lib/agent-auth';

const HERO='https://cdn.darglobal.co.uk/DG_AL_Diamente_Villa_Ext_2_2_a4790ab5a2.jpg';

export const metadata={title:'Property Portfolio | Private Office',description:'Private Office agent portfolio of international off-plan property.'};

export default async function Page(){
  const session=await getAgentSession();if(!session)redirect('/');if(!hasFreshPreciseLocation(session))redirect('/agent/location');
  return <div className="residences-page"><AgentPresenceGuard/><AgentHeader/><main>
    <section className="residence-hero">
      <img src={HERO} alt="Tierra Viva villa architectural render" fetchPriority="high"/>
      <div className="residence-hero-shade"/>
      <div className="residence-hero-copy">
        <p className="eyebrow">PRIVATE OFFICE · AGENT PORTFOLIO</p>
        <h1>Know the property.<br/><em>Represent it properly.</em></h1>
        <p>Your working portfolio of international off-plan opportunities. Use it to prepare for client conversations, appointments and follow-up from a professional environment.</p>
        <a className="button light" href="/agent">View assigned visits <ArrowRight size={18}/></a>
      </div>
      <div className="residence-hero-index"><span>PRIVATE OFFICE</span><span>CONTRACTED REPRESENTATIVE ACCESS</span></div>
    </section>

    <section className="residence-feature">
      <div className="residence-feature-copy">
        <p className="eyebrow">PORTFOLIO BRIEF · BENAHAVÍS, SPAIN</p>
        <h2>Tierra Viva</h2>
        <p className="residence-lede">A gated collection of ultra-luxury villas in the hills of Benahavís, developed by DarGlobal with design inspired by Automobili Lamborghini.</p>
        <p>Set above the Costa del Sol, the villas are positioned at varied elevations for Mediterranean views. The development is currently under construction and spans 4- to 6-bedroom villa typologies.</p>
        <a className="text-link" href="/agent">Return to client visits <ArrowRight size={18}/></a>
      </div>
      <div className="residence-facts" aria-label="Tierra Viva agent brief">
        <div><span>LOCATION</span><strong>Benahavís · Spain</strong></div>
        <div><span>PROPERTY TYPE</span><strong>Ultra-luxury villas</strong></div>
        <div><span>STATUS</span><strong>Under development</strong></div>
        <div><span>RESIDENCE TYPES</span><strong>4–6 bedrooms</strong></div>
      </div>
    </section>

    <section className="residence-process">
      <div className="residence-process-intro"><p className="eyebrow">REPRESENTATIVE DISCIPLINE</p><h2>Prepare before<br/>the conversation.</h2></div>
      <div className="residence-steps">
        <article><span>01</span><h3>Know the brief</h3><p>Understand the client’s destination, intended use, timing, budget range and decision context before recommending a development.</p></article>
        <article><span>02</span><h3>Know the property</h3><p>Use the portfolio material to distinguish verified project information from assumptions, availability changes or unconfirmed commercial terms.</p></article>
        <article><span>03</span><h3>Represent the office</h3><p>Handle client conversations and follow-up with the discretion, environment and preparation expected of Private Office representation.</p></article>
      </div>
    </section>

    <section className="residence-note"><p>Project information is sourced from the developer and may change. Availability, commercial terms and representation are confirmed by the office before they are presented as current.</p></section>
  </main></div>
}
