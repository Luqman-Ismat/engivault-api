const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';
  
  return {
    entry: {
      taskpane: './src/taskpane/taskpane.js',
      functions: './src/functions/functions.ts',
      commands: './src/commands/commands.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js', '.json']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/taskpane/taskpane.html',
        filename: 'taskpane.html',
        chunks: ['taskpane']
      }),
      new HtmlWebpackPlugin({
        template: './src/functions/functions.html',
        filename: 'functions.html',
        chunks: ['functions']
      }),
      new HtmlWebpackPlugin({
        template: './src/commands/commands.html',
        filename: 'commands.html',
        chunks: ['commands']
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'assets', to: 'assets', noErrorOnMissing: true },
          { from: 'src/functions/functions.json', to: 'functions.json' },
          { from: 'manifest.xml', to: '../manifest.xml' }
        ]
      })
    ],
    devServer: {
      static: path.join(__dirname, 'dist'),
      port: 3000,
      https: true,
      hot: true,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    },
    devtool: isDev ? 'source-map' : false,
    mode: isDev ? 'development' : 'production'
  };
};

