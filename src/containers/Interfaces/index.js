/* eslint-disable import/prefer-default-export */
import React from 'react';
import { has } from 'lodash';
import { Icon } from '@codaco/ui';
import NameGenerator from './NameGenerator/NameGenerator';
import NameGeneratorAutoComplete from './NameGeneratorAutoComplete';
import NameGeneratorList from './NameGeneratorList';
import NameGeneratorRoster from './NameGeneratorRoster';
import OrdinalBin from './OrdinalBin';
import Sociogram from './Sociogram';
import Information from './Information';
import CategoricalBin from './CategoricalBin';
import Narrative from './Narrative';
import AlterForm from './AlterForm';
import EgoForm from './EgoForm';
import AlterEdgeForm from './AlterEdgeForm';
import DyadCensus from './DyadCensus';
import TieStrengthCensus from './TieStrengthCensus';
import FinishSession from './FinishSession';
import { StageType } from '../../protocol-consts';

const interfaces = {
  [StageType.NameGenerator]: NameGenerator,
  [StageType.NameGeneratorQuickAdd]: NameGenerator,
  [StageType.NameGeneratorAutoComplete]: NameGeneratorAutoComplete,
  [StageType.NameGeneratorRoster]: NameGeneratorRoster,
  [StageType.NameGeneratorList]: NameGeneratorList,
  [StageType.Sociogram]: Sociogram,
  [StageType.Information]: Information,
  [StageType.OrdinalBin]: OrdinalBin,
  [StageType.CategoricalBin]: CategoricalBin,
  [StageType.Narrative]: Narrative,
  [StageType.AlterForm]: AlterForm,
  [StageType.EgoForm]: EgoForm,
  [StageType.AlterEdgeForm]: AlterEdgeForm,
  [StageType.DyadCensus]: DyadCensus,
  [StageType.TieStrengthCensus]: TieStrengthCensus,
  FinishSession,
};

const getInterface = (interfaceConfig) => {
  const divStyle = {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (has(interfaces, interfaceConfig)) { return interfaces[interfaceConfig]; }
  return () => (
    <div style={divStyle}>
      <div style={{ textAlign: 'center' }}>
        <Icon name="warning" />
        <h1 style={{ marginTop: '1rem' }}>
          No &quot;
          {interfaceConfig}
          &quot; interface found.
        </h1>
      </div>
    </div>
  );
};

export {
  NameGenerator,
  NameGeneratorAutoComplete,
  NameGeneratorList,
  NameGeneratorRoster,
  Sociogram,
  Information,
  CategoricalBin,
  OrdinalBin,
  Narrative,
  AlterForm,
  EgoForm,
  AlterEdgeForm,
  DyadCensus,
};

export default getInterface;
