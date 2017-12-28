const fs = require('fs')
const path = require('path')
const moment = require('moment')
const scrape = require('../src/scrape')

const NOW = moment().format('YYYY-MM-DD')

console.log('Scraping...')
scrape()
  .then(results => {
    console.log('Writing JSON file...')
    fs.writeFileSync(
      path.resolve(__dirname, `../data/${NOW}.json`),
      JSON.stringify(results)
    )
    fs.writeFileSync(
      path.resolve(__dirname, '../data/index.js'),
      `module.exports = require('./${NOW}.json')\n`
    )
    console.log('Done')
  })
  .catch(error => {
    console.log('Could not scrape data')
    console.error(error)
  })
