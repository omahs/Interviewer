/* eslint-disable no-nested-ternary */
import React, {
  useState,
  useContext,
  useMemo,
  useCallback,
} from 'react';
import uuid from 'uuid/v4';
import { isNil } from 'lodash';
import { compose } from 'recompose';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeGrid as Grid } from 'react-window';
import cx from 'classnames';
import useDebounce from '../../hooks/useDebounce';
import { DragSource, DropTarget, MonitorDropTarget } from '../../behaviours/DragAndDrop';
import useGridSizer from './useGridSizer';

const LargeRosterNotice = () => (
  <div
    className="large-roster-notice__wrapper"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <motion.div
      className="large-roster-notice"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h2>Too many items to display.</h2>
      <p>Use the search feature to see results here.</p>
    </motion.div>
  </div>
);

const GUTTER_SIZE = 14;

const ListContext = React.createContext({ items: [], columns: 0 });

const NoopComponent = () => null;

const getDataIndex = (columns, { rowIndex, columnIndex }) => (
  (rowIndex * columns) + columnIndex
);

const getCellRenderer = (Component, DragComponent, allowDragging) => ({
  columnIndex,
  rowIndex,
  style,
}) => {
  const {
    columns,
    items,
    itemType,
    dynamicProperties,
  } = useContext(ListContext);

  const dataIndex = getDataIndex(columns, { rowIndex, columnIndex });

  const item = items[dataIndex];

  if (!item) { return null; }

  const { id, data, props } = item;
  const { disabled } = dynamicProperties;

  const isDisabled = disabled && disabled.includes(id);

  const preview = DragComponent
    ? <DragComponent {...data} />
    : null;

  return (
    <div
      className="hyper-list__item"
      style={{
        ...style,
        left: style.left + GUTTER_SIZE,
        top: style.top + GUTTER_SIZE,
        width: style.width - GUTTER_SIZE,
        height: style.height - GUTTER_SIZE,
      }}
      key={id}
    >
      <Component
        {...props}
        meta={() => ({ data, id, itemType })}
        disabled={isDisabled}
        allowDrag={allowDragging && !isDisabled}
        preview={preview}
      />
    </div>
  );
};

/**
  * Renders an arbitrary list of items using itemComponent.
  *
  * Includes drag and drop functionality.
  *
  * @prop {Array} items Items in format [{ id, props: {}, data: {} }, ...]
  * @prop {Object} dynamicProperties Can be used for mutating properties,
  * that aren't necessarily part of item data. This is because items may
  * go through several filters before reaching HyperList, and these dynamic
  * properties may not be relevant (e.g. recomputing search results when
  * item values haven't changed). Currently only used to get the list of
  * disabled items.
  * @prop {React Component} emptyComponent React component to render when items is an empty array.
  * @prop {React Component} itemComponent React component, rendered with `{ props }` from item.
  * `{ data }`, `id`, and `itemType` is passed to the drag and drop state.
  * @prop {React node} placeholder React node. If provided will override rendering of
  * items/emptyComponent and will be rendered instead.
  * example usage: `<HyperList placeholder={(<div>placeholder</div>)} />`
  * @prop {number} columns Number of columns
  * @prop {string} itemType itemType used by drag and drop functionality
  */
const HyperList = ({
  className,
  items,
  dynamicProperties,
  columns,
  itemComponent: ItemComponent,
  dragComponent: DragComponent,
  emptyComponent: EmptyComponent,
  placeholder,
  itemType,
  showTooMany,
  allowDragging,
}) => {
  const [width, setWidth] = useState(0);
  const debouncedWidth = useDebounce(width, 1000);
  const columnCount = useMemo(() => {
    if (!debouncedWidth) { return 1; }
    return typeof columns === 'number'
      ? columns
      : columns(debouncedWidth);
  }, [columns, debouncedWidth]);

  const CellRenderer = useMemo(
    () => getCellRenderer(DragSource(ItemComponent), DragComponent, allowDragging),
    [ItemComponent, DragComponent],
  );

  const handleResize = useCallback(
    ({ width: newWidth }) => setWidth(newWidth - (GUTTER_SIZE)),
    [setWidth],
  );

  const context = useMemo(() => ({
    items,
    columns: columnCount,
    dynamicProperties,
    itemType,
  }), [items, columnCount, dynamicProperties, itemType]);

  const classNames = cx(
    'hyper-list',
    className,
  );

  const SizeRenderer = useCallback((props) => (
    <div className="hyper-list__item"><ItemComponent {...props} /></div>
  ), [ItemComponent]);

  const [gridProps, ready] = useGridSizer(SizeRenderer, items, columnCount, debouncedWidth);

  const itemKey = useCallback((index) => {
    const dataIndex = getDataIndex(columnCount, index);

    // If last row is shorter than number of columns
    if (dataIndex >= items.length) { return null; }

    const key = items[dataIndex] && items[dataIndex].id;

    if (isNil(key)) {
      // Something went wrong, this is a failsafe but will force a rerender every time
      console.debug('`itemKey()` returned undefined in `<HyperList />`'); // eslint-disable-line no-console
      return uuid();
    }

    return key;
  }, [columnCount, items]);

  // If placeholder is provider it supersedes everything
  const showPlaceholder = !!placeholder;
  // If items is provided but is empty show the empty component
  const showEmpty = !placeholder && items && items.length === 0;
  // Otherwise show the results!
  const showResults = !placeholder && items && items.length > 0;

  return (
    <>
      <motion.div
        className={classNames}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ListContext.Provider value={context}>
          <div className="hyper-list__container">
            <div className="hyper-list__sizer">
              <AnimatePresence exitBeforeEnter>
                {showPlaceholder ? placeholder : (
                  showEmpty ? <EmptyComponent /> : (
                    <AutoSizer onResize={handleResize}>
                      {(containerSize) => {
                        if (!ready) { return null; }
                        if (!showResults) { return null; }
                        return (
                          <Grid
                            className="hyper-list__grid"
                            height={containerSize.height}
                            width={containerSize.width}
                            itemKey={itemKey}
                            {...gridProps}
                          >
                            {CellRenderer}
                          </Grid>
                        );
                      }}
                    </AutoSizer>
                  )
                )}
              </AnimatePresence>
            </div>
          </div>
        </ListContext.Provider>
      </motion.div>
      <AnimatePresence>
        {showTooMany && (
          <LargeRosterNotice />
        )}
      </AnimatePresence>
    </>
  );
};

HyperList.propTypes = {
  itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  emptyComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  placeholder: PropTypes.node,
  columns: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  dynamicProperties: PropTypes.object,
  itemType: PropTypes.string,
};

HyperList.defaultProps = {
  itemComponent: NoopComponent,
  emptyComponent: NoopComponent,
  columns: 1,
  dynamicProperties: {},
  placeholder: null,
  itemType: 'HYPER_LIST',
};

export default compose(
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
)(HyperList);
