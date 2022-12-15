import React, {
  useState,
  useMemo,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { entityPrimaryKeyProperty, entityAttributesProperty } from '@codaco/shared-consts';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner } from '@codaco/ui';
import v4 from 'uuid/v4';
import { DataCard } from '@codaco/ui/lib/components/Cards';
import { getNetworkEdges, getNetworkEgo } from '../selectors/network';
import { Panel } from '../components';
import { Node } from './Node';
import useExternalData from '../hooks/useExternalData';
import customFilter from '../utils/networkQuery/filter';
import useDropMonitor from '../behaviours/DragAndDrop/useDropMonitor';
import { useDragMonitor } from '../behaviours/DragAndDrop/MonitorDragSource';
import { actionCreators as sessionsActions } from '../ducks/modules/sessions';
import { InterfaceContext } from './Interfaces/NameGenerator/NameGenerator';
import { get } from '../utils/lodash-replacements';
import HyperList from './HyperList';

// Small utility that returns the entityPrimaryKeyProperty of an entity
const getNodeId = (node) => node[entityPrimaryKeyProperty];

// Test if a given node is in a given Set of nodes
const notInSet = (set) => (node) => !set.has(node[entityPrimaryKeyProperty]);

const NodePanel = ({
  configuration,
  highlight,
  disableAddNew,
}) => {
  const {
    id,
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

  // We connect to the drag monitor to know if the panel needs to open when
  // minimizedto allow a node to be dropped inside it
  const {
    isDragging,
    meta: dragMeta,
  } = useDragMonitor();

  // Monitor the drop state of the SearchableList
  const panelDropMeta = useDropMonitor(id) || { isOver: false, willAccept: false };

  const [initialPanelNodes, setInitialPanelNodes] = useState([]);
  const [filteredPanelNodes, setFilteredPanelNodes] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const edges = useSelector(getNetworkEdges);
  const ego = useSelector(getNetworkEgo);

  const nodeIds = useMemo(() => ({
    prompt: nodesForPrompt.map(getNodeId),
    other: nodesForOtherPrompts.map(getNodeId),
  }), [nodesForPrompt, nodesForOtherPrompts]);

  const itemFormatter = useCallback((item) => {
    if (usesExternalData) {
      // DataCard requires different object structure
      return {
        id: item[entityPrimaryKeyProperty] || v4(),
        [entityAttributesProperty]: item.attributes,
        data: item,
        props: {
          label: Object.values(item.attributes)[0],
          data: {
            [Object.keys(item.attributes)[1]]: Object.values(item.attributes)[1],
          },
        },
      };
    }

    return {
      id: item[entityPrimaryKeyProperty] || v4(),
      ...item,
    };
  }, [usesExternalData]);

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
    // If we have a filter specified for the panel, construct a filter and apply it.
    // Otherwise, just use the source nodes.
    const filteredNodes = filter
      ? customFilter(filter)({ nodes: sourceNodes, edges, ego }).nodes
      : sourceNodes;

    /**
     * filterSet contains nodeIds of nodes that should be filtered out of the
     * panel.
     *
     * When using the interview network(dataSource === 'existing'), just filter
     * out nodes that are nominated on the current prompt.
     *
     * When using an external data source, filter all nodes in the network by
     * combining current prompt nodes and other prompt nodes.
     */
    const filterSet = new Set([
      ...nodeIds.prompt,
      ...(usesExternalData ? nodeIds.other : []),
    ]);

    setFilteredPanelNodes(filteredNodes.filter(notInSet(filterSet)).map(itemFormatter));
  }, [nodeIds, sourceNodes, filter, edges, ego, dataSource, itemFormatter]);

  // Once data is loaded, send the parent a complete list of NodeIDs that can
  // then be used to determine if a node originated here.
  useEffect(() => {
    const panelNodeIds = sourceNodes ? new Set(sourceNodes.map(getNodeId)) : new Set();
    setInitialPanelNodes(panelNodeIds);
  }, [sourceNodes, status]);

  const handleDrop = useCallback(
    ({ meta: dropMeta }) => {
      // 1. If this panel is showing the interview network, remove the node from the current prompt.
      if (dataSource === 'existing') {
        dispatch(sessionsActions.removeNodeFromPrompt(
          dropMeta[entityPrimaryKeyProperty],
          prompt.id,
          newNodeAttributes,
        ));
        return;
      }

      // 2. If it is an external data panel, remove the node form the interview network.
      dispatch(sessionsActions.removeNode(dropMeta[entityPrimaryKeyProperty]));
    },
    [newNodeAttributes, prompt.id, dispatch, dataSource],
  );

  const ItemComponent = useMemo(() => (
    usesExternalData ? DataCard : Node
  ), [usesExternalData]);

  // Control the panel's minimized state based on the drag monitor
  useEffect(() => {
    if (isDragging && dragMeta.itemType === 'NEW_NODE') {
      setMinimized(false);
    }
  }, [isDragging, dragMeta]);

  console.log('filteredPanelNodes', filteredPanelNodes);
  return (
    <Panel
      title={title}
      minimized={minimized}
      highlight={highlight}
    >
      {loading && (
        <>
          <Spinner small />
          <h4>Loading...</h4>
        </>
      )}
      {error && (<h4>Error!</h4>)}
      {!loading && !error && (
        <HyperList
          id={id}
          itemType="NEW_NODE" // drop type
          emptyComponent={() => (<h1>Empty panel should be hidden</h1>)}
          items={filteredPanelNodes}
          columns={usesExternalData ? 1 : 3}
          dragComponent={Node} // Todo - must be set to the correct color for stage subject
          itemComponent={ItemComponent}
          onDrop={handleDrop}
          accepts={({ meta: acceptsMeta }) => get(acceptsMeta, 'itemType', null) !== 'SOURCE_NODES'}
        />
      )}
    </Panel>
  );
};

export default NodePanel;
