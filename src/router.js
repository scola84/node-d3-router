import { ScolaError } from '@scola/error';
import { Observer } from '@scola/d3-model';
import Target from './target';

export default class Router extends Observer {
  constructor() {
    super();

    this._connection = null;
    this._user = null;
    this._targets = new Map();
  }

  destroy() {
    super.destroy();

    this._targets.forEach((target) => {
      target.destroy();
    });

    this._targets.clear();
  }

  connection(value = null) {
    if (value === null) {
      return this._connection;
    }

    this._connection = value;
    return this;
  }

  user(value = null) {
    if (value === null) {
      return this._user;
    }

    value = value === false ? null : value;

    this._user = value;
    return this;
  }

  target(name) {
    if (this._targets.has(name) === false) {
      this._targets.set(name, new Target()
        .router(this)
        .name(name));
    }

    return this._targets.get(name);
  }

  render(path, ...handlers) {
    let routeName = '';
    let targetName = path;

    if (path.indexOf('@') > -1) {
      [routeName, targetName] = path.split('@');
    }

    let object = this.target(targetName);

    if (routeName.length > 0) {
      object = object.route(routeName);
    }

    return object.render(...handlers);
  }

  error(message) {
    return new ScolaError(message);
  }

  parseHash() {
    const hash = {};
    const states = window.location.hash
      .substr(1)
      .split('/');

    states.forEach((state) => {
      if (state === '') {
        return;
      }

      const [route, target] = state.split('@');
      const [path, parameters = ''] = route.split(':');

      hash[target] = {
        path,
        parameters
      };
    });

    return hash;
  }

  popState(filter = null) {
    const hash = this.parseHash();

    this._targets.forEach((target) => {
      const pop =
        filter === null ||
        filter.indexOf(target.name()) > -1;

      if (pop === true) {
        target.popState(hash[target.name()]);
      }
    });
  }

  changeState() {
    const hash = '#' + this._stringify();

    if (hash === window.location.hash) {
      return;
    }

    window.history.replaceState(null, null, hash);

    this._targets.forEach((target) => {
      if (target.current() !== null) {
        this._model.set(target.name(), {
          path: target.current().stringify()
        }, false);
      }
    });
  }

  _set(setEvent) {
    const cancel =
      setEvent.changed === false ||
      this._targets.has(setEvent.name) === false;

    if (cancel === true) {
      return;
    }

    let value = setEvent.value;

    if (typeof value === 'string') {
      value = {
        path: value
      };
    }

    if (typeof value.parameters === 'undefined') {
      const [
        path,
        parameters = ''
      ] = value.path.split(':');

      value.path = path;
      value.parameters = parameters;
    }

    if (typeof value.action === 'undefined') {
      value.action = 'forward';
    }

    const target = this.target(setEvent.name);

    if (value.path === '' && value.action === 'backward') {
      target.backward();
      return;
    }

    target
      .route(value.path)
      .parameters(value.parameters)
      .go(value.action);
  }

  _stringify() {
    return Array
      .from(this._targets.values())
      .reduce((string, target) => {
        return target.current() === null ?
          string :
          string + '/' + target.stringify();
      }, '');
  }
}
