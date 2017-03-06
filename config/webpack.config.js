const path = require('path')
const projectConfig = require('./project.config')


const config = {
  entry: projectConfig.paths.src('main.js'),
  output: {
    filename: 'premiser-ui.js',
    path: projectConfig.paths.dist()
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude : /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            // plugins: ['transform-runtime'],
            presets: ['es2015', 'react', 'stage-0']
          },
        }
      }
    ]
  },
  // plugins: [
  //   new webpack.optimize.UglifyJsPlugin(),
  //   new HtmlWebpackPlugin({
  //     // https://github.com/jaketrent/html-webpack-template/blob/86f285d5c790a6c15263f5cc50fd666d51f974fd/index.html
  //     template : project.paths.client('index.html'),
  //     hash     : false,
  //     favicon  : project.paths.public('favicon.ico'),
  //     filename : 'index.html',
  //     inject   : 'body',
  //     minify   : {
  //       collapseWhitespace : true
  //     }
  //   })
  // ]
};

module.exports = config;
