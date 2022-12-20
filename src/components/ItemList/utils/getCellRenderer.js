import React, { useContext, useMemo, useEffect, memo } from 'react';
import { entityAttributesProperty, entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { motion, useAnimation } from 'framer-motion';
import { getDataIndex, getDelay } from '.';
import ListContext from '../ListContext';
import { DragSource } from '../../../behaviours/DragAndDrop';
import { areEqual } from 'react-window';

/**
 * @function getCellRenderer
 * Function called for each item when rendering the grid
 * @param {*} Component - A component for use when rendering
 * @returns function
 */
const getCellRenderer = (Component, gridProps) => (props) => {
  const {
    data,
    columnIndex,
    rowIndex,
    isScrolling,
    style,
  } = props;

  const {
    columnCount,
    rowHeight,
    containerHeight,
  } = gridProps;

  const animation = useAnimation();

  // Data passed to List as "itemData" is available as props.data
  const items = data;

  const dataIndex = getDataIndex(columnCount, { columnIndex, rowIndex });

  const item = items[dataIndex];

  const delay = getDelay(
    isScrolling,
    rowHeight,
    containerHeight,
    columnCount,
    columnIndex,
    rowIndex,
  );

  const shouldAnimate = !isScrolling && delay > 0;

  // Here is where we define and manage our initial mounting animation for this cell
  useEffect(() => {
    if (shouldAnimate) {
      animation.start({
        opacity: 1,
        y: 0,
        transition: {
          delay,
        },
      });
    }
    return () => animation.stop();
  }, []);

  if (!item) {
    debugger;
    return null;
  }

  return (
    <motion.div
      initial={shouldAnimate && {
        opacity: 0,
        y: '75%',
      }}
      animate={animation}
      className="item-list__item"
      style={style}
      key={item[entityPrimaryKeyProperty]}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
    >
      <Component
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...item}
      />
    </motion.div>
  );
};

export default getCellRenderer;
