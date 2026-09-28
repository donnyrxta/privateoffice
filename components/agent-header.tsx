'use client';
import {Brand} from './landing';

export default function AgentHeader(){
  async function logout(){try{await fetch('/api/agent/logout',{method:'POST',cache:'no-store'})}finally{location.assign('/')}}
  return <header className="site-header agent-site-header"><Brand/><nav aria-label="Agent navigation"><a href="/residences">Portfolio</a><a href="/agent">Visits</a><button className="agent-nav-button" onClick={logout}>Sign out</button></nav></header>
}
