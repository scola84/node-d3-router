import babel from 'rollup-plugin-babel';

export default {
  entry: 'index.js',
  format: 'umd',
  globals: {
    'd3-selection': 'd3_selection',
    '@scola/http': 'http'
  },
  plugins: [
    babel({
      presets: ['es2015-rollup']
    })
  ]
};
