'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {LockKeyhole} from 'lucide-react';
import {post} from '@/lib/client';

type Fix={lat:number;lng:number;accuracy:number;recorded_at:number};
const REQUIRED=25,POST_EVERY=15000,STALE=60000;

export default function AgentPresenceGuard(){
  const path=usePathname(),lastFix=useRef<Fix|null>(null),lastSent=useRef(Date.now()),watch=useRef<number|null>(null),sending=useRef(false),[locking,setLocking]=useState(false);

  function relock(){if(locking)return;setLocking(true);location.replace('/agent/location')}

  async function send(fix:Fix,force=false){
    if(fix.accuracy>REQUIRED){relock();return}
    const now=Date.now();if(!force&&now-lastSent.current<POST_EVERY)return;
    if(sending.current)return;sending.current=true;
    const duration=Math.min(60000,Math.max(0,now-lastSent.current));
    try{await post('/api/agent/presence',{...fix,path,duration_ms:duration});lastSent.current=now}
    catch(e){const err=e as Error&{code?:string,status?:number};if(err.code==='LOCATION_REQUIRED'||err.code==='PRECISION_REQUIRED'||err.status===401||err.status===428)relock()}
    finally{sending.current=false}
  }

  useEffect(()=>{
    function success(p:GeolocationPosition){const fix={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,recorded_at:p.timestamp};lastFix.current=fix;void send(fix)}
    function failure(){relock()}
    watch.current=navigator.geolocation.watchPosition(success,failure,{enableHighAccuracy:true,maximumAge:0,timeout:30000});
    const timer=setInterval(()=>{
      const fix=lastFix.current,now=Date.now();
      if(!fix||now-fix.recorded_at>STALE){navigator.geolocation.getCurrentPosition(success,failure,{enableHighAccuracy:true,maximumAge:0,timeout:15000});return}
      void send(fix);
    },5000);
    const visibility=()=>{if(document.visibilityState==='visible'){const fix=lastFix.current;if(fix&&Date.now()-fix.recorded_at<STALE)void send(fix,true);else navigator.geolocation.getCurrentPosition(success,failure,{enableHighAccuracy:true,maximumAge:0,timeout:15000})}};
    document.addEventListener('visibilitychange',visibility);
    return()=>{if(watch.current!==null)navigator.geolocation.clearWatch(watch.current);clearInterval(timer);document.removeEventListener('visibilitychange',visibility)};
  },[path]);

  useEffect(()=>{const fix=lastFix.current;if(fix)void send(fix,true)},[path]);

  return locking?<div className="agent-relock-overlay"><LockKeyhole size={28}/><strong>Precise location required</strong><span>Re-verifying this session…</span></div>:null;
}
