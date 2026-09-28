'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,LoaderCircle} from 'lucide-react';
import {api,post} from '@/lib/client';
import styles from './agent-onboarding.module.css';

type Question={id:string;stage:'property'|'judgment'|'operations';prompt:string;choices:{id:string;label:string}[]};
type Classification={version:string;archetype:string;primary_strengths:string[];interview_focus:string[];dimensions:Record<string,{score:number;level:string}>};
type Application={
  id:string;status:string;full_name?:string;email?:string;phone?:string;city?:string;country?:string;current_company?:string|null;years_experience?:number;
  languages?:string[];markets?:string[];specialisms?:string[];experience_summary?:string;motivation?:string;answers?:Record<string,string>;classification?:Classification|null;submitted_at?:number|null;
};
type Payload={invite:{status:string;intended_email?:string|null;expires_at:number};application:Application|null;screening:{version:string;questions:Question[]}};

const STEPS=['Profile','Property advisory','Judgment & trust','Operating discipline','Review'] as const;
const LABELS:Record<string,string>={off_plan:'Off-plan',client_advisory:'Client advisory',deal_execution:'Deal execution',international:'International',compliance:'Compliance',operating_discipline:'Operating discipline'};

function csv(v:string){return [...new Set(v.split(',').map(x=>x.trim()).filter(Boolean))]}
function join(v?:string[]){return (v||[]).join(', ')}

