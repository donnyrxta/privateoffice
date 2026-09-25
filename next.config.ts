import type { NextConfig } from 'next';
const nextConfig:NextConfig={async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Permissions-Policy',value:'geolocation=(self), camera=(), microphone=()'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]}]}};
export default nextConfig;
