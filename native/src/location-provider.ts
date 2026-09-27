// The native background service is intentionally disabled for this release.
// The web visit workflow requires foreground, explicit, session-bound sharing.
export type NativeLocation={lat:number;lng:number;accuracy:number;altitude:number|null;altitude_accuracy:number|null;heading:number|null;speed:number|null;simulated:boolean;recorded_at:number;source:'native'};
export class CapgoLocationProvider{
  async start(_mode:'engaged'|'visit',_onLocation:(p:NativeLocation)=>void,_onError:(e:Error&{code?:string})=>void){throw new Error('Native background collection is disabled. Use the foreground website visit workflow.');}
  async stop(){}
}
