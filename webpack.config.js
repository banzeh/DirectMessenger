var ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  entry: ['./app/js/app.js', './app/scss/app.scss'],
  output: {
    filename: './app/dist/app.bundle.js'
  },
  module: {

    rules: [
      {
        test: /\.(sass|scss)$/,
        loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin({
      filename: './app/dist/app.bundle.css',
      allChunks: true
    })
  ]
}
