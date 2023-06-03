const cheerio = require('cheerio');
const { visitPage } = require('./puppeteer');

module.exports = {
    /**@param {string} query */
    scrapeBrave: async (query) => {
        const searchQuery = encodeURIComponent(query);
        const url = `https://search.brave.com/search?q=${searchQuery}&source=web`;

        const { content, page } = await visitPage(url);

        const summarizer = (html) => {
            const $ = cheerio.load(html);

            const resultElement = $('.summarizer-content.svelte-1tbhqo9').length;
            if (!resultElement) return null;

            const answer = $('.answer.svelte-1tbhqo9 .block')
                .map((index, element) => {
                    return $(element)
                        .clone()
                        .find('.refs')
                        .remove()
                        .end()
                        .text()
                        .trim();
                })
                .get()
                .join(' ');

            const references = [];
            $('.refnotes.svelte-1tbhqo9').each((index, element) => {
                const iconUrl = $(element).find('img.avatar').attr('src');
                const url = $(element).find('a.source-name').attr('href');
                const name = $(element).find('a.source-name').text();
                references.push({ iconUrl, url, name });
            });

            return {
                text: answer.trim(),
                references
            };
        };

        const unitConverter = async (html) => {
            const $ = cheerio.load(html);

            const unitConversion = $('#rh-unit-conversion.fdb').length
            if (!unitConversion) return null;

            const dimensionalityOptions = $('#dimensionality option').map((index, element) => {
                const value = $(element).val();
                const text = $(element).text();
                return { value, text };
            }).get();

            const unitOptions = $('.box:last-child select option').map((index, element) => {
                const value = $(element).val();
                const text = $(element).text();
                return { value, text };
            }).get();

            const dimensionality = await page.evaluate('dimensionality.value');
            const inputUnit = await page.evaluate("document.getElementsByClassName('form-select no-border svelte-7k1hr7')[0].value")
            const inputValue = await page.evaluate("document.getElementsByClassName('amount no-border svelte-7k1hr7')[0].value");
            const outputUnit = await page.evaluate("document.getElementsByClassName('form-select no-border svelte-7k1hr7')[1].value")
            const outputValue = await page.evaluate("document.getElementsByClassName('amount no-border svelte-7k1hr7')[1].value");

            return {
                dimensionality: dimensionalityOptions.find((el) => el.value == dimensionality).text,
                inputUnit: unitOptions.find((el) => el.value == inputUnit).text,
                inputValue,
                outputUnit: unitOptions.find((el) => el.value == outputUnit).text,
                outputValue
            }
        }

        const dateTimer = (html) => {
            const $ = cheerio.load(html);

            const timezoneElement = $('#rh-timezones');
            if (!timezoneElement.length) return null;

            const time = $('.time.svelte-1qdes8p').text();
            const date = $('.h6.text-gray').eq(0).text();
            const timezone = $('.h6.text-gray').eq(1).text().trim();

            return {
                time,
                date,
                timezone
            };
        }

        const summarize = async () => {
            let data = summarizer(content);
            while (true) {
                if (data && !data.text.length) {
                    data = summarizer(await page.content());
                } else {
                    return data;
                }
            }
        }

        const result = {
            summarize: await summarize(),
            unitConversion: await unitConverter(content),
            dateTime: dateTimer(content)
        };

        await page.close();
        return result;
    }
};