const puppeteer = require('puppeteer');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Configuration
const SMOGON_USERNAME = process.env.SMOGON_USERNAME || 'YOUR_SMOGON_USERNAME';
const SMOGON_PASSWORD = process.env.SMOGON_PASSWORD || 'YOUR_SMOGON_PASSWORD';
const HEADLESS = process.env.HEADLESS !== 'true'; // Default to false for debugging
const COOLDOWN_MS = parseInt(process.env.COOLDOWN_MS) || 5000;
const SKIP_ALREADY_LIKED = process.env.SKIP_ALREADY_LIKED === 'true';
const TEST_LIKE_URL = 'https://www.smogon.com/forums/posts/10687082/react?reaction_id=1';

// Helper function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to detect page type
async function detectPageType(page) {
  await delay(3000); // Wait for dynamic content
  // Check for "Remove" text in buttons or body
  const removeButton = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.innerText.toLowerCase().includes('remove')) {
        return true;
      }
    }
    return false;
  });
  const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
  const isCancelPage = removeButton || bodyText.includes('remove');
  return isCancelPage ? 'cancel_reaction' : 'add_reaction';
}

// Helper function for likePost
async function likePost(likeUrl) {
  console.log(`Starting likePost for ${likeUrl}`);
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    console.log('Browser and page created');
    
    // Load cookies
    if (fs.existsSync('smogon-cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('smogon-cookies.json'));
      await page.setCookie(...cookies);
      console.log('Loaded pre-exported cookies from smogon-cookies.json');
    } else {
      console.log('No smogon-cookies.json found, will attempt login if needed');
    }
    
    // Navigate to like URL
    console.log(`Navigating to ${likeUrl}`);
    await page.goto(likeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`Current URL: ${page.url()}`);
    
    // Handle login if needed
    if (page.url().includes('login')) {
      console.log('Login required, attempting fallback login...');
      const loginInput = await page.$('input[name="login"]');
      const passwordInput = await page.$('input[name="password"]');
      const submitButton = await page.$('button[type="submit"]');
      if (!loginInput || !passwordInput || !submitButton) {
        const pageContent = await page.content();
        const debugFile = `debug-login-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
        fs.writeFileSync(debugFile, pageContent);
        console.log(`Login form invalid, saved to ${debugFile}`);
        throw new Error('Login form elements not found');
      }
      await page.type('input[name="login"]', SMOGON_USERNAME);
      await page.type('input[name="password"]', SMOGON_PASSWORD);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      ]);
      console.log(`Login submitted, Current URL: ${page.url()}`);
      await page.context().cookies().then(cookies => fs.writeFileSync('cookies.json', JSON.stringify(cookies)));
      await page.goto(likeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`Re-navigated after login, Current URL: ${page.url()}`);
    }
    
    // Detect page type
    const pageType = await detectPageType(page);
    console.log(`Page type: ${pageType}`);
    if (pageType === 'cancel_reaction' && SKIP_ALREADY_LIKED) {
      console.log('Already liked - skipping due to SKIP_ALREADY_LIKED=true');
      return;
    }
    
    // Find Confirm button
    const selectors = [
      'button.button--icon--confirm',
      'button.button--primary',
      'button[type="submit"]',
    ];
    
    let usedSelector = null;
    let confirmButton = null;
    for (const selector of selectors) {
      console.log(`Trying selector: ${selector}`);
      confirmButton = await page.$(selector);
      if (confirmButton) {
        usedSelector = selector;
        break;
      }
    }
    
    if (!usedSelector) {
      console.log('Confirm button not found, saving debug file...');
      const pageContent = await page.content();
      const debugFile = `debug-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`Debug saved to ${debugFile}`);
      throw new Error('Confirm button not found');
    }
    
    // Click and handle navigation
    console.log(`Clicking button with selector ${usedSelector}`);
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null),
      page.click(usedSelector),
    ]);
    
    if (response) {
      console.log(`Navigation after click: ${response.status()} - ${response.statusText()}`);
      if (response.status() === 502) {
        console.log('502 Bad Gateway - applying cooldown');
        await delay(COOLDOWN_MS);
      }
    }
    
    console.log(`✅ Reaction ${pageType === 'cancel_reaction' ? 'removed' : 'applied'}`);
    
  } catch (error) {
    console.error(`Error in likePost: ${error.message}`);
    if (page) {
      const pageContent = await page.content();
      const debugFile = `debug-error-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`Debug saved to ${debugFile}`);
    }
  } finally {
    if (browser) {
      console.log('Closing browser');
      await browser.close();
    }
    console.log(`Applying cooldown of ${COOLDOWN_MS}ms`);
    await delay(COOLDOWN_MS);
  }
}

// Step-by-step tests
async function testStep1AccessPageWithCookies() {
  console.log('\n=== STEP 1: Test Cookie Access to the Page ===');
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    console.log('Browser and page created');
    
    if (fs.existsSync('smogon-cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('smogon-cookies.json'));
      await page.setCookie(...cookies);
      console.log('Loaded pre-exported cookies from smogon-cookies.json');
    }
    
    console.log(`Navigating to ${TEST_LIKE_URL}`);
    await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`Current URL: ${page.url()}`);
    
    if (page.url().includes('login')) {
      console.log('❌ FAILED: Redirected to login - cookies invalid or missing');
      console.log('Attempting fallback login...');
      await page.type('input[name="login"]', SMOGON_USERNAME);
      await page.type('input[name="password"]', SMOGON_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`After fallback login, Current URL: ${page.url()}`);
      if (page.url().includes('login')) {
        console.log('❌ FAILED: Fallback login failed - check credentials');
        return false;
      }
      await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`Re-navigated after login, Current URL: ${page.url()}`);
    }
    
    console.log('✅ SUCCESS: On the right page (reaction page loaded with cookies)');
    const pageType = await detectPageType(page);
    console.log(`Page type: ${pageType}`);
    return true;
  } catch (error) {
    console.error(`Step 1 error: ${error.message}`);
    if (page) {
      const pageContent = await page.content();
      const debugFile = `debug-step1-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`Debug saved to ${debugFile}`);
    }
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

