import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { get } from 'lodash';
import {
  makeNetworkNodesForPrompt as makeGetNodesForPrompt,
  makeNetworkNodesForOtherPrompts as makeGetNodesForOtherPrompts,
} from '../selectors/interface';
import { getNetworkEdges, getNetworkEgo } from '../selectors/network';
import { Panel, NodeList } from '../components';
import withExternalData from './withExternalData';
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
    nodes,
    ...nodeListProps
  } = props;
  // Because the index is used to determine whether node originated in this list
  // we need to supply an index for the unfiltered list for externalData.
  const fullNodeIndex = () => {
    const {
      externalData,
    } = props;
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

const getNodeId = (node) => node[entityPrimaryKeyProperty];

const makeGetNodes = () => {
  const getNodesForPrompt = makeGetNodesForPrompt();
  const getNodesForOtherPrompts = makeGetNodesForOtherPrompts();

  return (state, props) => {
    const nodesForPrompt = getNodesForPrompt(state, props);
    const nodesForOtherPrompts = getNodesForOtherPrompts(state, props);
    const nodeIds = {
      prompt: nodesForPrompt.map(getNodeId),
      other: nodesForOtherPrompts.map(getNodeId),
    };

    const notInSet = (set) => (node) => !set.has(node[entityPrimaryKeyProperty]);

    if (props.dataSource === 'existing') {
      const nodes = nodesForOtherPrompts
        .filter(notInSet(new Set(nodeIds.prompt)));

      return nodes;
    }

    if (!props.externalData) { return []; }

    const nodes = get(
      props.externalData,
      'nodes',
      [],
    )
      .filter(notInSet(new Set([...nodeIds.prompt, ...nodeIds.other])));
    return nodes;
  };
};

const makeMapStateToProps = () => {
  const getNodes = makeGetNodes();

  return (state, props) => {
    const nodes = getNodes(state, props);

    const nodeFilter = props.filter;
    if (nodeFilter && typeof nodeFilter !== 'function') {
      const filterFunction = customFilter(nodeFilter);
      return filterFunction({
        nodes,
        edges: getNetworkEdges(state, props),
        ego: getNetworkEgo(state, props),
      });
    }

    return {
      nodes,
    };
  };
};

export { NodePanel };

export default compose(
  withExternalData('externalDataSource', 'externalData'),
  connect(makeMapStateToProps),
)(NodePanel);