export default function AgentOnboarding({token}:{token:string}){
  const[data,setData]=useState<Payload|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[step,setStep]=useState(0);
  const[profile,setProfile]=useState({full_name:'',email:'',phone:'',city:'',country:'',current_company:'',years_experience:'',languages:'',markets:'',specialisms:'',experience_summary:'',motivation:''});
  const[answers,setAnswers]=useState<Record<string,string>>({}),[declared,setDeclared]=useState(false);

  async function load(){const d=await api<Payload>('/api/onboarding/'+token);setData(d);const a=d.application;if(a){setProfile({full_name:a.full_name||'',email:a.email||'',phone:a.phone||'',city:a.city||'',country:a.country||'',current_company:a.current_company||'',years_experience:a.years_experience==null?'':String(a.years_experience),languages:join(a.languages),markets:join(a.markets),specialisms:join(a.specialisms),experience_summary:a.experience_summary||'',motivation:a.motivation||''});setAnswers(a.answers||{})}else if(d.invite.intended_email)setProfile(p=>({...p,email:d.invite.intended_email||''}))}
  useEffect(()=>{load().catch(e=>setError(e.message))},[token]);

  const questions=data?.screening.questions||[];
  const stage=step===1?'property':step===2?'judgment':step===3?'operations':null;
  const stageQuestions=useMemo(()=>stage?questions.filter(q=>q.stage===stage):[],[questions,stage]);
  const application=data?.application;
  const locked=!!application&&application.status!=='draft';

  async function saveProfile(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{
    const r=await post('/api/onboarding/'+token,{action:'save_profile',...profile,years_experience:Number(profile.years_experience),languages:csv(profile.languages),markets:csv(profile.markets),specialisms:csv(profile.specialisms)}) as {application:Application};
    setData(d=>d?{...d,application:r.application}:d);setStep(1);
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}}

  async function saveStage(){if(!stage)return;for(const q of stageQuestions)if(!answers[q.id]){setError('Choose a response for every question in this section.');return}
    setBusy(true);setError('');try{const subset=Object.fromEntries(stageQuestions.map(q=>[q.id,answers[q.id]]));const r=await post('/api/onboarding/'+token,{action:'save_answers',answers:subset}) as {application:Application};setData(d=>d?{...d,application:r.application}:d);setStep(s=>Math.min(4,s+1))}catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }

  async function submit(){if(!declared){setError('Confirm the declaration before submitting.');return}setBusy(true);setError('');try{const r=await post('/api/onboarding/'+token,{action:'submit',declaration:true}) as {application:Application};setData(d=>d?{...d,application:r.application}:d)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}

  if(error&&!data)return <main className={styles.failure}><div><p>PRIVATE OFFICE · REPRESENTATIVE SCREENING</p><h1>This invitation cannot be opened.</h1><span>{error}</span></div></main>;
  if(!data)return <main className={styles.loading}><LoaderCircle className={styles.spin}/><span>Opening private screening…</span></main>;

  if(locked&&application)return <main className={styles.complete}>
    <header className={styles.header}><a href="/" className={styles.wordmark}><b>╱</b><span>PRIVATE OFFICE<small>PROPERTY & PEOPLE</small></span></a><span>REPRESENTATIVE SCREENING</span></header>
    <section className={styles.completeHero}><p className={styles.eyebrow}>APPLICATION {application.status.toUpperCase()}</p><h1>{application.status==='submitted'?'Your profile is with the office.':application.status==='approved'?'Representation approved.':'Review completed.'}</h1><p>Your screening record is preserved as submitted. Private Office credentials are issued separately by the office after approval.</p></section>
    {application.classification&&<ClassificationView classification={application.classification}/>}
    <footer className={styles.footer}><span>PRIVATE OFFICE · CONFIDENTIAL</span><span>Screening classification supports human review; it does not make the approval decision.</span></footer>
  </main>;

  return <main className={styles.shell}>
    <header className={styles.header}><a href="/" className={styles.wordmark}><b>╱</b><span>PRIVATE OFFICE<small>PROPERTY & PEOPLE</small></span></a><span>REPRESENTATIVE SCREENING</span></header>
    <section className={styles.intro}>
      <div><p className={styles.eyebrow}>PRIVATE OFFICE · FIRST REPRESENTATION</p><h1>A private standard<br/><em>of representation.</em></h1></div>
      <div className={styles.introNote}><p>This screening establishes how you work: what you know, how you advise, and where a deeper conversation is useful.</p><span>Invitation expires {new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(data.invite.expires_at)}</span></div>
    </section>
    <div className={styles.progress} aria-label="Screening progress">{STEPS.map((name,i)=><button key={name} type="button" onClick={()=>i<=step&&setStep(i)} className={i===step?styles.active:i<step?styles.done:''}><span>{String(i+1).padStart(2,'0')}</span>{name}</button>)}</div>

    <section className={styles.stage}>
      <aside><p className={styles.eyebrow}>STEP {String(step+1).padStart(2,'0')} / 05</p><h2>{STEPS[step]}</h2><p>{step===0?'Build the professional context behind the interview.':step===4?'Review what you have supplied before it becomes a permanent screening record.':'Choose the response closest to how you would actually work. There are no hidden personality questions.'}</p></aside>
      <div className={styles.stageBody}>
        {step===0&&<form onSubmit={saveProfile} className={styles.profileForm}>
          <div className={styles.two}><label>Full name<input required value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})}/></label><label>Professional email<input type="email" required value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})}/></label></div>
          <div className={styles.two}><label>Phone<input required value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></label><label>Years in property<input type="number" min="0" max="60" required value={profile.years_experience} onChange={e=>setProfile({...profile,years_experience:e.target.value})}/></label></div>
          <div className={styles.two}><label>City<input required value={profile.city} onChange={e=>setProfile({...profile,city:e.target.value})}/></label><label>Country<input required value={profile.country} onChange={e=>setProfile({...profile,country:e.target.value})}/></label></div>
          <label>Current company / independent status<input value={profile.current_company} onChange={e=>setProfile({...profile,current_company:e.target.value})}/></label>
          <label>Languages <small>Comma separated</small><input required value={profile.languages} onChange={e=>setProfile({...profile,languages:e.target.value})} placeholder="English, Shona"/></label>
          <label>Markets worked <small>Comma separated</small><input required value={profile.markets} onChange={e=>setProfile({...profile,markets:e.target.value})} placeholder="Zimbabwe, UAE, South Africa"/></label>
          <label>Property specialisms <small>Comma separated</small><input required value={profile.specialisms} onChange={e=>setProfile({...profile,specialisms:e.target.value})} placeholder="Off-plan, luxury residential, investment"/></label>
          <label>Experience summary<textarea required minLength={40} value={profile.experience_summary} onChange={e=>setProfile({...profile,experience_summary:e.target.value})} placeholder="Describe the property work you have actually done, typical clients and transaction responsibility."/></label>
          <label>Why Private Office?<textarea required minLength={30} value={profile.motivation} onChange={e=>setProfile({...profile,motivation:e.target.value})} placeholder="What kind of representation do you want to be trusted with?"/></label>
          <button className={styles.primary} disabled={busy}>{busy?'Saving…':'Continue to screening'}<ArrowRight size={17}/></button>
        </form>}

        {stage&&<div className={styles.questions}>{stageQuestions.map((q,index)=><fieldset key={q.id}><legend><span>{String(index+1).padStart(2,'0')}</span>{q.prompt}</legend>{q.choices.map(c=><label key={c.id} className={answers[q.id]===c.id?styles.selected:''}><input type="radio" name={q.id} value={c.id} checked={answers[q.id]===c.id} onChange={()=>setAnswers({...answers,[q.id]:c.id})}/><span>{c.label}</span></label>)}</fieldset>)}
          <div className={styles.actions}><button type="button" className={styles.secondary} onClick={()=>setStep(step-1)}><ArrowLeft size={16}/>Back</button><button type="button" className={styles.primary} disabled={busy} onClick={saveStage}>{busy?'Saving…':'Save & continue'}<ArrowRight size={16}/></button></div>
        </div>}

        {step===4&&<div className={styles.review}>
          <div className={styles.reviewRow}><span>Identity</span><strong>{profile.full_name}<small>{profile.email} · {profile.city}, {profile.country}</small></strong></div>
          <div className={styles.reviewRow}><span>Practice</span><strong>{profile.years_experience} years<small>{profile.specialisms}</small></strong></div>
          <div className={styles.reviewRow}><span>Markets</span><strong>{profile.markets}<small>{profile.languages}</small></strong></div>
          <div className={styles.reviewRow}><span>Screening</span><strong>{Object.keys(answers).length} / {questions.length} responses saved<small>Version {data.screening.version}</small></strong></div>
          <label className={styles.declaration}><input type="checkbox" checked={declared} onChange={e=>setDeclared(e.target.checked)}/><span>I confirm that the information I supplied is accurate and may be reviewed by Private Office for representative onboarding. I understand that the screening map supports, but does not replace, human review.</span></label>
          {error&&<p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actions}><button type="button" className={styles.secondary} onClick={()=>setStep(3)}><ArrowLeft size={16}/>Back</button><button type="button" className={styles.primary} disabled={busy} onClick={submit}>{busy?'Submitting…':'Submit for office review'}<Check size={16}/></button></div>
        </div>}
        {error&&step!==4&&<p className={styles.error} role="alert">{error}</p>}
      </div>
    </section>
    <footer className={styles.footer}><span>PRIVATE OFFICE · CONFIDENTIAL</span><span>No property inventory is exposed during onboarding.</span></footer>
  </main>;
}

function ClassificationView({classification}:{classification:Classification}){return <section className={styles.classification}><div><p className={styles.eyebrow}>DESCRIPTIVE EXPERTISE MAP</p><h2>{classification.archetype}</h2><p>This map reflects your submitted scenario responses. The office reviews the full evidence, not a single total score.</p></div><div className={styles.dimensionList}>{Object.entries(classification.dimensions).map(([key,value])=><div key={key}><span>{LABELS[key]||key}</span><strong>{value.level}<small>{value.score}/100</small></strong></div>)}</div></section>}
