#!/usr/bin/env node
const puppeteer = require('puppeteer-core');
const fs = require('fs');
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
  const browser = await puppeteer.launch({executablePath: chromePath, headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const url = process.env.AXE_URL || 'http://127.0.0.1:8001/';
  try{
    await page.goto(url, {waitUntil:'networkidle2', timeout:20000});
    await page.addScriptTag({path: require.resolve('axe-core/axe.min.js')});
    const results = await page.evaluate(async () => {
      return await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa']}});
    });
    console.log('Accessibility violations: ' + results.violations.length);
    results.violations.forEach(v=>{
      console.log('\n--- ' + v.id + ' — ' + v.impact + ' — ' + v.help);
      console.log('Description: '+v.description);
      v.nodes.slice(0,5).forEach(n=>{
        console.log('  • target: ' + n.target.join(', '));
        console.log('    failureSummary: ' + (n.failureSummary || '').replace(/\n/g,' '));
      });
      if (v.nodes.length>5) console.log('  ... and '+(v.nodes.length-5)+' more nodes');
    });
  }catch(e){
    console.error('Error during axe run:', e);
    process.exit(2);
  }finally{
    await page.close();
    await browser.close();
  }
})();
