import React, {
  useState,
  useMemo,
  useEffect,
} from 'react';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { useSelector } from 'react-redux';
import {
  makeNetworkNodesForPrompt,
  makeNetworkNodesForOtherPrompts,
} from '../selectors/interface';
import usePropSelector from './Interfaces/NameGeneratorRoster/usePropSelector';
import { getNetworkEdges, getNetworkEgo } from '../selectors/network';
import { Panel, NodeList } from '../components';
import useExternalData from '../hooks/useExternalData';
import customFilter from '../utils/networkQuery/filter';

// Small utility that returns the entityPrimaryKeyProperty of an entity
const getNodeId = (node) => node[entityPrimaryKeyProperty];

// Test if a given node is in a given Set of nodes
const notInSet = (set) => (node) => !set.has(node[entityPrimaryKeyProperty]);

const NodePanel = (props) => {
  const {
    id,
    listId,
    dataSource,
    onDrop,
    onUpdate,
    filter,
    title,
    minimize,
    stage,
    disableDragNew,
    ...nodeListProps
  } = props;

  const {
    subject,
    id: stageId,
  } = stage;

  const [filteredPanelNodes, setFilteredPanelNodes] = useState([]);
  const [externalNodes, status] = useExternalData(dataSource, subject);

  const nodesForCurrentPrompt = usePropSelector(makeNetworkNodesForPrompt, props, true);
  const nodesForOtherPrompts = usePropSelector(makeNetworkNodesForOtherPrompts, props, true);
  const sourceNodes = useMemo(
    () => (dataSource === 'existing' ? nodesForOtherPrompts : externalNodes),
    [dataSource, nodesForOtherPrompts, externalNodes],
  );
  const edges = useSelector(getNetworkEdges);
  const ego = useSelector(getNetworkEgo);

  const nodeIds = useMemo(() => ({
    prompt: nodesForCurrentPrompt.map(getNodeId),
    other: nodesForOtherPrompts.map(getNodeId),
  }), [nodesForCurrentPrompt, nodesForOtherPrompts]);

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
      ...(dataSource !== 'existing' ? nodeIds.other : []),
    ]);

    setFilteredPanelNodes(filteredNodes.filter(notInSet(filterSet)));
  }, [nodeIds, sourceNodes, filter, edges, ego, dataSource]);

  // Once data is loaded, send the parent a complete list of NodeIDs that can
  // then be used to determine if a node originated here.
  useEffect(() => {
    const { isLoading } = status;
    const panelNodeIds = sourceNodes ? new Set(sourceNodes.map(getNodeId)) : new Set();

    onUpdate(panelNodeIds.size, panelNodeIds, isLoading);
  }, [sourceNodes, status]);

  const handleDrop = (item) => onDrop(item, dataSource);

  return (
    <Panel
      title={title}
      minimize={minimize}
    >
      {status.isLoading ? ( // Replace with the loading state of NodeList when that is updated
        <h4>Loading</h4>
      ) : (
        <NodeList
          {...nodeListProps}
          items={filteredPanelNodes}
          listId={listId}
          id={id}
          stageId={stageId}
          itemType="NEW_NODE"
          onDrop={handleDrop}
          disableDragNew={disableDragNew}
        />
      )}
    </Panel>
  );
};

export { NodePanel };

export default NodePanel;
