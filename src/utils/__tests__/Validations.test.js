/* eslint-env jest */

import {
  required,
  minLength,
  maxLength,
  minValue,
  maxValue,
  minSelected,
  maxSelected,
  unique,
  differentFrom,
  sameAs,
} from '../Validations';
import {
  entityAttributesProperty,
} from '../../ducks/modules/network';

describe('Validations', () => {
  describe('required()', () => {
    const errorMessage = 'You must answer this question before continuing';
    const subject = required();

    it('passes for a string', () => {
      expect(subject('hello world')).toBe(undefined);
    });

    it('passes for a numerical value', () => {
      expect(subject(3)).toBe(undefined);
      expect(subject(0)).toBe(undefined);
    });

    it('fails for null or undefined', () => {
      expect(subject(null)).toEqual(errorMessage);
      expect(subject(undefined)).toEqual(errorMessage);
    });

    it('fails for an empty string', () => {
      expect(subject('')).toEqual(errorMessage);
    });
  });

  describe('minLength()', () => {
    const errorMessage = 'Your answer must be 5 characters or more';
    const subject = minLength(5);

    it('passes for null or undefined', () => {
      expect(subject(null)).toBe(undefined);
      expect(subject(undefined)).toBe(undefined);
    });

    it('fails for a smaller string', () => {
      expect(subject('hi')).toBe(errorMessage);
    });

    it('passes for an exactly matching string', () => {
      expect(subject('hello')).toBe(undefined);
    });

    it('passes for a larger string', () => {
      expect(subject('hello world')).toBe(undefined);
    });
  });

  describe('maxLength()', () => {
    const errorMessage = 'Your answer must be 5 characters or less';
    const subject = maxLength(5);

    it('passes for null or undefined', () => {
      expect(subject(null)).toBe(undefined);
      expect(subject(undefined)).toBe(undefined);
    });

    it('passes for a smaller string', () => {
      expect(subject('hi')).toBe(undefined);
    });

    it('passes for an exactly matching string', () => {
      expect(subject('hello')).toBe(undefined);
    });

    it('fails for a larger string', () => {
      expect(subject('hello world')).toBe(errorMessage);
    });
  });

  describe('minValue()', () => {
    const errorMessage = 'Your answer must be at least 5';
    const subject = minValue(5);

    it('passes for null or undefined', () => {
      expect(subject(null)).toBe(undefined);
      expect(subject(undefined)).toBe(undefined);
    });

    it('fails for a negative number', () => {
      expect(subject(-1)).toBe(errorMessage);
    });

    it('fails for 0', () => {
      expect(subject(0)).toBe(errorMessage);
    });

    it('fails for a smaller value', () => {
      expect(subject(3)).toBe(errorMessage);
    });

    it('passes for an exactly matching value', () => {
      expect(subject(5)).toBe(undefined);
    });

    it('passes for a larger value', () => {
      expect(subject(10)).toBe(undefined);
    });
  });

  describe('maxValue()', () => {
    const errorMessage = 'Your answer must be less than 5';
    const subject = maxValue(5);

    it('passes for null or undefined', () => {
      expect(subject(null)).toBe(undefined);
      expect(subject(undefined)).toBe(undefined);
    });

    it('passes for a negative number', () => {
      expect(subject(-1)).toBe(undefined);
    });

    it('passes for 0', () => {
      expect(subject(0)).toBe(undefined);
    });

    it('passes for a smaller value', () => {
      expect(subject(3)).toBe(undefined);
    });

    it('passes for an exactly matching value', () => {
      expect(subject(5)).toBe(undefined);
    });

    it('fails for a larger value', () => {
      expect(subject(10)).toBe(errorMessage);
    });
  });

  describe('minSelected()', () => {
    const errorMessage = 'You must choose a minimum of 2 option(s)';
    const subject = minSelected(2);

    it('fails for null or undefined', () => {
      expect(subject(null)).toBe(errorMessage);
      expect(subject(undefined)).toBe(errorMessage);
    });

    it('fails for an empty array', () => {
      expect(subject([])).toBe(errorMessage);
    });

    it('fails for a smaller array', () => {
      expect(subject([1])).toBe(errorMessage);
    });

    it('passes for an exactly matching array', () => {
      expect(subject([1, 2])).toBe(undefined);
    });

    it('passes for a larger array', () => {
      expect(subject([1, 2, 3])).toBe(undefined);
    });
  });

  describe('maxSelected()', () => {
    const errorMessage = 'You must choose a maximum of 2 option(s)';
    const subject = maxSelected(2);

    it('fails for null or undefined', () => {
      expect(subject(null)).toBe(errorMessage);
      expect(subject(undefined)).toBe(errorMessage);
    });

    it('passes for an empty array', () => {
      expect(subject([])).toBe(undefined);
    });

    it('passes for a smaller array', () => {
      expect(subject([1])).toBe(undefined);
    });

    it('passes for an exactly matching array', () => {
      expect(subject([1, 2])).toBe(undefined);
    });

    it('fails for a larger array', () => {
      expect(subject([1, 2, 3])).toBe(errorMessage);
    });
  });

  describe('unique()', () => {
    const errorMessage = 'Your answer must be unique';
    const subject = unique('');
    const entities = {
      otherNetworkEntities: [{
        [entityAttributesProperty]: {
          uid1: 1, uid2: false, uid3: 'word', uid4: [1, 2, 3], uid5: { x: 1.2, y: 2.3 },
        },
      }],
    };

    it('passes for null or undefined', () => {
      expect(subject(null, '', entities, 'uid1')).toBe(undefined);
      expect(subject(undefined, '', entities, 'uid1')).toBe(undefined);
    });

    it('passes for a unique number', () => {
      expect(subject(2, '', entities, 'uid1')).toBe(undefined);
    });

    it('fails for a matching number', () => {
      expect(subject(1, '', entities, 'uid1')).toBe(errorMessage);
    });

    it('passes for a unique string', () => {
      expect(subject('diff', '', entities, 'uid3')).toBe(undefined);
    });

    it('fails for a matching string', () => {
      expect(subject('word', '', entities, 'uid3')).toBe(errorMessage);
    });

    it('passes for a unique array', () => {
      expect(subject([3, 1], '', entities, 'uid4')).toBe(undefined);
    });

    it('fails for a matching array', () => {
      expect(subject([3, 1, 2], '', entities, 'uid4')).toBe(errorMessage);
    });

    it('passes for a unique boolean', () => {
      expect(subject(true, '', entities, 'uid2')).toBe(undefined);
    });

    it('fails for a matching boolean', () => {
      expect(subject(false, '', entities, 'uid2')).toBe(errorMessage);
    });

    it('passes for a unique object', () => {
      expect(subject({ x: 2.1, y: 3.2 }, '', entities, 'uid5')).toBe(undefined);
    });

    it('fails for a matching object', () => {
      expect(subject({ y: 2.3, x: 1.2 }, '', entities, 'uid5')).toBe(errorMessage);
    });
  });

  describe('differentFrom()', () => {
    const errorMessage = 'Your answer must be different from';
    const subject1 = differentFrom('uid1');
    const subject2 = differentFrom('uid2');
    const subject3 = differentFrom('uid3');
    const subject4 = differentFrom('uid4');
    const subject5 = differentFrom('uid5');
    const allValues = {
      uid1: 1, uid2: false, uid3: 'word', uid4: [1, 2, 3], uid5: { x: 1.2, y: 2.3 },
    };

    it('passes for null or undefined', () => {
      expect(subject1(null, allValues)).toBe(undefined);
      expect(subject1(undefined, allValues)).toBe(undefined);
    });

    it('passes for a different number', () => {
      expect(subject1(2, allValues)).toBe(undefined);
    });

    it('fails for a matching number', () => {
      expect(subject1(1, allValues)).toBe(`${errorMessage} 1`);
    });

    it('passes for a different boolean', () => {
      expect(subject2(true, allValues)).toBe(undefined);
    });

    it('fails for a matching boolean', () => {
      expect(subject2(false, allValues)).toBe(`${errorMessage} false`);
    });

    it('passes for a different string', () => {
      expect(subject3('diff', allValues)).toBe(undefined);
    });

    it('fails for a matching string', () => {
      expect(subject3('word', allValues)).toBe(`${errorMessage} word`);
    });

    it('passes for a different array', () => {
      expect(subject4([1, 2], allValues)).toBe(undefined);
    });

    it('fails for a matching array', () => {
      expect(subject4([3, 1, 2], allValues)).toBe(`${errorMessage} 1,2,3`);
    });

    it('passes for a different object', () => {
      expect(subject5({ x: 2.1, y: 3.2 }, allValues)).toBe(undefined);
    });

    it('fails for a matching object', () => {
      expect(subject5({ y: 2.3, x: 1.2 }, allValues)).toBe(`${errorMessage} [object Object]`);
    });
  });

  describe('sameAs()', () => {
    const errorMessage = 'Your answer must be the same as';
    const subject1 = sameAs('uid1');
    const subject2 = sameAs('uid2');
    const subject3 = sameAs('uid3');
    const subject4 = sameAs('uid4');
    const subject5 = sameAs('uid5');
    const allValues = {
      uid1: 1, uid2: false, uid3: 'word', uid4: [1, 2, 3], uid5: { x: 1.2, y: 2.3 },
    };

    it('fails for null or undefined', () => {
      expect(subject1(null, allValues)).toBe(`${errorMessage} 1`);
      expect(subject1(undefined, allValues)).toBe(`${errorMessage} 1`);
    });

    it('passes for a matching number', () => {
      expect(subject1(1, allValues)).toBe(undefined);
    });

    it('fails for a different number', () => {
      expect(subject1(2, allValues)).toBe(`${errorMessage} 1`);
    });

    it('passes for a matching boolean', () => {
      expect(subject2(false, allValues)).toBe(undefined);
    });

    it('fails for a different boolean', () => {
      expect(subject2(true, allValues)).toBe(`${errorMessage} false`);
    });

    it('passes for a matching string', () => {
      expect(subject3('word', allValues)).toBe(undefined);
    });

    it('fails for a different string', () => {
      expect(subject3('diff', allValues)).toBe(`${errorMessage} word`);
    });

    it('passes for a matching array', () => {
      expect(subject4([3, 1, 2], allValues)).toBe(undefined);
    });

    it('fails for a different array', () => {
      expect(subject4([1, 2], allValues)).toBe(`${errorMessage} 1,2,3`);
    });

    it('passes for a matching object', () => {
      expect(subject5({ y: 2.3, x: 1.2 }, allValues)).toBe(undefined);
    });

    it('fails for a different object', () => {
      expect(subject5({ x: 2.1, y: 3.2 }, allValues)).toBe(`${errorMessage} [object Object]`);
    });
  });
});
