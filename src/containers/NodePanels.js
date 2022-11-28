import React, { memo, useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { getCSSVariableAsString } from '@codaco/ui/lib/utils/CSSVariables';
import { DataCard } from '@codaco/ui/lib/components/Cards';
import { Node, Spinner } from '@codaco/ui';
import { useDispatch } from 'react-redux';
import { makeGetAdditionalAttributes } from '../selectors/interface';
import { actionCreators as sessionsActions } from '../ducks/modules/sessions';
import { Panel, Panels } from '../components';
import { getPanelConfiguration } from '../selectors/name-generator';
import { get } from '../utils/lodash-replacements';
import useDropMonitor from '../behaviours/DragAndDrop/useDropMonitor';
import usePropSelector from './Interfaces/NameGeneratorRoster/usePropSelector';
import SearchableList from './SearchableList';
import { useDragMonitor } from '../behaviours/DragAndDrop/MonitorDragSource';

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
    ({ meta }, dataSource) => {
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

    // ??
    const panelItems = [];

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
            id={`PANEL_${index}`}
            items={panelItems}
            columns={2}
            dragComponent={Node}
            itemComponent={DataCard}
            onDrop={handleDrop}
            accepts={() => isPanelCompatible(index)}
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
