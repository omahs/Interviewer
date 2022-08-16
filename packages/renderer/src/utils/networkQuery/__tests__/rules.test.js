/* eslint-env jest */
const buildEdgeLookup = require('../buildEdgeLookup');
const getRule = require('../rules').default;
const helpers = require('./helpers');

const generateNode = helpers.getNodeGenerator();
const generateRuleConfig = helpers.generateRuleConfig;

const nodes = [
  generateNode({ name: 'William', age: 19, categoricalNull: null }),
  generateNode({ name: 'Theodore', age: 18, categoricalNull: null }),
  generateNode({ name: 'Rufus', age: 51, categoricalNull: null }),
  generateNode({ name: 'Phone Box' }, 'public_utility'),
];

const edges = [
  { from: 1, to: 2, type: 'friend' },
  { from: 2, to: 3, type: 'friend' },
  { from: 1, to: 3, type: 'friend' },
  { from: 1, to: 2, type: 'band' },
];

const edgeMap = buildEdgeLookup(edges);

describe('rules', () => {
  it('getRule() returns a function', () => {
    const rule = getRule({});

    expect(typeof rule).toEqual('function');
  });


  describe('alter rules', () => {
    describe('faulty rules', () => {
      it('correctly handles missing attribute (EXACTLY)', () => {
        const ruleConfig = generateRuleConfig(
          'alter',
          {
            type: 'person',
            attribute: 'missingVariable',
            operator: 'EXACTLY',
            value: 19,
          },
        );

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(0);
      });

      it('correctly handles missing attribute (NOT)', () => {
        const ruleConfig = generateRuleConfig(
          'alter',
          {
            type: 'person',
            attribute: 'missingVariable',
            operator: 'NOT',
            value: 19,
          },
        );

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(3);
      });

      it('correctly handles false-like categorical attribute (INCLUDES)', () => {
        const ruleConfig = generateRuleConfig(
          'alter',
          {
            type: 'person',
            attribute: 'categoricalNull',
            operator: 'INCLUDES',
            value: [19],
          },
        );

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(0);
      });

      it('correctly handles false-like categorical attribute (EXCLUDES)', () => {
        const ruleConfig = generateRuleConfig(
          'alter',
          {
            type: 'person',
            attribute: 'categoricalNull',
            operator: 'EXCLUDES',
            value: [19],
          },
        );

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(3);
      });
    });


    describe('type rules', () => {
      it('EXISTS', () => {
        const ruleConfig = generateRuleConfig('alter', { type: 'person', operator: 'EXISTS' });

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(3);
      });

      it('NOT_EXISTS', () => {
        const ruleConfig = generateRuleConfig('alter', { type: 'person', operator: 'NOT_EXISTS' });

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(1);
      });
    });

    describe('attribute rules', () => {
      const generateAttributeRuleConfig = config =>
        generateRuleConfig(
          'alter',
          {
            type: 'person',
            operator: 'EXACTLY',
            attribute: 'name',
            value: 'William',
            ...config,
          },
        );

      it('EXACTLY', () => {
        const ruleConfig = generateAttributeRuleConfig({ operator: 'EXACTLY' });

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(1);
      });

      it('NOT', () => {
        const ruleConfig = generateAttributeRuleConfig({ operator: 'NOT' });

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(2);
      });

      it('GREATER_THAN', () => {
        const ruleConfig = generateAttributeRuleConfig({
          attribute: 'age',
          operator: 'GREATER_THAN',
          value: 19,
        });

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(1);
      });

      it('LESS_THAN', () => {
        const ruleConfig = generateAttributeRuleConfig({
          attribute: 'age',
          operator: 'LESS_THAN',
          value: 19,
        });

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(1);
      });

      it('GREATER_THAN_OR_EQUAL', () => {
        const ruleConfig = generateAttributeRuleConfig({
          attribute: 'age',
          operator: 'GREATER_THAN_OR_EQUAL',
          value: 19,
        });

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(2);
      });

      it('LESS_THAN_OR_EQUAL', () => {
        const ruleConfig = generateAttributeRuleConfig({
          attribute: 'age',
          operator: 'LESS_THAN_OR_EQUAL',
          value: 19,
        });

        const rule = getRule(ruleConfig);
        const matches = nodes.filter(rule);
        expect(matches.length).toEqual(2);
      });
    });
  });

  describe('edge rules', () => {
    it('EXISTS', () => {
      const ruleConfig = generateRuleConfig('edge', { type: 'friend', operator: 'EXISTS' });

      const rule = getRule(ruleConfig);
      const matches = nodes.filter(node => rule(node, edgeMap));
      expect(matches.length).toEqual(3);
    });

    it('NOT_EXISTS', () => {
      const ruleConfig = generateRuleConfig('edge', { type: 'friend', operator: 'NOT_EXISTS' });

      const rule = getRule(ruleConfig);
      const matches = nodes.filter(node => rule(node, edgeMap));
      expect(matches.length).toEqual(1);
    });
  });
});
