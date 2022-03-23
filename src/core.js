const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const pMap = require('p-map');
const globby = require('globby');
const isTextPath = require('is-text-path');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

// linkSync files does't work with concurrency
const TRANSFORM_CONCURRENCY = 1;

async function editTextFiles(cwd, expresion, callback) {
  const paths = await globby(expresion, { cwd });

  return pMap(
    paths.filter(isTextPath),
    async (relpath) => {
      const srcpath = path.join(cwd, relpath);
      let contents = await readFileAsync(srcpath, 'utf-8');
      const result = await callback({ path: srcpath, contents });
      if (result) {
        contents = result;
      }

      await writeFileAsync(srcpath, contents);
    },
    { concurrency: TRANSFORM_CONCURRENCY }
  );
}

async function moveAllAssets(publicPath, assetPath, verbose) {
  const files = await globby('*.{js,css,js.map,webmanifest,xml,txt}', { cwd: publicPath });

  ['static', 'page-data', ...files].forEach((file) => {
    const srcpath = path.join(publicPath, file);
    const dest = path.join(assetPath, file);
    verbose && console.log('[relative-paths]', `rename ${srcpath} to ${dest}`);
    fs.moveSync(srcpath, dest, { overwrite: true });
  });

  return true;
}

async function copyAllAssets(publicPath, assetPath, verbose) {
  const files = await globby('*.{js,css,js.map,webmanifest,xml,txt}', { cwd: publicPath });

  ['static', 'page-data', ...files].forEach((file) => {
    const srcpath = path.join(publicPath, file);
    const dest = path.join(assetPath, file);
    verbose && console.log('[relative-paths]', `copy ${srcpath} to ${dest}`);
    fs.copySync(srcpath, dest, { overwrite: true });
  });

  return true;
}

async function relativizeAssets(assetPath, assetPrefix, assetFolder, verbose) {
  const prefixPattern = new RegExp(`(/${assetPrefix}|${assetPrefix})`, 'g');
  await editTextFiles(assetPath, ['**/*.{js,js.map}'], ({ path: srcpath, contents }) => {
    verbose && console.log('[relative-paths][_JS_]', srcpath, `${assetPrefix} => ${assetFolder}`);
    return contents.replace(prefixPattern, assetFolder);
  });

  await editTextFiles(assetPath, ['**/*', '!**/*.{js,js.map}'], ({ path: src, contents }) => {
    const relativePath = path.relative(src, assetPath);

    verbose && console.log('[relative-paths][MISC]', src, `${assetPrefix} => ${relativePath}`);
    return contents.replace(prefixPattern, relativePath);
  });

  return true;
}

async function relativizeFiles(publicPath, assetPrefix, assetFolder, verbose) {
  const prefixPattern = new RegExp(`(/${assetPrefix}|${assetPrefix})`, 'g');
  const publicAssetPath = path.join(publicPath, assetFolder);
  await moveAllAssets(publicPath, publicAssetPath, verbose);

  await editTextFiles(publicPath, ['*.html'], ({ path, contents }) => {
    verbose && console.log('[relative-paths][HTML]', path, `${assetPrefix} => ${assetFolder}`);
    return contents.replaceAll(prefixPattern, assetFolder);
  });

  await editTextFiles(publicPath, ['*/**/*.html'], async ({ path: srcpath, contents }) => {
    const pageAssetPath = path.join(path.dirname(srcpath), assetFolder);
    await copyAllAssets(publicAssetPath, pageAssetPath, verbose);
    await relativizeAssets(pageAssetPath, assetPrefix, assetFolder, verbose);

    verbose && console.log('[relative-paths][HTML]', srcpath, `${assetPrefix} => ${assetFolder}`);
    return contents.replaceAll(prefixPattern, assetFolder);
  });

  return true;
}

module.exports = { editTextFiles, moveAllAssets, copyAllAssets, relativizeFiles };
