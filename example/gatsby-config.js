module.exports = {
  siteMetadata: {
    title: `example`,
    siteUrl: `https://www.yourdomain.tld`,
  },
  plugins: [
    process.env.GATSBY_IPFS && {
      resolve: '..',
      options: { verbose: true },
    },
  ].filter(Boolean),
  assetPrefix: '__GATSBY_RELATIVE_PATH__',
};
