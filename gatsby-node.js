const { relativizeFiles } = require('./src/core');

const assetPrefix = '__GATSBY_RELATIVE_PATH__';
const assetFolder = 'assets';

exports.onPreBootstrap = ({ store, reporter }) => {
  const { config, program } = store.getState();
  if (assetPrefix !== config.assetPrefix) {
    reporter.panic(`The assetPrefix must be set to ${assetPrefix} in your gatsby-config.js file`);
  }

  if (program._[0] === 'build' && !program.prefixPaths) {
    reporter.panic('The build command must be run with --prefix-paths');
  }
};

exports.onPostBuild = async ({ reporter }) => {
  return relativizeFiles('public', assetPrefix, assetFolder, reporter);
};
