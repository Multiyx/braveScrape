const express = require('express');
const { scrapeBrave } = require('./scraper');
const { init } = require('./puppeteer');
const { existsSync, mkdir } = require('fs');

if(!existsSync('.cache')){
    mkdir('.cache');
}

const app = express();

(async () => {
    app.get('/', (req, res) => {
        res.send('Online');
    });

    await init();

    app.get('/search', async (req, res) => {
        if (!req.query.query) return res.status(400).send('Invalid request');

        res.send(await scrapeBrave(req.query.query));
    });

    app.listen(3000, () => console.log(`Listening to 3000`));
})();
