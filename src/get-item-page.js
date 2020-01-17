const cheerio = require('cheerio')
const request = require('./request')

async function getItemPage (itemId, buyOrSell) {
  // The URL of an offers page looks like
  //    https://www.realmeye.com/offers-to/buy/2592/
  //    https://www.realmeye.com/offers-to/sell/2592/
  // where 2592 is the item ID in this case. Each page can only display 100
  // entries. To get entries 201-300, a '/201' is appended at the end of the
  // URL. If '/501' is appended to the end of the URL, but item does not have
  // enough offers to have a 5th page, then the 1st page will be returned
  // (entries 1-100). This function will increment the page requested until
  // the first page is returned again.
  const allResults = []

  for (let pageNumber = 1; ; ++pageNumber) {

    const firstEntryNumber = (pageNumber - 1) * 100 + 1
    const url = `https://www.realmeye.com/offers-to/${buyOrSell}/${itemId}//${firstEntryNumber}`
    console.log('GET: ', itemId, buyOrSell, pageNumber, url)
    const html = await request(`https://www.realmeye.com/offers-to/${buyOrSell}/${itemId}//${firstEntryNumber}`)

    // With the HTML retrieved, I use cheerio to parse it, and it gives me
    // useful functions to interact with the HTML.
    const $ = cheerio.load(html)

    // First I need to find out which page was returned. If the wrong one is
    // returned, that means I'm back at the start and I've looped through all
    // the pages already.
    // A page usually contains a pagination element to indicate the current page.
    const pagination = $('.pagination')
    let returnedPageNumber

    // If there was no pagination element, then the current item only has 1
    // page of offers, so I am on the 1st page.
    if (pagination.get().length === 0) {
      returnedPageNumber = 1
    }

    // Otherwise, pagination is an <ul> element, and one of its <li> children
    // will have a className of "active" indicating the current page. The first
    // and last <li> children will be removed first, since they only say "First"
    // and "Last". After they are removed, I look for the index of the first
    // <li> child with the "active" className.
    else {
      const children = pagination.find('li').get()
      children.shift() // remove first child
      children.pop() // remove last child
      returnedPageNumber = children.findIndex(child => $(child).hasClass('active')) + 1
    }

    // If the returnedPageNumber doesn't match the requested page number, I am
    // done.
    if (returnedPageNumber !== pageNumber) {
      break
    }

    // Now I can scrape the current page. All the offers are located in a table
    // with id 'h'. Then each row of the table body is parsed for each offer.
    const tableOfOffers = $('table#h')
    tableOfOffers.find('tbody > tr').each((_, tr) => {
      const $tr = $(tr)
      allResults.push({
        s: $tr
          .find('td:nth-child(1) span.item-static')
          .map((_, itemStatic) => ({
            i: $(itemStatic).find('span.item').attr('data-item'),
            q: Number($(itemStatic).find('span.item-quantity-static').text().slice(1))
          }))
          .get(),
        b: $tr
          .find('td:nth-child(2) span.item-static')
          .map((_, itemStatic) => ({
            i: $(itemStatic).find('span.item').attr('data-item'),
            q: Number($(itemStatic).find('span.item-quantity-static').text().slice(1))
          }))
          .get(),
        q: Number($tr
          .find('td:nth-child(3)')
          .text()),
        u: $tr
          .find('td:nth-child(6)')
          .text()
      })
    })
  }

  return allResults
}

module.exports = getItemPage
