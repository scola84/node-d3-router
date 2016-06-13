import Router from './src/router';

let instance = null;

export function router() {
  if (!instance) {
    instance = new Router();
  }

  return instance;
}
