import stripPrefix from 'gatsby/cache-dir/strip-prefix';

function patchMethod(obj, prop, transform) {
  if (typeof obj[prop] !== "function") {
    throw new Error(`Property ${prop} is not a function`);
  }

  return Object.assign(obj, { [prop]: transform(obj[prop].bind(obj)) });
}

export const onClientEntry = () => {
  const [ipfsPrefix] = window.location.pathname.match(/^\/ipfs\/\w+/) ?? [""];

  // Prevent client-side routing from redirecting to canonical path
  window.pagePath = ipfsPrefix + window.pagePath;

  // Adjust page path to be matched by the router
  const transformPage = ({ path, ...rest }) => ({ path: ipfsPrefix + path, ...rest });
  const transformResources = ({ page, ...rest }) => ({page: transformPage(page), ...rest });

  // Load reosurces relative to the current page
  patchMethod(window.___loader, "loadPage", (loadPage) => (pagePath) =>
    loadPage(stripPrefix(pagePath, ipfsPrefix)).then(transformResources)
  );
  patchMethod(window.___loader, "loadPageSync", (loadPageSync) => (pagePath, options) =>
    transformResources(loadPageSync(stripPrefix(pagePath, ipfsPrefix), options))
  );
}
