   "use strict";
   var path = require('path');
   var webpack = require('webpack');
   var HtmlWebpackPlugin = require('html-webpack-plugin');
   module.exports = {
    entry: {
      app: ["webpack/hot/dev-server", "./src/app.js"],
    },
    output: {
      path: path.resolve(__dirname, "build"),
      filename: 'bundle.js'
    },
    module: {
      loaders: [
      { test: require.resolve("jquery"), loader: "expose?$!expose?jQuery" },
      { test: /\.js$/, exclude: /(node_modules|bower_components)/, loader: 'babel', query: {presets: ['es2015']} },
      { test: /\.css$/, loader: 'style-loader!css-loader'},
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
      { test: /\.(woff|woff2)$/, loader:"url?prefix=font/&limit=5000" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" },
      { test: /\.(jpe?g|png|gif|svg)$/i, loader: 'url?limit=10000!img?progressive=true' }
      ],
    },
    resolve: {
      root: [path.join(__dirname, "bower_components")]
    },
    plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(".bower.json", ["main"])
      ),
    new HtmlWebpackPlugin({
      template: "index.html"
    })
    ],
  };