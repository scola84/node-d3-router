import { select } from 'd3-selection';
import EventEmitter from 'events';
import Target from './target';

export default class Router extends EventEmitter {
  constructor() {
    super();

    this._connection = null;
    this._model = null;
    this._user = null;
    this._targets = new Map();

    this._handleSet = (e) => this._set(e);
    this._bindWindow();
  }

  destroy() {
    this._unbindModel();
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

  model(value = null) {
    if (value === null) {
      return this._model;
    }

    this._model = value;
    this._bindModel();

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
    if (!this._targets.has(name)) {
      this._targets.set(name, new Target()
        .router(this)
        .name(name));
    }

    return this._targets.get(name);
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
      target.popState(active[target.name()]);
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
      if (target.current()) {
        this._model.set(target.name(), target.current().path(), 'go');
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

  _bindModel() {
    if (this._model) {
      this._model.on('set', this._handleSet);
    }
  }

  _unbindModel() {
    if (this._model) {
      this._model.removeListener('set', this._handleSet);
    }
  }

  _set(setEvent) {
    if (setEvent.scope === 'go') {
      return;
    }

    if (!this._targets.has(setEvent.name)) {
      return;
    }

    this
      .target(setEvent.name)
      .route(setEvent.value)
      .go('push');
  }

  _stringify() {
    return Array
      .from(this._targets.values())
      .reduce((string, target) => {
        return target.current() ?
          string + '/' + target.stringify() :
          string;
      }, '');
  }
}
