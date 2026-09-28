import {json} from '@/lib/server';
// The retired browsing gate must never accept background/page-location data.
export async function GET(){return json({location_required:false,message:'Location is requested only when an agent starts an assigned visit.'})}
export async function POST(){return json({error:'Browsing location collection has been retired. Start an assigned visit to share location.',code:'PRESENCE_RETIRED'},410)}
