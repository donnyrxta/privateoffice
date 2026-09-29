'use client';

import {useEffect,useState} from 'react';
import CoordinateHistory from './coordinate-history';
import {ArrowRight,Check,Copy,RefreshCw,ShieldCheck,UserPlus,X} from 'lucide-react';
import {api,post,date} from '@/lib/client';
import {SCREENING_QUESTIONS} from '@/lib/screening';
import styles from './onboarding-manager.module.css';

type Classification={archetype:string;dimensions:Record<string,{score:number;level:string}>;primary_strengths:string[];interview_focus:string[]};
type Application={id:string;full_name:string|null;email:string|null;phone:string|null;city:string|null;country:string|null;current_company:string|null;years_experience:number|null;languages:string[];markets:string[];specialisms:string[];experience_summary:string|null;motivation:string|null;status:string;created_at:number;updated_at:number;submitted_at:number|null;reviewed_at:number|null;review_note:string|null;classification:Classification|null;answers:Record<string,string>};
type Invite={id:string;intended_email:string|null;status:string;created_at:number;expires_at:number;opened_at:number|null;submitted_at:number|null;application_id:string|null};
type LocationCheck={id:string;invite_id:string;kind:string;lat:number|null;lng:number|null;accuracy:number|null;received_at:number;note:string|null};
type Payload={applications:Application[];invites:Invite[];location_checks:LocationCheck[]};
type Issued={name:string;username:string;password:string}|null;
const D:Record<string,string>={off_plan:'Off-plan',client_advisory:'Client advisory',deal_execution:'Deal execution',international:'International',compliance:'Compliance',operating_discipline:'Operating discipline'};

