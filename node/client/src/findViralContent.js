const delay = require('delay');
const clone = require('clone');
const deleteInputValue = require('../utils/deleteInputValue');
const randomIntFromInterval = require('../utils/randomIntFromInterval');
const isJson = require('../utils/isJson');
const PageInstagram = require('../entity/pageInstagram');

module.exports = class FindViralContent {
    constructor(browser, maxPage, pageNames) {
        this.browser = browser;
        this.maxPage = maxPage;
        this.pages = [];// puppeteer pages
        this.pageInstagram = [];
        this.similarPagesDone = [];
        this.pageNames = clone(pageNames);
        this.pageNamesToGetCategories = clone(pageNames);
        this.categories = [];
        this.minWaitTime = 5000;
        this.maxWaitTime = 10000;

        this.login(browser).then(() => {
            this.createPages().then(() => {
                let i = 0;
                for (let page of this.pages) {
                    this.start(page, i);
                    i++;
                }
            });
        });
    }

    async start(page, indexPage) {
        this.findBestContent();
        if (this.pageNames.length === 0) {
            await delay(randomIntFromInterval(this.minWaitTime, this.maxWaitTime));
            this.start(page, indexPage);
        } else {
            let pageInstagram = null;
            const pageName = this.pageNames[0];
            this.similarPagesDone.push(pageName);
            this.pageNames.splice(0, 1);
            console.log(indexPage + ' scrapping ' + pageName);
            page.goto('https://www.instagram.com/' + pageName + '/');
            const responseToGet = 2; // similar pages and this page
            let i = 0;
            let done = false;
            let pageCategory = null;
            page.on('response', async (response) => {
                const request = response.request();
                if (request.method() === 'GET' && response.status() === 200) {
                    let result = null;
                    try {
                        result = await response.text();
                    } catch (e) {
                        return;
                    }
                    if (request.resourceType() === 'xhr' && request.url().includes('https://www.instagram.com/graphql/query/?query_hash=') && isJson(result)) {
                        result = JSON.parse(result);
                        if (result.status === 'ok' && typeof result.data !== 'undefined' && typeof result.data.user !== 'undefined') {
                            if (typeof result.data.user.edge_chaining !== 'undefined' && Array.isArray(result.data.user.edge_chaining.edges)) {
                                i++;
                                for (let x of result.data.user.edge_chaining.edges) {
                                    const username = x.node.username;
                                    if (!this.pageNames.includes(username) && !this.similarPagesDone.includes(username) &&
                                        (pageCategory === null || (this.categories.includes(pageCategory)))) {
                                        this.pageNames.push(username);
                                    }
                                }
                            }
                        }
                    } else if (request.resourceType() === 'document') {
                        i++;
                        result = result.match(/(?<=window._sharedData =)(.*)<\/script>/g);
                        result = JSON.parse(result[0].replace(';</script>', '').trim());
                        if (this.pageNamesToGetCategories.includes(pageName)) {
                            pageCategory = result.entry_data.ProfilePage[0].graphql.user.category_enum;
                            if (!this.categories.includes(pageCategory)) {
                                this.categories.push(pageCategory);
                            }
                        }
                        pageInstagram = new PageInstagram(result);
                        this.pageInstagram.push(pageInstagram);
                    }
                    if (i === responseToGet && done === false) {
                        done = true;
                        await page.goto('about:blank');
                        await page.close();
                        page = await this.browser.newPage();
                        this.start(page, indexPage);
                    }
                }
            });
        }
    }

    findBestContent() {
        let bestContent = null;
        for (let pageInstagram of this.pageInstagram) {
            const max = pageInstagram.postInstagrams.reduce((prev, current) => {
                return (prev.rating > current.rating) ? prev : current
            });
            if (bestContent === null) {
                bestContent = max;
            } else if (max.rating > bestContent.rating) {
                bestContent = max;
            }
        }
        console.log(bestContent, 'best content');
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
};
