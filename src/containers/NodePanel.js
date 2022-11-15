import React, { useEffect } from 'react';
import { get } from 'lodash';
import {
  makeNetworkNodesForPrompt,
  makeNetworkNodesForOtherPrompts,
} from '../selectors/interface';
import usePropSelector from './Interfaces/NameGeneratorRoster/usePropSelector';
import { getNetworkEdges, getNetworkEgo } from '../selectors/network';
import { Panel, NodeList } from '../components';
import { entityPrimaryKeyProperty } from '../ducks/modules/network';
import customFilter from '../utils/networkQuery/filter';

const NodePanel = (props) => {
  const {
    title,
    highlight,
    dataSource,
    id,
    listId,
    minimize,
    onDrop,
    externalData,
    filter,
    ...nodeListProps
  } = props;

  const getNodes = () => {
    const getNodeId = (node) => node[entityPrimaryKeyProperty];

    const nodesForPrompt = usePropSelector(makeNetworkNodesForPrompt, props, true);
    const nodesForOtherPrompts = usePropSelector(makeNetworkNodesForOtherPrompts, props, true);
    const nodeIds = {
      prompt: nodesForPrompt.map(getNodeId),
      other: nodesForOtherPrompts.map(getNodeId),
    };
    const notInSet = (set) => (node) => !set.has(node[entityPrimaryKeyProperty]);

    if (dataSource === 'existing') {
      const nodes = nodesForOtherPrompts.filter(notInSet(new Set(nodeIds.prompt)));
      return nodes;
    }

    if (!externalData) { return []; }

    const nodes = get(
      externalData,
      'nodes',
      [],
    )
      .filter(notInSet(new Set([...nodeIds.prompt, ...nodeIds.other])));
    return nodes;
  };

  const nodes = getNodes(props);

  const nodeFilter = filter;
  if (nodeFilter && typeof nodeFilter !== 'function') {
    const filterFunction = customFilter(nodeFilter);
    return filterFunction({
      nodes,
      edges: usePropSelector(getNetworkEdges, props, true),
      ego: usePropSelector(getNetworkEgo, props, true),
    });
  }

  // Because the index is used to determine whether node originated in this list
  // we need to supply an index for the unfiltered list for externalData.
  const fullNodeIndex = () => {
    const externalNodes = get(externalData, 'nodes', []);
    const allNodes = (dataSource === 'existing' ? nodes : externalNodes);
    return new Set(allNodes.map((node) => node[entityPrimaryKeyProperty]));
  };
  // This can use the displayed nodes for a count as it is used to see whether the panel
  // is 'empty'
  const nodeDisplayCount = () => nodes.length;
  const sendNodesUpdate = () => {
    const { onUpdate } = props;
    onUpdate(
      nodeDisplayCount(),
      fullNodeIndex(),
    );
  };

  // effect hook for calling sendNodesUpdate, replaces componentDidMount and componentDidUpdate
  useEffect(() => {
    sendNodesUpdate();
  }, [nodes.length]);

  const handleDrop = (item) => onDrop(item, dataSource);

  return (
    <Panel
      title={title}
      highlight={highlight}
      minimize={minimize}
    >
      <NodeList
        {...nodeListProps}
        items={nodes}
        listId={listId}
        id={id}
        itemType="NEW_NODE"
        onDrop={handleDrop}
      />
    </Panel>
  );
};

export default NodePanel;
