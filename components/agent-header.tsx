'use client';
import {BriefcaseBusiness,LogOut,MapPinned} from 'lucide-react';
import {Brand} from './landing';

export default function AgentHeader(){
  async function logout(){try{await fetch('/api/agent/logout',{method:'POST',cache:'no-store'})}finally{location.assign('/')}}
  return <header className="site-header agent-site-header"><Brand/><nav aria-label="Agent navigation"><a href="/residences"><BriefcaseBusiness size={15}/>Portfolio</a><a href="/agent"><MapPinned size={15}/>My visits</a><button className="agent-nav-button" onClick={logout}><LogOut size={15}/>Sign out</button></nav></header>
}
