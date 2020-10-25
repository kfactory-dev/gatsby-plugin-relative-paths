const { getRelativePrefix } = require('./relative-paths');

describe('getRelativePrefix', () => {
  test('deep 0', () => {
    const result = getRelativePrefix('public/index.html');
    expect(result).toEqual('./');
  });

  test('deep 2', () => {
    const result = getRelativePrefix('public/blog/home/index.html');
    expect(result).toEqual('../../');
  });

  test('deep 4', () => {
    const result = getRelativePrefix('public/blog/home/profile/data/index.html');
    expect(result).toEqual('../../../../');
  });
});
