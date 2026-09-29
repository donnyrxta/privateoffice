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
  token,onReady,onStopped,onPending,active
}:{token:string;onReady:(state:LocationState)=>void;onStopped:()=>void;onPending:(count:number)=>void;active:boolean}){
  const [consent,setConsent]=useState(false),[started,setStarted]=useState(false),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[reason,setReason]=useState(''),[requested,setRequested]=useState(false);
  const [last,setLast]=useState<{accuracy:number;receivedAt:number}|null>(null),[pending,setPending]=useState(0);
  useEffect(()=>{onPending(pending)},[pending,onPending]);
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
      queue.current=queue.current.filter(o=>!done.has(o.id));setPending(queue.current.length);
      if(result.location.received_at&&result.location.accuracy!=null)setLast({accuracy:result.location.accuracy,receivedAt:result.location.received_at});
      if(watchId.current!==null&&(result.location.status==='acquired'||result.location.status==='manual_approved')){
        onReadyRef.current(result.location);
      }
      setError('');
    }catch(e){
      setError('Some updates haven't reached Private Office yet. Keep this page open and try sending them again. '+(e as Error).message);
    }finally{
      flushing.current=false;
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
    const leaving=(e:BeforeUnloadEvent)=>{if(queue.current.length){e.preventDefault();e.returnValue=''}};
    const visibility=()=>{if(document.hidden)stop(true)};
    const pagehide=()=>{
      stop(false);
      if(queue.current.length===0||!sessionId.current)return;
      const batch=queue.current.slice(0,25);
      try{
        fetch('/api/onboarding/'+token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
          action:'location_batch',consent:true,consent_version:CONSENT_VERSION,session_id:sessionId.current,observations:batch
        }),keepalive:true,credentials:'same-origin'});
      }catch{}
    };
    window.addEventListener('beforeunload',leaving);window.addEventListener('online',online);window.addEventListener('pagehide',pagehide);document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('beforeunload',leaving);window.removeEventListener('online',online);window.removeEventListener('pagehide',pagehide);document.removeEventListener('visibilitychange',visibility);stop(false)};
  },[flush,stop,token]);

  function start(){
    if(!consent||started||queue.current.length)return;
    setError('');
    if(!window.isSecureContext){setError('Open the HTTPS version of this invitation to share precise location.');return}
    if(!navigator.geolocation){setError('This browser does not support location. Use another browser or request a manual interview below.');return}
    setBusy(true);setStarted(true);sessionId.current='screen-'+crypto.randomUUID();sequence.current=0;queue.current=[];
    watchId.current=navigator.geolocation.watchPosition(position=>{
      if(document.hidden||watchId.current===null)return;
      const c=position.coords,observation:Observation={
        id:crypto.randomUUID(),sequence_number:sequence.current++,lat:c.latitude,lng:c.longitude,accuracy:c.accuracy,
        altitude:c.altitude,altitude_accuracy:c.altitudeAccuracy,heading:c.heading,speed:c.speed,recorded_at:position.timestamp
      };
      queue.current.push(observation);
      setPending(queue.current.length);
      if(queue.current.length>=100){stop(true);setError('Sharing paused: 100 updates are still waiting to send. Try sending the unsent updates before resuming. Nothing has been lost.');void flush();return}
      setLast({accuracy:c.accuracy,receivedAt:Date.now()});
      setBusy(false);
      if(sequence.current===1||queue.current.length>=10)void flush();
    },event=>{
      setBusy(false);
      if(event.code===1){
        stop(true);
        setError('Location sharing is turned off for this site. You can allow it in your browser settings and try again, or request a manual interview.');
      }else if(event.code===2)setError('We haven't found your location yet. Keep location enabled and move near a window or outdoors; we'll keep trying while the page is open.');
      else setError('Finding your location is taking longer than expected. Keep this page open and move near a window or outdoors if you can.');
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
    <div><strong>Working area sharing is on</strong><span>{last?('Latest update ±'+Math.round(last.accuracy)+' m'):'Waiting for the first device fix'}{' · '+pending+' awaiting upload'}</span></div>
    <p>Location updates are sent while this page stays open. Sharing pauses if you hide or leave the page, and you choose when to resume.</p>
    <button type="button" className={styles.secondary} onClick={()=>stop(true)}>Stop sharing</button>
    {error&&<p role="status" className={styles.error}>{error}</p>}
  </section>;

  if(active&&!started&&pending===0)return null;

  return <section className={styles.checkIn} aria-labelledby="check-in-heading">
    <p className={styles.eyebrow}>BEFORE WE BEGIN · WORKING AREA</p>
    <h2 id="check-in-heading">Share where you are working from.</h2>
    <p><strong>We'd like to see if there are already prospects near you.</strong> For independent agents, sharing your working area can be useful because it helps Private Office match you with nearby prospects, appointments or opportunities that fit the area you serve.</p>
    <p>With your consent, we'll use your location while this page stays open to help suggest nearby matches. Sharing pauses if you hide or close the page, switch apps, or lock your screen.</p>
    <p>Only our small review team can see this, solely to support nearby matching. It is deleted after 30 days, never affects how we view your experience, and does not guarantee a nearby prospect will be assigned to you.</p>
    <label className={styles.declaration}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I agree to share my location during this screening to help match me with nearby opportunities. <a href="/privacy">Privacy notice</a></span></label>
    <button type="button" className={styles.primary} disabled={!consent||busy||pending>0} onClick={start}>{busy?'Finding your area…':'Share my working area'}</button>
    {pending>0&&<p role="status">{pending} updates are still sending. Keep this page open until they finish. <button type="button" className={styles.secondary} onClick={()=>void flush()}>Retry unsent updates</button></p>}
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    <details className={styles.manual}><summary>Unable or prefer not to share location?</summary><p>Request a manual interview instead. Your saved answers are kept, and we'll confirm with you before you continue online.</p><label>Reason for manual interview<textarea value={reason} minLength={10} maxLength={600} onChange={e=>setReason(e.target.value)}/></label><button type="button" className={styles.secondary} disabled={busy||reason.trim().length<10} onClick={manual}>Request manual review</button>{requested&&<p role="status">Request saved. Contact the office representative who invited you, then reopen this invitation after approval.</p>}</details>
  </section>;
}
