import uuid from 'uuid/v4';
import {
  orderBy,
  values,
  mapValues,
  omit,
  isNull,
} from 'lodash';
import { createSelector } from 'reselect';
import { entityAttributesProperty } from '../ducks/modules/network';

const DefaultFinishStage = {
  // `id` is used as component key; must be unique from user input
  id: uuid(),
  type: 'FinishSession',
  label: 'Finish Interview',
};

const getActiveSession = (state) => (
  state.activeSessionId && state.session
);

const getLastActiveSession = (state) => {
  if (Object.keys(state.sessions).length === 0) {
    return {};
  }

  const sessionsCollection = values(mapValues(state.sessions, (session, sessionUUID) => ({
    sessionUUID,
    ...session,
  })));

  const lastActive = orderBy(sessionsCollection, ['updatedAt', 'caseId'], ['desc', 'asc'])[0];
  return {
    sessionUUID: lastActive.sessionUUID,
    [entityAttributesProperty]: {
      ...omit(lastActive, 'sessionUUID'),
    },
  };
};

export const getProtocols = (state) => state.protocols;

export const getCurrentSessionProtocol = createSelector(
  (state, props) => getActiveSession(state, props),
  getProtocols,
  (session, protocols) => {
    if (!session) {
      return {};
    }
    return protocols[session.protocolUID];
  },
);

// Use the protocol associated with the last active session, unless there is a protocol with
// an `installationDate` that is more recent.
export const getLastActiveProtocol = (state) => {
  const protocols = getProtocols(state);

  if (isNull(protocols)) {
    return null;
  }

  const lastActiveSession = getLastActiveSession(state);
  const lastActiveAttributes = lastActiveSession[entityAttributesProperty];

  const protocolsCollection = values(mapValues(protocols, (protocol, protocolUID) => ({
    protocolUID,
    ...protocol,
  })));

  const lastInstalledProtocol = orderBy(protocolsCollection, ['installationDate'], ['desc'])[0];

  if (
    lastActiveAttributes
    && lastActiveAttributes.updatedAt // Last active session exists
    && lastActiveAttributes.updatedAt > lastInstalledProtocol.installationDate
  ) {
    return {
      ...protocols[lastActiveSession[entityAttributesProperty].protocolUID],
      protocolUID: lastActiveSession[entityAttributesProperty].protocolUID,
    };
  }

  return lastInstalledProtocol;
};

export const getActiveProtocolName = createSelector(
  getCurrentSessionProtocol,
  (protocol) => protocol && protocol.name,
);

export const getAssetManifest = createSelector(
  getCurrentSessionProtocol,
  (protocol) => protocol.assetManifest,
);

export const getProtocolCodebook = createSelector(
  getCurrentSessionProtocol,
  (protocol) => protocol.codebook,
);

const withFinishStage = (stages = []) => {
  if (!stages) { return []; }

  return [...stages, DefaultFinishStage];
};

export const getProtocolStages = createSelector(
  getCurrentSessionProtocol,
  (protocol) => withFinishStage(protocol.stages),
);
