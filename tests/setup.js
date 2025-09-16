const puppeteer = require('puppeteer');

// Global setup for Jest tests
beforeAll(async () => {
  // Set longer timeout for browser operations
  jest.setTimeout(30000);
});

afterAll(async () => {
  // Cleanup after all tests
});

// Helper function to launch browser
global.launchBrowser = async (options = {}) => {
  return await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    devtools: process.env.DEVTOOLS === 'true',
    ...options
  });
};

// Helper function to create new page
global.createPage = async (browser) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  return page;
};