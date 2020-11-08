const isTextPath = require('is-text-path');
const { editFiles, copyAllAssets } = require('./core');

class RelativizeContent {
  constructor({ assetPrefix }) {
    this.assetPrefix = assetPrefix;
  }

  inHtmlFiles({ path, contents }) {
    if (!contents.includes(`/${this.assetPrefix}`)) return;

    const string = `./assets`;
    contents = contents.replace(new RegExp(`(/${this.assetPrefix}|${this.assetPrefix})`, 'g'), string);
    console.log('[relative-paths][HTML]', path, `${this.assetPrefix} => ${string}`);

    return contents;
  }

  inJsFiles({ path, contents }) {
    if (!contents.includes(this.assetPrefix)) return;

    const string = `./assets`;
    contents = contents.replace(new RegExp(`(/${this.assetPrefix}|${this.assetPrefix})`, 'g'), string);
    console.log('[relative-paths][_JS_]', path, `${this.assetPrefix} => ${string}`);
    return contents;
  }

  inMiscAssetFiles({ path, contents }) {
    // Skip if is a binary file
    if (!isTextPath(path)) return;
    if (!contents.includes(this.assetPrefix)) return;
    contents = contents.replace(new RegExp(`(/${this.assetPrefix}|${this.assetPrefix})`, 'g'), `./assets`);
    console.log('[relative-paths][MISC]', path, `${this.assetPrefix} => ./assets`);
    return contents;
  }
}

async function relativizeFiles({ assetPrefix, assetFolder = 'public/assets' }) {
  const relativize = new RelativizeContent({ assetPrefix, assetFolder });

  await editFiles(['public/**/*.html'], ({ path, contents }) => {
    copyAllAssets(path, { assetFolder });
    return relativize.inHtmlFiles({ path, contents });
  });

  await editFiles(['public/**/*.{js,js.map}'], ({ path, contents }) => {
    return relativize.inJsFiles({ contents, path });
  });

  await editFiles(['public/**/*', '!public/**/*.html', '!public/**/*.{js,js.map}'], ({ path, contents }) => {
    return relativize.inMiscAssetFiles({ contents, path });
  });

  return true;
}

module.exports = { relativizeFiles, RelativizeContent };
