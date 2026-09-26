'use client';

import {useEffect} from 'react';

export default function PortfolioMotion(){
  useEffect(()=>{
    const root=document.documentElement;
    root.classList.add('po-motion-ready');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const reveals=[...document.querySelectorAll<HTMLElement>('[data-po-reveal]')];
    const parallax=[...document.querySelectorAll<HTMLElement>('[data-po-parallax]')];

    if(reduced.matches){
      reveals.forEach(node=>node.classList.add('is-visible'));
      parallax.forEach(node=>node.style.setProperty('--po-parallax-y','0px'));
      return;
    }

    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting){
          (entry.target as HTMLElement).classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
    reveals.forEach(node=>observer.observe(node));

    let raf=0;
    const update=()=>{
      raf=0;
      const vh=window.innerHeight;
      for(const node of parallax){
        const rect=node.getBoundingClientRect();
        if(rect.bottom<0||rect.top>vh)continue;
        const strength=Number(node.dataset.poParallax||.045);
        const delta=(rect.top+rect.height/2-vh/2)*strength*-1;
        const shift=Math.max(-42,Math.min(42,delta));
        node.style.setProperty('--po-parallax-y',shift.toFixed(2)+'px');
      }
    };
    const request=()=>{if(!raf)raf=requestAnimationFrame(update)};
    update();
    addEventListener('scroll',request,{passive:true});
    addEventListener('resize',request,{passive:true});
    return()=>{
      observer.disconnect();
      removeEventListener('scroll',request);
      removeEventListener('resize',request);
      if(raf)cancelAnimationFrame(raf);
      root.classList.remove('po-motion-ready');
    };
  },[]);
  return null;
}
