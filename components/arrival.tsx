'use client';
import {Textarea} from '@/components/ui/textarea';
import {useEffect,useMemo,useState} from 'react';
import {Check,MapPin,ShieldCheck} from 'lucide-react';
import {Brand} from './landing';
import LocationMap from './location-map';
import {api,post,date,age} from '@/lib/client';
import {demoVisit} from '@/lib/demo';
import {distanceMetres,FRESH_MS,type Visit} from '@/lib/contracts';
import {qualityFromAccuracy,qualityLabel} from '@/lib/telemetry/shared';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';

function arrivalHeadline(v:Visit|null,fresh:boolean){
  if(!v)return 'Your agent’s arrival.';
  if(v.status==='sharing')return fresh?'Your agent is on the way':'Reconnecting to your agent’s location';
  if(v.status==='arrived')return 'Your agent has arrived';
  if(v.status==='completed')return 'Appointment completed';
  if(v.status==='paused')return 'Location sharing has paused';
  if(v.status==='revoked')return 'This appointment was cancelled';
  if(v.status==='expired')return 'This arrival link has expired';
  return 'Your appointment is being prepared';
}

export default function Arrival({id}:{id:string}){
  const demo=id==='demo';
  const[v,setV]=useState<Visit|null>(demo?demoVisit():null),[error,setError]=useState(''),[key,setKey]=useState(''),[now,setNow]=useState(Date.now()),[answer,setAnswer]=useState(''),[comment,setComment]=useState(''),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[demoState,setDemoState]=useState('sharing');

  useEffect(()=>{if(demo)return;const k=new URLSearchParams(location.hash.slice(1)).get('key')||'';setKey(k);if(!k){setError('Open the complete private arrival link sent by the office.');return}let gone=false;async function refresh(){try{const d=await api('/api/client/'+id,{headers:{Authorization:'Bearer '+k}});if(!gone){setV(d);setError('')}}catch(e){if(!gone){setV(null);setError((e as Error).message)}}}refresh();const t=setInterval(refresh,5000);return()=>{gone=true;clearInterval(t)}},[id,demo]);
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[]);
  useEffect(()=>{const context=(document as any).modelContext;if(!context?.registerTool)return;const life=new AbortController();Promise.resolve(context.registerTool({name:'read_arrival_status',title:'Read arrival status',description:'Read the visible status of this visit. Does not request location or start tracking.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input:any){if(!input||Object.keys(input).length)throw Error('No arguments expected.');return {status:v?.status??'unavailable',agent:v?.agent_name??null,property:v?.property??null,fresh:!!v?.fresh&&!error,demonstration:demo}}},{signal:life.signal})).catch(()=>{});return()=>life.abort()},[v,error,demo]);

  const fresh=!!(v?.fresh&&!error&&v.point&&now-v.point.recorded_at<FRESH_MS);
  const current=v?{...v,fresh}:null;
  const quality=v?.point?qualityLabel(v.point.quality_class||qualityFromAccuracy(v.point.accuracy)):'Waiting';
  const distance=v?.point?distanceMetres(v.point,v):null;
  const remaining=v?.share_started_at&&v.eta_minutes?Math.ceil((v.share_started_at+v.eta_minutes*60000-now)/60000):0;
  const eta=fresh&&remaining>0?String(remaining):'—';
  const initials=useMemo(()=>v?.agent_name?.split(' ').filter(Boolean).map(s=>s[0]).slice(0,2).join('').toUpperCase()||'PO',[v?.agent_name]);

  async function confirm(){if(!answer)return;setBusy(true);try{if(!demo)await post('/api/client/'+id,{property_confirmed:answer,comment},{Authorization:'Bearer '+key});setSaved(true);setError('')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}

  return <div className="arrival-experience">
    <header className="arrival-header"><Brand/><span className="arrival-private-tag"><ShieldCheck size={14}/>PRIVATE APPOINTMENT</span></header>
    <main className="arrival-v2">
      {demo&&<div className="demo-bar arrival-demo"><strong>Demonstration</strong><span>Illustrative coordinates. No person is being tracked.</span><Select value={demoState} onValueChange={s=>{setDemoState(s);setV(demoVisit(s));setSaved(false)}}><SelectTrigger aria-label="Demonstration visit state" className="demo-select"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="sharing">On the way</SelectItem><SelectItem value="paused">Sharing stopped</SelectItem><SelectItem value="arrived">Arrived</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div>}
      {error&&<p className="error arrival-error" role="alert">{error}</p>}
      {!current&&!error&&<div className="arrival-loading">Preparing your private appointment…</div>}
      {current&&<>
        <section className="arrival-command">
          <div className="arrival-command-copy">
            <p className="eyebrow arrival-wordmark">PRIVATE OFFICE</p>
            <h1>{arrivalHeadline(v,fresh)}</h1>
            <div className="arrival-agent">
              <div className="arrival-agent-mark" aria-hidden="true">{initials}</div>
              <div><span>YOUR ASSIGNED AGENT</span><strong>{v!.agent_name}</strong></div>
            </div>
          </div>
          <div className="arrival-eta" aria-label={fresh&&remaining>0?remaining+' minutes estimated time remaining':'Arrival estimate unavailable'}>
            <div><strong>{eta}</strong><span>MIN</span></div>
            <p>{fresh&&remaining>0?'Estimated time remaining':v!.status==='arrived'?'ARRIVED':v!.status==='sharing'?'Awaiting a fresh fix':'Private appointment'}</p>
          </div>
        </section>

        <section className="arrival-map-stage">
          <LocationMap visit={current}/>
          <div className="arrival-destination">
            <MapPin size={17}/>
            <div><span>MEETING POINT</span><strong>{v!.meeting}</strong></div>
          </div>
          <div className="arrival-trust-strip">
            <div><span>UPDATED</span><strong>{v!.point?age(v!.point.recorded_at,now):'Waiting for fix'}</strong></div>
            <div><span>REPORTED ACCURACY</span><strong>{v!.point?'±'+Math.round(v!.point.accuracy)+' m':'—'}</strong></div>
            <div><span>LOCATION QUALITY</span><strong className={fresh?'trust-good':''}>{quality}</strong></div>
          </div>
        </section>

        <section className="arrival-context">
          <div><span>APPOINTMENT</span><strong>{date(v!.scheduled_at)} · Zimbabwe time</strong></div>
          <div><span>PROPERTY CONVERSATION</span><strong>{v!.property}</strong></div>
          {distance!==null&&<div><span>STRAIGHT-LINE DISTANCE</span><strong>{(distance/1000).toFixed(1)} km</strong></div>}
        </section>

        <details className="arrival-evidence">
          <summary>Location evidence</summary>
          <div className="arrival-evidence-grid">
            <div><span>Freshness</span><strong>{fresh?'Current':'Not live'}</strong></div>
            <div><span>Latest persisted fix</span><strong>{v!.point?age(v!.point.recorded_at,now):'Not received'}</strong></div>
            <div><span>Coordinates</span><strong className="mono">{v!.point?v!.point.lat.toFixed(6)+', '+v!.point.lng.toFixed(6):'—'}</strong></div>
            <div><span>Reported uncertainty</span><strong>{v!.point?'±'+Math.round(v!.point.accuracy)+' m · '+quality:'—'}</strong></div>
          </div>
          <p>The map shows the latest server-persisted position. Reported accuracy and timestamp remain visible because a coordinate alone is not proof of exact ground position.</p>
        </details>

        <p className="arrival-privacy"><ShieldCheck size={16}/> Shared for this appointment only. Your own location is not collected. <a href="/privacy">Privacy & location sharing</a></p>
      </>}

      {v&&['arrived','completed'].includes(v.status)&&<section className="panel arrival-confirmation">{saved?<p className="success" role="status">{demo?'Demo confirmation recorded in this preview.':'Thank you. Your confirmation has been recorded for the office.'}</p>:<><p className="eyebrow">AFTER THE MEETING</p><h2>Confirm the introduction.</h2><p className="muted">Did you meet {v.agent_name} and discuss {v.property}?</p><div className="form-stack section-gap"><Select value={answer} onValueChange={setAnswer}><SelectTrigger aria-label="Meeting confirmation"><SelectValue placeholder="Choose your response"/></SelectTrigger><SelectContent><SelectItem value="yes">Yes, we met and discussed the assigned property</SelectItem><SelectItem value="no">We met, but a different property was discussed</SelectItem><SelectItem value="not_met">I did not meet the agent</SelectItem></SelectContent></Select><label>Anything the office should know? (optional)<Textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={1000}/></label><button className="button" onClick={confirm} disabled={!answer||busy}>{busy?'Saving…':'Confirm with the office'}<Check size={18}/></button></div></>}</section>}
    </main>
  </div>
}
