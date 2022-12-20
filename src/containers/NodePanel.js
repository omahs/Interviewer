import React, {
  useState,
  useMemo,
  useEffect,
  useContext,
  useCallback,
  memo,
} from 'react';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner, Node as UINode } from '@codaco/ui';
import { DataCard as UIDataCard } from '@codaco/ui/lib/components/Cards';
import { isEmpty } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';
import { getNetworkEdges, getNetworkEgo } from '../selectors/network';
import { InterfaceContext } from './Interfaces/NameGenerator/InterfaceContext';
import { Panel } from '../components';
import useExternalData from '../hooks/useExternalData';
import customFilter from '../utils/networkQuery/filter';
import useDropMonitor from '../behaviours/DragAndDrop/useDropMonitor';
import { useDragMonitor } from '../behaviours/DragAndDrop/MonitorDragSource';
import { actionCreators as sessionsActions } from '../ducks/modules/sessions';
import ItemList from '../components/ItemList/ItemList';
import { get } from '../utils/lodash-replacements';
import { DragSource } from '../behaviours/DragAndDrop';
import { Node as ConnectedNode } from './Node';

// Small utility that returns the entityPrimaryKeyProperty of an entity
const getNodeId = (node) => node[entityPrimaryKeyProperty];

// Test if a given node is in a given Set of nodes
const notInSet = (set) => (node) => !set.has(node[entityPrimaryKeyProperty]);

const DataCard = memo((item) => {
  const attributes = get(item, 'attributes', {});
  const label = get(attributes, 'label', 'No label');
  // const Component = DragSource(DataCard);
  const Component = UIDataCard;
  return (
    <Component
      label={label}
      data={{
        'foo': 'bar',
        'baz': 'qux',
      }}
    />
  );
}, (prevProps, nextProps) => prevProps.item === nextProps.item);

const Node = memo((item) => {
  const attributes = get(item, 'attributes', {});
  const label = get(attributes, 'label', 'No label');
  const Component = UINode;
  return (
    <Component
      label={label}
    />
  );
}, (prevProps, nextProps) => prevProps.item === nextProps.item);

const getItemComponentForPanel = (usesExternalData) => (usesExternalData ? DataCard : Node);

