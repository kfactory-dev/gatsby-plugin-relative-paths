const { RelativizeContent } = require('./relative-paths');

describe('getRelativePrefix', () => {
  const options = {
    assetPrefix: '__GATSBY_RELATIVE_PATH__',
  };
  const relativize = new RelativizeContent(options);

  test('inHtmlFiles', () => {
    const path = 'public/home/index.html';
    const contents = `
    <script src="/__GATSBY_RELATIVE_PATH__/app.js"></script>
  `;
    expect(relativize.inHtmlFiles({ path, contents })).toEqual(`
    <script src="./assets/app.js"></script>
  `);
  });

  test('inJsFiles', () => {
    const path = 'public/home/index.html';
    const contents = `
    return '__GATSBY_RELATIVE_PATH__' + '/page-data/app-data.json';
    fnc('/__GATSBY_RELATIVE_PATH__' + '/page-data/app-data.json';
  `;
    expect(relativize.inJsFiles({ path, contents })).toEqual(`
    return './assets' + '/page-data/app-data.json';
    fnc('./assets' + '/page-data/app-data.json';
  `);
  });

  describe('inMiscAssetFiles', () => {
    test('binaryfile', () => {
      const path = 'public/static/image.png';
      const contents = '';
      expect(relativize.inMiscAssetFiles({ path, contents })).toEqual('');
    });
  });
});
