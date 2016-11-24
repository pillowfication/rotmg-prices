const _ = require('lodash');
const recentData = require('../data');

function parseIdentifier(identifier) {
  const expression = {};
  const [left, right] = identifier.split('|');
  left.split(',').forEach(term => {
    const [itemId, count] = term.split('x');
    expression[`${itemId}_sell`] = +count;
  });
  right.split(',').forEach(term => {
    const [itemId, count] = term.split('x');
    expression[`${itemId}_buy`] = +count;
  });
  return expression;
}

module.exports = function parseData(data = recentData, options) {
  const variables = data.itemIds.reduce((agg, itemId) => {
    agg.push(`${itemId}_sell`);
    agg.push(`${itemId}_buy`);
    return agg;
  }, []);

  const equations = [];
  _.forEach(data.offers, (quantities, identifier) => {
    const expression = parseIdentifier(identifier);
    equations.push({
      _identifier: identifier,
      expression: expression,
      weight: quantities.reduce((sum, quantity) =>
          sum + Math.min(quantity, options.maxQuantity || quantity),
        0) / (Object.keys(expression).length)
    });
  });

  return {
    _raw: data,
    variables: variables,
    equations: equations
  };
};
