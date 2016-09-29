import buble from 'rollup-plugin-buble';
import builtins from 'rollup-plugin-node-builtins';
import resolve from 'rollup-plugin-node-resolve';

export default {
  dest: './dist/d3-router.js',
  entry: 'index.js',
  format: 'umd',
  moduleName: 'd3',
  plugins: [
    builtins(),
    resolve({
      jsnext: true
    }),
    buble()
  ]
};
