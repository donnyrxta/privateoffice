import {redirect} from 'next/navigation';
import AgentPresenceGuard from '@/components/agent-presence-guard';
import PortfolioHeader from '@/components/portfolio-header';
import PortfolioMotion from '@/components/portfolio-motion';
import {getAgentSession,hasFreshPreciseLocation} from '@/lib/agent-auth';
import {tierraViva} from '@/lib/portfolio';

export const metadata={title:'Portfolio | Private Office',description:'Private Office authenticated property portfolio.'};
export const dynamic='force-dynamic';

export default async function Page(){
  const session=await getAgentSession();
  if(!session)redirect('/');
  if(!hasFreshPreciseLocation(session))redirect('/agent/location');
  return <div className="po-portfolio">
    <AgentPresenceGuard/>
    <PortfolioMotion/>
    <PortfolioHeader/>
    <main>
      <section className="po-portfolio-intro">
        <div data-po-reveal>
          <p className="po-kicker">PRIVATE OFFICE · PORTFOLIO</p>
          <h1>Selected property.<br/><em>Prepared for private conversations.</em></h1>
        </div>
        <div className="po-portfolio-intro-note" data-po-reveal>
          <p>Use the portfolio as a working brief: understand the architecture, residence types and verified project facts before a client conversation.</p>
          <div><span>SESSION</span><strong>Location verified</strong></div>
        </div>
      </section>

      <section className="po-feature-project" aria-labelledby="featured-project">
        <a className="po-feature-media" href="/residences/tierra-viva" aria-label="Open Tierra Viva project brief">
          <img src={tierraViva.hero.src} alt={tierraViva.hero.alt} style={{objectPosition:tierraViva.hero.focal}} fetchPriority="high" data-po-parallax=".035"/>
          <span className="po-image-index">01 / PROJECT</span>
        </a>
        <div className="po-feature-copy" data-po-reveal>
          <p className="po-kicker">CURRENT WORKING BRIEF · {tierraViva.location.toUpperCase()}, {tierraViva.country.toUpperCase()}</p>
          <h2 id="featured-project">{tierraViva.name}</h2>
          <p className="po-feature-lede">{tierraViva.positioning}</p>
          <div className="po-feature-meta">
            <span>{tierraViva.facts[0].value}</span>
            <span>{tierraViva.facts[1].value}</span>
            <span>{tierraViva.residences.length} residence types in source library</span>
          </div>
          <a className="po-arrow-link" href="/residences/tierra-viva">Enter project brief <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="po-residence-index">
        <div className="po-section-heading" data-po-reveal>
          <p className="po-kicker">TIERRA VIVA · RESIDENCE TYPES</p>
          <h2>Three expressions<br/>of the hillside.</h2>
          <p>Residence material is presented for agent preparation. Current unit availability and commercial terms are confirmed separately by the office.</p>
        </div>
        <div className="po-residence-composition">
          {tierraViva.residences.map((residence,index)=><a
            key={residence.slug}
            href={'/residences/tierra-viva/'+residence.slug}
            className={'po-residence-tile po-residence-tile-'+(index+1)}
            data-po-reveal
          >
            <div className="po-residence-image">
              <img src={residence.hero.src} alt={residence.hero.alt} style={{objectPosition:residence.hero.focal}} loading="lazy"/>
              <span>{String(index+1).padStart(2,'0')}</span>
            </div>
            <div className="po-residence-caption">
              <div><strong>{residence.name}</strong><span>{residence.bedrooms}</span></div>
              <span aria-hidden="true">↗</span>
            </div>
          </a>)}
        </div>
      </section>

      <section className="po-portfolio-truth" data-po-reveal>
        <div><span>PORTFOLIO STATE</span><strong>Working brief</strong></div>
        <p>Project material may outlive current inventory. Private Office treats price, availability, payment plans and transaction terms as confirmation-required until the office verifies them for the specific client conversation.</p>
      </section>
    </main>
  </div>
}
