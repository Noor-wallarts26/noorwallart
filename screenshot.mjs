import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to mobile size
  await page.setViewport({ width: 375, height: 812 });
  
  await page.goto('http://localhost:5173/');
  
  // Wait for network to be idle
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'whatsapp-test.png' });
  
  await browser.close();
})();
