import Link from 'next/link';
import {Brand} from './landing';
export default function PortfolioHeader(){return <header className="po-header"><Brand/><nav aria-label="Private Office"><Link href="/residences">Residences</Link><Link href="/?enquire=private">Private enquiry</Link><Link href="/agent">Agent sign in</Link></nav></header>}
