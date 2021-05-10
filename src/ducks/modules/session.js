import { has, omit, reduce } from 'lodash';
import uuid from 'uuid/v4';
import { actionCreators as SessionWorkerActions } from './sessionWorkers';
import { actionTypes as protocolsActionTypes } from './protocols';
import networkReducer, { actionTypes as networkActionTypes, actionCreators as networkActions, entityPrimaryKeyProperty } from './network';

const SET_SESSION_FINISHED = 'SET_SESSION_FINISHED';
const SET_SESSION_EXPORTED = 'SET_SESSION_EXPORTED';
const LOAD_SESSION = 'LOAD_SESSION';
const UPDATE_PROMPT = 'UPDATE_PROMPT';
const UPDATE_STAGE = 'UPDATE_STAGE';
const UPDATE_CASE_ID = 'UPDATE_CASE_ID';
const UPDATE_STAGE_STATE = 'UPDATE_STAGE_STATE';
const REMOVE_SESSION = 'REMOVE_SESSION';

export const initialState = {};

const withTimestamp = (session) => ({
  ...session,
  updatedAt: Date.now(),
});

const sessionExists = (sessionId, sessions) => has(sessions, sessionId);

const getReducer = (network) => (state = initialState, action = {}) => {
  switch (action.type) {
    case protocolsActionTypes.DELETE_PROTOCOL:
      return reduce(state, (result, sessionData, sessionId) => {
        if (sessionData.protocolUID !== action.protocolUID) {
          return { ...result, [sessionId]: sessionData };
        }
        return result;
      }, {});
    case networkActionTypes.ADD_NODE:
    case networkActionTypes.BATCH_ADD_NODES:
    case networkActionTypes.REMOVE_NODE:
    case networkActionTypes.REMOVE_NODE_FROM_PROMPT:
    case networkActionTypes.UPDATE_NODE:
    case networkActionTypes.TOGGLE_NODE_ATTRIBUTES:
    case networkActionTypes.ADD_EDGE:
    case networkActionTypes.UPDATE_EDGE:
    case networkActionTypes.TOGGLE_EDGE:
    case networkActionTypes.REMOVE_EDGE:
    case networkActionTypes.UPDATE_EGO: {
      return {
        ...withTimestamp({
          ...state,
          // Reset finished and exported state if network changes
          finishedAt: null,
          exportedAt: null,
          network: network(state.network, action),
        }),
      };
    }
    case SET_SESSION_FINISHED: {
      return {
        ...withTimestamp({
          ...state,
          finishedAt: Date.now(),
        }),
      };
    }

    case SET_SESSION_EXPORTED: {
      return {
        ...state,
        exportedAt: Date.now(),
      };
    }
    case LOAD_SESSION:
      return state;
    case UPDATE_PROMPT: {
      return {
        ...withTimestamp({
          ...state,
          promptIndex: action.promptIndex,
        }),
      };
    }
    case UPDATE_STAGE: {
      return {
        ...withTimestamp({
          ...state,
          stageIndex: action.stageIndex,
        }),
      };
    }
    case UPDATE_CASE_ID: {
      return {
        ...withTimestamp({
          ...state,
          caseId: action.caseId,
        }),
      };
    }
    case UPDATE_STAGE_STATE: {
      return {
        ...withTimestamp({
          ...state,
          stages: {
            ...state.stages,
            [action.stageIndex]: action.state,
          },
        }),
      };
    }
    default:
      return state;
  }
};

/**
 * This function generates default values for all variables in the variable registry for this node
 * type.
 *
 * @param {object} registryForType - An object containing the variable registry entry for this
 *                                   node type.
 */

const getDefaultAttributesForEntityType = (registryForType = {}) => {
  const defaultAttributesObject = {};

  // ALL variables initialised as `null`
  Object.keys(registryForType).forEach((variableUUID) => {
    defaultAttributesObject[variableUUID] = null;
  });

  return defaultAttributesObject;
};

/**
 * Add a batch of nodes to the state.
 *
 * @param {Collection} [nodeList] An array of objects representing nodes to add.
 * @param {Object} [attributeData] Attribute data that will be merged with each node
 * @param {String} [type] A node type ID
 *
 * @memberof! NetworkActionCreators
 * TODO: is `type` superfluous as contained by nodes in nodeList?
 */
const batchAddNodes = (nodeList, attributeData, type) => (dispatch, getState) => {
  const { session, protocols } = getState();

  const activeProtocol = protocols[session.protocolUID];
  const nodeRegistry = activeProtocol.codebook.node;
  const registryForType = nodeRegistry[type].variables;
  const defaultAttributes = getDefaultAttributesForEntityType(registryForType);

  dispatch(
    networkActions.batchAddNodes(
      nodeList,
      attributeData,
      defaultAttributes,
    ),
  );
};

const addNode = (modelData, attributeData = {}) => (dispatch, getState) => {
  const { activeSessionId, sessions, protocols } = getState();

  const activeProtocol = protocols[sessions[activeSessionId].protocolUID];
  const nodeRegistry = activeProtocol.codebook.node;

  const registryForType = nodeRegistry[modelData.type].variables;

  dispatch({
    type: networkActionTypes.ADD_NODE,
    sessionId: activeSessionId,
    modelData,
    attributeData: {
      ...getDefaultAttributesForEntityType(registryForType),
      ...attributeData,
    },
  });
};

const updateNode = (nodeId, newModelData = {}, newAttributeData = {}) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.UPDATE_NODE,
    sessionId: activeSessionId,
    nodeId,
    newModelData,
    newAttributeData,
  });
};

const toggleNodeAttributes = (uid, attributes) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.TOGGLE_NODE_ATTRIBUTES,
    sessionId: activeSessionId,
    [entityPrimaryKeyProperty]: uid,
    attributes,
  });
};

