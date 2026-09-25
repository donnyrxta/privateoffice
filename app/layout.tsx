import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Private Office | Property & People',description:'International property. Personal representation in Zimbabwe. Private enquiries and considered introductions.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},robots:{index:false,follow:false},referrer:'strict-origin-when-cross-origin'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
