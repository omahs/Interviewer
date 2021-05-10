import axios from 'axios';
import { useEffect, useRef, useReducer } from 'react';
import { API_URL } from '../services/auth';
import authHeader from '../services/auth-header';

const useAPI = (endpoint) => {
  const cache = useRef({});

  const initialState = {
    status: 'idle',
    error: null,
    data: null,
  };

  const [state, dispatch] = useReducer((currentState, action) => {
    switch (action.type) {
      case 'FETCHING':
        return { ...initialState, status: 'fetching' };
      case 'FETCHED':
        return { ...initialState, status: 'fetched', data: action.payload };
      case 'FETCH_ERROR':
        return { ...initialState, status: 'error', error: action.payload };
      default:
        return currentState;
    }
  }, initialState);

  useEffect(() => {
    let cancelRequest = false;
    if (!endpoint) return;

    const fetchData = async () => {
      const url = `${API_URL}${endpoint}`;
      dispatch({ type: 'FETCHING' });
      if (cache.current[url]) {
        const data = cache.current[url];
        dispatch({ type: 'FETCHED', payload: data });
      } else {
        try {
          const { data } = await axios.get(url, { headers: authHeader() });
          cache.current[url] = data;
          if (cancelRequest) return;
          dispatch({ type: 'FETCHED', payload: data });
        } catch (error) {
          if (cancelRequest) return;
          dispatch({ type: 'FETCH_ERROR', payload: error.message });
        }
      }
    };

    fetchData();

    // eslint-disable-next-line consistent-return
    return function cleanup() {
      cancelRequest = true;
    };
  }, [endpoint]);

  // eslint-disable-next-line no-console
  console.log('API: ', endpoint, state);
  return state;
};

export default useAPI;
