'use client';
import {FormEvent,useEffect,useState} from 'react';
import {Copy,KeyRound,Plus,RefreshCw} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {api,post,age} from '@/lib/client';
import OnboardingManager from './onboarding-manager';

type Expertise={score:number;level:'foundation'|'practiced'|'advanced'};
type AgentProfile={source:'screening';years_experience:number|null;markets:string[];specialisms:string[];languages:string[];experience_summary:string|null;classification:{archetype:string;dimensions:Record<string,Expertise>;primary_strengths:string[];interview_focus:string[]}|null};
type Agent={id:string;username:string;email:string;full_name:string;active:number;created_at:number;last_login_at:number|null;session_last_seen_at?:number|null;last_lat?:number|null;last_lng?:number|null;last_accuracy?:number|null;last_location_at?:number|null;current_path?:string|null;activity_24h?:{path:string;duration_ms:number;last_at:number}[];profile?:AgentProfile|null};
const DIMENSION_LABELS:Record<string,string>={off_plan:'Off-plan',client_advisory:'Client advisory',deal_execution:'Deal execution',international:'International',compliance:'Compliance',operating_discipline:'Operating discipline'};

export default function AgentManager(){
  const[agents,setAgents]=useState<Agent[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[issued,setIssued]=useState<{username:string;password:string;name:string}|null>(null),[busy,setBusy]=useState(false);
  async function refresh(){const d=await api<{agents:Agent[]}>('/api/office/agents');setAgents(d.agents);setError('')}
  useEffect(()=>{refresh().catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
  async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const form=e.currentTarget,data=Object.fromEntries(new FormData(form));try{const d:any=await post('/api/office/agents',data);setIssued({username:d.agent.username,password:d.password,name:d.agent.full_name});form.reset();await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function reset(agent:Agent){if(!confirm('Issue a new password for '+agent.full_name+'? Existing agent web sessions will be signed out.'))return;setBusy(true);try{const d:any=await post('/api/office/agents',{action:'reset',agent_id:agent.id});setIssued({username:agent.username,password:d.password,name:agent.full_name})}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function copy(value:string){try{await navigator.clipboard.writeText(value)}catch{}}
  return <><OnboardingManager/><section className="panel agent-manager">
    <div className="agent-manager-head"><div><p className="eyebrow">CONTRACTED AGENTS</p><h2>Agent access</h2><p className="muted">Approved first-time agents appear here after screening. Manual provisioning remains available for already-contracted representatives.</p></div><button className="icon-button" onClick={()=>refresh().catch(e=>setError(e.message))} aria-label="Refresh agents"><RefreshCw size={17}/></button></div>
    {error&&<p className="error section-gap">{error}</p>}
    {issued&&<div className="issued-credentials section-gap"><p className="eyebrow">ISSUED CREDENTIALS · SAVE NOW</p><strong>{issued.name}</strong><div><span>Username</span><code>{issued.username}</code><button onClick={()=>copy(issued.username)} aria-label="Copy username"><Copy size={15}/></button></div><div><span>Password</span><code>{issued.password}</code><button onClick={()=>copy(issued.password)} aria-label="Copy password"><Copy size={15}/></button></div><p>The password is returned once. Give it directly to the contracted agent.</p></div>}
    <form onSubmit={create} className="agent-create-grid section-gap">
      <label>Agent name<Input name="full_name" required maxLength={100}/></label>
      <label>Username<Input name="username" required minLength={3} maxLength={80} placeholder="e.g. tmoyo"/></label>
      <label>Email<Input type="email" name="email" required maxLength={160}/></label>
      <button className="button" disabled={busy}><Plus size={17}/>{busy?'Creating…':'Create existing-agent login'}</button>
    </form>
    <div className="agent-account-list section-gap">{loading?<p className="muted">Loading agents…</p>:agents.length?agents.map(a=><div className="agent-account-row agent-account-row-rich" key={a.id}><div className="agent-account-identity"><strong>{a.full_name}</strong><span>@{a.username} · {a.email}</span>{a.profile?<div className="agent-profile-summary"><div><small>PROFILE</small><b>{a.profile.classification?.archetype||'Screened representative'}</b></div><div><small>EXPERIENCE</small><b>{a.profile.years_experience==null?'Not recorded':a.profile.years_experience+' years'}</b></div><div><small>MARKETS</small><b>{a.profile.markets.join(' · ')||'Not recorded'}</b></div><div><small>SPECIALISMS</small><b>{a.profile.specialisms.join(' · ')||'Not recorded'}</b></div>{a.profile.classification&&<details><summary>Expertise map</summary><div className="agent-expertise-grid">{Object.entries(a.profile.classification.dimensions).map(([key,value])=><span key={key}><em>{DIMENSION_LABELS[key]||key}</em><b>{value.level} · {value.score}</b></span>)}</div></details>}</div>:<small className="agent-profile-unclassified">Manual account · no screening-derived profile</small>}{a.last_location_at&&a.last_lat!=null&&a.last_lng!=null?<small className="agent-location-line">{a.last_lat.toFixed(5)}, {a.last_lng.toFixed(5)} · ±{Math.round(a.last_accuracy||0)} m · {age(a.last_location_at)}</small>:<small>No verified location yet</small>}</div><div className="agent-activity-summary"><small>{a.current_path?'Current: '+(a.current_path==='/residences'?'Portfolio':a.current_path==='/agent'?'My visits':a.current_path):a.last_login_at?'Signed in previously':'Not signed in yet'}</small>{a.activity_24h?.slice(0,3).map(x=><span key={x.path}>{x.path==='/residences'?'Portfolio':x.path==='/agent'?'My visits':x.path} · {Math.max(1,Math.round(x.duration_ms/60000))} min / 24h</span>)}<button className="text-link" onClick={()=>reset(a)} disabled={busy}><KeyRound size={15}/>Reset password</button></div></div>):<p className="muted">No contracted agents have been added yet.</p>}</div>
  </section></>
}
