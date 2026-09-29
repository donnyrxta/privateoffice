import {redirect} from 'next/navigation';
import {getAgentSession} from './agent-auth';
export async function requirePortfolioAgent(){
 const session=await getAgentSession();
 if(!session)redirect('/agent/sign-in');
 return session.user;
}
