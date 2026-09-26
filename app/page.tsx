import {redirect} from 'next/navigation';
import Landing from '@/components/landing';
import {getAgentSession,hasFreshPreciseLocation} from '@/lib/agent-auth';
export const dynamic='force-dynamic';
export default async function Home(){const session=await getAgentSession();if(session)redirect(hasFreshPreciseLocation(session)?'/residences':'/agent/location');return <Landing/>}