export default function OnboardingManager(){
  const[data,setData]=useState<Payload>({applications:[],invites:[],location_checks:[]}),[error,setError]=useState(''),[busy,setBusy]=useState(false),[email,setEmail]=useState(''),[link,setLink]=useState(''),[issued,setIssued]=useState<Issued>(null);
  async function refresh(){const d=await api<Payload>('/api/office/onboarding');setData(d);setError('')}
  useEffect(()=>{refresh().catch(e=>setError(e.message))},[]);
  async function invite(){setBusy(true);setError('');try{const d:any=await post('/api/office/onboarding',{action:'invite',email:email.trim()||null});setLink(location.origin+d.invite.path);setEmail('');await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function approve(app:Application){if(!confirm('Approve '+app.full_name+' and issue Private Office agent credentials?'))return;setBusy(true);setError('');try{const d:any=await post('/api/office/onboarding',{action:'approve',application_id:app.id,review_note:'Approved after team review.'});setIssued({name:d.agent.full_name,username:d.agent.username,password:d.password});await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function decline(app:Application){const note=prompt('Record the reason or follow-up note for this decision.');if(!note)return;setBusy(true);setError('');try{await post('/api/office/onboarding',{action:'decline',application_id:app.id,review_note:note});await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function allowManual(inviteId:string){const note=prompt('Record why a manual interview is appropriate. Location is not a hiring score.');if(!note||note.trim().length<10)return;setBusy(true);setError('');try{await post('/api/office/onboarding',{action:'allow_manual_screening',invite_id:inviteId,review_note:note});await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function copy(v:string){try{await navigator.clipboard.writeText(v)}catch{}}
  const submitted=data.applications.filter(a=>a.status==='submitted'),inProgress=data.applications.filter(a=>a.status==='draft'),reviewed=data.applications.filter(a=>a.status==='approved'||a.status==='declined');
  return <section className={'panel '+styles.panel}>
    <div className={styles.head}><div><p className="eyebrow">REPRESENTATIVE ONBOARDING</p><h2>Know who you’re working with.</h2><p className="muted">Invite first-time agents to a structured professional introduction. Your team still makes the final access decision.</p></div><button className="icon-button" onClick={()=>refresh().catch(e=>setError(e.message))} aria-label="Refresh onboarding"><RefreshCw size={17}/></button></div>
    <div className={styles.inviteComposer}><label>Bind invitation to email <span>optional</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="candidate@example.com"/></label><button className="button" onClick={invite} disabled={busy}><UserPlus size={17}/>{busy?'Working…':'Create introduction link'}</button></div>
    {link&&<div className={styles.linkBox}><div><span>ONE-TIME ONBOARDING LINK</span><code>{link}</code><small>Valid for 7 days. The raw token is shown here only.</small></div><button onClick={()=>copy(link)} aria-label="Copy onboarding link"><Copy size={16}/></button></div>}
    {issued&&<div className={styles.credentials}><p className="eyebrow">APPROVED · CREDENTIALS ISSUED ONCE</p><strong>{issued.name}</strong><div><span>Username</span><code>{issued.username}</code><button onClick={()=>copy(issued.username)}><Copy size={14}/></button></div><div><span>Password</span><code>{issued.password}</code><button onClick={()=>copy(issued.password)}><Copy size={14}/></button></div><small>Credentials enter the existing agent authentication flow. Portfolio access requires these credentials. Visit activation remains subject to professional review.</small></div>}
    {error&&<p className="error section-gap" role="alert">{error}</p>}

    <div className={styles.pipelineHead}><h3>Shared working areas</h3><span>Team view · while shared · deleted after 30 days</span></div>
    <div className={styles.slimList}>{data.invites.map(invite=>{const checks=(data.location_checks||[]).filter(c=>c.invite_id===invite.id),latest=checks.find(c=>c.kind==='location'),request=checks.find(c=>c.kind==='manual_requested'),approved=checks.some(c=>c.kind==='manual_approved');return <div key={invite.id}><strong>{invite.intended_email||'Invitation '+invite.id.slice(0,8)}</strong>{latest&&<p>Latest shared location: {latest.lat?.toFixed(5)}, {latest.lng?.toFixed(5)} · ±{Math.round(latest.accuracy||0)} m · {date(latest.received_at)}.</p>}<CoordinateHistory kind="screening" id={invite.id}/>{request&&<p>Manual interview request: {request.note}</p>}{approved?<p>Manual interview arranged.</p>:request&&<button type="button" className={styles.approve} disabled={busy} onClick={()=>allowManual(invite.id)}>Arrange manual interview</button>}</div>})}</div>

    <div className={styles.pipelineHead}><h3>Ready for review</h3><span>{submitted.length}</span></div>
    {submitted.length?<div className={styles.applications}>{submitted.map(app=><ApplicationRow key={app.id} app={app} actions={<><button className={styles.approve} onClick={()=>approve(app)} disabled={busy}><Check size={14}/>Approve & issue login</button><button className={styles.decline} onClick={()=>decline(app)} disabled={busy}><X size={14}/>Decline</button></>}/>)}</div>:<div className={styles.empty}>No submitted introductions are waiting for review.</div>}

    <div className={styles.pipelineHead}><h3>In progress</h3><span>{inProgress.length}</span></div>
    {inProgress.length?<div className={styles.slimList}>{inProgress.map(app=><div key={app.id}><strong>{app.full_name||'Candidate started'}</strong><span>{app.email||'Profile not yet completed'} · updated {date(app.updated_at)}</span></div>)}</div>:<div className={styles.empty}>No candidate is currently part-way through their introduction.</div>}

    {reviewed.length>0&&<><div className={styles.pipelineHead}><h3>Reviewed</h3><span>{reviewed.length}</span></div><div className={styles.slimList}>{reviewed.slice(0,12).map(app=><div key={app.id}><strong>{app.full_name}</strong><span>{app.status.toUpperCase()} · {app.reviewed_at?date(app.reviewed_at):'reviewed'}</span></div>)}</div></>}

    <div className={styles.inviteLedger}><div className={styles.pipelineHead}><h3>Invitation history</h3><span>{data.invites.length}</span></div>{data.invites.slice(0,10).map(i=><div key={i.id}><span>{i.intended_email||'Unbound invitation'}</span><strong>{i.status}</strong><small>expires {date(i.expires_at)}</small></div>)}</div>
  </section>;
}

function ApplicationRow({app,actions}:{app:Application;actions:React.ReactNode}){return <article className={styles.application}>
  <div className={styles.identity}><div><p className="eyebrow">INTRODUCTION SUBMITTED</p><h4>{app.full_name}</h4><p>{app.email} · {app.phone}<br/>{app.city}, {app.country} · {app.years_experience} years</p></div><ShieldCheck size={22}/></div>
  <div className={styles.practice}><div><span>MARKETS</span><strong>{app.markets.join(' · ')}</strong></div><div><span>SPECIALISMS</span><strong>{app.specialisms.join(' · ')}</strong></div><div><span>LANGUAGES</span><strong>{app.languages.join(' · ')}</strong></div></div>
  {app.classification&&<div className={styles.classification}><div className={styles.archetype}><span>STRENGTHS MAP</span><strong>{app.classification.archetype}</strong></div>{Object.entries(app.classification.dimensions).map(([key,value])=><div key={key}><span>{D[key]||key}</span><strong>{value.level}<small>{value.score}</small></strong></div>)}</div>}
  <details className={styles.evidence}><summary>Review full introduction <ArrowRight size={13}/></summary><div><span>EXPERIENCE</span><p>{app.experience_summary}</p><span>MOTIVATION</span><p>{app.motivation}</p><span>SCENARIO RESPONSES</span>{SCREENING_QUESTIONS.map(q=>{const answer=q.choices.find(c=>c.id===app.answers?.[q.id]);return <div className={styles.response} key={q.id}><strong>{q.prompt}</strong><p>{answer?.label||'No response provided'}</p></div>})}</div></details>
  <div className={styles.actions}>{actions}</div>
</article>}
