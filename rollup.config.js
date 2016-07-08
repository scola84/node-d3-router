import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

function resolveLocal() {
  const map = {
    events: require.resolve('events')
  };

  return {
    resolveId: (importee) => {
      return map[importee] ? map[importee] : null;
    }
  };
}

export default {
  entry: 'index.js',
  format: 'umd',
  globals: {
    'd3-selection': 'd3'
  },
  plugins: [
    resolve({
      jsnext: true,
      preferBuiltins: false,
      skip: ['d3-selection']
    }),
    resolveLocal(),
    commonjs(),
    babel({
      presets: ['es2015-rollup']
    })
  ]
};
