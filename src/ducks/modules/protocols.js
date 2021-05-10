import { withErrorDialog } from './errors';

const IMPORT_PROTOCOL_COMPLETE = 'IMPORT_PROTOCOL_COMPLETE';
const IMPORT_PROTOCOL_FAILED = 'IMPORT_PROTOCOL_FAILED';
const DELETE_PROTOCOL = 'INSTALLED_PROTOCOLS/DELETE_PROTOCOL';

export const initialState = null;

function importProtocolCompleteAction(protocolData) {
  return {
    type: IMPORT_PROTOCOL_COMPLETE,
    protocolData,
  };
}

const importProtocolFailedAction = withErrorDialog((error) => ({
  type: IMPORT_PROTOCOL_FAILED,
  error,
}));

const updateProtocols = (protocols) => ({
  type: 'UPDATE_PROTOCOLS',
  payload: protocols,
});

const actionTypes = {
  DELETE_PROTOCOL,
  IMPORT_PROTOCOL_COMPLETE,
  IMPORT_PROTOCOL_FAILED,
};

const actionCreators = {
  importProtocolCompleteAction,
  importProtocolFailedAction,
  updateProtocols,
};

export {
  actionCreators,
  actionTypes,
};
