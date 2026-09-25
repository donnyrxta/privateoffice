// Generates a high-entropy one-time office bootstrap secret and its SHA-256 digest (gate #5).
// The secret is shown once; only the digest is stored in Cloudflare as OFFICE_SETUP_HASH.
import {createHash,randomBytes} from 'node:crypto';
const secret=randomBytes(32).toString('base64url'); // 256 bits
const digest=createHash('sha256').update(secret).digest('hex');
console.log(`
Private Office bootstrap secret (store in a password manager, use once, then discard):

  ${secret}

OFFICE_SETUP_HASH (SHA-256, safe to store as a Worker secret):

  ${digest}

Next steps:
  1. printf '%s' '${digest}' | npx wrangler secret put OFFICE_SETUP_HASH --name private-office
  2. Deploy, sign in through Cloudflare Access as the production owner, open /office and activate with the secret.
  3. Verify: npx wrangler d1 execute private-office-d1 --remote --command "SELECT owner_id,owner_email,created_at FROM office"
  4. Rotate: after activation, replace OFFICE_SETUP_HASH with a fresh random digest (or delete it) so the secret is dead.
`);
