import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';

export type AgentUser={userId:string;displayName:string;email:string;fullName:string|null;username:string};
export const AGENT_COOKIE='po_agent_session';
export const AGENT_SESSION_MS=12*60*60*1000;
export const PASSWORD_ITERATIONS=210000;

const encoder=new TextEncoder();
function b64url(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function fromB64url(value:string){const s=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');const raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
function randomBytes(n:number){const a=new Uint8Array(n);crypto.getRandomValues(a);return a}
async function digest(value:string){const out=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)));return [...out].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function derive(password:string,salt:string,iterations:number){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return b64url(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:fromB64url(salt),iterations,hash:'SHA-256'},key,256)))}
function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
function cookieValue(raw:string|null,name:string){if(!raw)return null;for(const part of raw.split(';')){const i=part.indexOf('=');if(i<0)continue;if(part.slice(0,i).trim()===name)return decodeURIComponent(part.slice(i+1).trim())}return null}

export function normalizeAgentUsername(value:string){return value.trim().toLowerCase()}
export function generateAgentPassword(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_';const bytes=randomBytes(20);return [...bytes].map(b=>alphabet[b%alphabet.length]).join('')}
export async function passwordRecord(password:string){const salt=b64url(randomBytes(18));return {salt,hash:await derive(password,salt,PASSWORD_ITERATIONS),iterations:PASSWORD_ITERATIONS}}
export async function verifyPassword(password:string,row:{password_salt:string;password_hash:string;password_iterations:number}){const actual=await derive(password,row.password_salt,Number(row.password_iterations)||PASSWORD_ITERATIONS);return safeEqual(actual,row.password_hash)}

export async function newAgentSession(d1:D1Database,agentId:string){
  const token=b64url(randomBytes(32)),tokenHash=await digest(token),now=Date.now(),expires=now+AGENT_SESSION_MS;
  await d1.prepare('INSERT INTO agent_web_sessions (token_hash,agent_id,created_at,last_seen_at,expires_at) VALUES (?,?,?,?,?)').bind(tokenHash,agentId,now,now,expires).run();
  return {token,expires};
}
export function agentCookie(token:string,maxAgeSeconds=Math.floor(AGENT_SESSION_MS/1000)){return AGENT_COOKIE+'='+encodeURIComponent(token)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAgeSeconds}
export function clearAgentCookie(){return AGENT_COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'}
export async function currentAgentSessionToken(){const h=await headers();return cookieValue(h.get('cookie'),AGENT_COOKIE)}

export async function revokeCurrentAgentSession(){
  const d1=env.DB;if(!d1)return;
  const token=await currentAgentSessionToken();if(!token)return;
  await d1.prepare('UPDATE agent_web_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL').bind(Date.now(),await digest(token)).run();
}

export async function getAgentUser():Promise<AgentUser|null>{
  const d1=env.DB;if(!d1)return null;
  const token=await currentAgentSessionToken();if(!token)return null;
  try{
    const now=Date.now(),tokenHash=await digest(token);
    const row=await d1.prepare(`SELECT a.id,a.username,a.email,a.full_name,s.last_seen_at
      FROM agent_web_sessions s JOIN agent_accounts a ON a.id=s.agent_id
      WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND a.active=1`).bind(tokenHash,now).first<{id:string;username:string;email:string;full_name:string;last_seen_at:number}>();
    if(!row)return null;
    if(now-Number(row.last_seen_at)>300000)await d1.prepare('UPDATE agent_web_sessions SET last_seen_at=? WHERE token_hash=?').bind(now,tokenHash).run();
    return {userId:row.id,username:row.username,email:row.email,displayName:row.full_name,fullName:row.full_name};
  }catch(e){
    if(e instanceof Error&&/no such table/i.test(e.message))return null;
    throw e;
  }
}
