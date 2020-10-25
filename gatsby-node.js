const {
  relativizeHtmlFiles,
  relativizeJsFiles,
  relativizeMiscAssetFiles,
  PATH_PREFIX,
} = require('./src/relative-paths');

exports.onPreBootstrap = ({ store, reporter }) => {
  const { config, program } = store.getState();
  if (`/${PATH_PREFIX}` !== config.pathPrefix) {
    reporter.panic(`The pathPrefix must be set to ${PATH_PREFIX} in your gatsby-config.js file`);
  }

  if (program._[0] === 'build' && !program.prefixPaths) {
    reporter.panic('The build command must be run with --prefix-paths');
  }
};

exports.onPostBuild = async ({ store }) => {
  const { config } = store.getState();
  await relativizeHtmlFiles(config.assetPrefix);
  await relativizeJsFiles();
  await relativizeMiscAssetFiles();
};