const NodePanel = ({
  accentColor,
  configuration,
}) => {
  const {
    title,
    dataSource,
    filter,
  } = configuration;

  const {
    stage: {
      subject,
    },
    nodesForPrompt,
    nodesForOtherPrompts,
    newNodeAttributes,
  } = useContext(InterfaceContext);

  const dispatch = useDispatch();
  const edges = useSelector(getNetworkEdges);
  const ego = useSelector(getNetworkEgo);

  // We connect to the drag monitor to know if the panel needs to open when
  // minimizedto allow a node to be dropped inside it
  const {
    isDragging,
    meta: dragMeta,
  } = useDragMonitor();

  // Monitor the drop state of the SearchableList
  // const panelDropMeta = useDropMonitor(id) || { isOver: false, willAccept: false };

  // Initial panel nodes used to determine if a node being dragged from elsewhere
  // originated within this panel.
  const [initialPanelNodes, setInitialPanelNodes] = useState([]);

  // Filtered panel nodes are nodes left over after dragged nodes and filtered
  // nodes are removed.
  const [filteredPanelNodes, setFilteredPanelNodes] = useState([]);

  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minimized, setMinimized] = useState(false);

  const usesExternalData = useMemo(() => dataSource !== 'existing', [dataSource]);
  const [externalNodes, status] = useExternalData(dataSource, subject);

  // Handle status changes from the external data hook
  useEffect(() => {
    const { isLoading, error: statusError } = status;

    if (isLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }

    if (statusError) {
      setError(error);
    }
  }, [status]);

  const sourceNodes = useMemo(
    () => (usesExternalData ? externalNodes : nodesForOtherPrompts),
    [dataSource, nodesForOtherPrompts, externalNodes],
  );

  const nodeIds = useMemo(() => ({
    prompt: nodesForPrompt.map(getNodeId),
    other: nodesForOtherPrompts.map(getNodeId),
  }), [nodesForPrompt, nodesForOtherPrompts]);

  useEffect(() => {
    /**
     * If there are no source nodes, we can skip all other processing, and just return
     * an empty array.
     *
     * This means either external data is still loading, or there are no nodes in the
     * interview network.
     */
    if (!sourceNodes) {
      setFilteredPanelNodes([]);
      return;
    }

    // If we have nodes and a filter,construct a filter and apply it.
    // Otherwise, just use the source nodes.
    const filteredNodes = filter
      ? customFilter(filter)({ nodes: sourceNodes, edges, ego }).nodes
      : sourceNodes;

    /**
     * `filterSet` contains nodeIds of nodes that should be filtered out of the
     * panel.
     *
     * When using the interview, only filter out nodes that are nominated on
     * the current prompt.
     *
     * When using an external data source, filter any nodes in the current
     * interview network by combining current prompt nodes and other prompt
     * nodes.
     */
    const filterSet = new Set([
      ...nodeIds.prompt,
      ...(usesExternalData ? nodeIds.other : []),
    ]);

    setFilteredPanelNodes(filteredNodes.filter(notInSet(filterSet)));
  }, [nodeIds, sourceNodes, filter, edges, ego, dataSource, usesExternalData]);

  // Once data is loaded, send the parent a complete list of NodeIDs that can
  // then be used to determine if a node originated here.
  useEffect(() => {
    const panelNodeIds = sourceNodes ? new Set(sourceNodes.map(getNodeId)) : new Set();
    setInitialPanelNodes(panelNodeIds);
  }, [sourceNodes]);

  const handleDrop = useCallback(
    ({ meta: dropMeta }) => {
      // If this panel is showing the interview network, remove the node from
      // the current prompt. This will cause it to be re-added to the panel.
      if (dataSource === 'existing') {
        dispatch(sessionsActions.removeNodeFromPrompt(
          dropMeta[entityPrimaryKeyProperty],
          prompt.id,
          newNodeAttributes,
        ));
        return;
      }

      // If it is an external data panel, remove the node form the interview
      // network, which will cause it to be re-added to the panel.
      dispatch(sessionsActions.removeNode(dropMeta[entityPrimaryKeyProperty]));
    },
    [newNodeAttributes, prompt.id, dispatch, dataSource],
  );

  // Control the panel's minimized state based on the drag monitor
  useEffect(() => {
    if (isDragging && dragMeta.itemType === 'NEW_NODE') {
      setMinimized(false);
    }
  }, [isDragging, dragMeta]);

  useEffect(() => {
    if (isEmpty(filteredPanelNodes)) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  }, [filteredPanelNodes]);

  if (hidden) {
    return null;
  }

  return (
    <Panel
      title={title}
      minimized={minimized}
      highlight={accentColor}
    >
      {loading && (
        <motion.div
          key="loading"
          className="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          <Spinner small />
          <h4>Loading...</h4>
        </motion.div>
      )}
      {error && (
        <motion.div
          className="error"
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <h4>Error!</h4>
        </motion.div>
      )}
      {!loading && !error && (
        <ItemList
          items={filteredPanelNodes}
          itemComponent={getItemComponentForPanel(usesExternalData)}
          emptyComponent={() => (<h1>Empty panel should be hidden</h1>)}
          useItemSizing={!usesExternalData}
          columnBreakpoints={{
            800: 2,
            1200: 3,
          }}
          itemType="NEW_NODE" // drop type
          onDrop={handleDrop}
          accepts={({ meta: acceptsMeta }) => get(acceptsMeta, 'itemType', null) !== 'SOURCE_NODES'}
        />
      )}
    </Panel>
  );
};

export default NodePanel;
