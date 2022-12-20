import {
  useMemo,
  useCallback,
} from 'react';
import { get } from '../../../utils/lodash-replacements';

/**
 *
 * @param {N} useItemSizing - Whether or not we should base column count on item size
 * @param {*} columnBreakpoints - Breakpoints for column count (when not using item sizing)
 * @param {*} itemSize - Size of the item (taken from ref)
 * @param {*} items - Collection of all items to render
 * @param {*} containerWidth - Width of the container
 * @returns
 *
 *
 * Needs to return:
 *   columnCount: number
 *   rowCount: number
 *   columnWidth: (index: number) => number
 *   rowHeight: (index: number) => number
 */

const useGridSizer = ({
  useItemSizing,
  columnBreakpoints,
  itemSize,
  containerSize,
  items,
}) => {
  /**
    * Calculate the number of columns to render.
   */
  const columnCount = useMemo(() => {
    const containerWidth = get(containerSize, 'width', 0);

    if (containerWidth === 0) { return 0; }
    /**
     * When using item sizing, column width is based on the width of the
     * item.
     */
    if (useItemSizing) {
      const width = get(itemSize, 'width', 0);

      if (width === 0) { return 0; }

      const columns = Math.floor(containerWidth / width);
      return columns > 1 ? columns : 1;
    }

    /**
     * When not using item sizing, we need to calculate the number of columns
     * based on the container width and the breakpoints.
     */
    const breakpoints = Object.keys(columnBreakpoints).sort(); // Sort breakpoints

    // Find the breakpoint that is closest to the container width
    const activeBreakpoint = breakpoints.find((bp) => bp < containerWidth);

    // Return the number of columns for that breakpoint, or 1 if none found
    return columnBreakpoints[activeBreakpoint] || 1;
  }, [useItemSizing, containerSize, columnBreakpoints]);

  /**
   * Calculate the number of rows to render.
   */
  const rowCount = useMemo(() => {
    if (items.length === 0) { return 0; }

    // Rows is the number of items divided by the number of columns
    return Math.ceil(items.length / columnCount);
  }, [items, columnCount]);

  /**
   * Calculate the width of each column.
   *
   * We don't have variable column widths, so this is just the container width
   * divided by the number of columns.
   */
  const columnWidth = useCallback(() => {
    const containerWidth = get(containerSize, 'width', 0);
    return containerWidth / columnCount;
  }, [containerSize, columnCount, itemSize]);

  /**
   * Calculate the height of each row.
   *
   * For now, assume that all rows are the same height.
   */
  const rowHeight = useCallback(
    (rowIndex) => {
      // Get the hiddenSizing element's intrinsic height
      const height = get(itemSize, 'height', 0);

      // If we are using item sizing, return the intrinsic height
      if (useItemSizing) { return height; }

      // Otherwise, we need to resize the hiddenSizing element to the column
      // with, and then calculate the height of the tallest item.
      // For now!
      return height;

      // hiddenSizingEl.style.width = `${columnWidth()}px`;

      // const start = rowIndex * columnCount;
      // const end = start + columnCount;

      // const biggestRowHeight = items.slice(start, end)
      //   .reduce(
      //     (acc) => (
      //       height > acc
      //         ? height
      //         : acc
      //     ), 0,
      //   );

      // return biggestRowHeight > 0 ? biggestRowHeight : minimumHeight;
    },
    [useItemSizing, itemSize],
  );

  const ready = columnCount > 0 && rowCount > 0 && rowHeight(0) > 0 && columnWidth(0) > 0;

  const key = `${columnCount}-${rowCount}-${rowHeight(0)}-${columnWidth(0)}-${ready}`;

  console.log('useGridSizer', itemSize, key, ready);
  return {
    ready,
    key,
    columnCount,
    columnWidth,
    rowCount,
    rowHeight,
  };
};

export default useGridSizer;
