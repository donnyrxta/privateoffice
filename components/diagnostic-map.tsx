'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map,LayerGroup} from 'leaflet';

export type DiagnosticFix={lat:number;lng:number;accuracy:number;timestamp:number};

export default function DiagnosticMap({fix}:{fix:DiagnosticFix|null}){
  const el=useRef<HTMLDivElement>(null);
  const map=useRef<Map|null>(null);
  const layer=useRef<LayerGroup|null>(null);
  const lib=useRef<typeof import('leaflet')|null>(null);
  const[ready,setReady]=useState(false);
  const[failed,setFailed]=useState(false);

  useEffect(()=>{
    let gone=false;
    import('leaflet').then(L=>{
      if(gone||!el.current)return;
      lib.current=L;
      const m=L.map(el.current,{scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false}).setView([-17.8249,31.0530],12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).on('tileerror',()=>setFailed(true)).addTo(m);
      map.current=m;
      layer.current=L.layerGroup().addTo(m);
      setReady(true);
      requestAnimationFrame(()=>m.invalidateSize());
    }).catch(()=>setFailed(true));
    return()=>{gone=true;map.current?.remove();map.current=null;layer.current=null};
  },[]);

  useEffect(()=>{
    const L=lib.current,m=map.current,g=layer.current;
    if(!ready||!L||!m||!g)return;
    g.clearLayers();
    if(!fix)return;
    L.circle([fix.lat,fix.lng],{radius:Math.max(3,fix.accuracy),color:'#a1804e',weight:1.5,fillColor:'#c7a878',fillOpacity:.16}).addTo(g);
    L.circleMarker([fix.lat,fix.lng],{radius:9,color:'#fff',weight:3,fillColor:'#101b22',fillOpacity:1}).bindTooltip('Latest device fix').addTo(g);
    const zoom=fix.accuracy<=15?17:fix.accuracy<=50?16:fix.accuracy<=150?15:14;
    m.setView([fix.lat,fix.lng],zoom);
    requestAnimationFrame(()=>m.invalidateSize());
  },[fix,ready]);

  return <div className="diagnostic-map-shell"><div ref={el} className="diagnostic-map" aria-label="Map showing the latest location fix and its reported accuracy radius"/>{!ready&&!failed&&<div className="diagnostic-map-state">Loading map…</div>}{ready&&!fix&&<div className="diagnostic-map-state diagnostic-map-prompt">Acquire a fix to place this device on the map.</div>}{failed&&<div className="diagnostic-map-state diagnostic-map-error">Map tiles are unavailable. Raw coordinates will still appear when the device returns a fix.</div>}</div>
}
