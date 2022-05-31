// Require all models
const db = require('../../models');

// Dependencies
const axios = require('axios');
const cheerio = require('cheerio');

// Document variables
const baseUrl = 'https://www.smashingmagazine.com';
const scrapeUrl = baseUrl + '/articles';

module.exports = app => {
    app.get('/scrape', (req, res) => {
        axios.get(scrapeUrl)
            .then(response => {
                // Hanndle the response
                const data = [];
                let count = 0;
                // Loads the url HTML into cheerio
                const $ = cheerio.load(response.data);
                $('article.article--post').each((index, article) => {
                    count++;
                    const title = $(article)
                        .children('.article--post__title')
                        .children('a')
                        .text();
                    const link = baseUrl + $(article)
                        .children('.article--post__title')
                        .children('a')
                        .attr('href');
                    const teaser = $(article)
                        .find('p.article--post__teaser')
                        .clone() // clone the element...
                        .children() // grab all it's child elements (but not the texts!)
                        .remove() // remove it's date tag...
                        .end() // grab the result's text
                        .text();
                    const dateString = $(article)
                        .find('time.article--post__time')
                        .text();
                    const author = {
                        authorName: $(article)
                            .find('span.article--post__author-name a')
                            .text(),
                        authorLink: baseUrl + $(article)
                            .find('span.article--post__author-name a')
                            .attr('href')
                    };

                    data.push({
                        title: title,
                        link: link,
                        teaser: teaser,
                        dateString: dateString,
                        author: {
                            authorName: author.authorName,
                            authorLink: author.authorLink
                        }
                    });

                });

                // Remove all old, then POST the array to the database
                db.ScrapedArticle.deleteMany({})
                    .then(removeRes => {
                        db.ScrapedArticle.create(data)
                            .then(dbScrapedArticle => {
                                res.json({
                                    message: 'Scraped from ' + scrapeUrl,
                                    count: count,
                                    created: dbScrapedArticle,
                                    removedOld: removeRes
                                });
                            }).catch(err => {
                                // Handle the error
                                res.status(400).json(err);
                            }).finally(() => {
                                // Always runs
                                console.log("Someone made a scrape attempt at " + Date.now());
                            });
                    }).catch(err => {
                        res.status(400).json(err);
                    }).finally(() => {
                        // Always runs
                        console.log("Someone made a scrape attempt at " + Date.now());
                    });

            });
    });
}