'use client';

import {useEffect,useRef,useState} from 'react';
import {Crosshair,Pause,Play,ShieldCheck} from 'lucide-react';
import {Header} from './landing';

type Sample={
  lat:number;
  lng:number;
  accuracy:number;
  altitude:number|null;
  altitudeAccuracy:number|null;
  heading:number|null;
  speed:number|null;
  timestamp:number;
};

function fromPosition(p:GeolocationPosition):Sample{
  return {
    lat:p.coords.latitude,
    lng:p.coords.longitude,
    accuracy:p.coords.accuracy,
    altitude:p.coords.altitude,
    altitudeAccuracy:p.coords.altitudeAccuracy,
    heading:p.coords.heading,
    speed:p.coords.speed,
    timestamp:p.timestamp,
  };
}

function geolocationError(e:GeolocationPositionError){
  if(e.code===1)return 'PERMISSION_DENIED';
  if(e.code===2)return 'POSITION_UNAVAILABLE';
  if(e.code===3)return 'TIMEOUT';
  return 'UNKNOWN';
}

export default function LocationDiagnostics(){
  const[supported,setSupported]=useState(false);
  const[secure,setSecure]=useState(false);
  const[permission,setPermission]=useState('unknown');
  const[sample,setSample]=useState<Sample|null>(null);
  const[samples,setSamples]=useState<Sample[]>([]);
  const[status,setStatus]=useState('idle');
  const[error,setError]=useState('');
  const watchId=useRef<number|null>(null);

  useEffect(()=>{
    setSupported(typeof navigator!=='undefined'&&!!navigator.geolocation);
    setSecure(typeof window!=='undefined'&&window.isSecureContext);
    let alive=true;
    const permissions=(navigator as Navigator & {permissions?:Permissions}).permissions;
    if(permissions?.query){
      permissions.query({name:'geolocation'} as PermissionDescriptor).then(p=>{
        if(!alive)return;
        setPermission(p.state);
        p.onchange=()=>setPermission(p.state);
      }).catch(()=>{});
    }
    return()=>{alive=false;if(watchId.current!==null)navigator.geolocation?.clearWatch(watchId.current)};
  },[]);

  function accept(p:GeolocationPosition){
    const next=fromPosition(p);
    setSample(next);
    setSamples(rows=>[next,...rows].slice(0,12));
    setStatus('fix_received');
    setError('');
  }

  function fail(e:GeolocationPositionError){
    setStatus('error');
    setError(geolocationError(e)+' ('+e.code+'): '+(e.message||'No browser message'));
  }

  function oneFix(){
    setError('');
    setStatus('acquiring');
    if(!window.isSecureContext){setError('INSECURE_CONTEXT: geolocation requires HTTPS.');setStatus('error');return}
    if(!navigator.geolocation){setError('UNSUPPORTED: navigator.geolocation is unavailable in this browser.');setStatus('error');return}
    navigator.geolocation.getCurrentPosition(
      accept,
      fail,
      {enableHighAccuracy:true,maximumAge:0,timeout:30000}
    );
  }

  function startWatch(){
    setError('');
    if(!window.isSecureContext){setError('INSECURE_CONTEXT: geolocation requires HTTPS.');setStatus('error');return}
    if(!navigator.geolocation){setError('UNSUPPORTED: navigator.geolocation is unavailable in this browser.');setStatus('error');return}
    if(watchId.current!==null)navigator.geolocation.clearWatch(watchId.current);
    setStatus('watching');
    watchId.current=navigator.geolocation.watchPosition(
      p=>{accept(p);setStatus('watching')},
      fail,
      {enableHighAccuracy:true,maximumAge:0,timeout:30000}
    );
  }

  function stopWatch(){
    if(watchId.current!==null)navigator.geolocation.clearWatch(watchId.current);
    watchId.current=null;
    setStatus('stopped');
  }

  return <>
    <Header/>
    <main className="app-main location-diagnostic">
      <div className="app-title">
        <div>
          <p className="eyebrow">PRIVATE OFFICE · LOCATION DIAGNOSTIC</p>
          <h1>Can this device acquire a location fix?</h1>
          <p className="muted">This page tests the browser location provider only. Nothing from this diagnostic is uploaded or written to D1.</p>
        </div>
      </div>

      <section className="panel diagnostic-status">
        <div><span>Secure context</span><strong>{secure?'YES':'NO'}</strong></div>
        <div><span>Geolocation API</span><strong>{supported?'AVAILABLE':'UNAVAILABLE'}</strong></div>
        <div><span>Permission</span><strong>{permission.toUpperCase()}</strong></div>
        <div><span>Acquisition state</span><strong>{status.toUpperCase()}</strong></div>
      </section>

      <div className="actions section-gap">
        <button className="button" onClick={oneFix}><Crosshair size={18}/>Acquire one high-accuracy fix</button>
        <button className="button" onClick={startWatch}><Play size={18}/>Start continuous watch</button>
        <button className="button outline" onClick={stopWatch}><Pause size={18}/>Stop watch</button>
      </div>

      {error&&<p className="error section-gap" role="alert">{error}</p>}

      <div className="two-col section-gap">
        <section className="panel">
          <p className="eyebrow">LATEST RAW FIX</p>
          {sample?<dl className="diagnostic-fix">
            <div><dt>Latitude</dt><dd className="mono">{sample.lat.toFixed(7)}</dd></div>
            <div><dt>Longitude</dt><dd className="mono">{sample.lng.toFixed(7)}</dd></div>
            <div><dt>Reported accuracy</dt><dd>±{Math.round(sample.accuracy)} m</dd></div>
            <div><dt>Provider timestamp</dt><dd>{new Date(sample.timestamp).toISOString()}</dd></div>
            <div><dt>Altitude</dt><dd>{sample.altitude===null?'Not supplied':sample.altitude.toFixed(1)+' m'}</dd></div>
            <div><dt>Altitude accuracy</dt><dd>{sample.altitudeAccuracy===null?'Not supplied':'±'+Math.round(sample.altitudeAccuracy)+' m'}</dd></div>
            <div><dt>Heading</dt><dd>{sample.heading===null?'Not supplied':Math.round(sample.heading)+'°'}</dd></div>
            <div><dt>Speed</dt><dd>{sample.speed===null?'Not supplied':sample.speed.toFixed(2)+' m/s'}</dd></div>
          </dl>:<div className="empty diagnostic-empty">No fix received yet.</div>}
        </section>

        <section className="panel">
          <p className="eyebrow">WHAT THIS TEST PROVES</p>
          <div className="diagnostic-explainer">
            <p><strong>If a fix appears here:</strong> browser acquisition works. Any missing agent/client location is then downstream — authentication, visit state, queueing, upload, D1 projection, or UI.</p>
            <p><strong>If this times out or says POSITION_UNAVAILABLE:</strong> the problem is at the browser/OS location-provider layer.</p>
            <p><strong>If permission is denied:</strong> re-enable location permission for this site in the browser and operating system.</p>
            <p><ShieldCheck size={16}/> This page never calls a Private Office API with the coordinates.</p>
          </div>
        </section>
      </div>

      {samples.length>0&&<section className="panel section-gap">
        <p className="eyebrow">RECENT FIXES · DEVICE ONLY</p>
        <div className="diagnostic-table-wrap">
          <table className="diagnostic-table">
            <thead><tr><th>Time</th><th>Latitude</th><th>Longitude</th><th>Accuracy</th></tr></thead>
            <tbody>{samples.map((p,i)=><tr key={p.timestamp+'-'+i}><td>{new Date(p.timestamp).toLocaleTimeString()}</td><td className="mono">{p.lat.toFixed(7)}</td><td className="mono">{p.lng.toFixed(7)}</td><td>±{Math.round(p.accuracy)} m</td></tr>)}</tbody>
          </table>
        </div>
      </section>}
    </main>
  </>;
}
