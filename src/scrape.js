const _ = require('lodash');
const async = require('async');
const cheerio = require('cheerio');
const esprima = require('esprima');
const request = require('request');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36';

/**
 * Getting the item IDs cannot be achieved on the Current Offers page. If an
 * item has no offers, its ID will not be posted. Instead use the
 * /edit-offers-by/:username page where :username is any public profile. There
 * is a <script> tag with all the item IDs placed immediately after the
 * <script src="/s/ap/js/offer-editor.js"> tag.
 *
 * In that <script> tag, there is a function call to `initializeOfferEditor()`
 * where the 4th argument contains all the item data. This argument is an array
 * of triplets (e.g. [2821,10,16]). The first element is the item ID, the
 * second is an indication of its background color (defined in offer-editor.js),
 * and the third element I have no idea what it's for.
 */
function getItemIds(cb) {
  request({
    url: `https://www.realmeye.com/edit-offers-by/${'PillowMoo'}`,
    headers: {'User-Agent': USER_AGENT}
  }, (err, res) => {
    if (err)
      return setImmediate(cb, err);

    const itemData = _.find(
      esprima.parse(
        _.find(
          cheerio.load(res.body, {xmlMode: false})('script'),
          node => node.attribs.src === '/s/ap/js/offer-editor.js'
        ).next.children[0].data
      ).body,
      statement => statement.expression.callee.name === 'initializeOfferEditor'
    ).expression.arguments[3].elements.map(
      expression => expression.elements[0].type === 'Literal' ?
        expression.elements[0].raw :
        `-${expression.elements[0].argument.raw}` // Negative number
    );

    return setImmediate(cb, null, itemData);
  });
}

/**
 * When finding offers for an item, results may be paginated (per 100 results).
 * This is reflected in the last part of the URL (e.g. /601 for offers 601-700).
 * If the page requested does not exist, the default first page is returned.
 * Keep fetching pages until this occurs.
 */
function getAllOffers(buyOrSell, itemId, _logString, cb) {
  let allOffers = [];
  let page = 0;

  getPage(buyOrSell, itemId, page, _logString, function pageCb(err, offers) {
    if (err)
      return setImmediate(cb, err);

    if (offers === undefined)
      return setImmediate(cb, null, allOffers);

    allOffers = allOffers.concat(offers);
    return setImmediate(getPage, buyOrSell, itemId, ++page, _logString, pageCb);
  });
}

function getPage(buyOrSell, itemId, page, _logString, cb) {
  request({
    url: `https://www.realmeye.com/offers-to/${buyOrSell}/${itemId}//${page*100+1}`,
    headers: {'User-Agent': USER_AGENT}
  }, (err, res) => {
    if (err)
      return setImmediate(cb, err);

    const $ = cheerio.load(res.body);
    if (page > 0) {
      const pagination = $('.pagination');
      if (pagination.length === 0 || pagination[0].children[0].attribs.class === 'active')
        return setImmediate(cb, null, undefined);
    }

    const offers = _.map($('table#g > tbody > tr'), tr => ({
      sell: _.map(tr.children[0].children, span => ({
        itemId: span.children[0].attribs['data-item'],
        quantity: +span.children[1].children[0].data.substring(1)
      })),
      buy: _.map(tr.children[1].children, span => ({
        itemId: span.children[0].attribs['data-item'],
        quantity: +span.children[1].children[0].data.substring(1)
      })),
      quantity: +tr.children[2].children[0].children[0].data
    }));

    console.log(`Received ${_logString} page ${page+1}`);
    return setImmediate(cb, null, offers);
  });
}

/**
 * Create a unique representation of the offer. Trading (A, B for C) x2 is the
 * same as Trading (B, A for C) x3 (but with different weights). It is not the
 * same as Trading (C for A, B) even though they are equationally the same.
 */
function createIdentifier(offer) {
  const sellString = `${_(offer.sell).map(item => `${item.itemId}x${item.quantity}`).orderBy().join(',')}`;
  const buyString = `${_(offer.buy).map(item => `${item.itemId}x${item.quantity}`).orderBy().join(',')}`;
  return `${sellString}|${buyString}`;
}

function scrape(cb) {
  console.log('Fetching item IDs...');
  getItemIds((err, itemIds) => {
    if (err)
      return setImmediate(cb, err);

    console.log('Received item IDs');
    console.log('Fetching all offers...');
    const allOffers = {};

    async.eachOfSeries(itemIds, (itemId, itemIndex, itemCb) => {
      async.eachSeries(['buy', 'sell'], (buyOrSell, offerCb) => {
        const _logString = `(${itemIndex+1}/${itemIds.length}) '${buyOrSell}'`;
        getAllOffers(buyOrSell, itemId, _logString, (err, offers) => {
          if (err)
            return offerCb(err);

          for (const offer of offers) {
            const identifier = createIdentifier(offer);
            const data = allOffers[identifier] || (allOffers[identifier] = []);
            data.push(offer.quantity);
          }

          return offerCb();
        });
      }, itemCb);
    }, err => {
      if (err)
        return setImmediate(cb, err);

      return setImmediate(cb, null, {
        timestamp: Date.now(),
        itemIds: itemIds,
        offers: allOffers
      });
    });
  });
}

module.exports = scrape;

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const jsonfile = require('jsonfile');

  scrape((err, results) => {
    if (err) {
      console.log('Something bad happened while scraping. Please try again.');
      process.exit(1);
    }

    console.log('Writing JSON file...');
    const fileName = `offers_${results.timestamp}.json`;
    jsonfile.writeFileSync(
      path.join(__dirname, '..', 'data', fileName),
      results
    );

    console.log('Updating require...');
    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'index.js'),
      `module.exports = require('./${fileName}');`
    );

    console.log('Done!');
    console.log(`Data written to data/${fileName}`);
  });
}
