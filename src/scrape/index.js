const getItemIds = require('./get-item-ids')
const getOffersTo = require('./get-offers-to')

async function scrapeForId (id, buyOrSell) {
  const results = []

  for (let page = 0; true; ++page) {
    const resultsForPage = await getOffersTo(buyOrSell, id, page)
    if (resultsForPage === null) {
      break
    } else {
      results.push(...resultsForPage)
    }
  }

  return results
}

async function scrape () {
  const ids = await getItemIds()
  const results = []

  for (let index = 0; index < ids.length; ++index) {
    const id = ids[index]

    const [ selling, buying ] = await Promise.all([
      scrapeForId(id, 'sell'),
      scrapeForId(id, 'buy')
    ])
    results.push({ id, selling, buying })
  }

  return results
}

module.exports = scrape
