const getItems = require('./src/get-items')
const getItemPage = require('./src/get-item-page')

;(async () => {
  // Get all the items and their IDs first
  const items = await getItems()

  // Now grab the offers for every item
  const results = []
  for (const item of items) {
    const buyOffers = await getItemPage(item.id, 'buy')
    const sellOffers = await getItemPage(item.id, 'sell')
    results.push({
      id: item.id,
      name: item.name,
      buy: buyOffers,
      sell: sellOffers
    })
  }

  // Write the results to a file
  console.log('WRITING TO FILE')
  const today = new Date()
  const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
  require('fs').writeFileSync(require('path').resolve(`./data/${date}.json`), JSON.stringify(results))
})()
