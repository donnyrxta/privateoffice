export type QualityClass='excellent'|'good'|'usable'|'low'|'very_low';
export function qualityFromAccuracy(accuracy:number):QualityClass{return accuracy<=10?'excellent':accuracy<=25?'good':accuracy<=75?'usable':accuracy<=200?'low':'very_low'}
export function qualityLabel(q:QualityClass|string|undefined){return ({excellent:'Excellent',good:'Good',usable:'Usable',low:'Low',very_low:'Very low'} as Record<string,string>)[q||'']||'Unknown'}
export function canonicalJson(value:unknown):string{
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']';
  const record=value as Record<string,unknown>;
  return '{'+Object.keys(record).sort().map(k=>JSON.stringify(k)+':'+canonicalJson(record[k])).join(',')+'}';
}
export function base64url(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
export function fromBase64url(value:string){const s=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');const raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
