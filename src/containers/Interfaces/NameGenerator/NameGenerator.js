import React, { useState, useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  has, isUndefined, omit,
} from 'lodash';
import { Icon } from '@codaco/ui';
import { entityAttributesProperty, entityPrimaryKeyProperty } from '@codaco/shared-consts';
import Prompts from '../../../components/Prompts';
import withPrompt from '../../../behaviours/withPrompt';
import { actionCreators as sessionsActions } from '../../../ducks/modules/sessions';
import { makeNetworkNodesForPrompt, makeGetAdditionalAttributes, makeGetStageNodeCount, makeNetworkNodesForOtherPrompts } from '../../../selectors/interface';
import { makeGetPromptNodeModelData, makeGetNodeIconName } from '../../../selectors/name-generator';
import NodePanels from '../../NodePanels';
import NodeForm from '../../NodeForm';
import { NodeList, NodeBin } from '../../../components';
import {
  MaxNodesReached, maxNodesWithDefault, MinNodesNotMet, minNodesWithDefault,
} from './MinMaxHelpers';
import { get } from '../../../utils/lodash-replacements';
import QuickNodeForm from '../../../components/QuickNodeForm';

// Create a context to store interface specific state
export const InterfaceContext = React.createContext();

// Create a provider to pass state to components
const InterfaceProvider = ({
  children,
  ...data
}) => {
  return (
    <InterfaceContext.Provider value={data}>
      {children}
    </InterfaceContext.Provider>
  );
};

