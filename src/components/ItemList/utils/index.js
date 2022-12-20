// items = [ { id: 1, name: 'foo' }, { id: 2, name: 'bar' }, { id: 3, name: 'baz' }]
// columns = 3
// columnIndex

// Get the index of the item in the array based on the current row and column
// Must never be less than 0 or greater than the number of items
export const getDataIndex = (columns, { rowIndex, columnIndex }) => {
  // When Row is 6 and Column is 2 should return 18
  // When Row is 0 and Column is 0 should return 0
  // When Row is 0 and Column is 1 should return 1

  if (rowIndex === 0) {
    return columnIndex;
  }

  if (columnIndex === 0) {
    return rowIndex * columns;
  }

  return (rowIndex * columns) + columnIndex - 1;
};

/**
 * @function getDelay
 * Calculates an animation delay for each cell based on its position as well as the
 * current scrolling state of the list.
 *
 * @param {boolean} isScrolling - is the list currently scrolling?
 * @param {number} rowHeight - pixel height of the current row
 * @param {number} containerHeight - pixel height of the list
 * @param {number} numberOfColumns - number of vertical divisions
 * @param {number} columnIndex - the column index of the current item
 * @param {number} rowIndex - the row index of the current item
 * @returns number
 */
export const getDelay = (
  isScrolling,
  rowHeight,
  containerHeight,
  numberOfColumns,
  columnIndex,
  rowIndex,
) => {
  const ITEM_STAGGER = 0.5; // Gap between items

  const rowsToAnimate = Math.ceil(containerHeight / rowHeight()); // Don't animate past viewport

  // Don't delay at all if we are scrolling. This prevents list animation when scrolling back up
  if (isScrolling) { return 0; }

  if (numberOfColumns === 1) {
    // If we only have one column, stagger by row
    return (rowIndex + 1) * ITEM_STAGGER;
  }

  // Calculate the delay based on the cell's row and column position
  const colDelay = (columnIndex + 1) * ITEM_STAGGER;
  const rowDelay = (rowIndex % rowsToAnimate) * (ITEM_STAGGER * numberOfColumns);
  return colDelay + rowDelay;
};
