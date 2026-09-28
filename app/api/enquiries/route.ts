import {body,db,json,wrap,str,rate,hash,HttpError} from '@/lib/server';
export async function POST(req:Request){return wrap(async()=>{
  const b=await body(req);
  if(b.website)return json({ok:true});
  if(b.consent!==true)throw new HttpError(400,'Please agree to be contacted.');
  const name=str(b.name,100),contact=str(b.contact,160,5),interest=str(b.interest,2000);
  if(!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)||/^\+?[\d\s().-]{7,30}$/.test(contact)))throw new HttpError(400,'Please enter a valid email address or telephone number.');
  const requestType=b.request_type?str(b.request_type,80):'Private property brief';
  const timeframe=b.timeframe?str(b.timeframe,80):'Not specified';
  await rate('enquiry:'+await hash(req.headers.get('cf-connecting-ip')||'unknown'),5,3600000);
  const reference=crypto.randomUUID();
  await db().prepare('INSERT INTO enquiries (id,name,contact,interest,created_at,status) VALUES (?,?,?,?,?,?)').bind(reference,name,contact,`${requestType} · ${timeframe}\n${interest}`,Date.now(),'new').run();
  return json({ok:true,reference},201);
})}
