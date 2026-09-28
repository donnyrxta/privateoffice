/** Access authenticates the owner; the application still verifies the JWT and owner identity. */
export function accessToken(headers: Headers): string | null {
  const assertion = headers.get('cf-access-jwt-assertion');
  if (assertion) return assertion;
  const values = (headers.get('cookie') || '').split(';').map(value => value.trim()).filter(value => value.startsWith('CF_Authorization='));
  // Reject ambiguous cookie transport. Neither transport bypasses signature validation.
  if (values.length !== 1) return null;
  return values[0].slice('CF_Authorization='.length) || null;
}
