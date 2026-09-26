'use client';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {useEffect,useState} from 'react';
import {ArrowUpRight,ArrowRight,Check} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Checkbox} from '@/components/ui/checkbox';

const HERO='https://cdn.darglobal.co.uk/DG_AL_Diamente_Villa_Ext_2_2_a4790ab5a2.jpg';

export function Brand(){
  return <a className="brand" href="/" aria-label="Private Office home"><span className="brand-mark" aria-hidden="true">╱</span><span>PRIVATE OFFICE<small>PROPERTY & PEOPLE</small></span></a>
}

export function Header({publicNav=false}:{publicNav?:boolean}){
  return <header className="site-header"><Brand/><nav aria-label="Main navigation">{publicNav?<><a href="/residences">Residences <ArrowUpRight size={15}/></a><a href="/?enquire=private">Private enquiry <ArrowUpRight size={15}/></a></>:<><a href="/agent">Agent access <ArrowUpRight size={15}/></a><a href="/office">The office <ArrowUpRight size={15}/></a></>}</nav></header>
}

export function PublicFooter(){
  return <footer><Brand/><span>Zimbabwe · International property enquiries</span><a href="/privacy">Privacy</a></footer>
}

export default function Landing(){
  const[open,setOpen]=useState(false);
  const[agreed,setAgreed]=useState(false);
  const[status,setStatus]=useState('');
  const[busy,setBusy]=useState(false);
  const[success,setSuccess]=useState(false);
  const[prefill,setPrefill]=useState('');

  useEffect(()=>{
    const q=new URLSearchParams(window.location.search).get('enquire');
    if(!q)return;
    setPrefill(q==='private'?'I would like to discuss a private off-plan property brief.':'I would like a private brief on '+q+'.');
    setOpen(true);
  },[]);

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setStatus('');
    const data=Object.fromEntries(new FormData(e.currentTarget));
    try{
      const r=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,consent:agreed})});
      const d=await r.json() as {error?:string};
      if(!r.ok)throw Error(d.error||'Could not send your enquiry.');
      setSuccess(true);
    }catch(e){setStatus((e as Error).message)}
    finally{setBusy(false)}
  }

  return <><div className="landing"><Header publicNav/><main>
    <section className="hero">
      <img className="hero-image" src={HERO} alt="Contemporary Tierra Viva villa architectural render" fetchPriority="high"/>
      <div className="hero-shade"/>
      <div className="hero-content">
        <p className="eyebrow">INTERNATIONAL PROPERTY. LOCAL CONNECTION.</p>
        <h1>A world of possibility.<br/><em>A personal introduction.</em></h1>
        <p className="hero-description">Exceptional homes. Considered introductions.<br/>Your property conversation, closer to home.</p>
        <button className="button light" onClick={()=>setOpen(true)}>Make an enquiry <ArrowUpRight size={20}/></button>
      </div>
      <div className="hero-bottom"><span>ZIMBABWE <span className="tiny-line"/> INTERNATIONALLY CONNECTED</span><span>01 <span className="tiny-line"/> TIERRA VIVA · ARTIST’S IMPRESSION</span></div>
    </section>

    <section className="intro">
      <p className="eyebrow">PERSONAL, FROM THE FIRST CONVERSATION</p>
      <div>
        <h2>Good property decisions<br/>begin with the right people.</h2>
        <p>Private access to exceptional off-plan opportunities, considered around your brief, your timing and the way you want to buy.</p>
        <a className="text-link" href="/residences">Explore private residences <ArrowRight size={18}/></a>
      </div>
      <span className="intro-note">A private conversation.<br/>A considered next step.</span>
    </section>
  </main><PublicFooter/></div>

  <Dialog open={open} onOpenChange={setOpen}><DialogContent className="enquiry-dialog">{success?<><Check size={30}/><DialogTitle>We have your enquiry.</DialogTitle><DialogDescription>Your details have been saved for the office. We will follow up privately about the property brief that best fits your enquiry.</DialogDescription><button className="button" onClick={()=>setOpen(false)}>Close <ArrowRight size={18}/></button></>:<><p className="eyebrow">LET’S START A CONVERSATION</p><DialogTitle>Tell us what you have in mind.</DialogTitle><DialogDescription>Leave your details and the office will arrange a private property conversation.</DialogDescription><form onSubmit={submit} className="form-stack"><label>Your name<Input name="name" autoComplete="name" required maxLength={100}/></label><label>Email or phone<Input name="contact" required maxLength={160}/></label><label>What are you looking for?<Textarea key={prefill} name="interest" required maxLength={2000} rows={4} defaultValue={prefill} placeholder="Destination, property type, intended use, timing or simply the question you want answered."/></label><Input name="website" tabIndex={-1} autoComplete="off" className="honeypot" aria-hidden="true"/><label className="check-row"><Checkbox checked={agreed} onCheckedChange={v=>setAgreed(v===true)}/><span>I agree to be contacted about this enquiry. <a href="/privacy">Privacy notice</a></span></label>{status&&<p className="error" role="alert">{status}</p>}<button className="button" disabled={busy||!agreed}>{busy?'Sending…':'Send enquiry'}<ArrowUpRight size={18}/></button></form></>}</DialogContent></Dialog></>
}
