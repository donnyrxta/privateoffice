import {Header,PublicFooter} from '@/components/landing';
import {CONSENT_VERSION} from '@/lib/contracts';

export default function Page(){
  return <div className="public-paper"><Header publicNav/><main className="app-main prose privacy-prose">
    <p className="eyebrow">PRIVACY</p>
    <h1 className="sign-in-title">Privacy, handled quietly.</h1>
    <p>Private Office uses personal information to handle property enquiries, arrange introductions and operate private appointments. The location system is an operational coordination and audit layer for assigned agents; it is not the product being offered to property buyers.</p>

    <h2>Your property enquiry</h2>
    <p>When you make an enquiry we save the name, contact details and property interest you choose to provide so the office can respond, refine your brief and arrange the appropriate conversation. The enquiry form does not request your device location.</p>

    <h2>Private appointment links</h2>
    <p>If the office arranges an in-person appointment, the intended client may receive a private arrival link. That link can show the latest server-persisted position of the assigned agent during the active appointment together with freshness and reported accuracy. It does not request or collect the client’s own location.</p>

    <h2>Agent operations</h2>
    <p>Notice version {CONSENT_VERSION}. An authenticated agent workspace creates a security session. Starting an assigned visit creates a separate, appointment-bound tracking epoch and requests the best practical location accuracy exposed by the registered device.</p>
    <p>During an active visit Private Office may record device-reported latitude, longitude, accuracy and time together with available altitude, heading, speed, queue and server-receipt times, sequence numbers, device/session identifiers and tracking-health events. Observations are written to a durable local queue before signed upload so temporary network loss does not intentionally discard the visit evidence.</p>

    <h2>Background operation and interruption</h2>
    <p>The installed mobile application is designed to maintain an active visit location session through normal backgrounding and screen lock, subject to operating-system permissions and device state. The browser implementation remains subject to browser and operating-system lifecycle limits. Permission loss, network interruption and stale telemetry are surfaced as explicit states rather than silently presented as live location.</p>

    <h2>Accuracy and interpretation</h2>
    <p>A coordinate is never presented as exact ground truth by itself. Location is interpreted together with its timestamp and device-reported uncertainty. A fix may be precise but stale, current but low-accuracy, or affected by the device and surrounding environment.</p>

    <h2>Who can see agent location</h2>
    <p>The authenticated office can review the evidence associated with its visits. The intended client receives only the latest persisted position for that appointment while sharing is active, rather than the complete office audit trail. Private arrival links should be shared only with their intended recipient.</p>

    <h2>Ending and retaining a visit</h2>
    <p>Pause, Arrive, Complete, revocation and expiry close or stop the relevant visit workflow. Where a terminal action is requested, the device first attempts to reconcile its final queued telemetry with the office. Visit records and operational evidence are retained according to the configured retention policy; enquiries are retained separately for customer follow-up.</p>

    <h2>Map provider</h2>
    <p>Where a map is displayed, map tiles are loaded from the configured map provider. That provider may receive the requesting device’s IP address and the map area being requested.</p>

    <a className="text-link" href="/">Return to Private Office</a>
  </main><PublicFooter/></div>
}
