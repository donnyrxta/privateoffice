/** Access authenticates the owner; the application still verifies the JWT and owner identity. */
export function accessToken(headers: Headers): string | null {
  const assertion = headers.get('cf-access-jwt-assertion');
  if (assertion) return assertion;
  const values = (headers.get('cookie') || '').split(';').map(value => value.trim()).filter(value => value.startsWith('CF_Authorization='));
  // Reject ambiguous cookie transport. Neither transport bypasses signature validation.
  if (values.length !== 1) return null;
  return values[0].slice('CF_Authorization='.length) || null;
}

export function officeLoginURL(team: string | undefined, audience: string | undefined): string | null {
  if (!team || !audience || !/^[a-f0-9]{64}$/i.test(audience)) return null;
  const domain = team.trim().replace(/^https:\/\//, '').replace(/\/$/, '');
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(domain)) return null;
  const url = new URL(`https://${domain}/cdn-cgi/access/login/private-office.donny-gee.workers.dev`);
  url.searchParams.set('kid', audience);
  url.searchParams.set('redirect_url', '/office');
  return url.toString();
}
