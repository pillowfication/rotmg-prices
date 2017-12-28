const cheerio = require('cheerio')
const getPage = require('./get-page')

function parseQuantity (quantity) {
  return Number(quantity.replace(/[^0-9]/g, ''))
}

class TradeOffer {
  constructor ($, tr) {
    const tds = $(tr).children('td')

    this.selling = tds.eq(0)
      .children('.item-static').toArray()
      .map(span => {
        const $span = $(span)
        return {
          id: $span.find('.item').eq(0).attr('data-item'),
          quantity: parseQuantity($span.find('.item-quantity-static').eq(0).text())
        }
      })

    this.buying = tds.eq(1)
      .children('.item-static').toArray()
      .map(span => {
        const $span = $(span)
        return {
          id: $span.find('.item').eq(0).attr('data-item'),
          quantity: parseQuantity($span.find('.item-quantity-static').eq(0).text())
        }
      })

    this.quantity = parseQuantity(tds.eq(2).children().eq(0).text())
  }
}

async function getOffersTo (buyOrSell, itemId, page) {
  const html = await getPage(`offers-to/${buyOrSell}/${itemId}//${page * 100 + 1}`)
  const $ = cheerio.load(html)

  // Determine if this is the first page.
  // When there is no `.pagination` element, or the first element of the
  // `.pagination` button group is `.active`, then this is the first page.
  const pagination = $('.pagination')
  const isFirstPage = pagination.length === 0 ||
    pagination.children().first().hasClass('active')

  // If this is the first page and we did not request the first page, return
  // `null`
  if (isFirstPage && page !== 0) {
    return null
  }

  // Parse all the offers
  return $('#g tbody tr').toArray()
    .map(tr => new TradeOffer($, tr))
}

module.exports = getOffersTo
