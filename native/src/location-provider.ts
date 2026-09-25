import {BackgroundGeolocation} from '@capgo/background-geolocation';
export type NativeLocation={lat:number;lng:number;accuracy:number;altitude:number|null;altitude_accuracy:number|null;heading:number|null;speed:number|null;simulated:boolean;recorded_at:number;source:'native'};
export class CapgoLocationProvider{
  private running=false;
  async start(mode:'engaged'|'visit',onLocation:(p:NativeLocation)=>void,onError:(e:Error&{code?:string})=>void){
    if(this.running)await this.stop();
    await BackgroundGeolocation.start({
      backgroundTitle:'Private Office',
      backgroundMessage:mode==='visit'?'Customer visit location sharing is active.':'Private Office security session is active.',
      requestPermissions:true,
      stale:false,
      distanceFilter:mode==='visit'?0:25,
      minIntervalMs:mode==='visit'?5000:30000
    },(p,e)=>{
      if(e){onError(e);return}if(!p)return;
      onLocation({lat:p.latitude,lng:p.longitude,accuracy:p.accuracy,altitude:p.altitude??null,altitude_accuracy:p.altitudeAccuracy??null,heading:p.bearing??null,speed:p.speed??null,simulated:p.simulated===true,recorded_at:p.time??Date.now(),source:'native'});
    });
    this.running=true;
  }
  async stop(){if(!this.running)return;await BackgroundGeolocation.stop();this.running=false}
}
