/* eslint-env jest */

import reducer from '../protocols';
import { actionTypes as ProtocolActionTypes } from '../protocol';

describe('protocols reducer', () => {
  it('should return the initial state', () => {
    expect(
      reducer(undefined, {}),
    ).toEqual([]);
  });

  describe('SET_PROTOCOL', () => {
    it('adds a new protocol', () => {
      const setProtocolAction = { type: ProtocolActionTypes.SET_PROTOCOL, protocol: { name: 'new' } };
      expect(reducer([], setProtocolAction)).toHaveLength([].length + 1);
    });

    it('does not add an existing protocol', () => {
      const setProtocolAction = { type: ProtocolActionTypes.SET_PROTOCOL, protocol: { name: 'new' } };
      const newState = reducer([], setProtocolAction);
      expect(reducer(newState, setProtocolAction)).toHaveLength(newState.length);
    });
  });
});
