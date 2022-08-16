const nodeAttributesProperty = require('./nodeAttributesProperty');
const nodePrimaryKeyProperty = require('./nodePrimaryKeyProperty');
const predicate = require('./predicate').default;

/**
 * Creates an edge rule, which can be called with `rule(node, edgeMap)`
 *
 * @param {Object} options Rule configuration
 * @param {string} options.type Which edge type are we looking for
 * @param {('EXISTS'|'NOT_EXISTS')} options.operator Check if node has/does not have edge
 */
const edgeRule = ({ operator, type }) =>
  (node, edgeMap) => {
    switch (operator) {
      case 'EXISTS':
        return edgeMap[type] && edgeMap[type].has(node[nodePrimaryKeyProperty]);
      default:
        return !edgeMap[type] || !edgeMap[type].has(node[nodePrimaryKeyProperty]);
    }
  };

/**
 * Creates an alter rule, which can be called with `rule(node)`
 *
 * @param {Object} options Rule configuration
 * @param {string} options.type Which type of node we are interested in
 * @param {string} options.attribute Which node attribute to assess
 * @param {string} options.operator What predicate to apply to the attribute
 * @param {string} options.value Value to compare the node attribute with
 *
 * Usage:
 * ```
 * // Check node is of type
 * const rule = alterRule({ type: 'person', operator: 'EXISTS' });
 * const result = rule(node); // returns boolean
 * ```
* ```
 * // Check node is of type and has attribute that matches the expression
 * const rule = alterRule({
 *   type: 'person',
 *   operator: 'EXISTS',
 *   attribute:'age',
 *   operator: 'GREATER_THAN',
 *   value: 20
 * });
 * const result = rule(node); // returns boolean
 * ```
 */
const alterRule = ({ attribute, operator, type, value: other }) =>
  (node) => {
    if (!attribute) {
      switch (operator) {
        case 'EXISTS':
          return node.type === type;
        default:
          return node.type !== type;
      }
    }

    return node.type === type && predicate(operator)({
      value: node[nodeAttributesProperty][attribute],
      other,
    });
  };

/**
 * Creates an ego rule, which can be called with `rule(node)`
 *
 * @param {Object} options Rule configuration
 * @param {string} options.attribute Which node attribute to assess
 * @param {string} options.operator What predicate to apply to the attribute
 * @param {string} options.value Value to compare the node attribute with
 */
const egoRule = ({ attribute, operator, value: other }) =>
  node =>
    predicate(operator)({
      value: node[nodeAttributesProperty][attribute],
      other,
    });

/**
 * Adds type parameter to rule function
 * @param {string} type rule type
 * @param {function} f rule method
 */
const createRule = (type, options, f) => {
  const rule = f(options);
  rule.type = type;
  rule.options = options;
  return rule;
};

/**
 * Creates a configured rule function based on the ruleConfig
 *
 * @param {Object} ruleConfig
 * @param {string} ruleConfig.type Which type of rule we need
 * @param {Object} ruleConfig.options Configuration object for specific rule type
 *
 * Usage:
 * ```
 * const rule = getRule({ type: alter, options: { type: 'person', operator: 'EXISTS' } });
 * const result = rule(node, edgeMap); // returns boolean
 * ```
 */
const getRule = (ruleConfig) => {
  switch (ruleConfig.type) {
    case 'alter':
      return createRule('alter', ruleConfig.options, alterRule);
    case 'edge':
      return createRule('edge', ruleConfig.options, edgeRule);
    case 'ego':
      return createRule('ego', ruleConfig.options, egoRule);
    default:
      return () => false;
  }
};

// Provides ES6 named + default imports via babel
Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = getRule;
exports.alter = alterRule;
exports.ego = egoRule;
exports.edge = edgeRule;
