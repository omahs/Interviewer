/* eslint-env jest */
const buildEdgeLookup = require('../buildEdgeLookup');

const mockEdges = [
  { from: 1, to: 2, type: 'friends' },
  { from: 1, to: 2, type: 'running_club' },
  { from: 1, to: 3, type: 'friends' },
  { from: 3, to: 4, type: 'band_members' },
];

describe('buildEdgeLookup()', () => {
  it('returns an edge lookup set', () => {
    const subject = buildEdgeLookup(mockEdges);
    expect(subject).toEqual({
      band_members: new Set([3, 4]),
      friends: new Set([1, 2, 3]),
      running_club: new Set([1, 2]),
    });
  });
});
