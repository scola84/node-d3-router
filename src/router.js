import { select } from 'd3-selection';
import Target from './target';

export default class Router {
  constructor() {
    this._targets = {};
    this._bind();
  }

  destroy() {
    Object.keys(this._targets).forEach((key) => this._targets[key].destroy());
    this._targets = {};
    this._unbind();
  }

  target(name, creator) {
    if (creator) {
      this._targets[name] = new Target(this, name, creator);
    }

    return this._targets[name];
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

    this.changeState();
  }

  changeState(change = 'push') {
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
    select(window).on('popstate.scola-router', this.popState.bind(this));
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
