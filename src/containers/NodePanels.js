import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Panels } from '../components';
import NodePanel from './NodePanel';
import { InterfaceContext } from './Interfaces/NameGenerator/NameGenerator';

const panelColors = [
  'var(--primary-color-seq-1)',
  'var(--primary-color-seq-2)',
  'var(--primary-color-seq-3)',
  'var(--primary-color-seq-4)',
  'var(--primary-color-seq-5)',
];

const NodePanels = (props) => {
  const { disableAddNew } = props;
  const {
    stage: {
      panels,
    },
    prompt,
  } = useContext(InterfaceContext);

  return (
    <Panels>
      {panels.map(
        (panel, index) => (
          <NodePanel
            key={panel.id}
            highlight={panelColors[index % panelColors.length]}
            configuration={panel}
            disableAddNew={disableAddNew}
          />
        ),
      )}
    </Panels>
  );
};

NodePanels.propTypes = {
  prompt: PropTypes.object,
};

NodePanels.defaultProps = {
  prompt: { id: null },
};

export default NodePanels;
