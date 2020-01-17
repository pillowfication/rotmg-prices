/**
 * Attempt to make a request to a given URL. If the request fails, it will try
 * again up to MAX_ATTEMPTS times. If it still fails, the last error seen is
 * thrown.
 **/

const request = require('request')
const MAX_ATTEMPTS = 5

function requestGet (url) {
  return new Promise((resolve, reject) => {
    request.get({
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
      }
    }, (error, response, body) => {
      if (error || !body) {
        reject(error || new Error(`Could not load url: ${url}`))
      } else {
        resolve(body)
      }
    })
  })
}

module.exports = async function request (url) {
  let lastError = null
  for (let i = 0; i < MAX_ATTEMPTS; ++i) {
    try {
      return await requestGet(url)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}