const removeNode = (uid) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.REMOVE_NODE,
    sessionId: activeSessionId,
    [entityPrimaryKeyProperty]: uid,
  });
};

const removeNodeFromPrompt = (nodeId, promptId, promptAttributes) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.REMOVE_NODE_FROM_PROMPT,
    sessionId: activeSessionId,
    nodeId,
    promptId,
    promptAttributes,
  });
};

const updateEgo = (modelData = {}, attributeData = {}) => (dispatch, getState) => {
  const { activeSessionId, sessions, protocols } = getState();

  const activeProtocol = protocols[sessions[activeSessionId].protocolUID];
  const egoRegistry = activeProtocol.codebook.ego || {};

  dispatch({
    type: networkActionTypes.UPDATE_EGO,
    sessionId: activeSessionId,
    modelData,
    attributeData: {
      ...getDefaultAttributesForEntityType(egoRegistry.variables),
      ...attributeData,
    },
  });
};

const addEdge = (modelData, attributeData = {}) => (dispatch, getState) => {
  const { activeSessionId, sessions, protocols } = getState();

  const activeProtocol = protocols[sessions[activeSessionId].protocolUID];
  const edgeRegistry = activeProtocol.codebook.edge;

  const registryForType = edgeRegistry[modelData.type].variables;

  dispatch({
    type: networkActionTypes.ADD_EDGE,
    sessionId: activeSessionId,
    modelData,
    attributeData: {
      ...getDefaultAttributesForEntityType(registryForType),
      ...attributeData,
    },
  });
};

const updateEdge = (edgeId, newModelData = {}, newAttributeData = {}) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.UPDATE_EDGE,
    sessionId: activeSessionId,
    edgeId,
    newModelData,
    newAttributeData,
  });
};

const toggleEdge = (modelData, attributeData = {}) => (dispatch, getState) => {
  const { activeSessionId, sessions, protocols } = getState();

  const activeProtocol = protocols[sessions[activeSessionId].protocolUID];
  const edgeRegistry = activeProtocol.codebook.edge;

  const registryForType = edgeRegistry[modelData.type].variables;

  dispatch({
    type: networkActionTypes.TOGGLE_EDGE,
    sessionId: activeSessionId,
    modelData,
    attributeData: {
      ...getDefaultAttributesForEntityType(registryForType),
      ...attributeData,
    },
  });
};

const removeEdge = (edgeId) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.REMOVE_EDGE,
    sessionId: activeSessionId,
    edgeId,
  });
};

// const addSession = (caseId, protocolUID, sessionNetwork) => (dispatch, getState) => {
//   const id = uuid();

//   const { protocols } = getState();
//   const activeProtocol = protocols[protocolUID];
//   const egoRegistry = activeProtocol.codebook.ego || {};
//   const egoAttributeData = getDefaultAttributesForEntityType(egoRegistry.variables);

//   return dispatch({
//     type: ADD_SESSION,
//     sessionId: id,
//     ...(sessionNetwork && { network: sessionNetwork }),
//     caseId,
//     protocolUID,
//     egoAttributeData, // initial values for ego
//   });

//   // return dispatch(SessionWorkerActions.initializeSessionWorkersThunk(protocolUID))
//   //   .then(() => id);
// };

const updateCaseId = (caseId) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: UPDATE_CASE_ID,
    sessionId: activeSessionId,
    caseId,
  });
};

const loadSession = () => (dispatch) => {
  dispatch({
    type: LOAD_SESSION,
  });
};

const updatePrompt = (promptIndex) => (dispatch, getState) => {
  const state = getState();
  const sessionId = state.activeSessionId;

  dispatch({
    type: UPDATE_PROMPT,
    sessionId,
    promptIndex,
  });
};

const updateStage = (stageIndex) => (dispatch, getState) => {
  const state = getState();
  const sessionId = state.activeSessionId;

  dispatch({
    type: UPDATE_STAGE,
    sessionId,
    stageIndex,
  });
};

const withSessionId = (action) => (dispatch, getState) => {
  const { activeSessionId: sessionId } = getState();

  dispatch({
    ...action,
    sessionId,
  });
};

const updateStageState = (state) => (dispatch, getState) => {
  const { activeSessionId, sessions } = getState();
  const { stageIndex } = sessions[activeSessionId];

  dispatch(withSessionId({
    type: UPDATE_STAGE_STATE,
    stageIndex,
    state,
  }));
};

function removeSession(id) {
  return {
    type: REMOVE_SESSION,
    sessionId: id,
  };
}

const setSessionFinished = (id) => ({
  type: SET_SESSION_FINISHED,
  sessionId: id,
});

const setSessionExported = (id) => ({
  type: SET_SESSION_EXPORTED,
  sessionId: id,
});

const actionCreators = {
  addNode,
  batchAddNodes,
  updateNode,
  removeNode,
  removeNodeFromPrompt,
  updateEgo,
  addEdge,
  updateEdge,
  toggleEdge,
  removeEdge,
  toggleNodeAttributes,
  loadSession,
  updatePrompt,
  updateStage,
  updateCaseId,
  updateStageState,
  removeSession,
  setSessionFinished,
  setSessionExported,
};

const actionTypes = {
  SET_SESSION_FINISHED,
  SET_SESSION_EXPORTED,
  LOAD_SESSION,
  UPDATE_PROMPT,
  UPDATE_STAGE,
  UPDATE_CASE_ID,
  UPDATE_STAGE_STATE,
  REMOVE_SESSION,
};

export {
  actionCreators,
  actionTypes,
  getReducer,
};

export default getReducer(networkReducer);
