import {notFound} from 'next/navigation';
import PortfolioHeader from '@/components/portfolio-header';
import PortfolioMotion from '@/components/portfolio-motion';
import ResidenceGallery from '@/components/residence-gallery';
import {getResidence,tierraViva} from '@/lib/portfolio';

export const dynamic='force-dynamic';

export default async function Page({params}:{params:Promise<{residence:string}>}){
  const {residence:slug}=await params;
  const residence=getResidence(slug);
  if(!residence)notFound();

  const media=[residence.hero,...residence.gallery];
  return <div className="po-residence-detail">
    <PortfolioMotion/>
    <PortfolioHeader/>
    <main>
      <section className="po-residence-hero">
        <img src={residence.hero.src} srcSet={residence.hero.srcSet} sizes="100vw" alt={residence.hero.alt} style={{objectPosition:residence.hero.focal}} fetchPriority="high" data-po-parallax=".04"/>
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

      <ResidenceGallery media={media} project={tierraViva.name} residence={residence.name}/>

      <section className="po-residence-truth" data-po-reveal>
        <div>
          <p className="po-kicker">PRIVATE ENQUIRY</p>
          <h2>Begin with the residence.<br/>Make it your conversation.</h2>
        </div>
        <p>Discuss this residence with our office. We will help clarify the current availability, commercial terms and next steps for your requirements. All images are architectural impressions; this illustrative collection does not confirm a current sales mandate.</p>
      </section>

      <section className="po-project-exit">
        <a href="/residences/tierra-viva">← Tierra Viva</a>
        <a href={"/?enquire="+encodeURIComponent("Tierra Viva · "+residence.name)}>Request a private presentation →</a>
      </section>
    </main>
  </div>
}
