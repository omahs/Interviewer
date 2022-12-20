import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { debounce, get, isEmpty } from 'lodash';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import { VariableSizeGrid as Grid } from 'react-window';
import cx from 'classnames';
import useGridSizer from './hooks/useGridSizer';
import useSize from '../../hooks/useSize';
import getCellRenderer from './utils/getCellRenderer';
import ListContext from './ListContext';
import DefaultEmptyComponent from './DefaultEmptyComponent';
import DefaultDropOverlay from './DefaultDropOverlay';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';

const SCROLLBAR_WIDTH = 20;

const ItemList = ({
  className,
  items,
  useItemSizing,
  itemComponent: ItemComponent,
  emptyComponent: EmptyComponent,
  columnBreakpoints,
}) => {
  const containerRef = useRef(null);
  const itemSizeRef = useRef(null);

  const containerMeasurer = useSize(containerRef);
  const itemMeasurer = useSize(itemSizeRef);

  const {
    ready,
    key,
    columnCount,
    columnWidth,
    rowCount,
    rowHeight,
  } = useGridSizer({
    itemSize: itemMeasurer,
    items,
    containerSize: containerMeasurer,
    useItemSizing,
    columnBreakpoints,
  });

  const CellRenderer = useMemo(() => getCellRenderer(
    ItemComponent,
    { columnCount, rowHeight, containerHeight: containerMeasurer.height },
  ),
    [columnCount, rowHeight, containerMeasurer.height, containerMeasurer.width]);

  return (
    <div
      className={cx(
        'item-list',
        { 'item-list--empty': isEmpty(items) },
        className,
      )}
      ref={containerRef}
    >
      <AnimatePresence>
        {/* {active && <DefaultDropOverlay isOver={isOver} />} */}
      </AnimatePresence>
      <div className="item-list__container">
        <div className="hidden-sizer">
          <div ref={itemSizeRef} style={{ display: 'inline-flex' }}>
            <ItemComponent />
          </div>
        </div>
        <AnimatePresence exitBeforeEnter>
          {isEmpty(items) || !ready ? (<EmptyComponent />) : (
            <Grid
              className="item-list__grid"
              height={containerMeasurer.height}
              width={containerMeasurer.width}
              columnCount={columnCount}
              rowCount={rowCount}
              columnWidth={columnWidth}
              rowHeight={rowHeight}
              useIsScrolling
              itemData={items}
              itemKey={({ columnIndex, data, rowIndex }) => {
                const item = data[rowIndex * columnCount + columnIndex];
                return get(item, [entityPrimaryKeyProperty], `item-${rowIndex}-${columnIndex}`);
              }}
              overscanRowCount={2}
              estimatedRowHeight={itemMeasurer.height}
            >
              {CellRenderer}
            </Grid>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

ItemList.propTypes = {
  useItemSizing: PropTypes.bool,
  className: PropTypes.string,
  itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
  emptyComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  columnBreakpoints: PropTypes.object,
  items: PropTypes.array.isRequired,
};

ItemList.defaultProps = {
  useItemSizing: false,
  className: null,
  emptyComponent: DefaultEmptyComponent,
  columnBreakpoints: {
    250: 1,
    500: 2,
    750: 3,
  },
};

export default ItemList;
