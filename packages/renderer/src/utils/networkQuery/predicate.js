const {
  isEqual,
  isNull,
  isArray,
} = require('lodash');

// operators list
const operators = {
  EXACTLY: 'EXACTLY',
  INCLUDES: 'INCLUDES',
  EXCLUDES: 'EXCLUDES',
  EXISTS: 'EXISTS',
  NOT_EXISTS: 'NOT_EXISTS',
  NOT: 'NOT',
  GREATER_THAN: 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL: 'GREATER_THAN_OR_EQUAL',
  LESS_THAN: 'LESS_THAN',
  LESS_THAN_OR_EQUAL: 'LESS_THAN_OR_EQUAL',
  OPTIONS_GREATER_THAN: 'OPTIONS_GREATER_THAN',
  OPTIONS_LESS_THAN: 'OPTIONS_LESS_THAN',
  OPTIONS_EQUALS: 'OPTIONS_EQUALS',
  OPTIONS_NOT_EQUALS: 'OPTIONS_NOT_EQUALS',
};

// count operators list
const countOperators = {
  COUNT: 'COUNT',
  COUNT_NOT: 'COUNT_NOT',
  COUNT_ANY: 'COUNT_ANY',
  COUNT_NONE: 'COUNT_NONE',
  COUNT_GREATER_THAN: 'COUNT_GREATER_THAN',
  COUNT_GREATER_THAN_OR_EQUAL: 'COUNT_GREATER_THAN_OR_EQUAL',
  COUNT_LESS_THAN: 'COUNT_LESS_THAN',
  COUNT_LESS_THAN_OR_EQUAL: 'COUNT_LESS_THAN_OR_EQUAL',
};

/**
 * returns functions that can be used to compare `value` with `other`
 *
 * @param {string} operator One of the operators from the operators list.
 *
 * Usage:
 *
 * ```
 * predicate('GREATER_THAN')({ value: 2, other: 1 }); // returns true
 * ```
 */
const predicate = operator =>
  ({ value, other }) => {
    switch (operator) {
      case operators.GREATER_THAN:
      case countOperators.COUNT_GREATER_THAN:
        return value > other;
      case operators.LESS_THAN:
      case countOperators.COUNT_LESS_THAN:
        return value < other;
      case operators.GREATER_THAN_OR_EQUAL:
      case countOperators.COUNT_GREATER_THAN_OR_EQUAL:
        return value >= other;
      case operators.LESS_THAN_OR_EQUAL:
      case countOperators.COUNT_LESS_THAN_OR_EQUAL:
        return value <= other;
      case operators.EXACTLY:
      case countOperators.COUNT:
        return isEqual(value, other);
      case operators.NOT:
      case countOperators.COUNT_NOT:
        return !isEqual(value, other);
      case operators.INCLUDES: {
        if (!value) { return false; } // ord/cat vars are initialised to null
        return value.includes(other);
      }
      case operators.EXCLUDES: {
        if (!value) { return true; } // ord/cat vars are initialised to null
        return !value.includes(other);
      }
      case operators.EXISTS:
        return !isNull(value);
      case operators.NOT_EXISTS:
        return isNull(value);
      case countOperators.COUNT_ANY:
        return value > 0;
      case countOperators.COUNT_NONE:
        return value === 0;
      case operators.OPTIONS_GREATER_THAN: {
        if (!isArray(value)) { return false; }
        return value.length > other;
      }
      case operators.OPTIONS_LESS_THAN: {
        if (!isArray(value)) { return false; }
        return value.length < other;
      }
      case operators.OPTIONS_EQUALS: {
        if (!isArray(value)) { return false; }
        return value.length === other;
      }
      case operators.OPTIONS_NOT_EQUALS: {
        if (!isArray(value)) { return false; }
        return value.length !== other;
      }
      default:
        return false;
    }
  };

// Provides ES6 named + default imports via babel
Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = predicate;
exports.operators = operators;
exports.countOperators = countOperators;
