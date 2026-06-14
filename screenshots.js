const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Login page
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: '/tmp/sc-login.png' });
  console.log('login done');

  // Register page
  await page.goto('http://localhost:3000/register', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: '/tmp/sc-register.png' });
  console.log('register done');

  // Dashboard (will redirect to login, but good to show)
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: '/tmp/sc-home.png' });
  console.log('home done');

  await browser.close();
  console.log('All screenshots done');
})();
