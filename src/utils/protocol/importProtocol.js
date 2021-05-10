import React from 'react';
import { store } from '../../ducks/store';
import { actionCreators as installedProtocolActions } from '../../ducks/modules/protocols';
import { actionCreators as toastActions } from '../../ducks/modules/toasts';

const dispatch = store.dispatch;
const getState = store.getState;

const showCancellationToast = () => {
  dispatch(toastActions.addToast({
    type: 'warning',
    title: 'Import cancelled',
    content: (
      <React.Fragment>
        <p>You cancelled the import of this protocol.</p>
      </React.Fragment>
    ),
  }));
}

export const importProtocolFromURI = (uri, usePairedServer) => {
  let pairedServer;

  if (usePairedServer) {
    pairedServer = getState().pairedServer;
  }

  return fetch(uri).then(response => {
    return response.json().then(json => {
      console.log('content', json);
      dispatch(installedProtocolActions.importProtocolCompleteAction(json));
    });

  });
};
