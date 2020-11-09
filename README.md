# gatsby-plugin-relative-paths

[![NPM version][npm-image]][npm-url]

[npm-url]: https://npmjs.org/package/gatsby-plugin-relative-paths
[npm-image]: https://img.shields.io/npm/v/gatsby-plugin-relative-paths.svg

## Installation

```
npm install --save gatsby-plugin-relative-paths
```

## Usage

Set `assetPrefix` to `__GATSBY_RELATIVE_PATH__` and include the plugin in your `gatsby-config.js` file:

```js
module.exports = {
  assetPrefix: '__GATSBY_RELATIVE_PATH__',
  plugins: [
    // recomended to avoid react routes redirections
    `@wardpeet/gatsby-plugin-static-site`,
    'gatsby-plugin-relative-paths',
  ],
};
```

```json
"scripts": {
  "build": "gatsby build --prefix-paths"
},
```

## What is a relative path?

Relative paths use the current url to calculate the location of the resource.

Example:

```
URL: www.example.com/blog/posts/1
```

`public/blog/potsts/1/index.html`

```html
<script src="../../assets/app.js"></script>
```

our browser search for the resource at the following location (two levels of folders higher):
`www.example.com/blog/assets/app.js`

## Relative paths use cases

Gatsby provides some solutions to change the location of the assets [asset-prefix](https://www.gatsbyjs.com/docs/asset-prefix/) and to have more control of the web site url [path-prefix](https://www.gatsbyjs.com/docs/path-prefix/).
These would be some scenarios where Gatsby's solutions are not enough:

### Multiple urls

If your web site is served statically it may be embedded in a specific path, for example `/blog` but in some cases it may be more than one embedded path, example `/blog`, `/my-company/blog`, `/us/blog`, etc.

## But how?

Using a smart and ugly hacks to do so:

- Adds a post-build step that iterates over files and transforms every `__GATSBY_RELATIVE_PATH__` occurrence

HTML files

```html
<script src="__GATSBY_RELATIVE_PATH__/app.js"></script>
```

to

```html
<script src="./assets/app.js"></script>
```

JS files

```javascript
return '__GATSBY_RELATIVE_PATH__' + '/page-data/app-data.json';
```

```javascript
return './assets' + '/page-data/app-data.json`;
```

It is also necessary to move the assets folder to each html file, so that it is always relative to the html file.
This copy will be a symbolic link, so it will not use more disk space than necessary.

### Assets relative to each html file

```
public
--assets
----app.js
----page-data
--posts/1
----assets
------app.js
------page-data
----index.html
--contact
----assets
------app.js
------page-data
----index.html
--index.html

```

#### But why move assets?

The javascript files need to refresh the components data, for this it is necessary to make xhr requests to obtain the page-data resources (`page-data/page-data.json`).

Due to this we have the following problem when loading that page-data.

In the case that we only have one assets folder in one location.

Example:

```
URL:        www.example.com/my-company/blog/posts/1
Assets URL: www.example.com/my-company/assets
```

JS

```javascript
return './assets' + '/page-data/app-data.json';
```

Our browser search for the resource at the following location:
`www.example.com/my-company/blog/posts/1/assets/page-data/app-data.json`.

Due to this and because more data can be loaded asynchronously in webpack; creating symbolic links of assets folder for each html fix these problems without affecting hard drive space.

## License

[MIT License](http://opensource.org/licenses/MIT)