async function testStep2ButtonDetection() {
  console.log('\n=== STEP 2: Test Button Detection ===');
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    
    if (fs.existsSync('smogon-cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('smogon-cookies.json'));
      await page.setCookie(...cookies);
    }
    
    await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    if (page.url().includes('login')) {
      await page.type('input[name="login"]', SMOGON_USERNAME);
      await page.type('input[name="password"]', SMOGON_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    const pageType = await detectPageType(page);
    console.log(`Page type: ${pageType}`);
    if (pageType === 'cancel_reaction' && SKIP_ALREADY_LIKED) {
      console.log('Already liked - would skip in full run');
    }
    
    const selectors = [
      'button.button--icon--confirm',
      'button.button--primary',
      'button[type="submit"]',
    ];
    
    let found = false;
    let usedSelector = null;
    for (const selector of selectors) {
      console.log(`Trying selector: ${selector}`);
      const button = await page.$(selector);
      if (button) {
        usedSelector = selector;
        found = true;
        console.log(`✅ SUCCESS: Button found with selector ${usedSelector}`);
        break;
      } else {
        console.log(`❌ No button with selector ${selector}`);
      }
    }
    
    if (!found) {
      console.log('❌ FAILED: No Confirm button found - saving debug file');
      const pageContent = await page.content();
      const debugFile = `debug-step2-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`Debug file saved to ${debugFile}`);
    }
    
    return found;
  } catch (error) {
    console.error(`Step 2 error: ${error.message}`);
    if (page) {
      const pageContent = await page.content();
      const debugFile = `debug-step2-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`Debug saved to ${debugFile}`);
    }
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

async function testStep3ButtonClick() {
  console.log('\n=== STEP 3: Test Button Click ===');
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    
    if (fs.existsSync('smogon-cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('smogon-cookies.json'));
      await page.setCookie(...cookies);
    }
    
    await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    if (page.url().includes('login')) {
      await page.type('input[name="login"]', SMOGON_USERNAME);
      await page.type('input[name="password"]', SMOGON_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    const pageType = await detectPageType(page);
    console.log(`Page type: ${pageType}`);
    if (pageType === 'cancel_reaction' && SKIP_ALREADY_LIKED) {
      console.log('Already liked - skipping click test');
      return true; // Skip click but consider test passed
    }
    
    const selectors = [
      'button.button--icon--confirm',
      'button.button--primary',
      'button[type="submit"]',
    ];
    
    let clicked = false;
    let usedSelector = null;
    for (const selector of selectors) {
      const button = await page.$(selector);
      if (button) {
        console.log(`Found button with selector ${selector}, clicking...`);
        const [response] = await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null),
          page.click(selector),
        ]);
        
        if (response) {
          console.log(`Navigation after click: ${response.status()} - ${response.statusText()}`);
          if (response.status() === 502) {
            console.log('502 Bad Gateway - applying cooldown');
            await delay(COOLDOWN_MS);
          }
        }
        
        clicked = true;
        console.log(`✅ SUCCESS: Button clicked successfully (${pageType === 'cancel_reaction' ? 'removed' : 'applied'})`);
        break;
      }
    }
    
    if (!clicked) {
      console.log('❌ FAILED: No button found - saving debug file');
      const pageContent = await page.content();
      const debugFile = `debug-step3-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`Debug file saved to ${debugFile}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Step 3 error: ${error.message}`);
    if (page) {
      const pageContent = await page.content();
      const debugFile = `debug-step3-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`Debug file saved to ${debugFile}`);
    }
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

// Run only the tests
async function runTests() {
  console.log('Starting step-by-step tests for Smogon liking bot...\n');
  
  const step1 = await testStep1AccessPageWithCookies();
  if (!step1) {
    console.log('Step 1 failed - stopping tests');
    return;
  }
  
  const step2 = await testStep2ButtonDetection();
  if (!step2) {
    console.log('Step 2 failed - stopping tests');
    return;
  }
  
  const step3 = await testStep3ButtonClick();
  if (!step3) {
    console.log('Step 3 failed - stopping tests');
    return;
  }
  
  console.log('\nAll tests completed successfully!');
}

runTests().catch(error => {
  console.error('Fatal error:', error.message);
});