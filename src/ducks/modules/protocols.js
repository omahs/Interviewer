import { combineEpics } from 'redux-observable';
import uuid from 'uuid/v4';
import { Observable } from 'rxjs';
import {
  downloadProtocol,
  extractProtocol,
} from '../../utils/protocol';

/**
 * `protocols` maintains some cached data and metadata about the protocol files available on disk.
 *
 * For downloaded protocols, `name` is the unique ID.
 *
 * As a side effect for SET_PROTOCOL (from `./protocol`), which provides the parsed protocol JSON,
 * the store is updated.
 */

const INSTALL_PROTOCOL = 'INSTALL_PROTOCOL';
const INSTALL_PROTOCOL_FINISHED = Symbol('INSTALL_PROTOCOL_FINISHED');
const INSTALL_PROTOCOL_FAILED = Symbol('INSTALL_PROTOCOL_FAILED');

const DOWNLOAD_PROTOCOL = 'DOWNLOAD_PROTOCOL';
const DOWNLOAD_PROTOCOL_FAILED = Symbol('DOWNLOAD_PROTOCOL_FAILED');

const EXTRACT_PROTOCOL = 'EXTRACT_PROTOCOL';
const EXTRACT_PROTOCOL_FAILED = Symbol('EXTRACT_PROTOCOL_FAILED');

export const initialProtocol = {
  isInstalled: false,
  isInstalling: false,
  isExtracting: false,
  isDownloading: false,
  error: null,
};

export default function reducer(state = [], action = {}) {
  switch (action.type) {
    case INSTALL_PROTOCOL_FINISHED:
      return state.map((protocol) => {
        if (protocol.uid !== action.uid) { return protocol; }

        return {
          ...protocol,
          isInstalled: true,
          isInstalling: false,
          isExtracting: false,
          isDownloading: false,
        };
      });
    case DOWNLOAD_PROTOCOL:
      return state.map((protocol) => {
        if (protocol.uid !== action.uid) { return protocol; }

        return {
          ...protocol,
          isDownloading: true,
        };
      });
    case EXTRACT_PROTOCOL:
      return state.map((protocol) => {
        if (protocol.uid !== action.uid) { return protocol; }

        return {
          ...protocol,
          isDownloading: false,
          isExtracting: true,
        };
      });
    case DOWNLOAD_PROTOCOL_FAILED:
    case EXTRACT_PROTOCOL_FAILED:
    case INSTALL_PROTOCOL_FAILED:
      return state.map((protocol) => {
        if (protocol.uid !== action.uid) { return protocol; }

        return {
          ...protocol,
          ...initialProtocol,
          error: action.error,
        };
      });
    case INSTALL_PROTOCOL: {
      console.log(action);
      return [
        ...state,
        {
          ...initialProtocol,
          uid: action.uid,
          isInstalling: true,
        },
      ];
    }
    // case SET_PROTOCOL_METADATA: {
    //   const protocolMetaData = {
    //     name: action.protocol.name,
    //     description: action.protocol.description,
    //     path: action.path,
    //   };

    //   const existingIndex = state.findIndex(protocol => protocol.name === protocolMetaData.name);

    //   if (existingIndex > -1) {
    //     const updatedState = [...state];
    //     updatedState.splice(existingIndex, 1, protocolMetaData);
    //     return updatedState;
    //   }

    //   return [
    //     ...state,
    //     protocolMetaData,
    //   ];
    // }
    default:
      return state;
  }
}

function installProtocolAction(uri, forNCServer) {
  return {
    type: INSTALL_PROTOCOL,
    uri,
    uid: uuid(),
    forNCServer,
  };
}

function installProtocolFailed(error) {
  return {
    type: INSTALL_PROTOCOL_FAILED,
    error,
  };
}

function installProtocolFinished(uid) {
  return {
    type: INSTALL_PROTOCOL_FINISHED,
    uid,
  };
}


function downloadProtocolAction(uri, forNCServer, uid) {
  return {
    type: DOWNLOAD_PROTOCOL,
    uri,
    forNCServer,
    uid,
  };
}

function downloadProtocolFailed(error) {
  return {
    type: DOWNLOAD_PROTOCOL_FAILED,
    error,
  };
}

function extractProtocolAction(path, uid) {
  return {
    type: EXTRACT_PROTOCOL,
    path,
    uid,
  };
}

function extractProtocolFailed(error) {
  return {
    type: EXTRACT_PROTOCOL_FAILED,
    error,
  };
}

const installProtocolEpic = action$ =>
  action$.ofType(INSTALL_PROTOCOL)
    .switchMap(action =>
      Observable
        .fromPromise(downloadProtocol(action.uri, action.forNCServer, action.uid))
        .map(({ protocolPath, uid }) => extractProtocolAction(protocolPath, uid))
        .catch(error => Observable.of(installProtocolFailed(error))),
    );

const downloadProtocolEpic = (action$, store) =>
  action$.ofType(DOWNLOAD_PROTOCOL)
    .switchMap((action) => {
      let pairedServer;
      if (action.forNCServer) {
        pairedServer = store.getState().pairedServer;
      }
      return Observable
        .fromPromise(downloadProtocol(action.uri, pairedServer))
        .catch(error => Observable.of(downloadProtocolFailed(error)));
    });

const extractProtocolEpic = action$ =>
  action$.ofType(EXTRACT_PROTOCOL)
    .switchMap(action =>
      Observable
        .fromPromise(extractProtocol(action.path))
        .of(installProtocolFinished(action.uid))
        .catch(error => Observable.of(extractProtocolFailed(error))),
    );

const actionCreators = {
  extractProtocol: extractProtocolAction,
  downloadProtocol: downloadProtocolAction,
  installProtocol: installProtocolAction,
  extractProtocolFailed,
  downloadProtocolFailed,
};

const actionTypes = {
  EXTRACT_PROTOCOL,
  EXTRACT_PROTOCOL_FAILED,
  DOWNLOAD_PROTOCOL,
  DOWNLOAD_PROTOCOL_FAILED,
  INSTALL_PROTOCOL,
  INSTALL_PROTOCOL_FAILED,
};

const epics = combineEpics(
  downloadProtocolEpic,
  extractProtocolEpic,
  installProtocolEpic,
);

export {
  actionCreators,
  actionTypes,
  epics,
};
