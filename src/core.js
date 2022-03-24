const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const pMap = require('p-map');
const globby = require('globby');
const isTextPath = require('is-text-path');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const moveAsync = util.promisify(fs.move);
const copyAsync = util.promisify(fs.copy);

const TRANSFORM_CONCURRENCY = 1;

async function editTextFiles(root, expresion, callback) {
  const files = await globby(expresion, { cwd: root });

  return pMap(
    files.filter(isTextPath),
    async (file) => {
      const srcpath = path.join(root, file);
      const contents = await readFileAsync(srcpath, 'utf-8');
      const result = await callback(srcpath, contents);

      await writeFileAsync(srcpath, result);
    },
    { concurrency: TRANSFORM_CONCURRENCY }
  );
}

async function moveAllAssets(root, target, reporter) {
  const files = await globby('*.{js,css,js.map,webmanifest,xml,txt}', { cwd: root });

  for (const file of ['static', 'page-data', ...files]) {
    const srcpath = path.join(root, file);
    const dest = path.join(target, file);

    reporter.verbose(`[relative-paths] rename ${srcpath} ${dest}`);
    await moveAsync(srcpath, dest, { overwrite: true });
  }
}

async function copyAllAssets(root, target, reporter) {
  const files = await globby('*.{js,css,js.map,webmanifest,xml,txt}', { cwd: root });

  for (const file of ['static', 'page-data', ...files]) {
    const srcpath = path.join(root, file);
    const dest = path.join(target, file);

    reporter.verbose(`[relative-paths] copy ${srcpath} ${dest}`);
    await copyAsync(srcpath, dest, { overwrite: true });
  }
}

async function relativizeAssets(assetPath, assetPrefix, assetFolder, reporter) {
  const prefixPattern = new RegExp(`(/${assetPrefix}|${assetPrefix})`, 'g');

  await editTextFiles(assetPath, ['**/*.{js,js.map}'], (path, contents) => {
    reporter.verbose(`[relative-paths][_JS_] replace ${path} ${assetPrefix} ${assetFolder}`);
    return contents.replace(prefixPattern, assetFolder);
  });

  await editTextFiles(assetPath, ['**/*', '!**/*.{js,js.map}'], (srcpath, contents) => {
    const relativePath = path.relative(srcpath, assetPath);

    reporter.verbose(`[relative-paths][MISC] replace ${srcpath} ${assetPrefix} ${relativePath}`);
    return contents.replace(prefixPattern, relativePath);
  });

  return true;
}

async function relativizeFiles(publicPath, assetPrefix, assetFolder, reporter) {
  const prefixPattern = new RegExp(`(/${assetPrefix}|${assetPrefix})`, 'g');

  const publicAssetPath = path.join(publicPath, assetFolder);
  await moveAllAssets(publicPath, publicAssetPath, reporter);

  await editTextFiles(publicPath, ['*.html'], (path, contents) => {
    reporter.verbose(`[relative-paths][HTML] replace ${path}: ${assetPrefix} ${assetFolder}`);
    return contents.replace(prefixPattern, assetFolder);
  });

  await editTextFiles(publicPath, ['*/**/*.html'], async (srcpath, contents) => {
    const pageAssetPath = path.join(path.dirname(srcpath), assetFolder);

    await copyAllAssets(publicAssetPath, pageAssetPath, reporter);
    await relativizeAssets(pageAssetPath, assetPrefix, assetFolder, reporter);

    reporter.verbose(`[relative-paths][HTML] replace ${srcpath}: ${assetPrefix} ${assetFolder}`);
    return contents.replace(prefixPattern, assetFolder);
  });

  await relativizeAssets(publicAssetPath, assetPrefix, assetFolder, reporter);
}

module.exports = { editTextFiles, moveAllAssets, copyAllAssets, relativizeFiles };
