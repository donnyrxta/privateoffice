'use client';
import {FormEvent,useState} from 'react';
import {ArrowRight,MapPin} from 'lucide-react';
import {Header} from './landing';
import {Input} from '@/components/ui/input';
import {post} from '@/lib/client';

export default function SignInPanel({kind}:{kind:'agent'|'office'}){
  const[username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function login(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await post('/api/agent/login',{username,password});location.assign('/agent')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  if(kind==='agent')return <><Header/><main className="agent-login-shell">
    <section className="agent-login-copy"><p className="eyebrow">PRIVATE OFFICE · AGENT ACCESS</p><h1>Your assigned visit.<br/><em>Ready when you are.</em></h1><p>Use the credentials issued by Private Office. Your client visit and meeting details appear after sign-in.</p><a className="text-link" href="/gps-test"><MapPin size={17}/>Test this phone’s location first</a></section>
    <section className="agent-login-card"><p className="eyebrow">SIGN IN</p><form onSubmit={login} className="form-stack section-gap"><label>Username<Input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required/></label><label>Password<Input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required minLength={8}/></label>{error&&<p className="error" role="alert">{error}</p>}<button className="button" disabled={busy}>{busy?'Signing in…':'Sign in'}<ArrowRight size={18}/></button></form><p className="agent-login-help">Credentials are issued directly by Private Office to contracted agents.</p></section>
  </main></>;
  return <><Header/><main className="app-main prose"><p className="eyebrow">PRIVATE OFFICE</p><h1 className="sign-in-title">Your introductions. In one place.</h1><p className="muted">Continue through the secure office sign-in to manage agents, enquiries, visits and client introductions.</p><div className="actions section-gap"><a className="button" href="/signin-with-chatgpt?return_to=%2Foffice" target="_top">Continue to secure office</a><a className="button outline" href="/office/demo">Explore a demonstration</a></div></main></>
}
