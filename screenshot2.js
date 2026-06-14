const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Register page
  await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/flowchat-register.png' });

  // Dashboard (will redirect to login since unauthenticated, but let's try groups page look)
  await page.goto('http://localhost:3000/groups', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/flowchat-dashboard-redirect.png' });

  console.log('Done');
  await browser.close();
})();
