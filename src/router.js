import { select } from 'd3-selection';
import EventEmitter from 'events';
import Target from './target';

export default class Router extends EventEmitter {
  constructor() {
    super();

    this._targets = {};
    this._connection = null;

    this._bind();
  }

  destroy() {
    Object.keys(this._targets).forEach((key) => {
      this._targets[key].destroy();
    });

    this._targets = {};
    this._unbind();
  }

  target(name) {
    if (!this._targets[name]) {
      this._targets[name] = new Target()
        .router(this)
        .name(name);
    }

    return this._targets[name];
  }

  connection(value) {
    if (typeof value === 'undefined') {
      return this._connection;
    }

    this._connection = value;
    return this;
  }

  user(value) {
    if (typeof value === 'undefined') {
      return this._connection && this._connection.user();
    }

    if (this._connection) {
      this._connection.user(value);
    }

    return this;
  }

  render(path, ...handlers) {
    let routeName = null;
    let targetName = null;

    if (path.indexOf('@') > -1) {
      [routeName, targetName] = path.split('@');
    } else {
      targetName = path;
    }

    let object = this.target(targetName);

    if (routeName) {
      object = object.route(routeName);
    }

    return object.render(...handlers);
  }

  popState() {
    const active = {};

    window.location.hash.substr(2).split('/').forEach((state) => {
      if (!state) {
        return;
      }

      const [route, target] = state.split('@');
      const [path, parameters = ''] = route.split(':');

      active[target] = {
        path,
        parameters
      };
    });

    Object.keys(this._targets).forEach((name) => {
      this._targets[name].popState(active[name]);
    });
  }

  changeState(change) {
    const state = this._stringify();

    if (state !== window.location.hash.substr(1)) {
      if (change === 'push') {
        window.history.pushState(state, null, '#' + state);
      } else if (change === 'replace') {
        window.history.replaceState(state, null, '#' + state);
      }
    }
  }

  _bind() {
    select(window).on('popstate.scola-router', () => this.popState());
  }

  _unbind() {
    select(window).on('popstate.scola-router', null);
  }

  _stringify() {
    let result = '';

    Object.keys(this._targets).forEach((name) => {
      if (this._targets[name].current()) {
        result += '/' + this._targets[name].stringify();
      }
    });

    return result;
  }
}
