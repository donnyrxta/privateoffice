import {json,officeUser,wrap} from '@/lib/server';

export async function GET(){return wrap(async()=>{
  const user=await officeUser();
  return json({authenticated:true,email:user.email,display_name:user.displayName});
})}
