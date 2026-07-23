import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to local dev server
  await page.goto('http://localhost:5173/login');
  
  // Listen for console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  // Listen for dialogs (alerts)
  page.on('dialog', async dialog => {
    console.log('ALERT:', dialog.message());
    await dialog.dismiss();
  });

  // Wait for network to be idle
  await new Promise(r => setTimeout(r, 2000));
  
  // Type phone number
  await page.type('input[type="tel"]', '8189940301');
  
  // Click Send OTP
  console.log('Clicking Send OTP...');
  await page.click('.auth-submit-btn');
  
  // Wait 5 seconds
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
