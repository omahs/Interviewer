import React, { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { getCSSVariableAsString } from '@codaco/ui/lib/utils/CSSVariables';
import { makeGetAdditionalAttributes } from '../selectors/interface';
import { actionCreators as sessionsActions } from '../ducks/modules/sessions';
import { Panels } from '../components';
import { makeGetPanelConfiguration } from '../selectors/name-generator';
import NodePanel from './NodePanel';
import { MonitorDragSource } from '../behaviours/DragAndDrop';
import { get } from '../utils/lodash-replacements';

/**
  * Configures and renders `NodePanels` according to the protocol config
  */
class NodePanels extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      panelIndexes: [],
    };

    this.colorPresets = [
      getCSSVariableAsString('--primary-color-seq-1'),
      getCSSVariableAsString('--primary-color-seq-2'),
      getCSSVariableAsString('--primary-color-seq-3'),
      getCSSVariableAsString('--primary-color-seq-4'),
      getCSSVariableAsString('--primary-color-seq-5'),
    ];
  }

  getHighlight = (panelNumber) => {
    if (panelNumber === 0) { return null; }

    return this.colorPresets[panelNumber % this.colorPresets.length];
  };

  handleDrop = ({ meta }, dataSource) => {
    const {
      removeNodeFromPrompt,
      prompt,
      newNodeAttributes,
      removeNode,
    } = this.props;
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
  }

  isPanelEmpty = (index) => {
    const { panelIndexes } = this.state;
    const count = get(panelIndexes, [index, 'count']);

    return count === 0;
  };

  isPanelLoading = (index) => {
    const { panelIndexes } = this.state;
    const isLoading = get(panelIndexes, [index, 'isLoading']);
    return isLoading;
  };

  isPanelCompatible = (index) => {
    const {
      panels,
      meta,
    } = this.props;
    const { panelIndexes } = this.state;

    if (panelIndexes.length !== panels.length) { return false; }

    // We only accept existing nodes in panels
    if (meta.itemType !== 'EXISTING_NODE') { return false; }

    // Rules for when panel contains existing nodes
    const panel = panels[index];
    if (panel.dataSource === 'existing') {
      // Don't allow nodes into existing panel if this is their last prompt ID
      return (
        meta.promptIDs.length !== 1
      );
    }

    // Panel source is external data if we get here
    // For external data, we only allow nodes back into the panel if their ID is
    // contained in the panel's index.
    const panelIndex = panelIndexes[index].index;
    return panelIndex && panelIndex.has(meta[entityPrimaryKeyProperty]);
  };

  isPanelOpen = (index) => {
    const { isDragging } = this.props;
    const isCompatible = this.isPanelCompatible(index);
    const isNotEmpty = !this.isPanelEmpty(index);
    const isLoading = this.isPanelLoading(index);

    return isLoading || isNotEmpty || (isDragging && isCompatible);
  };

  isAnyPanelOpen = () => {
    const { panels } = this.props;
    return panels.some((_, index) => this.isPanelOpen(index));
  };

  handlePanelUpdate = (index) => (nodeCount, nodeIndex, isLoading) => {
    this.setState((state) => {
      const panelIndexes = [...state.panelIndexes];
      panelIndexes[index] = { count: nodeCount, index: nodeIndex, isLoading };

      return {
        panelIndexes,
      };
    });
  }

  renderNodePanel = (panel, index) => {
    const {
      stage,
      prompt,
      disableAddNew,
    } = this.props;

    const {
      dataSource,
      filter,
      ...nodeListProps
    } = panel;

    return (
      <NodePanel
        {...nodeListProps}
        key={index}
        prompt={prompt}
        stage={stage}
        disableDragNew={disableAddNew}
        dataSource={dataSource}
        filter={filter}
        accepts={() => this.isPanelCompatible(index)}
        minimize={!this.isPanelOpen(index)}
        id={`PANEL_NODE_LIST_${index}`}
        listId={`PANEL_NODE_LIST_${stage.id}_${prompt.id}_${index}`}
        itemType="NEW_NODE"
        onDrop={this.handleDrop}
        onUpdate={this.handlePanelUpdate(index)}
      />
    );
  }

  render() {
    const { panels } = this.props;

    return (
      <Panels minimize={!this.isAnyPanelOpen()}>
        {panels.map(this.renderNodePanel)}
      </Panels>
    );
  }
}

NodePanels.propTypes = {
  isDragging: PropTypes.bool,
  meta: PropTypes.object,
  panels: PropTypes.array,
  prompt: PropTypes.object,
  newNodeAttributes: PropTypes.object.isRequired,
  removeNode: PropTypes.func.isRequired,
  stage: PropTypes.object,
  removeNodeFromPrompt: PropTypes.func.isRequired,
};

NodePanels.defaultProps = {
  isDragging: false,
  meta: {},
  panels: [],
  prompt: { id: null },
  stage: { id: null },
};

function makeMapStateToProps() {
  const getPromptNodeAttributes = makeGetAdditionalAttributes();
  const getPanelConfiguration = makeGetPanelConfiguration();

  return function mapStateToProps(state, props) {
    const newNodeAttributes = getPromptNodeAttributes(state, props);
    const panels = getPanelConfiguration(state, props);

    return {
      activePromptId: props.prompt.id,
      newNodeAttributes,
      panels,
    };
  };
}

const mapDispatchToProps = {
  removeNodeFromPrompt: sessionsActions.removeNodeFromPrompt,
  removeNode: sessionsActions.removeNode,
};

export { NodePanels };

export default compose(
  connect(makeMapStateToProps, mapDispatchToProps),
  MonitorDragSource(['isDragging', 'meta']),
)(NodePanels);
