import React, {
  memo, useCallback, useState, useMemo, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { getCSSVariableAsString } from '@codaco/ui/lib/utils/CSSVariables';
import { DataCard } from '@codaco/ui/lib/components/Cards';
import { Spinner } from '@codaco/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  makeGetAdditionalAttributes,
  makeNetworkNodesForPrompt,
  makeNetworkNodesForOtherPrompts,
} from '../selectors/interface';
import { getNetworkEdges, getNetworkEgo } from '../selectors/network';
import { actionCreators as sessionsActions } from '../ducks/modules/sessions';
import { Panel, Panels } from '../components';
import { getPanelConfiguration } from '../selectors/name-generator';
import { get } from '../utils/lodash-replacements';
import useDropMonitor from '../behaviours/DragAndDrop/useDropMonitor';
import Node from './Node';
import usePropSelector from './Interfaces/NameGeneratorRoster/usePropSelector';
import SearchableList from './SearchableList';
import { useDragMonitor } from '../behaviours/DragAndDrop/MonitorDragSource';
import useExternalData from '../hooks/useExternalData';
import customFilter from '../utils/networkQuery/filter';

/**
  * Configures and renders `NodePanels` according to the protocol config
  */

const initialPanelState = {
  loading: false,
  error: null,
  items: [],
};

const panelWithInitialState = (panel) => ({
  ...panel,
  ...initialPanelState,
});

