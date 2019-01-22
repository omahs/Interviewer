/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import { createStore } from 'redux';

import ProtocolList, { UnconnectedProtocolList } from '../ProtocolList';

const mockProps = {
  addSession: jest.fn(),
  loadProtocol: jest.fn(),
};

const mockProtocols = [{ name: 'Sample', path: 'sample.netcanvas' }];

const mockStore = () =>
  createStore(() => ({
    protocols: mockProtocols,
  }));

describe('<ProtocolList />', () => {
  it('renders ok', () => {
    const component = shallow(<ProtocolList {...mockProps} store={mockStore()} />);

    expect(component).toMatchSnapshot();
  });

  describe('click handler', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = shallow(<UnconnectedProtocolList {...mockProps} protocols={mockProtocols} />);
      mockProps.loadProtocol.mockClear();
    });

    it('loads a remote protocol', () => {
      const protocol = { ...mockProtocols[0] };
      wrapper.instance().onClickNewProtocol(protocol);
      expect(mockProps.loadProtocol).toHaveBeenCalledWith(protocol.path);
    });
  });
});
