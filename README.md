# gatsby-plugin-relative-paths

[![NPM version][npm-image]][npm-url]

[npm-url]: https://npmjs.org/package/gatsby-plugin-relative-paths
[npm-image]: https://img.shields.io/npm/v/gatsby-plugin-relative-paths.svg

## Installation

```sh
npm install --save gatsby-plugin-relative-paths
```

## Usage

Set `prefixPath` to `__GATSBY_RELATIVE_PATH_PREFIX__` and include the plugin in your `gatsby-config.js` file:

```js
module.exports = {
  pathPrefix: '__GATSBY_RELATIVE_PATH_PREFIX__',
  plugins: ['gatsby-plugin-relative-paths'],
};
```

```json
"scripts": {
  "build": "gatsby build --prefix-paths"
},
```

## But how?

It turns out the Gatsby doesn't support relative paths. But I didn't gave up and came up with smart and ugly hacks to do so:

- Adds a post-build step that iterates over files and transforms every `__GATSBY_RELATIVE_PATH_PREFIX__` occurrence

## License

[MIT License](http://opensource.org/licenses/MIT)
