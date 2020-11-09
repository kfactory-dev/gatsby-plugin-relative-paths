const { relativizeFiles } = require('./src/relative-paths');
const { moveAllAssets } = require('./src/core');

const assetPrefix = '__GATSBY_RELATIVE_PATH__';

exports.onPreBootstrap = ({ store, reporter }) => {
  const { config, program } = store.getState();
  if (assetPrefix !== config.assetPrefix) {
    reporter.panic(`The assetPrefix must be set to ${assetPrefix} in your gatsby-config.js file`);
  }

  if (program._[0] === 'build' && !program.prefixPaths) {
    reporter.panic('The build command must be run with --prefix-paths');
  }
};

exports.onPostBuild = async (_, { assetFolder = 'public', verbose = false }) => {
  assetFolder = `${assetFolder}/assets`;

  await moveAllAssets({ assetFolder, verbose });
  await relativizeFiles({ assetPrefix, assetFolder, verbose });
};
