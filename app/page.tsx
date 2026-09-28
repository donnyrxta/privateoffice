import Landing from '@/components/landing';
export default async function Home({searchParams}:{searchParams:Promise<{enquire?:string}>}){const {enquire=''}=await searchParams;return <Landing key={enquire} initialEnquiry={enquire.slice(0,200)}/>}
