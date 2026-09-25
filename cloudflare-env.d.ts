// Runtime bindings for `import {env} from 'cloudflare:workers'` (typed as Cloudflare.Env by @cloudflare/workers-types).
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    OFFICE_SETUP_HASH?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    CF_ACCESS_AUD?: string;
    PRIVATE_OFFICE_STANDALONE?: string;
  }
}
