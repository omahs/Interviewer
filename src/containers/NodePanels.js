import React, { useContext } from 'react';
import { Panels } from '../components';
import NodePanel from './NodePanel';
import { InterfaceContext } from './Interfaces/NameGenerator/InterfaceContext';

const panelColors = [
  'var(--primary-color-seq-1)',
  'var(--primary-color-seq-2)',
  'var(--primary-color-seq-3)',
  'var(--primary-color-seq-4)',
  'var(--primary-color-seq-5)',
];

const NodePanels = () => {
  const {
    stage: {
      panels,
    },
  } = useContext(InterfaceContext);

  return (
    <Panels>
      {panels.map(
        (panel, index) => (
          <NodePanel
            key={panel.id}
            accentColor={panelColors[index % panelColors.length]}
            configuration={panel}
          />
        ),
      )}
    </Panels>
  );
};

export default NodePanels;
