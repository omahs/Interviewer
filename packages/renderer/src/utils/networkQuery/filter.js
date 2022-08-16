const buildEdgeLookup = require('./buildEdgeLookup');
const nodePrimaryKeyProperty = require('./nodePrimaryKeyProperty');
const getRule = require('./rules').default;

// remove orphaned edges
const trimEdges = (network) => {
  const uids = new Set(network.nodes.map(node => node[nodePrimaryKeyProperty]));

  const edges = network.edges.filter(
    ({ from, to }) => uids.has(from) && uids.has(to),
  );

  return {
    ...network,
    edges,
  };
};

/**
 * Returns a method which can filter the network.
 * The returned method takes a network object and returns a network object
 *
 * @param filter
 * @param {Object[]} filter.rules An array of rule options
 * @param {('alter'|'edge')} filter.rules[].type What the rule will act on
 * @param {Object} filter.rules[].options The parameters of the rule
 * @param {('AND'|'OR')} filter.join The method used to combine rule outcomes
 *
 * Example usage:
 *
 * ```
 * import getFilter from 'networkQuery/filter';
 *
 * const config = {
 *   rules: [
 *     {
 *       type: 'alter',
 *       options: { type: 'person', attribute: 'name', operator: 'EXACTLY', value: 'Bill'},
 *     },
 *     {
 *       type: 'edge',
 *       options: { type: 'friend', operator: 'EXISTS' },
 *     },
 *   ],
 *   join: 'AND',
 * };
 *
 * const filter = getFilter(config);
 * const result = filter(network);
 */

const filter = ({ rules = [], join } = {}) => {
  const ruleRunners = rules.map(getRule);
  // use the built-in array methods
  const ruleIterator = join === 'AND' ? Array.prototype.every : Array.prototype.some;

  return (network) => {
    const edgeMap = buildEdgeLookup(network.edges);

    const nodes = network.nodes.filter(
      node => ruleIterator.call(ruleRunners, rule => rule(node, edgeMap)),
    );

    return trimEdges({
      ...network,
      nodes,
    });
  };
};

// Provides ES6 named + default imports via babel
Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = filter;
