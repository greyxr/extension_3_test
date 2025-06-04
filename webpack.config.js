import webpack from 'webpack';
import path from 'path';
import { fileURLToPath } from 'url';

// Required for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    entry: {
        background: './background.ts',
        utils: './utils.ts',
        content: './content.ts',
        storage: './storage.ts',
        webauthn: './webauthn.ts',
        crypto: './crypto.ts'
      },
    optimization: { minimize: false },
    devtool: 'cheap-module-source-map', // Running in dev mode causes no-unsafe-eval errors
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      buffer: 'buffer/',
      stream: 'stream-browserify',
      util: 'util/',
      assert: 'assert/',
      events: 'events/',
      process: 'process/browser',
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: ['process/browser'],
    }),
  ],
};
