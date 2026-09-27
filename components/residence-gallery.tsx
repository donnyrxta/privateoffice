'use client';

import {useEffect,useRef,useState} from 'react';
import type {PortfolioMedia} from '@/lib/portfolio';

export default function ResidenceGallery({media,project,residence}:{media:PortfolioMedia[];project:string;residence:string}){
  const[active,setActive]=useState<number|null>(null);
  const opener=useRef<HTMLButtonElement|null>(null);
  const closeRef=useRef<HTMLButtonElement|null>(null);

  function open(index:number,event:React.MouseEvent<HTMLButtonElement>){
    opener.current=event.currentTarget;
    setActive(index);
  }
  function close(){setActive(null)}
  function previous(){setActive(current=>current===null?null:(current-1+media.length)%media.length)}
  function next(){setActive(current=>current===null?null:(current+1)%media.length)}

  useEffect(()=>{
    if(active===null)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();close()}
      if(event.key==='ArrowLeft'){event.preventDefault();previous()}
      if(event.key==='ArrowRight'){event.preventDefault();next()}
    };
    addEventListener('keydown',onKey);
    requestAnimationFrame(()=>closeRef.current?.focus());
    return()=>{
      document.body.style.overflow=previousOverflow;
      removeEventListener('keydown',onKey);
      requestAnimationFrame(()=>opener.current?.focus());
    };
  },[active]);

  return <>
    <section className="po-gallery" id="gallery" aria-label={residence+' gallery'}>
      {media.map((item,index)=><figure key={item.src} className={'po-gallery-frame po-gallery-frame-'+((index%4)+1)} data-po-reveal>
        <button className="po-gallery-open" type="button" onClick={event=>open(index,event)} aria-label={'Open '+(item.label??'architecture')+' image '+(index+1)+' of '+media.length}>
          <img src={item.src} alt={item.alt} style={{objectPosition:item.focal}} loading={index===0?'eager':'lazy'}/>
          <span className="po-gallery-affordance" aria-hidden="true">View</span>
        </button>
        <figcaption><span>{String(index+1).padStart(2,'0')}</span><strong>{item.label??'Architecture'}</strong></figcaption>
      </figure>)}
    </section>

    {active!==null&&<div className="po-media-viewer" role="dialog" aria-modal="true" aria-label={residence+' architectural image viewer'} onMouseDown={event=>{if(event.target===event.currentTarget)close()}}>
      <header className="po-media-viewer-head">
        <div><span>{String(active+1).padStart(2,'0')} / {String(media.length).padStart(2,'0')}</span><strong>{media[active].label??'Architecture'}</strong></div>
        <button ref={closeRef} type="button" onClick={close} aria-label="Close image viewer">Close <span aria-hidden="true">×</span></button>
      </header>
      <div className="po-media-viewer-stage">
        <img src={media[active].src} alt={media[active].alt}/>
      </div>
      <footer className="po-media-viewer-foot">
        <button type="button" onClick={previous} aria-label="Previous image"><span aria-hidden="true">←</span> Previous</button>
        <div><span>{project}</span><strong>{residence}</strong></div>
        <button type="button" onClick={next} aria-label="Next image">Next <span aria-hidden="true">→</span></button>
      </footer>
    </div>}
  </>;
}
