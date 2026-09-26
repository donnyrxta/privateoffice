'use client';

import {Brand} from './landing';

export default function PortfolioHeader(){
  async function logout(){
    try{await fetch('/api/agent/logout',{method:'POST',cache:'no-store'})}
    finally{location.assign('/')}
  }
  return <header className="po-header">
    <Brand/>
    <nav aria-label="Private Office">
      <a href="/residences">Portfolio</a>
      <a href="/agent">Visits</a>
      <button type="button" onClick={logout}>Sign out</button>
    </nav>
  </header>
}
