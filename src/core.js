const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const pMap = require('p-map');
const globby = require('globby');
const isTextPath = require('is-text-path');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

async function editTextFiles(cwd, expresion, callback) {
  const paths = await globby(expresion, { cwd });

  return pMap(paths.filter(isTextPath), async (relpath) => {
    const srcpath = path.join(cwd, relpath);
    const contents = await readFileAsync(srcpath, 'utf-8');
    const result = await callback({ path: srcpath, contents });

    await writeFileAsync(srcpath, result);
  });
}

async function moveAllAssets(publicPath, assetPath, reporter) {
  const files = await globby('*.{js,css,js.map,webmanifest,xml,txt}', { cwd: publicPath });

  ['static', 'page-data', ...files].forEach((file) => {
    const srcpath = path.join(publicPath, file);
    const dest = path.join(assetPath, file);

    reporter.verbose(`[relative-paths] rename ${srcpath} ${dest}`);
    fs.moveSync(srcpath, dest, { overwrite: true });
  });

  return true;
}

async function copyAllAssets(publicPath, assetPath, reporter) {
  const files = await globby('*.{js,css,js.map,webmanifest,xml,txt}', { cwd: publicPath });

  ['static', 'page-data', ...files].forEach((file) => {
    const srcpath = path.join(publicPath, file);
    const dest = path.join(assetPath, file);

    reporter.verbose(`[relative-paths] copy ${srcpath} ${dest}`);
    fs.copySync(srcpath, dest, { overwrite: true });
  });

  return true;
}

async function relativizeAssets(assetPath, assetPrefix, assetFolder, reporter) {
  const prefixPattern = new RegExp(`(/${assetPrefix}|${assetPrefix})`, 'g');

  await editTextFiles(assetPath, ['**/*.{js,js.map}'], ({ path: srcpath, contents }) => {
    reporter.verbose(`[relative-paths][_JS_] replace ${srcpath} ${assetPrefix} ${assetFolder}`);
    return contents.replace(prefixPattern, assetFolder);
  });

  await editTextFiles(assetPath, ['**/*', '!**/*.{js,js.map}'], ({ path: src, contents }) => {
    const relativePath = path.relative(src, assetPath);

    reporter.verbose(`[relative-paths][MISC] replace ${src} ${assetPrefix} ${relativePath}`);
    return contents.replace(prefixPattern, relativePath);
  });

  return true;
}

async function relativizeFiles(publicPath, assetPrefix, assetFolder, reporter) {
  const prefixPattern = new RegExp(`(/${assetPrefix}|${assetPrefix})`, 'g');

  const publicAssetPath = path.join(publicPath, assetFolder);
  await moveAllAssets(publicPath, publicAssetPath, reporter);

  await editTextFiles(publicPath, ['*.html'], ({ path, contents }) => {
    reporter.verbose(`[relative-paths][HTML] replace ${path}: ${assetPrefix} ${assetFolder}`);
    return contents.replaceAll(prefixPattern, assetFolder);
  });

  await editTextFiles(publicPath, ['*/**/*.html'], async ({ path: srcpath, contents }) => {
    const pageAssetPath = path.join(path.dirname(srcpath), assetFolder);

    await copyAllAssets(publicAssetPath, pageAssetPath, reporter);
    await relativizeAssets(pageAssetPath, assetPrefix, assetFolder, reporter);

    reporter.verbose(`[relative-paths][HTML] replace ${srcpath}: ${assetPrefix} ${assetFolder}`);
    return contents.replaceAll(prefixPattern, assetFolder);
  });

  return true;
}

module.exports = { editTextFiles, moveAllAssets, copyAllAssets, relativizeFiles };
