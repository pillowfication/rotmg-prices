function swap(m, row1, row2) {
  if (row1 !== row2)
    [m[row1], m[row2]] = [m[row2], m[row1]];
}

function multiply(m, row, factor) {
  const cols = m[0].length;
  for (let col = 0; col < cols; ++col)
    m[row][col] *= factor;
}

function addMultiple(m, row1, row2, factor) {
  const cols = m[0].length;
  for (let col = 0; col < cols; ++col)
    m[row1][col] += factor * m[row2][col];
}

module.exports = {
  transpose(m) {
    const mRows = m.length;
    const mCols = m[0].length;
    const mT = [];

    for (let c = 0; c < mCols; ++c) {
      const mTRow = [];
      mT[c] = mTRow;
      for (let r = 0; r < mRows; ++r)
        mTRow[r] = m[r][c];
    }

    return mT;
  },

  invert(m) {
    const mRows = m.length;
    const mCols = m[0].length;

    if (mCols !== mRows)
      throw new Error('Cannot invert the matrix!');

    const size = mRows;

    const inverse = [];
    for (let iRow = 0; iRow < size; ++iRow) {
      const row = [];
      for (let iCol = 0; iCol < size; ++iCol)
        row[iCol] = iRow === iCol ? 1 : 0;
      inverse[iRow] = row;
    }

    for (let col = 0; col < size; ++col) {
      // Find first non-zero entry and swap to the top
      let nonZero = -1;
      for (let row = col; row < size; ++row)
        if (m[row][col] !== 0) {
          nonZero = row;
          break;
        }
      if (nonZero === -1)
        throw new Error('Cannot invert the matrix!');
      swap(m, col, nonZero);
      swap(inverse, col, nonZero);

      // Normalize that row
      const norm = 1/m[col][col];
      multiply(m, col, norm);
      multiply(inverse, col, norm);

      // Zero out the column
      for (let row = 0; row < size; ++row)
        if (row !== col) {
          const factor = -m[row][col];
          addMultiple(m, row, col, factor);
          addMultiple(inverse, row, col, factor);
        }
    }

    return inverse;
  },

  multiply(a, b) {
    const aRows = a.length;
    const aCols = a[0].length;
    const bRows = b.length;
    const bCols = b[0].length;

    if (aCols !== bRows)
      throw new Error('Cannot multiply the matrices!');

    const inner = aCols;
    const m = [];

    for (let rM = 0; rM < aRows; ++rM) {
      console.log(`${rM}/${aRows}`)
      const mRow = [];
      m[rM] = mRow;
      for (let cM = 0; cM < bCols; ++cM) {
        let dot = 0;
        for (let i = 0; i < inner; ++i)
          dot += a[rM][i] * b[i][cM];
        mRow[cM] = dot;
      }
    }

    return m;
  }
};
