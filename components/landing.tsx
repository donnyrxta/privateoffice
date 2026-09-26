'use client';
import {ArrowUpRight} from 'lucide-react';
import AgentLoginForm from './agent-login-form';

const HERO='https://cdn.darglobal.co.uk/DG_AL_Diamente_Villa_Ext_2_2_a4790ab5a2.jpg';

export function Brand(){return <a className="brand" href="/" aria-label="Private Office home"><span className="brand-mark" aria-hidden="true">╱</span><span>PRIVATE OFFICE<small>PROPERTY & PEOPLE</small></span></a>}

export function Header({publicNav=false}:{publicNav?:boolean}){return <header className="site-header"><Brand/><nav aria-label="Main navigation">{publicNav?<><a href="/">Agent access <ArrowUpRight size={15}/></a><a href="/office">The office <ArrowUpRight size={15}/></a></>:<><a href="/">Agent access <ArrowUpRight size={15}/></a><a href="/office">The office <ArrowUpRight size={15}/></a></>}</nav></header>}

export function PublicFooter(){return <footer><Brand/><span>Zimbabwe · Private property representation</span><a href="/privacy">Privacy</a></footer>}

export default function Landing(){
  return <main className="portal-landing">
    <img className="portal-hero-image" src={HERO} alt="Contemporary Tierra Viva villa architectural render" fetchPriority="high"/>
    <div className="portal-shade"/>
    <div className="portal-top"><Brand/><a href="/office" className="portal-office-link">The office <ArrowUpRight size={15}/></a></div>
    <section className="portal-copy">
      <p className="eyebrow">PRIVATE OFFICE · REPRESENTATIVE ACCESS</p>
      <h1>Private property.<br/><em>Professional representation.</em></h1>
      <p>Access for contracted Private Office real estate agents. Your portfolio, client appointments and visit tools sit behind verified agent credentials and a fresh device location.</p>
      <div className="portal-index"><span>ZIMBABWE</span><span>INTERNATIONAL OFF-PLAN PROPERTY</span></div>
    </section>
    <section className="portal-login-card" aria-label="Agent sign in">
      <p className="eyebrow">AGENT SIGN IN</p>
      <h2>Enter your private office.</h2>
      <p className="portal-login-intro">Use the username and password issued to you by Private Office.</p>
      <AgentLoginForm className="portal-login-form"/>
      <p className="portal-location-note">After sign-in, precise location verification is required before the portfolio or dashboard opens. Location must remain available while the session is in use.</p>
    </section>
    <div className="portal-bottom"><span>AUTHORIZED REPRESENTATIVES ONLY</span><a href="/privacy">Privacy & operational notice</a></div>
  </main>
}
