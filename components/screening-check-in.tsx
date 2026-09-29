'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {post} from '@/lib/client';
import styles from './agent-onboarding.module.css';

type LocationState={status:string;accuracy:number|null;received_at:number|null};
type Observation={
  id:string;sequence_number:number;lat:number;lng:number;accuracy:number;
  altitude:number|null;altitude_accuracy:number|null;heading:number|null;speed:number|null;recorded_at:number;
};
const CONSENT_VERSION='2026-09-29.screening.v2';

export default function ScreeningCheckIn({
  token,onReady,onStopped,active
}:{token:string;onReady:(state:LocationState)=>void;onStopped:()=>void;active:boolean}){
  const [consent,setConsent]=useState(false),[started,setStarted]=useState(false),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[reason,setReason]=useState(''),[requested,setRequested]=useState(false);
  const [last,setLast]=useState<{accuracy:number;receivedAt:number}|null>(null),[backgrounded,setBackgrounded]=useState(false);
  const watchId=useRef<number|null>(null),sessionId=useRef(''),sequence=useRef(0),queue=useRef<Observation[]>([]),flushing=useRef(false);
  const timer=useRef<ReturnType<typeof setInterval>|null>(null),onReadyRef=useRef(onReady),onStoppedRef=useRef(onStopped);
  useEffect(()=>{onReadyRef.current=onReady},[onReady]);
  useEffect(()=>{onStoppedRef.current=onStopped},[onStopped]);

  const flush=useCallback(async()=>{
    if(flushing.current||queue.current.length===0)return;
    flushing.current=true;
    const batch=queue.current.slice(0,25);
    try{
      const result=await post('/api/onboarding/'+token,{
        action:'location_batch',consent:true,consent_version:CONSENT_VERSION,session_id:sessionId.current,observations:batch
      }) as {processed_ids:string[];location:LocationState};
      const done=new Set(result.processed_ids||[]);
      queue.current=queue.current.filter(o=>!done.has(o.id));
      if(result.location.received_at&&result.location.accuracy!=null)setLast({accuracy:result.location.accuracy,receivedAt:result.location.received_at});
      if(result.location.status==='acquired'||result.location.status==='manual_approved'){
        onReadyRef.current(result.location);
      }
      setError('');
    }catch(e){
      setError('Location is still being collected on this device, but the latest observations have not reached Private Office yet. '+(e as Error).message);
    }finally{
      flushing.current=false;
      if(queue.current.length>25)void flush();
    }
  },[token]);

  const stop=useCallback((notify=true)=>{
    if(watchId.current!==null&&navigator.geolocation){navigator.geolocation.clearWatch(watchId.current);watchId.current=null}
    if(timer.current){clearInterval(timer.current);timer.current=null}
    setStarted(false);setBusy(false);
    if(notify)onStoppedRef.current();
  },[]);

  useEffect(()=>{
    const online=()=>void flush();
    const visibility=()=>setBackgrounded(document.hidden);
    const pagehide=()=>{
      if(queue.current.length===0||!sessionId.current)return;
      const batch=queue.current.slice(0,25);
      try{
        fetch('/api/onboarding/'+token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
          action:'location_batch',consent:true,consent_version:CONSENT_VERSION,session_id:sessionId.current,observations:batch
        }),keepalive:true,credentials:'same-origin'});
      }catch{}
    };
    window.addEventListener('online',online);window.addEventListener('pagehide',pagehide);document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('online',online);window.removeEventListener('pagehide',pagehide);document.removeEventListener('visibilitychange',visibility);stop(false)};
  },[flush,stop,token]);

  function start(){
    if(!consent||started)return;
    setError('');
    if(!window.isSecureContext){setError('Open the HTTPS version of this invitation to share precise location.');return}
    if(!navigator.geolocation){setError('This browser does not support location. Use another browser or request a manual interview below.');return}
    setBusy(true);setStarted(true);sessionId.current='screen-'+crypto.randomUUID();sequence.current=0;queue.current=[];
    watchId.current=navigator.geolocation.watchPosition(position=>{
      const c=position.coords,observation:Observation={
        id:crypto.randomUUID(),sequence_number:sequence.current++,lat:c.latitude,lng:c.longitude,accuracy:c.accuracy,
        altitude:c.altitude,altitude_accuracy:c.altitudeAccuracy,heading:c.heading,speed:c.speed,recorded_at:position.timestamp
      };
      queue.current.push(observation);
      if(queue.current.length>100)queue.current=queue.current.slice(-100);
      setLast({accuracy:c.accuracy,receivedAt:Date.now()});
      setBusy(false);
      if(sequence.current===1||queue.current.length>=10)void flush();
    },event=>{
      setBusy(false);
      if(event.code===1){
        stop(true);
        setError('Location permission was denied. Allow precise location in your browser’s site settings and retry, or request a manual interview.');
      }else if(event.code===2)setError('Your device cannot determine its location yet. Keep device location enabled and move near a window or outdoors; we will keep trying while the browser permits.');
      else setError('The device location request timed out. We will keep trying while this page remains open; move near a window or outdoors for a better fix.');
    },{enableHighAccuracy:true,maximumAge:0,timeout:20000});
    timer.current=setInterval(()=>void flush(),10000);
  }

  async function manual(){
    stop(false);setBusy(true);setError('');
    try{await post('/api/onboarding/'+token,{action:'manual_location_request',reason});setRequested(true)}
    catch(e){setError((e as Error).message)}
    finally{setBusy(false)}
  }

  if(started)return <section className={styles.locationMonitor} aria-live="polite">
    <div><strong>Precise location sharing is active</strong><span>{last?('Latest device fix ±'+Math.round(last.accuracy)+' m'):'Waiting for the first device fix'}{backgrounded?' · browser is backgrounded':''}</span></div>
    <p>Keep this screening page open for the strongest continuity. We keep requesting and saving device-reported coordinates while your browser and device allow it; backgrounding, screen lock or operating-system restrictions can interrupt updates.</p>
    <button type="button" className={styles.secondary} onClick={()=>stop(true)}>Stop sharing</button>
    {error&&<p role="status" className={styles.error}>{error}</p>}
  </section>;

  if(active&&!started)return null;

  return <section className={styles.checkIn} aria-labelledby="check-in-heading">
    <p className={styles.eyebrow}>BEFORE WE BEGIN · PROXIMITY CHECK</p>
    <h2 id="check-in-heading">Share where you are working from.</h2>
    <p><strong>We want to determine whether we already have prospects close to you.</strong> For independent agents, sharing precise device location can be advantageous because it can help Private Office identify nearby prospects, appointments or opportunities that may fit the area you can serve.</p>
    <p>With your consent, we will request the most precise location your device and browser can provide and continue collecting device-reported coordinates while this screening page and your device allow it. Browsers may throttle or pause location when backgrounded or when the screen locks, so this is best-effort rather than guaranteed background tracking.</p>
    <p>Only authorized Private Office reviewers can access this screening-location evidence. It is retained for up to 30 days, is not used in your expertise score, and does not guarantee that a nearby prospect will be assigned to you.</p>
    <label className={styles.declaration}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I agree to share my precise device location continuously during this screening for proximity matching and screening evidence. <a href="/privacy">Privacy notice</a></span></label>
    <button type="button" className={styles.primary} disabled={!consent||busy} onClick={start}>{busy?'Acquiring precise location…':'Start precise location sharing'}</button>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    <details className={styles.manual}><summary>Unable or prefer not to share location?</summary><p>Request a manual interview. Your saved answers remain available. The office must approve this alternative before online screening can continue.</p><label>Reason for manual interview<textarea value={reason} minLength={10} maxLength={600} onChange={e=>setReason(e.target.value)}/></label><button type="button" className={styles.secondary} disabled={busy||reason.trim().length<10} onClick={manual}>Request manual review</button>{requested&&<p role="status">Request saved. Contact the office representative who invited you, then reopen this invitation after approval.</p>}</details>
  </section>;
}
