import handler from 'vinext/server/fetch-handler';
import {runScheduled} from '../lib/maintenance';

type Env={DB?:D1Database;[key:string]:unknown};

/**
 * Worker entry: HTTP traffic goes to the Vinext app; Cron Triggers run the active-visit
 * watchdog (every minute) and policy retention (daily) independently of any open dashboard.
 */
const app=handler as unknown as {fetch(request:Request,env:Env,ctx:ExecutionContext):Promise<Response>};
const worker={
  fetch(request:Request,env:Env,ctx:ExecutionContext){return app.fetch(request,env,ctx)},
  scheduled(controller:ScheduledController,env:Env,ctx:ExecutionContext){ctx.waitUntil(runScheduled(controller.cron,env.DB,controller.scheduledTime||Date.now()))},
};
export default worker;
