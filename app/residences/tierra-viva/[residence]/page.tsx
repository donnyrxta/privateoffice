import {notFound,redirect} from 'next/navigation';
import AgentPresenceGuard from '@/components/agent-presence-guard';
import PortfolioHeader from '@/components/portfolio-header';
import PortfolioMotion from '@/components/portfolio-motion';
import {getAgentSession,hasFreshPreciseLocation} from '@/lib/agent-auth';
import {getResidence,tierraViva} from '@/lib/portfolio';

export const dynamic='force-dynamic';

export default async function Page({params}:{params:Promise<{residence:string}>}){
  const session=await getAgentSession();
  if(!session)redirect('/');
  if(!hasFreshPreciseLocation(session))redirect('/agent/location');
  const {residence:slug}=await params;
  const residence=getResidence(slug);
  if(!residence)notFound();

  const media=[residence.hero,...residence.gallery];
  return <div className="po-residence-detail">
    <AgentPresenceGuard/>
    <PortfolioMotion/>
    <PortfolioHeader/>
    <main>
      <section className="po-residence-hero">
        <img src={residence.hero.src} alt={residence.hero.alt} style={{objectPosition:residence.hero.focal}} fetchPriority="high" data-po-parallax=".04"/>
        <div className="po-residence-hero-shade"/>
        <div className="po-residence-title" data-po-reveal>
          <p className="po-kicker">TIERRA VIVA · {tierraViva.location.toUpperCase()}</p>
          <h1>{residence.name}</h1>
        </div>
        <aside className="po-residence-lens" aria-label={residence.name+' residence facts'} data-po-reveal>
          <span>RESIDENCE TYPE</span>
          <strong>{residence.name}</strong>
          <p>{residence.bedrooms}</p>
          <div><span>COMMERCIAL STATE</span><b>Confirmation required</b></div>
          <a href="#gallery">View architecture ↓</a>
        </aside>
      </section>

      <section className="po-residence-overview">
        <div data-po-reveal>
          <p className="po-kicker">OVERVIEW</p>
          <h2>{residence.name}<br/><em>within Tierra Viva.</em></h2>
        </div>
        <div data-po-reveal>
          <p>{residence.descriptor}</p>
          <p>{residence.sourceNote}</p>
        </div>
      </section>

      <section className="po-gallery" id="gallery" aria-label={residence.name+' gallery'}>
        {media.map((item,index)=><figure key={item.src} className={'po-gallery-frame po-gallery-frame-'+((index%4)+1)} data-po-reveal>
          <div><img src={item.src} alt={item.alt} style={{objectPosition:item.focal}} loading={index===0?'eager':'lazy'}/></div>
          <figcaption><span>{String(index+1).padStart(2,'0')}</span><strong>{item.label??'Architecture'}</strong></figcaption>
        </figure>)}
      </section>

      <section className="po-residence-truth" data-po-reveal>
        <div>
          <p className="po-kicker">AGENT NOTE</p>
          <h2>Beautiful material is not the same thing as live inventory.</h2>
        </div>
        <p>Use this page to understand and present the residence type. Before discussing price, availability, incentives, payment plans or delivery commitments, confirm the current transaction brief with the office.</p>
      </section>

      <section className="po-project-exit">
        <a href="/residences/tierra-viva">← Tierra Viva</a>
        <a href="/agent">Open client visits →</a>
      </section>
    </main>
  </div>
}
