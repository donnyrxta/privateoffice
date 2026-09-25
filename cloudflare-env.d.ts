declare module 'cloudflare:workers' {
  export const env: {
    DB: D1Database;
    OFFICE_SETUP_HASH?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    CF_ACCESS_AUD?: string;
    PRIVATE_OFFICE_STANDALONE?: string;
  };
}
