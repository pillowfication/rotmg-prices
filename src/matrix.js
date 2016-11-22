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
