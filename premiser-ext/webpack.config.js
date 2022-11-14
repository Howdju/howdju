const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => ({
  mode: env.production ? 'production' : 'development',
  devtool: env.production ? 'source-map' : 'inline-source-map',
  entry: {
    background: path.join(__dirname, './src/background'),
    content: path.join(__dirname, './src/content'),
    'options-ui': path.join(__dirname, './src/options-ui'),
  },
  output: {
    path: path.join(__dirname, './dist'),
    filename: '[name].js',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {from: 'src/manifest.json'},
        {from: 'icons/**/*'},
        // `to: "[name][ext]"` flattens the files
        {from: 'src/*.css', to: "[name][ext]"},
        {from: 'src/*.html', to: "[name][ext]"},
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          rootMode: "upward",
        },
        exclude: /node_modules/,
      },
    ],
  },
})
