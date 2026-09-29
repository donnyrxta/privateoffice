import {Header,PublicFooter} from '@/components/landing';
import {CONSENT_VERSION} from '@/lib/contracts';

export default function Page(){
  return <div className="public-paper"><Header publicNav/><main className="app-main prose privacy-prose">
    <p className="eyebrow">PRIVACY</p>
    <h1 className="sign-in-title">Privacy, handled quietly.</h1>
    <p>Private Office uses personal information to handle property enquiries, arrange introductions and operate private appointments. Location sharing supports appointment coordination for assigned agents; it is not part of the property product offered to buyers.</p>

    <h2>Your property enquiry</h2>
    <p>When you make an enquiry we save the name, contact details and property interest you choose to provide so the office can respond, refine your brief and arrange the appropriate conversation. The enquiry form does not request your device location.</p>

    <h2>Private appointment links</h2>
    <p>If the office arranges an in-person appointment, the intended client may receive a private arrival link. That link can show the latest location the assigned agent chose to share during the appointment, together with when it was updated and the device’s accuracy estimate. It does not request or collect the client’s own location.</p>

    <h2>Working area sharing during introductions</h2>
    <p>Invited candidates choose whether to share their working area before the introduction begins. Private Office uses this only to understand where an agent works and whether there may already be prospects, appointments or opportunities nearby. For independent agents, sharing their location can help us spot relevant nearby opportunities, but it does not guarantee assignment of a prospect.</p><p>Once started, the introduction page uses the best location your device and browser provide and sends location updates while the page remains active. We save the location you shared, the device’s accuracy estimate, when it was shared and which notice you agreed to. Sharing pauses when the page is hidden or closed and only restarts when you choose. The Private Office team handling the introduction can view or export the shared history when needed to coordinate nearby opportunities. This working-area history is deleted after 30 days.</p>
    <p>Device location can vary with the phone, browser and surroundings, so we do not treat it as definitive proof of identity or presence and it does not affect how we view your professional experience. If you prefer not to share location, you can request a manual interview and our team will confirm the alternative with you. Keep your private invitation link to yourself.</p>
    <h2>Visit sharing</h2>
    <p>Notice version {CONSENT_VERSION}. Signing in and browsing do not request location. An approved agent chooses Start or Resume after agreeing to the visit notice; the device then shares the best location estimate it can provide.</p>
    <p>During an active visit, Private Office keeps the locations the agent chooses to share, together with the time, the device’s accuracy estimate and any movement details the device provides. Recent updates stay temporarily on the device if the connection drops, then send when the connection returns.</p>

    <h2>When sharing pauses</h2>
    <p>The website stops sharing location when the visit page is hidden or left. Returning does not automatically resume collection: the agent must choose to resume. If permission is turned off, the network drops, or an update becomes old, the page explains what happened. If location is unavailable or the agent chooses not to share it, they can contact the office to coordinate the appointment another way.</p>

    <h2>Accuracy and interpretation</h2>
    <p>Location is approximate rather than absolute. We show it together with its time and reported accuracy because a location can be precise but old, current but broad, or affected by the device and surrounding environment.</p>

    <h2>Who sees shared location</h2>
    <p>The Private Office team can see the shared location history for its visits. The intended client receives only the latest shared position for that appointment while sharing is active, not the full visit history. Private arrival links should be shared only with their intended recipient.</p>

    <h2>When sharing ends</h2>
    <p>Pause, Arrive and Complete stop sharing for the visit, and cancelled or expired appointments end it as well. Before the visit closes, the device tries to send any remaining updates. Visit records and shared location history are deleted after 30 days. Enquiries are kept for 90 days. Unsent updates are cleared from the device after Private Office receives them.</p>

    <h2>Map provider</h2>
    <p>Where a map is displayed, map tiles are loaded from the configured map provider. That provider may receive the requesting device’s IP address and the map area being requested.</p>

    <a className="text-link" href="/">Return to Private Office</a>
  </main><PublicFooter/></div>
}
