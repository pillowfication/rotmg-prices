const DATE = '2020-1-16'
const json = require(`./data/${DATE}.json`)

const fs = require('fs')
const path = require('path')

const regex = /[,\n"]/
function csvEscape (value) {
  let escaped = String(value).replace('"', '""')
  if (regex.test(escaped)) {
    escaped = '"' + escaped + '"'
  }
  return escaped
}

function toCsvRow (row) {
  return row.map(csvEscape).join(',') + '\n'
}

// Item IDs
console.log('WRITE ITEMS')
const itemIdsPath = path.resolve(`./data/${DATE}-items.csv`)
fs.writeFileSync(itemIdsPath, 'id,item name\n')
for (const key in json) {
  fs.appendFileSync(itemIdsPath, toCsvRow([key, json[key].name]))
}

// Offers
console.log('WRITE OFFERS')
const offersPath = path.resolve(`./data/${DATE}.csv`)
fs.writeFileSync(offersPath, 'group id,buy item,buy quantity,sell item,sell quantity,quantity,posted by\n')
let groupId = 0
for (const key in json) {
  for (const offer of json[key].buy.concat(json[key].sell)) {
    for (let i = 0; i < Math.max(offer.s.length, offer.b.length); ++i) {
      fs.appendFileSync(offersPath, toCsvRow([
        groupId,
        offer.b[i] ? offer.b[i].i : '',
        offer.b[i] ? offer.b[i].q : '',
        offer.s[i] ? offer.s[i].i : '',
        offer.s[i] ? offer.s[i].q : '',
        offer.q,
        offer.u || ''
      ]))
    }
    ++groupId
  }
}

console.log('DONE')
