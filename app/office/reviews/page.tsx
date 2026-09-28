import {owner} from '@/lib/server';
import AgentReviews from '@/components/agent-reviews';
import OfficeAccessPanel from '@/components/office-access-panel';
export const dynamic='force-dynamic';
export default async function Page(){try{await owner()}catch{return <OfficeAccessPanel mode="denied"/>}return <AgentReviews/>}
