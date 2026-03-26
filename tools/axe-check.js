#!/usr/bin/env node
const puppeteer = require('puppeteer-core');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async ()=>{
  const browser = await puppeteer.launch({executablePath: chromePath, headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const url = 'http://localhost:8001';
  try{
    await page.goto(url, {waitUntil:'networkidle2', timeout:20000});
    // inject axe-core from CDN
    await page.addScriptTag({url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js'});
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