'use client';
import {useEffect,useRef,useState} from 'react';
import {post} from '@/lib/client';
import styles from './agent-onboarding.module.css';
type LocationState={status:string;accuracy:number|null;received_at:number|null};
export default function ScreeningCheckIn({token,onReady}:{token:string;onReady:(state:LocationState)=>void}){
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reason,setReason]=useState(''),[requested,setRequested]=useState(false);
 const generation=useRef(0);
 useEffect(()=>{const invalidate=()=>{generation.current++};const stop=()=>{if(document.hidden){generation.current++;setBusy(false);setError('Location check paused. Return and choose Check my location to try again.')}};document.addEventListener('visibilitychange',stop);return()=>{invalidate();document.removeEventListener('visibilitychange',stop)}},[]);
 async function check(){
  if(!consent)return;
  setError('');
  if(!window.isSecureContext){setError('Open the HTTPS version of this invitation to use location.');return}
  if(!navigator.geolocation){setError('This browser does not support location. Use another browser or request a manual interview below.');return}
  setBusy(true);const attempt=++generation.current;
  navigator.geolocation.getCurrentPosition(async position=>{
   if(attempt!==generation.current||document.hidden)return;
   try{const c=position.coords;const result=await post('/api/onboarding/'+token,{action:'location',consent:true,consent_version:'2026-09-28.screening.v1',lat:c.latitude,lng:c.longitude,accuracy:c.accuracy,recorded_at:position.timestamp}) as {location:LocationState};
    if(attempt!==generation.current)return;
    if(result.location.status!=='acquired'&&result.location.status!=='manual_approved'){setError(`The device reported ±${Math.round(c.accuracy)} m. Move near a window or outdoors and retry; screening needs 100 m accuracy or better, or manual review.`)}else onReady(result.location);
   }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  },e=>{if(attempt!==generation.current)return;setBusy(false);setError(e.code===1?'Location permission was denied. Allow location in your browser’s site settings and retry, or request a manual interview.':e.code===2?'Your device could not determine its location. Enable device location, move to a clearer area and retry.':'The location check timed out. Retry near a window or request a manual interview.');},{enableHighAccuracy:true,maximumAge:0,timeout:15000});
 }
 async function manual(){setBusy(true);setError('');try{await post('/api/onboarding/'+token,{action:'manual_location_request',reason});setRequested(true)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className={styles.checkIn} aria-labelledby="check-in-heading"><p className={styles.eyebrow}>BEFORE WE BEGIN · PRIVATE CHECK-IN</p><h2 id="check-in-heading">Where are you joining us from?</h2><p>Share a device location to accompany your screening. Only you and the authorized office reviewer can access this evidence. It is retained for up to 30 days and does not affect your expertise score.</p><p>This is a single check-in, repeated before submission or after 15 minutes. It does not run continuously or in the background. The device reports an accuracy radius; this is not independent proof of your physical location.</p><label className={styles.declaration}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I agree to share my location for this screening check-in. <a href="/privacy">Privacy notice</a></span></label><button type="button" className={styles.primary} disabled={!consent||busy} onClick={check}>{busy?'Checking…':'Check my location'}</button>{error&&<p role="alert" className={styles.error}>{error}</p>}<details className={styles.manual}><summary>Unable or prefer not to share location?</summary><p>Request a manual interview. Your saved answers remain available. The office must approve this alternative before online screening can continue.</p><label>Reason for manual interview<textarea value={reason} minLength={10} maxLength={600} onChange={e=>setReason(e.target.value)}/></label><button type="button" className={styles.secondary} disabled={busy||reason.trim().length<10} onClick={manual}>Request manual review</button>{requested&&<p role="status">Request saved. Contact the office representative who invited you, then reopen this invitation after approval.</p>}</details></section>;
}
