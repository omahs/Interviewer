import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { isEmpty } from 'lodash';
import { Icon, window } from '@codaco/ui';
import { Radio, Checkbox } from '@codaco/ui/lib/components/Fields';
import Accordion from './Accordion';
import {
  makeGetEdgeColor, makeGetEdgeLabel, makeGetNodeAttributeLabel, makeGetCategoricalOptions,
} from '../../selectors/network';
import { get } from '../../utils/lodash-replacements';
import { convertVersion } from 'electron-winstaller';

class PresetSwitcherKey extends Component {
  constructor() {
    super();
    this.state = {
      isOpen: false,

    };

    this.panel = React.createRef();
  }

  togglePanel = () => {
    this.setState((oldState) => ({
      isOpen: !oldState.isOpen,
    }));
  }

  renderHighlightLabel = (highlight, index) => {
    const {
      highlightIndex,
      changeHighlightIndex,
    } = this.props;

    const handleHighlightClick = (event) => {
      event.stopPropagation();
      changeHighlightIndex(index);
    };

    return (
      <Radio
        className="accordion-item"
        key={index}
        input={{
          value: index,
          checked: index === highlightIndex,
          onChange: (event) => handleHighlightClick(event, index),
        }}
        label={highlight}
      />
    );
  }

  renderEdge = (edge, index) => {
    const {
      linkIndexes,
      changeLinkIndexes,
    } = this.props;

    const handleLinkClick = (event) => {
      event.stopPropagation();
      // check if index is included in linkIndexes. If not, push that index. If it is, remove it.
      if (linkIndexes.includes(index)) {
        const filteredLinkIndex = linkIndexes.filter((item) => item !== index);
        changeLinkIndexes(filteredLinkIndex);
      } else {
        linkIndexes.push(index);
        changeLinkIndexes(linkIndexes);
      }
    };
    return (
      <div>
        <Checkbox
          className="accordion-item"
          key={index}
          input={{
            value: index,
            checked: linkIndexes.includes(index),
            onChange: (event) => handleLinkClick(event, index),
          }}
          label={edge.label}
        />
        <Icon
          name="links"
          color={edge.color}
        />
      </div>
    );
  }

  renderGroup = (option, index) => {
    const {
      groupIndex,
      changeGroupIndex,
    } = this.props;

    const handleGroupClick = (event) => {
      event.stopPropagation();
      changeGroupIndex(index);
    };
    return (
      <div>
        <Radio
          className="accordion-item"
          key={index}
          input={{
            value: index,
            checked: index === groupIndex,
            onChange: (event) => handleGroupClick(event, index),
          }}
          label={option.label}
        />
        <Icon
          name="contexts"
          color={`cat-color-seq-${index + 1}`}
        />
      </div>
    );
  }

  render() {
    const {
      toggleHighlighting,
      toggleEdges,
      toggleHulls,
      isOpen,
      convexOptions,
      edges,
      highlightLabels,
    } = this.props;

    const classNames = cx(
      'preset-switcher-key',
      { 'preset-switcher-key--open': isOpen },
    );

    return (
      <div className={classNames} ref={this.panel}>
        <div className="preset-switcher-key__content">
          {!isEmpty(highlightLabels) && (
            <Accordion label="Attributes" onAccordionToggle={toggleHighlighting}>
              {highlightLabels.map(this.renderHighlightLabel)}
            </Accordion>
          )}
          {!isEmpty(edges) && (
            <Accordion label="Links" onAccordionToggle={toggleEdges}>
              {edges.map(this.renderEdge)}
            </Accordion>
          )}
          {!isEmpty(convexOptions) && (
            <Accordion label="Groups" onAccordionToggle={toggleHulls}>
              {convexOptions.map(this.renderGroup)}
            </Accordion>
          )}
        </div>
      </div>
    );
  }
}

PresetSwitcherKey.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  preset: PropTypes.object.isRequired,
  highlightIndex: PropTypes.number.isRequired,
  linkIndexes: PropTypes.array.isRequired,
  groupIndex: PropTypes.number.isRequired,
  changeHighlightIndex: PropTypes.func.isRequired,
  changeLinkIndexes: PropTypes.func.isRequired,
  changeGroupIndex: PropTypes.func.isRequired,
  toggleHighlighting: PropTypes.func.isRequired,
  toggleEdges: PropTypes.func.isRequired,
  toggleHulls: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

PresetSwitcherKey.defaultProps = {
};

const makeMapStateToProps = () => {
  const getEdgeColor = makeGetEdgeColor();
  const getEdgeLabel = makeGetEdgeLabel();
  const getNodeAttributeLabel = makeGetNodeAttributeLabel();
  const getCategoricalOptions = makeGetCategoricalOptions();

  const mapStateToProps = (state, props) => {
    const highlightLabels = get(props, 'preset.highlight', [])
      .map((variable) => (
        getNodeAttributeLabel(state, { variableId: variable, ...props })
      ));
    const edges = get(props, 'preset.edges.display', [])
      .map((type) => (
        { label: getEdgeLabel(state, { type }), color: getEdgeColor(state, { type }) }
      ));
    const convexOptions = getCategoricalOptions(
      state,
      { variableId: props.preset.groupVariable, ...props },
    );

    return {
      convexOptions,
      edges,
      highlightLabels,
    };
  };

  return mapStateToProps;
};

export {
  PresetSwitcherKey as UnconnectedPresetSwitcherKey,
};

export default compose(
  window,
  connect(makeMapStateToProps),
)(PresetSwitcherKey);
