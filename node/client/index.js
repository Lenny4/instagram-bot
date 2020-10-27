require('log-timestamp');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const puppeteer = require('puppeteer');

const FindViralContent = require('./src/findViralContent');


let maxPageBrowser = 1;


server.listen(3000, async () => {
    const browser = await puppeteer.launch({headless: false});
    const findViralContent = new FindViralContent(browser, maxPageBrowser, ['worldofmustang']);

});