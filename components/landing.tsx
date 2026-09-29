'use client';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {useState} from 'react';
import {ArrowUpRight,ArrowRight,Check} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Checkbox} from '@/components/ui/checkbox';

const PREVIEWS=[{name:'Diamante',src:'/assets/villa-hero-2000.webp'},{name:'Zafiro',src:'/assets/zafiro-splash.webp'},{name:'Esmeralda',src:'/assets/esmeralda-splash.webp'}];

export function Brand(){
  return <a className="brand" href="/" aria-label="Private Office home"><span className="brand-mark" aria-hidden="true">╱</span><span>PRIVATE OFFICE<small>PROPERTY & PEOPLE</small></span></a>
}

export function Header({publicNav=false}:{publicNav?:boolean}){
  return <header className="site-header"><Brand/><nav aria-label="Main navigation">{publicNav?<><a href="/#collection-preview">Property preview <ArrowUpRight size={15}/></a><a href="/?enquire=private">Private enquiry <ArrowUpRight size={15}/></a><a href="/agent">Agent sign in</a></>:<><a href="/agent">Agent access <ArrowUpRight size={15}/></a><a href="/office">The office <ArrowUpRight size={15}/></a></>}</nav></header>
}

export function PublicFooter(){
  return <footer><Brand/><span>Zimbabwe · International property enquiries</span><a href="/privacy">Privacy</a></footer>
}

export default function Landing({initialEnquiry=""}:{initialEnquiry?:string}){
  const[preview,setPreview]=useState(0);
  const[open,setOpen]=useState(!!initialEnquiry);
  const[agreed,setAgreed]=useState(false);
  const[status,setStatus]=useState('');
  const[busy,setBusy]=useState(false);
  const[success,setSuccess]=useState(false);
  const prefill=initialEnquiry==='private'?'I would like to discuss a private off-plan property brief.':initialEnquiry?'I would like a private brief on '+initialEnquiry+'.':'';

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setStatus('');
    const data=Object.fromEntries(new FormData(e.currentTarget));
    try{
      const r=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,consent:agreed})});
      const d=await r.json() as {error?:string;reference?:string};
      if(!r.ok)throw Error(d.error||'Could not send your enquiry.');
      setStatus(d.reference ? `Reference ${d.reference}` : '');setSuccess(true);
    }catch(e){setStatus((e as Error).message)}
    finally{setBusy(false)}
  }

  return <><div className="landing"><Header publicNav/><main>
    <section className="hero">
      <img className="hero-image" src={PREVIEWS[preview].src} srcSet={preview===0?"/assets/villa-hero-720.webp 720w, /assets/villa-hero-1280.webp 1280w, /assets/villa-hero-2000.webp 2000w":undefined} sizes="100vw" width={2000} height={1171} alt={"Tierra Viva "+PREVIEWS[preview].name+" architectural impression"} fetchPriority="high"/>
      <div className="hero-shade"/>
      <div className="hero-content">
        <p className="eyebrow">INTERNATIONAL PROPERTY. LOCAL CONNECTION.</p>
        <h1>A world of possibility.<br/><em>A personal introduction.</em></h1>
        <p className="hero-description">Exceptional homes. Considered introductions.<br/>Your property conversation, closer to home.</p>
        <div className="splash-actions"><a className="button light" href="/agent/sign-in">Agent sign in <ArrowUpRight size={20}/></a><button className="splash-enquiry" onClick={()=>setOpen(true)}>Make an enquiry <ArrowUpRight size={18}/></button></div>
      </div>
      <div className="hero-bottom"><span>ZIMBABWE <span className="tiny-line"/> INTERNATIONALLY CONNECTED</span><span>01 <span className="tiny-line"/> TIERRA VIVA · {PREVIEWS[preview].name.toUpperCase()} · ARTIST’S IMPRESSION</span></div>
    </section>

    <section className="splash-preview" id="collection-preview" aria-labelledby="preview-heading"><div><p className="eyebrow">A GLIMPSE OF THE COLLECTION</p><h2 id="preview-heading">Three expressions.<br/><em>One exceptional setting.</em></h2><p>Tierra Viva · Benahavís, Spain. Architectural impressions from our property library. Full briefs are available to invited representatives after sign-in.</p></div><div className="splash-selector" aria-label="Choose property preview">{PREVIEWS.map((item,i)=><button type="button" key={item.name} aria-pressed={preview===i} onClick={()=>setPreview(i)}><img src={item.src} alt={item.name+' villa preview'} loading="lazy" width={480} height={281}/><span><small>0{i+1}</small>{item.name}<ArrowUpRight size={18}/></span></button>)}</div></section>
  </main><PublicFooter/></div>

  <Dialog open={open} onOpenChange={setOpen}><DialogContent className="enquiry-dialog">{success?<><Check size={30}/><DialogTitle>We have your enquiry.</DialogTitle><DialogDescription>Your details have been saved for the office. A representative will review your brief and contact you privately.</DialogDescription>{status&&<p role="status">{status}</p>}<button className="button" onClick={()=>setOpen(false)}>Close <ArrowRight size={18}/></button></>:<><p className="eyebrow">LET’S START A CONVERSATION</p><DialogTitle>Tell us what you have in mind.</DialogTitle><DialogDescription>Leave your details and the office will arrange a private property conversation.</DialogDescription><form onSubmit={submit} className="form-stack"><label>Your name<Input name="name" autoComplete="name" required maxLength={100}/></label><label>Email or phone<Input name="contact" autoComplete="email" required minLength={5} maxLength={160}/></label><label>Preferred next step<select name="request_type" required defaultValue="Private property brief"><option>Private property brief</option><option>Arrange a viewing or presentation</option><option>Discuss a specific residence</option></select></label><label>Purchase timeframe<select name="timeframe" defaultValue="Exploring options"><option>Exploring options</option><option>Within 3 months</option><option>3–6 months</option><option>6–12 months</option><option>More than 12 months</option></select></label><label>What are you looking for?<Textarea key={prefill} name="interest" required maxLength={2000} rows={4} defaultValue={prefill} placeholder="Destination, property type, intended use, timing or simply the question you want answered."/></label><Input name="website" tabIndex={-1} autoComplete="off" className="honeypot" aria-hidden="true"/><label className="check-row"><Checkbox checked={agreed} onCheckedChange={v=>setAgreed(v===true)}/><span>I agree to be contacted about this enquiry. <a href="/privacy">Privacy notice</a></span></label>{status&&<p className="error" role="alert">{status}</p>}<button className="button" disabled={busy||!agreed}>{busy?'Sending…':'Send enquiry'}<ArrowUpRight size={18}/></button></form></>}</DialogContent></Dialog></>
}
