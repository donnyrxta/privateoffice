import Link from 'next/link';
import PortfolioHeader from '@/components/portfolio-header';
import PortfolioMotion from '@/components/portfolio-motion';
import {tierraViva} from '@/lib/portfolio';

export const metadata={title:'Portfolio | Private Office',description:'Architecture, residences and private off-plan property enquiries.'};
export const dynamic='force-dynamic';

export default async function Page(){
  return <div className="po-portfolio">
    <PortfolioMotion/>
    <PortfolioHeader/>
    <main>
      <section className="po-portfolio-intro">
        <div data-po-reveal>
          <p className="po-kicker">PRIVATE OFFICE · PORTFOLIO</p>
          <h1>Selected property.<br/><em>Considered around you.</em></h1>
        </div>
        <div className="po-portfolio-intro-note" data-po-reveal>
          <p>Explore the architecture and find the residence that speaks to your priorities. Discuss your requirements privately with our office.</p>
          <div><span>COLLECTION NOTE</span><strong>Illustrative project collection</strong></div>
        </div>
      </section>

      <section className="po-feature-project" aria-labelledby="featured-project">
        <Link className="po-feature-media" href="/residences/tierra-viva" aria-label="Open Tierra Viva project brief">
          <img src={tierraViva.hero.src} srcSet={tierraViva.hero.srcSet} sizes="100vw" alt={tierraViva.hero.alt} style={{objectPosition:tierraViva.hero.focal}} fetchPriority="high" data-po-parallax=".035"/>
          <span className="po-image-index">01 / PROJECT</span>
        </Link>
        <div className="po-feature-copy" data-po-reveal>
          <p className="po-kicker">PROJECT COLLECTION · {tierraViva.location.toUpperCase()}, {tierraViva.country.toUpperCase()}</p>
          <h2 id="featured-project">{tierraViva.name}</h2>
          <p className="po-feature-lede">{tierraViva.positioning}</p>
          <div className="po-feature-meta">
            <span>{tierraViva.facts[0].value}</span>
            <span>{tierraViva.facts[1].value}</span>
            <span>{tierraViva.residences.length} residence types</span>
          </div>
          <Link className="po-arrow-link" href="/residences/tierra-viva">Explore Tierra Viva <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="po-residence-index">
        <div className="po-section-heading" data-po-reveal>
          <p className="po-kicker">TIERRA VIVA · RESIDENCE TYPES</p>
          <h2>Three expressions<br/>of the hillside.</h2>
          <p>Discover three distinct villa types. Ask us to confirm current availability and terms for your requirements.</p>
        </div>
        <div className="po-residence-composition">
          {tierraViva.residences.map((residence,index)=><Link
            key={residence.slug}
            href={'/residences/tierra-viva/'+residence.slug}
            className={'po-residence-tile po-residence-tile-'+(index+1)}
            data-po-reveal
          >
            <div className="po-residence-image">
              <img src={residence.hero.src} srcSet={residence.hero.srcSet} sizes="100vw" alt={residence.hero.alt} style={{objectPosition:residence.hero.focal}} loading="lazy"/>
              <span>{String(index+1).padStart(2,'0')}</span>
            </div>
            <div className="po-residence-caption">
              <div><strong>{residence.name}</strong><span>{residence.bedrooms}</span></div>
              <span aria-hidden="true">↗</span>
            </div>
          </Link>)}
        </div>
      </section>

      <section className="po-portfolio-truth" data-po-reveal>
        <div><span>ILLUSTRATIVE COLLECTION</span><strong>Enquire for current options</strong></div>
        <p>Architectural renders illustrate the project and are not a live inventory feed. Availability, pricing and Private Office representation must be confirmed for your enquiry.</p>
      </section>
    </main>
  </div>
}
