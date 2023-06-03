const puppeteer = require('puppeteer');

/**@type {puppeteer.Browser} */
let browser;

/**@param {string} url */
async function visitPage(url) {
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'load' }); // Wait until page finishes loading
    

    // Get the rendered HTML content
    const content = await page.content();

    return {
        content,
        page
    };
}

module.exports = {
    init: async () => {
        browser = await puppeteer.launch({ headless: 'new' });
        console.log('Browser loaded!');
    },
    getBrowser: () => browser,
    visitPage
};
