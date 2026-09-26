'use client';

import {FormEvent,useState} from 'react';
import {ArrowRight,LockKeyhole,ShieldCheck} from 'lucide-react';
import {Header} from './landing';
import {Input} from '@/components/ui/input';
import {post} from '@/lib/client';

type Mode='missing_auth'|'setup'|'denied'|'error';

export default function OfficeAccessPanel({mode,email}:{mode:Mode;email?:string}){
  const[key,setKey]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function activate(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await post('/api/office/setup',{key});location.replace('/office')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}

  if(mode==='setup')return <><Header/><main className="app-main office-access-shell">
    <section className="office-access-card">
      <ShieldCheck size={28}/>
      <p className="eyebrow section-gap">CLOUDFLARE ACCESS VERIFIED</p>
      <h1 className="sign-in-title">Activate your Private Office.</h1>
      <p className="muted">Signed in as {email}. Enter the one-time bootstrap secret to bind this identity as the production office owner.</p>
      <form onSubmit={activate} className="form-stack section-gap">
        <label>Bootstrap secret<Input type="password" value={key} onChange={e=>setKey(e.target.value)} autoComplete="off" required maxLength={200}/></label>
        {error&&<p className="error" role="alert">{error}</p>}
        <button className="button" disabled={busy||key.length<16}>{busy?'Activating…':'Activate office'}<ArrowRight size={18}/></button>
      </form>
    </section>
  </main></>;

  if(mode==='denied')return <><Header/><main className="app-main office-access-shell"><section className="office-access-card"><LockKeyhole size={28}/><p className="eyebrow section-gap">PRIVATE OFFICE ADMIN</p><h1 className="sign-in-title">This identity is not the office owner.</h1><p className="muted">{email} passed Cloudflare Access, but the production office is bound to a different owner identity.</p></section></main></>;

  if(mode==='error')return <><Header/><main className="app-main office-access-shell"><section className="office-access-card"><LockKeyhole size={28}/><p className="eyebrow section-gap">PRIVATE OFFICE ADMIN</p><h1 className="sign-in-title">Office data is unavailable.</h1><p className="muted">The authenticated office cannot reach its D1 binding. Check the production Worker bindings before continuing.</p></section></main></>;

  return <><Header/><main className="app-main office-access-shell"><section className="office-access-card"><LockKeyhole size={28}/><p className="eyebrow section-gap">PRIVATE OFFICE ADMIN</p><h1 className="sign-in-title">Secure office access is required.</h1><p className="muted">This production Worker expects Cloudflare Access to protect /office and /api/office. Once the Access application and runtime variables are configured, reopen /office and Cloudflare will authenticate the administrator before this page loads.</p><p className="notice section-gap">The old /signin-with-chatgpt route is not used in standalone production.</p></section></main></>;
}
