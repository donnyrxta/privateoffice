import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base=process.env.PRODUCTION_BASE_URL;
if(!base?.startsWith('https://'))throw Error('PRODUCTION_BASE_URL must be HTTPS');
mkdirSync('outputs/production',{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  await page.goto(base,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Make an enquiry'}).click();
  await page.getByLabel('Your name').waitFor({state:'visible'});
  console.log('PASS homepage enquiry opens');
  await page.keyboard.press('Escape');
  await page.getByRole('link',{name:'Agent sign in',exact:true}).first().click();
  await page.getByLabel('Username',{exact:true}).waitFor({state:'visible'});
  await page.getByLabel('Password',{exact:true}).waitFor({state:'visible'});
  assert.match(new URL(page.url()).pathname,/\/agent\/sign-in/);
  await page.screenshot({path:'outputs/production/agent-sign-in.png',fullPage:true});
  console.log('PASS homepage Agent sign in opens credential form');
  for(const path of ['/residences','/residences/tierra-viva','/residences/tierra-viva/diamante']){
    await page.goto(base+path);await page.getByLabel('Username',{exact:true}).waitFor({state:'visible'});
    assert.match(new URL(page.url()).pathname,/\/agent\/sign-in/);
  }
  console.log('PASS all portfolio levels require sign-in');
  await page.goto(base,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/Zafiro/}).click();
  await page.getByRole('img',{name:'Tierra Viva Zafiro architectural impression',exact:true}).waitFor();
  await page.screenshot({path:'outputs/production/property-preview.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.goto(base,{waitUntil:'networkidle'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByRole('link',{name:'Agent sign in',exact:true}).first().click();
  await page.getByLabel('Username',{exact:true}).waitFor({state:'visible'});
  await page.screenshot({path:'outputs/production/mobile-sign-in.png',fullPage:true});
  console.log('PASS mobile agent sign-in navigation');
  assert.deepEqual(errors,[],'Uncaught production browser errors');
}catch(error){
  await page.screenshot({path:'outputs/production/failure.png',fullPage:true});
  console.error('Browser errors:',errors);
  throw error;
}finally{await browser.close();}
