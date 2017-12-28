const request = require('request-promise-native')

const BASE_URL = 'https://www.realmeye.com/'
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'

async function getPage (path) {
  return request({
    url: BASE_URL + path,
    headers: {
      'User-Agent': USER_AGENT
    }
  })
}

module.exports = getPage
