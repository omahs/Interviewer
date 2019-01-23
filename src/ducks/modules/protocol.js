import { combineEpics } from 'redux-observable';
import { Observable } from 'rxjs';
import { omit } from 'lodash';

import { actionTypes as SessionActionTypes } from './session';
import { supportedWorkers } from '../../utils/WorkerAgent';
import {
  loadProtocol,
  preloadWorkers,
} from '../../utils/protocol';

/**
 * `protocol` maintains information about the currently-loaded protocol for session, and
 * provides actions for downloading, importing, etc. It does a reference to data in `./protocols`.
 *
 * Typical action flow:
 *
 * 1. Download: Fetch a remote .netcanvas file from network, save to tmp dir
 * 2. Import: extract .netcanvas contents & move files to user data dir
 * 3. Load: Read & parse protocol.json from imported files
 * 4. Set Protocol: store parsed protocol JSON in state
 *   - Side effect: if this is a new protocol, persist data & metadata (see ./protocols)
 *
 * Notes:
 * - As a side effect of END_SESSION, clear out the current protocol contents here
 * - Typically, an interface will call addSession() to begin a new session before a protocol
 *   is loaded; loading state is maintained here.
 */

const END_SESSION = SessionActionTypes.END_SESSION;

const LOAD_PROTOCOL = 'LOAD_PROTOCOL';
const LOAD_PROTOCOL_FAILED = Symbol('LOAD_PROTOCOL_FAILED');
const SET_PROTOCOL = 'SET_PROTOCOL';
const SET_WORKER = 'SET_WORKER';

export const initialState = {
  isLoaded: false,
  isLoading: false,
  error: null,
  name: '',
  version: '',
  required: '',
  stages: [],
  workerUrlMap: null,
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case SET_PROTOCOL:
      return {
        ...state,
        ...omit(action.protocol, 'externalData'),
        path: action.path,
        isLoaded: true,
        isLoading: false,
      };
    case SET_WORKER:
      return {
        ...state,
        workerUrlMap: action.workerUrlMap,
      };
    case END_SESSION:
      return initialState;
    case LOAD_PROTOCOL:
      return {
        ...state,
        isLoaded: false,
        isLoading: true,
      };
    case LOAD_PROTOCOL_FAILED:
      return {
        ...state,
        isLoaded: false,
        isLoading: true,
      };
    default:
      return state;
  }
}

function loadProtocolAction(path) {
  return {
    type: LOAD_PROTOCOL,
    path,
  };
}

function loadProtocolFailed(error) {
  return {
    type: LOAD_PROTOCOL_FAILED,
    error,
  };
}

function setProtocol(path, protocol) {
  return {
    type: SET_PROTOCOL,
    path,
    protocol,
  };
}

// If there's no custom worker, set to empty so we won't expect one later
function setWorkerContent(workerUrlMap = {}) {
  return {
    type: SET_WORKER,
    workerUrlMap,
  };
}

const loadProtocolEpic = action$ =>
  action$
    .filter(action => action.type === LOAD_PROTOCOL)
    .switchMap(action => // Favour subsequent load actions over earlier ones
      Observable
        .fromPromise(loadProtocol(action.path)) // Get protocol
        .map(response => setProtocol(action.path, response, false)) // Parse and save
        .catch(error => Observable.of(loadProtocolFailed(error))), //  ...or throw an error
    );

const loadProtocolWorkerEpic = action$ =>
  action$
    .ofType(LOAD_PROTOCOL)
    .switchMap(action => // Favour subsequent load actions over earlier ones
      Observable
        .fromPromise(preloadWorkers(action.path))
        .mergeMap(urls => urls)
        .reduce((urlMap, workerUrl, i) => {
          if (workerUrl) {
            // eslint-disable-next-line no-param-reassign
            urlMap[supportedWorkers[i]] = workerUrl;
          }
          return urlMap;
        }, {})
        .map(workerUrlMap => setWorkerContent(workerUrlMap)),
    );

const actionCreators = {
  loadProtocol: loadProtocolAction,
  setProtocol,
  loadProtocolFailed,
};

const actionTypes = {
  LOAD_PROTOCOL,
  LOAD_PROTOCOL_FAILED,
  SET_PROTOCOL,
};

const epics = combineEpics(
  loadProtocolEpic,
  loadProtocolWorkerEpic,
);

export {
  actionCreators,
  actionTypes,
  epics,
};
