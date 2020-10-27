const delay = require('delay');
const deleteInputValue = require('../utils/deleteInputValue');
const randomIntFromInterval = require('../utils/randomIntFromInterval');
const isJson = require('../utils/isJson');

module.exports = class FindViralContent {
    constructor(browser, maxPage, pageNames) {
        this.browser = browser;
        this.maxPage = maxPage;
        this.pages = [];
        this.similarPagesDone = [];
        this.pageNames = pageNames;
        this.minWaitTime = 5000;
        this.maxWaitTime = 10000;

        this.login(browser).then(() => {
            this.createPages().then(() => {
                for (let page of this.pages) {
                    this.start(page);
                }
            });
        });
    }

    async start(page) {
        if (this.pageNames.length === 0) {
            await delay(randomIntFromInterval(this.minWaitTime, this.maxWaitTime));
            this.start(page);
        } else {
            const pageName = this.pageNames[0];
            this.pageNames.splice(0, 1);
            page.goto('https://www.instagram.com/' + pageName + '/');
            page.on('response', async (response) => {
                const request = response.request();
                if (
                    request.resourceType() === 'xhr'
                    && request.method() === 'GET'
                    && request.url().includes('https://www.instagram.com/graphql/query/?query_hash=')
                    && response.status() === 200
                ) {
                    let result = await response.text();
                    if (isJson(result)) {
                        result = JSON.parse(result);
                        console.log(result);
                    }
                    // await page.goto('about:blank');
                    // await page.close();
                }
            });
        }
    }

    async login(browser) {
        const page = await browser.newPage();
        await page.goto(`https://www.instagram.com/accounts/login/`);
        if (page.url().includes('login')) {
            await delay(2000);
            await page.evaluate(() => {
                const acceptCookiePopUp = document.querySelectorAll('body > div button');
                if (acceptCookiePopUp.length > 0) {
                    for (let button of acceptCookiePopUp) {
                        if (button.textContent.trim().toLowerCase() === 'accept') {
                            button.click();
                            break;
                        }
                    }
                }
            });
            await delay(200);
            await deleteInputValue(page, 'input[name="username"]');
            await deleteInputValue(page, 'input[name="password"]');
            await page.type('input[name="username"]', 'alexandre.beaujour11@gmail.com');
            await page.type('input[name="password"]', 'Computer210496,');
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('form button');
                if (buttons.length > 0) {
                    for (let button of buttons) {
                        if (button.textContent.trim().toLowerCase() === 'log in') {
                            button.click();
                            break;
                        }
                    }
                }
            });
            await page.waitForNavigation({timeout: 10000});
            await page.goto('about:blank');
            await page.close();
        }
    }

    async createPages() {
        let nbPageCreated = 0;
        return new Promise((resolve) => {
            for (let i = 0; i < this.maxPage; i++) {
                this.browser.newPage().then(async (page) => {
                    this.pages.push(page);
                    await page.goto(`https://www.instagram.com/`);
                    await delay(1000);
                    await page.evaluate(() => {
                        const buttons = document.querySelectorAll('body > div button');
                        if (buttons.length > 0) {
                            for (let button of buttons) {
                                if (button.textContent.trim().toLowerCase() === 'not now') {
                                    button.click();
                                    break;
                                }
                            }
                        }
                    });
                    nbPageCreated++;
                    if (nbPageCreated === this.maxPage) {
                        await delay(1000);
                        resolve();
                    }
                });
            }
        });
    }
}