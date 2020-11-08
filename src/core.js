const fs = require('fs-extra');
const util = require('util');
const pMap = require('p-map');
const globby = require('globby');
const klawSync = require('klaw-sync');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

// linkSync files does't work with concurrency
const TRANSFORM_CONCURRENCY = 1;

async function editFiles(expresion, callback) {
  const paths = await globby(expresion);

  return pMap(
    paths,
    async (path) => {
      let contents = await readFileAsync(path, 'utf-8');
      const result = await callback({ path, contents });
      if (result) {
        contents = result;
      }

      await writeFileAsync(path, contents);
    },
    { concurrency: TRANSFORM_CONCURRENCY }
  );
}

async function moveAllAssets({ assetFolder }) {
  const files = await globby('public/*.{js,css,js.map,webmanifest,xml,txt}');
  files.forEach((file) => {
    fs.moveSync(file, file.replace('public', `${assetFolder}`), {
      overwrite: true,
    });
  });
  fs.moveSync(`public/static`, `${assetFolder}/static`, { overwrite: true });
  fs.moveSync(`public/page-data`, `${assetFolder}/page-data`, {
    overwrite: true,
  });
  return true;
}

function copyAllAssets(path, { assetFolder }) {
  let dest = path.replace(/\/(index|404|500).html/g, '');
  dest = `${dest}/assets`;

  klawSync(assetFolder, { nofile: true }).forEach(({ path }) => {
    const newPath = path.replace(assetFolder, dest);
    fs.mkdirSync(newPath, { recursive: true });
  });

  klawSync(assetFolder, { nodir: true }).forEach(({ path }) => {
    const newPath = path.replace(assetFolder, dest);
    fs.ensureSymlink(path, newPath);
  });

  return true;
}

module.exports = { editFiles, moveAllAssets, copyAllAssets };
