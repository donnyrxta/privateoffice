import Link from 'next/link';
import PortfolioHeader from '@/components/portfolio-header';
import PortfolioMotion from '@/components/portfolio-motion';
import {tierraViva} from '@/lib/portfolio';

export const metadata={title:'Tierra Viva | Private Office',description:'Private Office working brief for Tierra Viva, Benahavís.'};
export const dynamic='force-dynamic';

export default async function Page(){
  return <div className="po-project">
    <PortfolioMotion/>
    <PortfolioHeader/>
    <main>
      <section className="po-project-hero">
        <img src={tierraViva.hero.src} srcSet={tierraViva.hero.srcSet} sizes="100vw" alt={tierraViva.hero.alt} style={{objectPosition:tierraViva.hero.focal}} fetchPriority="high" data-po-parallax=".045"/>
        <div className="po-project-hero-shade"/>
        <div className="po-project-hero-copy" data-po-reveal>
          <p className="po-kicker">BENAHAVÍS · SPAIN</p>
          <h1>Tierra<br/>Viva</h1>
          <p>{tierraViva.positioning}</p>
        </div>
        <div className="po-project-hero-foot">
          <span>TIERRA VIVA · ARTIST’S IMPRESSION</span>
          <Link href="#project-story">Explore project ↓</Link>
        </div>
      </section>

      <section className="po-project-story" id="project-story">
        <div className="po-story-heading" data-po-reveal>
          <p className="po-kicker">THE SETTING</p>
          <h2>Architecture placed<br/>above the Mediterranean.</h2>
        </div>
        <div className="po-story-copy" data-po-reveal>
          <p>Tierra Viva is positioned in the hills of Benahavís on the Costa del Sol. Developer project material describes a gated collection of villas arranged across the hillside for long views toward the Mediterranean.</p>
          <p>Tell us what matters to you: space, outlook, timing or intended use. We will confirm current options and commercial details before you make a decision.</p>
        </div>
      </section>

      <section className="po-masterplan">
        <div className="po-masterplan-media">
          <img src={tierraViva.masterplan.src} alt={tierraViva.masterplan.alt} style={{objectPosition:tierraViva.masterplan.focal}} loading="lazy" data-po-parallax=".028"/>
          <div className="po-masterplan-label"><span>MASTERPLAN / CONTEXT</span><strong>Benahavís · Costa del Sol</strong></div>
        </div>
      </section>

      <section className="po-project-facts" aria-label="Verified project facts" data-po-reveal>
        {tierraViva.facts.map(fact=><div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}
      </section>

      <section className="po-project-residences">
        <div className="po-section-heading po-section-heading-light" data-po-reveal>
          <p className="po-kicker">RESIDENCE TYPES</p>
          <h2>Move through<br/>the collection.</h2>
        </div>
        <div className="po-project-residence-list">
          {tierraViva.residences.map((residence,index)=><Link key={residence.slug} className={'po-project-residence po-project-residence-'+(index+1)} href={'/residences/tierra-viva/'+residence.slug} data-po-reveal>
            <div className="po-project-residence-media">
              <img src={residence.hero.src} srcSet={residence.hero.srcSet} sizes="100vw" alt={residence.hero.alt} style={{objectPosition:residence.hero.focal}} loading="lazy"/>
            </div>
            <div className="po-project-residence-copy">
              <span>{String(index+1).padStart(2,'0')}</span>
              <div><h3>{residence.name}</h3><p>{residence.bedrooms}</p></div>
              <span aria-hidden="true">↗</span>
            </div>
          </Link>)}
        </div>
      </section>

      <section className="po-commercial">
        <div data-po-reveal>
          <p className="po-kicker">YOUR NEXT STEP</p>
          <h2>A private conversation.<br/>A considered next step.</h2>
        </div>
        <div className="po-commercial-grid" data-po-reveal>
          <div><span>PROJECT STATUS</span><strong>Under development</strong></div>
          <div><span>PRICE / AVAILABILITY</span><strong>Confirm with office</strong></div>
          <div><span>PAYMENT TERMS</span><strong>Confirm with office</strong></div>
          <div><span>SOURCE</span><strong>{tierraViva.sourceLabel}</strong></div>
          <div><span>LAST CHECKED</span><strong>{tierraViva.verifiedAt}</strong></div>
        </div>
        <p className="po-source-note" data-po-reveal>Source: developer project material. The visual material is architectural marketing content and does not, by itself, establish a current Private Office sales mandate or unit availability.</p>
      </section>

      <section className="po-project-exit">
        <Link href="/residences">← Portfolio</Link>
        <Link href="/?enquire=Tierra%20Viva">Request a private presentation →</Link>
      </section>
    </main>
  </div>
}