const NodePanels = memo((props) => {
  const {
    prompt,
  } = props;

  const activePromptId = prompt.id;

  const panelDefinitions = usePropSelector(getPanelConfiguration, props);
  const newNodeAttributes = usePropSelector(makeGetAdditionalAttributes(), props);
  const [panels, setPanels] = useState([...panelDefinitions.map(panelWithInitialState)]);

  const dispatch = useDispatch();
  const removeNodeFromPrompt = useCallback((nodeId) => {
    dispatch(sessionsActions.removeNodeFromPrompt(prompt.id, nodeId));
  }, [dispatch, prompt.id]);

  const removeNode = useCallback((nodeId) => {
    dispatch(sessionsActions.removeNode(nodeId));
  }, [dispatch]);

  const colorPresets = useMemo(() => ([
    getCSSVariableAsString('--primary-color-seq-1'),
    getCSSVariableAsString('--primary-color-seq-2'),
    getCSSVariableAsString('--primary-color-seq-3'),
    getCSSVariableAsString('--primary-color-seq-4'),
    getCSSVariableAsString('--primary-color-seq-5'),
  ]), []);

  const firstPanelMeta = useDropMonitor('PANEL_NODE_LIST_0')
    || { isOver: false, willAccept: false };

  const secondPanelMeta = useDropMonitor('PANEL_NODE_LIST_1')
    || { isOver: false, willAccept: false };

  const {
    isDragging,
    meta,
  } = useDragMonitor();

  const getHighlight = useCallback(
    (panelNumber) => colorPresets[panelNumber % colorPresets.length],
    [colorPresets],
  );

  const handleDrop = useCallback(
    ({ meta }) => {
      /**
       * Handle a node being dropped into a panel
       * If this panel is showing the interview network, remove the node from the current prompt.
       * If it is an external data panel, remove the node form the interview network.
      */
      if (dataSource === 'existing') {
        removeNodeFromPrompt(
          meta[entityPrimaryKeyProperty],
          prompt.id,
          newNodeAttributes,
        );
      } else {
        removeNode(meta[entityPrimaryKeyProperty]);
      }
    },
    [newNodeAttributes, prompt.id, removeNode, removeNodeFromPrompt],
  );

  const isPanelEmpty = useCallback((index) => {
    const count = get(panelDefinitions, [index, 'count']);

    return count === 0;
  }, []);

  const isPanelLoading = useCallback((index) => {
    const loading = get(panelDefinitions, [index, 'loading']);
    return loading;
  }, []);

  const isPanelCompatible = useCallback((index) => () => {
    // ?
    if (panelDefinitions.length !== panels.length) { return false; }

    const panel = panels[index];
    const panelDefinition = panelDefinitions[index].index;

    // We only accept existing nodes in panels
    if (meta.itemType !== 'EXISTING_NODE') { return false; }

    // Rules for when panel contains existing nodes
    if (panel.dataSource === 'existing') {
      // Don't allow nodes into existing panel if this is their last prompt ID
      return (
        meta.promptIDs.length !== 1
      );
    }

    // Panel source is external data if we get here
    // For external data, we only allow nodes into the panel if their ID is contained
    // in the panel's index.
    console.log('isPanelCompatible', panelDefinition, meta);
    return panelDefinition && panelDefinition.has(meta[entityPrimaryKeyProperty]);
  }, [meta, panelDefinitions, panels]);

  const isPanelOpen = useCallback((index) => {
    const isCompatible = isPanelCompatible(index);
    const isNotEmpty = !isPanelEmpty(index);
    const isLoading = isPanelLoading(index);

    return isLoading || isNotEmpty || (isDragging && isCompatible);
  }, [isDragging, isPanelCompatible, isPanelEmpty, isPanelLoading]);

  const isAnyPanelOpen = useMemo(() => panels.some((_, index) => isPanelOpen(index)), [panels]);

  const renderNodePanel = useCallback((panel, index) => {
    const {
      title,
      dataSource,
      filter,
      loading,
      error,
      nodes,
    } = panel;

    const {
      stage,
    } = props;

    const {
      subject,
      id: stageId,
    } = stage;

    // data fetching and filtering

    // Small utility that returns the entityPrimaryKeyProperty of an entity
    const getNodeId = (node) => node[entityPrimaryKeyProperty];

    // Test if a given node is in a given Set of nodes
    const notInSet = (set) => (node) => !set.has(node[entityPrimaryKeyProperty]);

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

    const handlePanelUpdate = (index) => (nodeCount, nodeIndex, isLoading) => {
      const panelIndexes = [panels.panelIndexes];
      panelIndexes[index] = { count: nodeCount, index: nodeIndex, isLoading };
        return {
          panelIndexes,
        };
    }

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

      const filteredPanelNodes = filteredNodes.filter(notInSet(filterSet));

      // reformat filteredPanelNodes as panelItems for DataCard component
      const panelItems = [];
      filteredPanelNodes.forEach((item) => {
        panelItems.push({
         attributes: item.attributes,
          data: item,
          props: {
            label: Object.values(item.attributes)[0],
         },
        });
      });

      setFilteredPanelNodes(panelItems);

    }, [nodeIds, sourceNodes, filter, edges, ego, dataSource]);

    // Once data is loaded, send the parent a complete list of NodeIDs that can
    // then be used to determine if a node originated here.
    useEffect(() => {
      const { isLoading } = status;
      const panelNodeIds = sourceNodes ? new Set(sourceNodes.map(getNodeId)) : new Set();
      const onUpdate = handlePanelUpdate(index);
      onUpdate(panelNodeIds.size, panelNodeIds, isLoading);
    }, [sourceNodes, status]);


    return (
      <Panel
        key={index}
        title={title}
        minimized={!isPanelOpen(index)}
        highlight={getHighlight(index)}
      >
        {loading && (
          <>
            <Spinner small />
            <h4>Loading...</h4>
          </>
        )}
        {error && (<h4>Error!</h4>)}
        {!loading && !error && (
          <SearchableList
            id={`PANEL_NODE_LIST_${index}`}
            itemType="NEW_NODE" // drop type
            items={filteredPanelNodes}
            columns={2}
            dragComponent={Node}
            itemComponent={DataCard}
            onDrop={handleDrop}
            accepts={({ meta }) => get(meta, 'itemType', null) !== 'SOURCE_NODES'}
          />
        )}
      </Panel>
    );
  }, [handleDrop, isPanelCompatible, isPanelOpen, panels, prompt]);

  return (
    <Panels minimize={!isAnyPanelOpen}>
      {panels.map(renderNodePanel)}
    </Panels>
  );
});

NodePanels.propTypes = {
  prompt: PropTypes.object,
};

NodePanels.defaultProps = {
  prompt: { id: null },
};

export default NodePanels;
