'use client';
import {FormEvent,useEffect,useState} from 'react';
import {Copy,KeyRound,Plus,RefreshCw} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {api,post} from '@/lib/client';

type Agent={id:string;username:string;email:string;full_name:string;active:number;created_at:number;last_login_at:number|null};

export default function AgentManager(){
  const[agents,setAgents]=useState<Agent[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[issued,setIssued]=useState<{username:string;password:string;name:string}|null>(null),[busy,setBusy]=useState(false);
  async function refresh(){const d=await api<{agents:Agent[]}>('/api/office/agents');setAgents(d.agents);setError('')}
  useEffect(()=>{refresh().catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
  async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const form=e.currentTarget,data=Object.fromEntries(new FormData(form));try{const d:any=await post('/api/office/agents',data);setIssued({username:d.agent.username,password:d.password,name:d.agent.full_name});form.reset();await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function reset(agent:Agent){if(!confirm('Issue a new password for '+agent.full_name+'? Existing agent web sessions will be signed out.'))return;setBusy(true);try{const d:any=await post('/api/office/agents',{action:'reset',agent_id:agent.id});setIssued({username:agent.username,password:d.password,name:agent.full_name})}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function copy(value:string){try{await navigator.clipboard.writeText(value)}catch{}}
  return <section className="panel agent-manager">
    <div className="agent-manager-head"><div><p className="eyebrow">CONTRACTED AGENTS</p><h2>Agent access</h2><p className="muted">Create an account once. Assign future visits using the agent username.</p></div><button className="icon-button" onClick={()=>refresh().catch(e=>setError(e.message))} aria-label="Refresh agents"><RefreshCw size={17}/></button></div>
    {error&&<p className="error section-gap">{error}</p>}
    {issued&&<div className="issued-credentials section-gap"><p className="eyebrow">ISSUED CREDENTIALS · SAVE NOW</p><strong>{issued.name}</strong><div><span>Username</span><code>{issued.username}</code><button onClick={()=>copy(issued.username)} aria-label="Copy username"><Copy size={15}/></button></div><div><span>Password</span><code>{issued.password}</code><button onClick={()=>copy(issued.password)} aria-label="Copy password"><Copy size={15}/></button></div><p>The password is returned once. Give it directly to the contracted agent.</p></div>}
    <form onSubmit={create} className="agent-create-grid section-gap">
      <label>Agent name<Input name="full_name" required maxLength={100}/></label>
      <label>Username<Input name="username" required minLength={3} maxLength={80} placeholder="e.g. tmoyo"/></label>
      <label>Email<Input type="email" name="email" required maxLength={160}/></label>
      <button className="button" disabled={busy}><Plus size={17}/>{busy?'Creating…':'Create agent login'}</button>
    </form>
    <div className="agent-account-list section-gap">{loading?<p className="muted">Loading agents…</p>:agents.length?agents.map(a=><div className="agent-account-row" key={a.id}><div><strong>{a.full_name}</strong><span>@{a.username} · {a.email}</span></div><div><small>{a.last_login_at?'Has signed in':'Not signed in yet'}</small><button className="text-link" onClick={()=>reset(a)} disabled={busy}><KeyRound size={15}/>Reset password</button></div></div>):<p className="muted">No contracted agents have been added yet.</p>}</div>
  </section>
}
