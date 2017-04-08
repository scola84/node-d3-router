import { select } from 'd3';
import { ScolaError } from '@scola/error';
import { Observer } from '@scola/d3-model';
import Target from './target';

export default class Router extends Observer {
  constructor() {
    super();

    this._connection = null;
    this._user = null;
    this._targets = new Map();

    this._bindWindow();
  }

  destroy() {
    super.destroy();
    this._unbindWindow();

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

  popState(filter = null) {
    const active = {};
    const states = window.location.hash
      .substr(1)
      .split('/');

    states.forEach((state) => {
      const [route, target] = state.split('@');
      const [path, parameters = ''] = route.split(':');

      active[target] = {
        path,
        parameters
      };
    });

    this._targets.forEach((target) => {
      const pop =
        filter === null ||
        filter.indexOf(target.name()) > -1;

      if (pop === true) {
        target.popState(active[target.name()]);
      }
    });
  }

  changeState(change) {
    const state = this._stringify();

    if (state === window.location.hash.substr(1)) {
      return;
    }

    if (change === 'push') {
      window.history.pushState(state, null, '#' + state);
    } else if (change === 'replace') {
      window.history.replaceState(state, null, '#' + state);
    }

    this._targets.forEach((target) => {
      if (target.current() !== null) {
        this._model.set(target.name(),
          target.current().stringify(), false);
      }
    });
  }

  _bindWindow() {
    if (typeof window !== 'undefined') {
      select(window).on('popstate.scola-router', () => this.popState());
    }
  }

  _unbindWindow() {
    if (typeof window !== 'undefined') {
      select(window).on('popstate.scola-router', null);
    }
  }

  _set(setEvent) {
    if (this._targets.has(setEvent.name) === false) {
      return;
    }

    const [path, parameters = ''] = setEvent.value.split(':');

    this
      .target(setEvent.name)
      .route(path)
      .parameters(parameters)
      .go('push');
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
