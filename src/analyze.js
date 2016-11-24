const recentData = require('../data');
const parseData = require('./parseData');
const matrix = require('./matrix');
const transpose = matrix.transpose;
const invert = matrix.invert;
const multiply = matrix.multiply;

module.exports = function analyze(data = recentData, options) {
  console.log('Parsing data...');
  const parsedData = parseData(data, options);

  // Weighted least squares: B = (Xt * W * X)^-1 * Xt * W * Y
  const X = [];
  const Y = [];
  const W = [];

  const variables = parsedData.variables.filter(variable => variable !== options.fixedVariable);

  console.log('Building matrices...');
  const isUsed = {};
  variables.forEach(variable => {
    isUsed[variable] = false;
  });

  for (let row = 0; row < parsedData.equations.length; ++row) {
    const equation = parsedData.equations[row];
    X.push(variables.map(variable => {
      const value = equation.expression[variable] || 0;
      if (value)
        isUsed[variable] = true;
      return value;
    }));
    Y.push([-equation.expression[options.fixedVariable] || 0]);
    W.push(equation.weight);
  }

  // For unused variables, add the equation A = 0 (weight: 1)
  for (const variable of variables)
    if (!isUsed[variable]) {
      X.push(variables.map(_variable => _variable === variable ? 1 : 0));
      Y.push([0]);
      W.push(1);
    }

  for (let row = 0; row < W.length; ++row) {
    const Wrow = [];
    for (let col = 0; col < W.length; ++col)
      Wrow[col] = col === row ? W[row] : 0;
    W[row] = Wrow;
  }

  console.log('Compute XtW...');
  const XtW = multiply(transpose(X), W);
  console.log('Compute LHS...');
  const LHS = multiply(XtW, X);
  console.log('Compute RHS...');
  const RHS = multiply(XtW, Y);
  console.log('Compute B...');
  const B = multiply(invert(LHS), RHS);

  return {B: B, e: variables};
};
