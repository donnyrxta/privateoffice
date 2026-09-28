'use client';
export type LocationSample={lat:number;lng:number;accuracy:number;altitude:number|null;altitude_accuracy:number|null;heading:number|null;speed:number|null;simulated:boolean;recorded_at:number;source:'browser'|'native'};
export type ProviderMode='engaged'|'visit';
export interface LocationProvider{start(mode:ProviderMode,onPosition:(p:LocationSample)=>void,onError:(e:Error&{code?:number|string})=>void):Promise<void>;stop():Promise<void>;kind:string}
function sample(p:GeolocationPosition):LocationSample{return {lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,altitude:p.coords.altitude,altitude_accuracy:p.coords.altitudeAccuracy,heading:p.coords.heading,speed:p.coords.speed,simulated:false,recorded_at:p.timestamp,source:'browser'}}
export function locationError(error:unknown):Error{
  const e=error as {code?:number|string;message?:string};
  const message=e?.code===1?'Location permission was denied. Enable location for this site in browser settings, or contact the office to coordinate by phone.':e?.code===2?'Your device cannot determine its location. Turn on device location, move near a window or outdoors, then retry.':e?.code===3?'The location request timed out. Check device location and retry, or coordinate with the office by phone.':e?.message||'Location is unavailable. Please retry or contact the office.';
  return Object.assign(new Error(message),{code:e?.code});
}
function assertAvailable(){if(!window.isSecureContext)throw new Error('Location requires a secure HTTPS connection. Open the secure site and retry.');if(!navigator.geolocation)throw new Error('This browser does not support location. Use a supported browser or coordinate by phone.');if(document.visibilityState!=='visible')throw new Error('Keep this visit page visible while sharing location.');}
export class BrowserLocationProvider implements LocationProvider{
  kind='browser';private watch:number|null=null;private generation=0;private wake:WakeLockSentinel|null=null;
  async start(mode:ProviderMode,onPosition:(p:LocationSample)=>void,onError:(e:Error&{code?:number|string})=>void){
    await this.stop();assertAvailable();if(mode!=='visit')throw new Error('Location collection requires an active visit.');
    const generation=++this.generation;
    this.watch=navigator.geolocation.watchPosition(p=>{if(generation===this.generation&&document.visibilityState==='visible')onPosition(sample(p));},e=>{if(generation===this.generation)onError(locationError(e));},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
    document.addEventListener('visibilitychange',this.visibility);
    try{this.wake=await navigator.wakeLock?.request('screen');if(generation!==this.generation)await this.wake?.release();}catch{}
  }
  private visibility=()=>{if(document.visibilityState==='hidden')this.stop().catch(()=>{});};
  async stop(){this.generation++;if(this.watch!==null)navigator.geolocation?.clearWatch(this.watch);this.watch=null;document.removeEventListener('visibilitychange',this.visibility);try{await this.wake?.release();}catch{}this.wake=null;}
}
export async function probeBrowserLocation(){assertAvailable();try{const p=await new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,maximumAge:0,timeout:20000}));assertAvailable();return sample(p);}catch(e){throw locationError(e);}}
