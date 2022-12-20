import React from 'react';

// Create a context to store interface specific state
export const InterfaceContext = React.createContext();

// Create a provider to pass state to components
export const InterfaceProvider = ({
  children,
  ...data
}) => (
  <InterfaceContext.Provider value={data}>
    {children}
  </InterfaceContext.Provider>
);
