import React, {
  useState,
  useMemo,
  useCallback,
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
  } = props;

  const {
    subject,
    id: stageId,
  } = stage;

  const [panelNodes, setPanelNodes] = useState([]);
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
    // If there are no source nodes, return an empty array
    if (!sourceNodes) {
      setPanelNodes([]);
      return;
    }

    // Filter potential nodes based on the panel's filter property
    let filteredNodes;

    if (!filter) {
      filteredNodes = sourceNodes;
    } else {
      const result = customFilter(filter)({ nodes: sourceNodes, edges, ego });
      filteredNodes = result.nodes;
    }

    // Set panelNodes based on the dataSource
    if (dataSource === 'existing') {
      setPanelNodes(filteredNodes.filter(notInSet(new Set(nodeIds.prompt))));
      return;
    }

    // We haven't yet recieved external data (must be loading)
    if (!externalNodes) {
      setPanelNodes([]);
      return;
    }

    // We have external data
    setPanelNodes(filteredNodes.filter(notInSet(new Set([...nodeIds.prompt, ...nodeIds.other]))));
  }, [nodeIds, sourceNodes]);

  useEffect(() => {
    const { isLoading } = status;
    const panelNodeIds = new Set(panelNodes.map(getNodeId));

    onUpdate(panelNodes.length, panelNodeIds, isLoading);
  }, [panelNodes, status]);

  const handleDrop = useCallback((item) => onDrop(item, dataSource), [onDrop, dataSource]);

  return (
    <Panel
      title={title}
      minimize={minimize}
    >
      {status.isLoading ? ( // Replace with the loading state of NodeList when that is updated
        <h4>Loading</h4>
      ) : (
        <NodeList
          items={panelNodes}
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
