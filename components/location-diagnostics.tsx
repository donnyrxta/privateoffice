'use client';

import {useEffect,useRef,useState} from 'react';
import {Crosshair,Pause,Play,ShieldCheck} from 'lucide-react';
import {Header} from './landing';
import DiagnosticMap from './diagnostic-map';

type Sample={
  lat:number;lng:number;accuracy:number;altitude:number|null;altitudeAccuracy:number|null;heading:number|null;speed:number|null;timestamp:number;
};

function fromPosition(p:GeolocationPosition):Sample{
  return {lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,altitude:p.coords.altitude,altitudeAccuracy:p.coords.altitudeAccuracy,heading:p.coords.heading,speed:p.coords.speed,timestamp:p.timestamp};
}

function geolocationError(e:GeolocationPositionError){
  if(e.code===1)return 'PERMISSION_DENIED';
  if(e.code===2)return 'POSITION_UNAVAILABLE';
  if(e.code===3)return 'TIMEOUT';
  return 'UNKNOWN';
}

export default function LocationDiagnostics(){
  const[supported,setSupported]=useState(false),[secure,setSecure]=useState(false),[permission,setPermission]=useState('unknown'),[sample,setSample]=useState<Sample|null>(null),[samples,setSamples]=useState<Sample[]>([]),[status,setStatus]=useState('idle'),[error,setError]=useState('');
  const watchId=useRef<number|null>(null);

  useEffect(()=>{
    setSupported(!!navigator.geolocation);setSecure(window.isSecureContext);
    let alive=true;
    const permissions=(navigator as Navigator & {permissions?:Permissions}).permissions;
    if(permissions?.query)permissions.query({name:'geolocation'} as PermissionDescriptor).then(p=>{if(!alive)return;setPermission(p.state);p.onchange=()=>setPermission(p.state)}).catch(()=>{});
    return()=>{alive=false;if(watchId.current!==null)navigator.geolocation?.clearWatch(watchId.current)};
  },[]);

  function accept(p:GeolocationPosition){const next=fromPosition(p);setSample(next);setSamples(rows=>[next,...rows].slice(0,20));setStatus('fix_received');setError('')}
  function fail(e:GeolocationPositionError){setStatus('error');setError(geolocationError(e)+' ('+e.code+'): '+(e.message||'No browser message'))}
  function guard(){if(!window.isSecureContext){setError('INSECURE_CONTEXT: geolocation requires HTTPS.');setStatus('error');return false}if(!navigator.geolocation){setError('UNSUPPORTED: navigator.geolocation is unavailable in this browser.');setStatus('error');return false}return true}
  function oneFix(){setError('');setStatus('acquiring');if(!guard())return;navigator.geolocation.getCurrentPosition(accept,fail,{enableHighAccuracy:true,maximumAge:0,timeout:30000})}
  function startWatch(){setError('');if(!guard())return;if(watchId.current!==null)navigator.geolocation.clearWatch(watchId.current);setStatus('watching');watchId.current=navigator.geolocation.watchPosition(p=>{accept(p);setStatus('watching')},fail,{enableHighAccuracy:true,maximumAge:0,timeout:30000})}
  function stopWatch(){if(watchId.current!==null)navigator.geolocation.clearWatch(watchId.current);watchId.current=null;setStatus('stopped')}

  return <><Header/><main className="app-main location-diagnostic">
    <div className="app-title"><div><p className="eyebrow">PRIVATE OFFICE · LOCATION TEST</p><h1>Test the device fix directly.</h1><p className="muted">This bypasses visits, authentication, signing and D1. It asks this browser for location and displays the result on-device only.</p></div></div>

    <section className="panel diagnostic-status">
      <div><span>SECURE CONTEXT</span><strong>{secure?'YES':'NO'}</strong></div>
      <div><span>GEOLOCATION API</span><strong>{supported?'AVAILABLE':'UNAVAILABLE'}</strong></div>
      <div><span>PERMISSION</span><strong>{permission.toUpperCase()}</strong></div>
      <div><span>ACQUISITION</span><strong>{status.toUpperCase()}</strong></div>
    </section>

    <div className="actions section-gap">
      <button className="button" onClick={oneFix}><Crosshair size={18}/>Acquire one precise fix</button>
      <button className="button" onClick={startWatch}><Play size={18}/>Start continuous watch</button>
      <button className="button outline" onClick={stopWatch}><Pause size={18}/>Stop watch</button>
    </div>

    {error&&<p className="error section-gap" role="alert">{error}</p>}

    <section className="diagnostic-visual section-gap">
      <DiagnosticMap fix={sample?{lat:sample.lat,lng:sample.lng,accuracy:sample.accuracy,timestamp:sample.timestamp}:null}/>
      <div className="panel diagnostic-fix-panel">
        <p className="eyebrow">LATEST DEVICE FIX</p>
        {sample?<dl className="diagnostic-fix">
          <div><dt>Latitude</dt><dd className="mono">{sample.lat.toFixed(7)}</dd></div>
          <div><dt>Longitude</dt><dd className="mono">{sample.lng.toFixed(7)}</dd></div>
          <div><dt>Reported accuracy</dt><dd>±{Math.round(sample.accuracy)} m</dd></div>
          <div><dt>Provider timestamp</dt><dd>{new Date(sample.timestamp).toISOString()}</dd></div>
          <div><dt>Altitude</dt><dd>{sample.altitude===null?'Not supplied':sample.altitude.toFixed(1)+' m'}</dd></div>
          <div><dt>Heading</dt><dd>{sample.heading===null?'Not supplied':Math.round(sample.heading)+'°'}</dd></div>
          <div><dt>Speed</dt><dd>{sample.speed===null?'Not supplied':sample.speed.toFixed(2)+' m/s'}</dd></div>
        </dl>:<div className="empty diagnostic-empty">No fix received yet.</div>}
        <p className="diagnostic-local-only"><ShieldCheck size={16}/> Coordinates on this test page are not submitted to a Private Office API.</p>
      </div>
    </section>

    <section className="diagnostic-reading section-gap">
      <p><strong>A fix appears here:</strong> acquisition works; test the signed visit pipeline next.</p>
      <p><strong>PERMISSION_DENIED:</strong> site or OS permission is blocking acquisition.</p>
      <p><strong>POSITION_UNAVAILABLE or TIMEOUT:</strong> the browser has not obtained a fresh position from the device provider.</p>
    </section>

    {samples.length>0&&<section className="panel section-gap"><p className="eyebrow">RECENT FIXES · DEVICE ONLY</p><div className="diagnostic-table-wrap"><table className="diagnostic-table"><thead><tr><th>Time</th><th>Latitude</th><th>Longitude</th><th>Accuracy</th></tr></thead><tbody>{samples.map((p,i)=><tr key={p.timestamp+'-'+i}><td>{new Date(p.timestamp).toLocaleTimeString()}</td><td className="mono">{p.lat.toFixed(7)}</td><td className="mono">{p.lng.toFixed(7)}</td><td>±{Math.round(p.accuracy)} m</td></tr>)}</tbody></table></div></section>}
  </main></>
}
