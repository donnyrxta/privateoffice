'use client';
import {FormEvent,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {post} from '@/lib/client';

export default function AgentLoginForm({className=''}:{className?:string}){
  const[username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await post('/api/agent/login',{username,password});location.assign('/agent/location')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  return <form onSubmit={submit} className={'form-stack '+className}>
    <label>Username<Input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required maxLength={80}/></label>
    <label>Password<Input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required minLength={8} maxLength={200}/></label>
    {error&&<p className="error" role="alert">{error}</p>}
    <button className="button" disabled={busy}>{busy?'Signing in…':'Enter Private Office'}<ArrowRight size={18}/></button>
  </form>
}
