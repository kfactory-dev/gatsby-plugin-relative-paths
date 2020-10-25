const fs = require('fs');
const util = require('util');
const pMap = require('p-map');
const globby = require('globby');
const isTextPath = require('is-text-path');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const TRANSFORM_CONCURRENCY = 10;
const PATH_PREFIX = '__GATSBY_RELATIVE_PATH_PREFIX__';
exports.PATH_PREFIX = PATH_PREFIX;

function getRelativePrefix(path) {
  const depth = path.split('/').length - 2;
  return depth > 0 ? '../'.repeat(depth) : './';
}
exports.getRelativePrefix = getRelativePrefix;

/**
Replaces all /__GATSBY_RELATIVE_PATH_PREFIX__/ strings with the correct relative paths
based on the depth of the file within the `public/` folder
*/
async function relativizeHtmlFiles(assetPrefix) {
  const paths = await globby(['public/**/*.html']);

  await pMap(
    paths,
    async (path) => {
      let contents = await readFileAsync(path, 'utf-8');
      if (!contents.includes(PATH_PREFIX)) return;

      const relativePrefix = getRelativePrefix(path);

      contents = contents.replace(
        new RegExp(`/${assetPrefix}/${PATH_PREFIX}/`, 'g'),
        `${relativePrefix}${assetPrefix}/`
      );
      contents = contents.replace(new RegExp(`/${PATH_PREFIX}/`, 'g'), `${relativePrefix}`);

      await writeFileAsync(path, contents);
    },
    { concurrency: TRANSFORM_CONCURRENCY }
  );
}
exports.relativizeHtmlFiles = relativizeHtmlFiles;

/**
Replaces all "/__GATSBY_RELATIVE_PATH_PREFIX__" strings __GATSBY_RELATIVE_PATH_PREFIX__
Replaces all "/__GATSBY_RELATIVE_PATH_PREFIX__/" strings with __GATSBY_RELATIVE_PATH_PREFIX__ + "/"
Replaces all "/__GATSBY_RELATIVE_PATH_PREFIX__/xxxx" strings with __GATSBY_RELATIVE_PATH_PREFIX__ + "/xxxx"
Also ensures that `__GATSBY_RELATIVE_PATH_PREFIX__` is defined in case this JS file is outside the document context, e.g.: in a worker
*/
async function relativizeJsFiles() {
  const paths = await globby(['public/**/*.js']);

  await pMap(
    paths,
    async (path) => {
      let contents = await readFileAsync(path, 'utf-8');
      if (!contents.includes(PATH_PREFIX)) return;

      contents = contents
        .replace(/["']\/__GATSBY_RELATIVE_PATH_PREFIX__['"]/g, () => ' __GATSBY_RELATIVE_PATH_PREFIX__ ')
        .replace(
          /(["'])\/__GATSBY_RELATIVE_PATH_PREFIX__\/([^'"]*?)(['"])/g,
          (matches, g1, g2, g3) => ` ${PATH_PREFIX} + ${g1}/${g2}${g3}`
        );

      contents = `if(typeof ${PATH_PREFIX} === 'undefined'){${PATH_PREFIX}=''}${contents}`;

      await writeFileAsync(path, contents);
    },
    { concurrency: TRANSFORM_CONCURRENCY }
  );
}
exports.relativizeJsFiles = relativizeJsFiles;

/**
Replaces all /__GATSBY_RELATIVE_PATH_PREFIX__/ strings to standard relative paths
*/
async function relativizeMiscAssetFiles() {
  const paths = await globby(['public/**/*', '!public/**/*.html', '!public/**/*.js']);

  await pMap(
    paths,
    async (path) => {
      // Skip if is a binary file
      if (!isTextPath(path)) return;

      let contents = await readFileAsync(path, 'utf-8');
      if (!contents.includes(PATH_PREFIX)) return;

      contents = contents.replace(new RegExp(`/${PATH_PREFIX}/`, 'g'), getRelativePrefix(path));

      await writeFileAsync(path, contents);
    },
    { concurrency: TRANSFORM_CONCURRENCY }
  );
}
exports.relativizeMiscAssetFiles = relativizeMiscAssetFiles;
