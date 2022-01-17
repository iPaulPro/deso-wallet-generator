let mix = require('laravel-mix');

require('laravel-mix-workbox');

mix.setPublicPath('dist')
  .copy('src', 'dist')
  .js('res/index.js', 'dist')
  .css('res/style.css', 'dist')
  .webpackConfig({
    resolve: {
      fallback: {
        buffer: require("node-libs-browser").buffer,
        stream: require("node-libs-browser").stream,
        crypto: require("node-libs-browser").crypto,
      },
    },
  })
  .sourceMaps()
  .version()
  .generateSW()
  .disableSuccessNotifications();