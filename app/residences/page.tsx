import {ArrowRight,ArrowUpRight} from 'lucide-react';
import {Header,PublicFooter} from '@/components/landing';

const HERO='https://cdn.darglobal.co.uk/DG_AL_Diamente_Villa_Ext_2_2_a4790ab5a2.jpg';

export const metadata={title:'Private Residences | Private Office',description:'A considered selection of international off-plan property for private buyers.'};

export default function Page(){
  return <div className="residences-page"><Header publicNav/><main>
    <section className="residence-hero">
      <img src={HERO} alt="Tierra Viva villa architectural render" fetchPriority="high"/>
      <div className="residence-hero-shade"/>
      <div className="residence-hero-copy">
        <p className="eyebrow">PRIVATE RESIDENCES</p>
        <h1>Exceptional property.<br/><em>Considered privately.</em></h1>
        <p>International off-plan opportunities for buyers who value discretion, design and a more personal route to the right conversation.</p>
        <a className="button light" href="/?enquire=private">Request a private brief <ArrowUpRight size={18}/></a>
      </div>
      <div className="residence-hero-index"><span>PRIVATE OFFICE</span><span>CURATED · INTERNATIONAL · OFF-PLAN</span></div>
    </section>

    <section className="residence-feature">
      <div className="residence-feature-copy">
        <p className="eyebrow">FEATURED RESIDENCE · BENAHAVÍS, SPAIN</p>
        <h2>Tierra Viva</h2>
        <p className="residence-lede">A gated collection of ultra-luxury villas in the hills of Benahavís, developed by DarGlobal with design inspired by Automobili Lamborghini.</p>
        <p>Set above the Costa del Sol, the villas are positioned at varied elevations for Mediterranean views. The development is currently under construction and spans 4- to 6-bedroom villa typologies.</p>
        <a className="text-link" href="/?enquire=Tierra%20Viva">Request the private brief <ArrowRight size={18}/></a>
      </div>
      <div className="residence-facts" aria-label="Tierra Viva overview">
        <div><span>LOCATION</span><strong>Benahavís · Spain</strong></div>
        <div><span>PROPERTY TYPE</span><strong>Ultra-luxury villas</strong></div>
        <div><span>STATUS</span><strong>Under development</strong></div>
        <div><span>RESIDENCE TYPES</span><strong>4–6 bedrooms</strong></div>
      </div>
    </section>

    <section className="residence-process">
      <div className="residence-process-intro"><p className="eyebrow">THE PRIVATE OFFICE APPROACH</p><h2>Less browsing.<br/>Better conversations.</h2></div>
      <div className="residence-steps">
        <article><span>01</span><h3>Define the brief</h3><p>Destination, intended use, timing, budget range and what would make the property worth pursuing.</p></article>
        <article><span>02</span><h3>Curate the opportunity</h3><p>We narrow the conversation to relevant developments and organise the information needed to evaluate them properly.</p></article>
        <article><span>03</span><h3>Make the introduction</h3><p>When the fit is right, the office coordinates the appropriate property conversation and appointment discreetly.</p></article>
      </div>
    </section>

    <section className="residence-note">
      <p>Project information is sourced from the developer and may change. Availability, commercial terms and representation are confirmed at enquiry; Private Office does not imply a current developer affiliation or sales mandate.</p>
    </section>
  </main><PublicFooter/></div>
}
