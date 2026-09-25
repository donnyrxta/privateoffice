import type {CapacitorConfig} from '@capacitor/cli';
const config:CapacitorConfig={appId:'co.zw.privateoffice.app',appName:'Private Office',webDir:'www',android:{useLegacyBridge:true},server:process.env.PRIVATE_OFFICE_APP_URL?{url:process.env.PRIVATE_OFFICE_APP_URL,cleartext:false}:undefined};
export default config;
