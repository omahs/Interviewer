import { createRoot } from 'react-dom/client';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { history, store, persistor as storePersistor } from './ducks/store';
import { actionCreators as deviceActions } from './ducks/modules/deviceSettings';
import App from './containers/App';
import AppRouter from './routes';

// This prevents user from being able to drop a file anywhere on the app
document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
});
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

const Persist = ({ persistor, children }) => {
  return (
    <PersistGate loading={null} persistor={persistor}>
      {children}
    </PersistGate>
  );
};

const startApp = () => {
  store.dispatch(deviceActions.deviceReady());
  const container = document.getElementById('root');
  const root = createRoot(container);

  root.render(
    <Provider store={store}>
      <Persist persistor={storePersistor}>
        <ConnectedRouter history={history}>
          <App>
            <AppRouter />
          </App>
        </ConnectedRouter>
      </Persist>
    </Provider>,
  );
};

startApp();
