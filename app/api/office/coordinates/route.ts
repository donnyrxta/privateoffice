import {db,getVisit,HttpError,json,owner,wrap} from '@/lib/server';

// Insertion cursors preserve delayed fixes and ties in device/server timestamps.
export async function GET(req:Request){return wrap(async()=>{
 const user=await owner(),q=new URL(req.url).searchParams,kind=q.get('kind'),id=q.get('id');
 if(!id||id.length>100||!['screening','visit'].includes(kind||''))throw new HttpError(400,'Choose a screening invitation or visit.');
 const cursor=(name:string)=>{const n=Number(q.get(name)||0);if(!Number.isSafeInteger(n)||n<0)throw new HttpError(400,'Invalid coordinate cursor.');return n};
 const after=cursor('after'),legacyAfter=cursor('legacy_after'),limit=Math.min(500,Math.max(1,cursor('limit')||500)),cutoff=Date.now()-30*86400000;
 if(kind==='visit'){const visit=await getVisit(id);if(visit.owner_id!==user.userId)throw new HttpError(403,'Visit not accessible.')}
 else if(!await db().prepare('SELECT id FROM agent_onboarding_invites WHERE id=?').bind(id).first())throw new HttpError(404,'Invitation not found.');
 const table=kind==='visit'?'points':'screening_location_observations',key=kind==='visit'?'visit_id':'invite_id';
 const rows=await db().prepare(`SELECT rowid AS cursor,* FROM ${table} WHERE ${key}=? AND rowid>? AND received_at>=? ORDER BY rowid LIMIT ?`).bind(id,after,cutoff,limit+1).all<Record<string,unknown>&{cursor:number}>();
 const legacy=kind==='screening'?await db().prepare("SELECT rowid AS cursor,* FROM screening_location_checks WHERE invite_id=? AND kind='location' AND rowid>? AND received_at>=? ORDER BY rowid LIMIT ?").bind(id,legacyAfter,cutoff,limit+1).all<Record<string,unknown>&{cursor:number}>():{results:[]};
 const page=rows.results.slice(0,limit),old=legacy.results.slice(0,limit);
 return json({rows:[...page.map(r=>({...r,source:kind})),...old.map(r=>({...r,source:'check-in'}))],next:{after:page.at(-1)?.cursor||after,legacy_after:old.at(-1)?.cursor||legacyAfter},has_more:rows.results.length>limit||legacy.results.length>limit,retention_days:30});
})}
