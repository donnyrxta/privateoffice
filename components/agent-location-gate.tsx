'use client';
import {useEffect,useRef,useState} from 'react';
import {Crosshair,LockKeyhole,LogOut,ShieldCheck} from 'lucide-react';
import {Brand} from './landing';
import {post} from '@/lib/client';

type Fix={lat:number;lng:number;accuracy:number;recorded_at:number};
const REQUIRED=25;

export default function AgentLocationGate({name}:{name:string}){
  const[status,setStatus]=useState<'starting'|'acquiring'|'too_wide'|'error'>('starting'),[fix,setFix]=useState<Fix|null>(null),[error,setError]=useState('');
  const watch=useRef<number|null>(null),sending=useRef(false);

  async function submitFix(next:Fix){
    if(sending.current||next.accuracy>REQUIRED)return;
    sending.current=true;
    try{await post('/api/agent/presence',{...next,path:'/agent/location',duration_ms:0});location.replace('/residences')}
    catch(e){const err=e as Error&{code?:string};if(err.code==='PRECISION_REQUIRED'){sending.current=false;setStatus('too_wide');return}setError(err.message);setStatus('error');sending.current=false}
  }

  function start(){
    setError('');setStatus('acquiring');
    if(!window.isSecureContext){setError('Private Office needs a secure HTTPS connection for location verification.');setStatus('error');return}
    if(!navigator.geolocation){setError('This browser does not expose device location.');setStatus('error');return}
    if(watch.current!==null)navigator.geolocation.clearWatch(watch.current);
    watch.current=navigator.geolocation.watchPosition(p=>{
      const next={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,recorded_at:p.timestamp};
      setFix(next);
      if(next.accuracy<=REQUIRED){setStatus('acquiring');void submitFix(next)}else setStatus('too_wide');
    },e=>{setError(e.code===1?'Precise location permission is required to enter Private Office.':e.code===2?'The device cannot provide a location fix yet.':'Private Office is still waiting for a fresh location fix.');setStatus('error')},{enableHighAccuracy:true,maximumAge:0,timeout:30000});
  }

  useEffect(()=>{start();return()=>{if(watch.current!==null)navigator.geolocation.clearWatch(watch.current)}},[]);
  async function logout(){try{await fetch('/api/agent/logout',{method:'POST'})}finally{location.assign('/')}}

  return <main className="location-gate">
    <div className="location-gate-top"><Brand/><button onClick={logout} className="location-gate-signout"><LogOut size={15}/>Sign out</button></div>
    <section className="location-gate-copy">
      <p className="eyebrow">IDENTITY CONFIRMED · LOCATION REQUIRED</p>
      <h1>Good evening, {name.split(' ')[0]}.<br/><em>Verify where you are working from.</em></h1>
      <p>Private Office opens only after this device supplies a fresh precise fix. The access threshold is ±{REQUIRED} m or better.</p>
      <div className="location-gate-status">
        <div><span>AUTHENTICATION</span><strong><ShieldCheck size={16}/>VERIFIED</strong></div>
        <div><span>LOCATION</span><strong><Crosshair size={16}/>{fix?'±'+Math.round(fix.accuracy)+' m':status==='acquiring'?'ACQUIRING':'REQUIRED'}</strong></div>
        <div><span>ACCESS</span><strong><LockKeyhole size={16}/>{fix&&fix.accuracy<=REQUIRED?'VERIFYING':'LOCKED'}</strong></div>
      </div>
      {status==='too_wide'&&<p className="location-gate-note">Fix received, but not precise enough yet. Keep the phone’s precise-location setting enabled while Private Office improves the fix.</p>}
      {error&&<p className="error location-gate-note" role="alert">{error}</p>}
      {status==='error'&&<button className="button light" onClick={start}>Try location again <Crosshair size={18}/></button>}
    </section>
    <div className="location-gate-foot">Your portfolio and client workspace remain unavailable until location verification succeeds.</div>
  </main>
}
