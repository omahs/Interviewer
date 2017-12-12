import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';
import { isEqual, pick, isMatch, has } from 'lodash';
import LayoutNode from './LayoutNode';
import { withBounds } from '../../../behaviours';
import { makeGetSociogramOptions, makeGetPlacedNodes, sociogramOptionsProps } from '../../../selectors/sociogram';
import { actionCreators as networkActions } from '../../../ducks/modules/network';
import { DropTarget } from '../../../behaviours/DragAndDrop';

const watchProps = ['width', 'height'];

const propsChangedExcludingNodes = (nextProps, props) =>
  !isEqual(pick(nextProps, watchProps), pick(props, watchProps));

const nodesLengthChanged = (nextProps, props) =>
  nextProps.nodes.length !== props.nodes.length;

const relativeCoords = (container, node) => ({
  x: (node.x - container.x) / container.width,
  y: (node.y - container.y) / container.height,
});

const dropHandlers = withProps(props => ({
  accepts: ({ meta }) => meta.itemType === 'POSITIONED_NODE',
  onDrop: (item) => {
    props.updateNode({
      uid: item.meta.uid,
      [props.layoutVariable]: relativeCoords(props, item),
    });
  },
  onDrag: (item) => {
    if (!has(item.meta, props.layoutVariable)) { return; }

    props.updateNode({
      uid: item.meta.uid,
      [props.layoutVariable]: relativeCoords(props, item),
    });
  },
}));

class NodeLayout extends Component {
  static propTypes = {
    nodes: PropTypes.array,
    toggleEdge: PropTypes.func.isRequired,
    toggleHighlight: PropTypes.func.isRequired,
    ...sociogramOptionsProps,
  };

  static defaultProps = {
    nodes: [],
    allowPositioning: true,
    allowSelect: true,
  };

  constructor(props) {
    super(props);

    this.state = {
      connectFrom: null,
    };
  }

  shouldComponentUpdate(nextProps) {
    if (nodesLengthChanged(nextProps, this.props)) { return true; }
    if (propsChangedExcludingNodes(nextProps, this.props)) { return true; }

    return false;
  }

  onSelected = (node) => {
    const { allowSelect } = this.props;

    if (!allowSelect) { return; }

    this.connectNode(node.id);

    this.toggleHighlightAttributes(node.uid);

    this.forceUpdate();
  }

  connectNode(nodeId) {
    const { createEdge } = this.props;
    const { connectFrom } = this.state;

    if (!connectFrom) {
      this.setState({ connectFrom: nodeId });
      return;
    }

    if (connectFrom !== nodeId) {
      this.props.toggleEdge({
        from: connectFrom,
        to: nodeId,
        type: createEdge,
      });
    }

    this.setState({ connectFrom: null });
  }

  toggleHighlightAttributes(nodeId) {
    this.props.toggleHighlight(
      { uid: nodeId },
      { ...this.props.highlightAttributes },
    );
  }

  isSelected(node) {
    const { allowSelect } = this.props;

    if (!allowSelect) { return false; }

    return (
      node.id === this.state.connectFrom ||
      isMatch(node, this.props.highlightAttributes)
    );
  }

  render() {
    const {
      nodes,
      allowPositioning,
      allowSelect,
      layoutVariable,
    } = this.props;

    return (
      <div className="node-layout">
        { nodes.map((node) => {
          if (!has(node, layoutVariable)) { return null; }

          return (
            <LayoutNode
              key={node.uid}
              node={node}
              layoutVariable={layoutVariable}
              onSelected={() => this.onSelected(node)}
              selected={this.isSelected(node)}
              allowPositioning={allowPositioning}
              allowSelect={allowSelect}
              areaWidth={this.props.width}
              areaHeight={this.props.height}
            />
          );
        }) }
      </div>
    );
  }
}

function makeMapStateToProps() {
  const getPlacedNodes = makeGetPlacedNodes();
  const getSociogramOptions = makeGetSociogramOptions();

  return function mapStateToProps(state, props) {
    return {
      nodes: getPlacedNodes(state, props),
      ...getSociogramOptions(state, props),
    };
  };
}

function mapDispatchToProps(dispatch) {
  return {
    toggleHighlight: bindActionCreators(networkActions.toggleNodeAttributes, dispatch),
    toggleEdge: bindActionCreators(networkActions.toggleEdge, dispatch),
    updateNode: bindActionCreators(networkActions.updateNode, dispatch),
  };
}

export { NodeLayout };

export default compose(
  connect(makeMapStateToProps, mapDispatchToProps),
  withBounds,
  dropHandlers,
  DropTarget,
)(NodeLayout);
