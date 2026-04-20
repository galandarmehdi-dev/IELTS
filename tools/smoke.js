#!/usr/bin/env node
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const pages = String(process.env.SMOKE_URLS || 'http://127.0.0.1:8001/')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
function findChrome() {
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return process.env.CHROME_PATH || null;
}
const chromePath = findChrome();
if (!chromePath) {
  console.error('No Chrome/Chromium binary found. Set CHROME_PATH or install Chrome.');
  process.exit(2);
}
(async ()=>{
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const results = {};
  for (const url of pages) {
    const page = await browser.newPage();
    results[url] = {console:[], errors:[], requestsFailed:[], badResponses:[]};
    page.on('console', msg => {
      results[url].console.push({type: msg.type(), text: msg.text()});
    });
    page.on('pageerror', err => {
      results[url].errors.push(String(err));
    });
    page.on('requestfailed', req => {
      const errorText = req.failure()?.errorText || '';
      const failedUrl = req.url();
      const isAbortedMedia = errorText === 'net::ERR_ABORTED' && /\.(mp3|wav|ogg|m4a)(?:[?#].*)?$/i.test(failedUrl);
      if (isAbortedMedia) return;
      results[url].requestsFailed.push({url: failedUrl, method: req.method(), errorText});
    });
    page.on('response', res => {
      try{
        const st = res.status();
        if (st >= 400) {
          results[url].badResponses.push({url: res.url(), status: st});
        }
      }catch(e){}
    });
    try{
      await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 20000});
      await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});
      await new Promise(r => setTimeout(r,1500));
    }catch(e){
      const html = await page.content().catch(() => '');
      const hasBody = /<body[\s>]/i.test(html);
      if (!hasBody) {
        results[url].errors.push('Navigation error: '+String(e));
      }
    }
    await page.close();
  }
  await browser.close();
  let hasFailures = false;
  for (const url of pages) {
    const r = results[url];
    console.log('\n=== ' + url + ' ===');
    console.log('Console messages: ' + r.console.length);
    r.console.slice(0,50).forEach((c,i)=>console.log('  ['+c.type+'] '+c.text));
    if (r.console.length>50) console.log('  ... ('+(r.console.length-50)+' more)');
    console.log('Page errors: ' + r.errors.length);
    r.errors.forEach(e=>console.log('  - '+e));
    console.log('Failed requests: ' + r.requestsFailed.length);
    r.requestsFailed.forEach(rr=>console.log('  - '+rr.method+' '+rr.url+' -> '+rr.errorText));
    console.log('HTTP errors (>=400): ' + r.badResponses.length);
    r.badResponses.forEach(br=>console.log('  - '+br.status+' '+br.url));
    if (r.errors.length || r.requestsFailed.length || r.badResponses.length) {
      hasFailures = true;
    }
  }
  process.exit(hasFailures ? 1 : 0);
})();
