let mix = require('laravel-mix');

mix.setPublicPath('dist')
  .copy('src/index.html', 'dist')
  .js('src/index.js', 'dist')
  .css('src/style.css', 'dist')
  .webpackConfig({
    resolve: {
      fallback: {
        buffer: require("node-libs-browser").buffer,
        stream: require("node-libs-browser").stream,
        crypto: require("node-libs-browser").crypto,
      },
    },
  })
  .disableSuccessNotifications();