const NameGenerator = (props) => {
  const {
    registerBeforeNext,
    isFirstPrompt,
    isLastPrompt,
    minNodes,
    maxNodes,
    stageNodeCount,
    onComplete,
    updateNode,
    addNode,
    newNodeModelData,
    newNodeAttributes,
    nodesForPrompt,
    nodesForOtherPrompts,
    nodeIconName,
    prompt,
    stage,
    removeNode,
  } = props;

  const {
    prompts,
    form,
  } = stage;

  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [showMinWarning, setShowMinWarning] = useState(false);

  useEffect(() => {
    console.log('component will receive props');
    setShowMinWarning(false);
  });

  const handleBeforeLeaving = (direction, destination) => {
    const isLeavingStage = (isFirstPrompt() && direction === -1)
      || (isLastPrompt() && direction === 1);

    // Implementation quirk that destination is only provided when navigation
    // is triggered by Stages Menu. Use this to skip message if user has
    // navigated directly using stages menu.
    if (isUndefined(destination) && isLeavingStage && stageNodeCount < minNodes) {
      setShowMinWarning(true);
      return;
    }

    onComplete();
  };

  useEffect(() => {
    registerBeforeNext(handleBeforeLeaving);
  }, []);

  /**
   * Drop node handler
   * Adds prompt attributes to existing nodes, or adds new nodes to the network.
   * @param {object} item - key/value object containing node object from the network store
   */
  const handleDropNode = (item) => {
    const node = { ...item.meta.data };
    // Test if we are updating an existing network node, or adding it to the network
    if (has(node, 'promptIDs')) {
      updateNode(
        node[entityPrimaryKeyProperty],
        { ...newNodeModelData },
        { ...newNodeAttributes },
      );
    } else {
      const droppedAttributeData = node[entityAttributesProperty];
      const droppedModelData = omit(node, entityAttributesProperty);

      addNode(
        { ...newNodeModelData, ...droppedModelData },
        { ...droppedAttributeData, ...newNodeAttributes },
      );
    }
  };

  /**
  * Node Form submit handler
  */
  const handleSubmitForm = ({ form: formData }) => {
    if (!formData) { return; }

    if (!editingNode) {
      addNode(
        newNodeModelData,
        { ...newNodeAttributes, ...formData },
      );
    } else {
      const selectedUID = editingNode[entityPrimaryKeyProperty];
      updateNode(selectedUID, {}, formData);
    }

    setShowForm(false);
    setEditingNode(null);
  };

  const handleSelectNode = (node) => {
    setEditingNode(node);
    setShowForm(true);
  };

  const handleOpenForm = () => {
    setShowMinWarning(false);
    setEditingNode(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setEditingNode(null);
    setShowForm(false);
  };

  return (
    <InterfaceProvider
      stage={stage}
      prompt={prompt}
      nodesForPrompt={nodesForPrompt}
      nodesForOtherPrompts={nodesForOtherPrompts}
      newNodeAttributes={newNodeAttributes}
    >
      <div className="name-generator-interface">
        <div className="name-generator-interface__prompt">
          <Prompts
            prompts={prompts}
            currentPrompt={prompt.id}
          />
        </div>
        <div className="name-generator-interface__main">
          {has(stage, 'panels') && (
            <div className="name-generator-interface__panels">
              <NodePanels
                panels={stage.panels}
                stage={stage}
                prompt={prompt}
                disableAddNew={stageNodeCount >= maxNodes}
              />
            </div>
          )}
          <div className="name-generator-interface__nodes">
            <NodeList
              items={nodesForPrompt}
              stageId={stage.id}
              listId={`${stage.id}_${prompt.id}_MAIN_NODE_LIST`}
              id="MAIN_NODE_LIST"
              accepts={({ meta }) => get(meta, 'itemType', null) === 'NEW_NODE'}
              itemType="EXISTING_NODE"
              onDrop={handleDropNode}
              onItemClick={handleSelectNode}
            />
          </div>
        </div>
        <MaxNodesReached show={stageNodeCount >= maxNodes} />
        <MinNodesNotMet show={showMinWarning} minNodes={minNodes} />
        {form ? (
          <>
            <div
              onClick={handleOpenForm}
              className={`name-generator-interface__add-node ${stageNodeCount >= maxNodes ? 'name-generator-interface__add-node--disabled' : ''}`}
              data-clickable="open-add-node"
            >
              <Icon name={nodeIconName} />
            </div>
            <NodeForm
              key={editingNode}
              node={editingNode}
              stage={stage}
              onSubmit={handleSubmitForm}
              onClose={handleFormClose}
              show={showForm}
            />
          </>
        ) : (
          <QuickNodeForm
            show={showForm}
            onSubmit={handleSubmitForm}
            onClick={handleOpenForm}
            onClose={handleFormClose}
            disabled={stageNodeCount >= maxNodes}
            nodeType={stage.subject.type}
            nodeIconName={nodeIconName}
            targetVariable={stage.quickAdd}
          />
        )}
        <NodeBin
          accepts={(meta) => meta.itemType === 'EXISTING_NODE'}
          dropHandler={(meta) => removeNode(meta[entityPrimaryKeyProperty])}
          id="NODE_BIN"
        />
      </div>
    </InterfaceProvider>
  );
};

NameGenerator.defaultProps = {
  form: null,
};

NameGenerator.propTypes = {
  addNode: PropTypes.func.isRequired,
  form: PropTypes.object,
  newNodeAttributes: PropTypes.object.isRequired,
  newNodeModelData: PropTypes.object.isRequired,
  nodesForPrompt: PropTypes.array.isRequired,
  nodeIconName: PropTypes.string.isRequired,
  prompt: PropTypes.object.isRequired,
  stage: PropTypes.object.isRequired,
  updateNode: PropTypes.func.isRequired,
  removeNode: PropTypes.func.isRequired,
};

function makeMapStateToProps() {
  const networkNodesForPrompt = makeNetworkNodesForPrompt();
  const networkNodesForOtherPrompts = makeNetworkNodesForOtherPrompts();
  const getPromptNodeAttributes = makeGetAdditionalAttributes();
  const getPromptNodeModelData = makeGetPromptNodeModelData();
  const getNodeIconName = makeGetNodeIconName();
  const getStageNodeCount = makeGetStageNodeCount();

  return function mapStateToProps(state, props) {
    return {
      activePromptAttributes: get(props, ['prompt', 'additionalAttributes'], {}),
      // eslint-disable-next-line @codaco/spellcheck/spell-checker
      minNodes: minNodesWithDefault(get(props, ['stage', 'behaviours', 'minNodes'])),
      // eslint-disable-next-line @codaco/spellcheck/spell-checker
      maxNodes: maxNodesWithDefault(get(props, ['stage', 'behaviours', 'maxNodes'])),
      stageNodeCount: getStageNodeCount(state, props),
      newNodeAttributes: getPromptNodeAttributes(state, props),
      newNodeModelData: getPromptNodeModelData(state, props),
      nodesForPrompt: networkNodesForPrompt(state, props),
      nodesForOtherPrompts: networkNodesForOtherPrompts(state, props),
      nodeIconName: getNodeIconName(state, props),
    };
  };
}

const mapDispatchToProps = {
  addNode: sessionsActions.addNode,
  updateNode: sessionsActions.updateNode,
  removeNode: sessionsActions.removeNode,
};

export default compose(
  withPrompt,
  connect(makeMapStateToProps, mapDispatchToProps),
)(NameGenerator);

export {
  NameGenerator as UnconnectedNameGenerator,
};
