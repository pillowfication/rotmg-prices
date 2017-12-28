const cheerio = require('cheerio')
const esprima = require('esprima')
const getPage = require('./get-page')

const ME = 'PillowMoo'

/**
 * Getting the item IDs cannot be achieved on the Current Offers page. If an
 * item has no offers, its ID will not be posted. Instead use the
 * `edit-offers-by/:username` page where `:username` is any public profile.
 * There is a `<script>` tag with all the item IDs placed immediately after the
 * `<script src="/s/{something}/js/offer-editor.js">` tag.
 *
 * In that `<script>` tag, there is a function call to `initializeOfferEditor()`
 * where the 4th argument contains all the item data. This argument is an array
 * of triplets (e.g. `[2821, 10, 16]`). The first element is the item ID, the
 * second is an indication of its background color (defined in
 * `offer-editor.js`), and the third element I have no idea what it's for.
 */
async function getItemIds () {
  const html = await getPage(`edit-offers-by/${ME}`)
  const $ = cheerio.load(html, { xmlMode: false })

  // Find the `<script>` tag and get its contents
  const script = $('script').toArray().map($)
    .find(node => /\/offer-editor\.js$/.test(node.prop('src')))
    .next()
    .html()

  // Find the `initializeOfferEditor(...)` statement
  const syntaxTree = esprima.parse(script)
  const initializeOfferEditor = syntaxTree.body.find(expressionStatement =>
    expressionStatement.type === 'ExpressionStatement' &&
    expressionStatement.expression.type === 'CallExpression' &&
    expressionStatement.expression.callee.type === 'Identifier' &&
    expressionStatement.expression.callee.name === 'initializeOfferEditor')

  // Pull the IDs from the 4th argument
  const ids = initializeOfferEditor.expression.arguments[3]
    .elements.map(arrayExpression => {
      const arrayExpressionElement = arrayExpression.elements[0]
      return arrayExpressionElement.type === 'Literal'
        ? arrayExpressionElement.raw
        : '-' + arrayExpressionElement.argument.raw // Negative IDs
    })

  return ids
}

module.exports = getItemIds
