/* eslint-disable implicit-arrow-linebreak, react/jsx-props-no-spreading */
import React, { PureComponent, useState, useRef, useEffect } from 'react';
import { pick, isEqual } from 'lodash';
import store from './store';

const monitor = (getMonitorProps, types) => (WrappedComponent) =>
  class Monitor extends PureComponent {
    constructor(props) {
      super(props);
      this.state = { monitorProps: null };
    }

    componentDidMount() {
      this.unsubscribe = store.subscribe(this.updateMonitorProps);
    }

    componentWillUnmount() {
      this.unsubscribe();
    }

    updateMonitorProps = () => {
      const monitorPropsNew = pick(getMonitorProps(store.getState(), this.props), types);
      const { monitorProps } = this.state;
      if (!isEqual(monitorProps, monitorPropsNew)) {
        this.setState({ monitorProps: monitorPropsNew });
      }
    }

    render() {
      const { monitorProps } = this.state;

      const props = {
        ...this.props,
        ...monitorProps,
      };

      return <WrappedComponent {...props} />;
    }
  };

export const useMonitor = (getMonitorProps, types) => {
  const internalState = useRef();
  const [state, setState] = useState({ monitorProps: null });

  const updateState = (newState) => {
    if (isEqual(internalState.current, newState)) { return; }
    internalState.current = newState;
    setState(newState);
  };

  const updateMonitorProps = () => {
    const status = getMonitorProps(store.getState(), types);
    updateState(status);

    return status;
  };

  useEffect(() => {
    const unsubscribe = store.subscribe(updateMonitorProps);

    return unsubscribe;
  }, []);

  return state;
};

export default monitor;
