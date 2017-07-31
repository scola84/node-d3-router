import { ScolaError } from '@scola/error';
import series from 'async/series';
import EventEmitter from 'events';
import Route from './route';

export default class Target extends EventEmitter {
  constructor() {
    super();

    this._router = null;
    this._name = null;
    this._handlers = [];

    this._routes = new Map();
    this._default = null;

    this._element = null;
    this._current = null;
    this._history = [];
  }

  destroy() {
    this._element = null;
    this._current = null;

    this._router.changeState();
    this.emit('destroy');
  }

  current() {
    return this._current;
  }

  history(value = null) {
    if (value === null) {
      return this._history;
    }

    return this._history[this._history.length + value] || null;
  }

  has(path) {
    return this._routes.has(path);
  }

  stringify() {
    return [
      this._current.stringify(),
      this._name
    ].join('@');
  }

  router(value = null) {
    if (value === null) {
      return this._router;
    }

    this._router = value;
    return this;
  }

  name(value = null) {
    if (value === null) {
      return this._name;
    }

    this._name = value;
    return this;
  }

  render(...handlers) {
    if (handlers.length === 0) {
      return this._handlers;
    }

    this._handlers = handlers;
    return this;
  }

  routes(value = null) {
    if (value === null) {
      return this._routes;
    }

    if (value === false) {
      this._routes.forEach((route) => {
        route.destroy();
      });

      return this;
    }

    this._routes = value;
    return this;
  }

  route(path) {
    if (this.has(path) === false) {
      this._routes.set(path, new Route()
        .target(this)
        .path(path));
    }

    return this._routes.get(path);
  }

  default (route = null) {
    if (route === null) {
      return this._default;
    }

    this._default = route;
    return this;
  }

  element(value = null) {
    if (value === null) {
      return this._element;
    }

    if (value === false) {
      this.destroy();
      return this;
    }

    if (this._element !== null) {
      return this;
    }

    this._element = value;
    this._current.execute();

    return this;
  }

  prepare(route, action) {
    if (this._current === route) {
      return;
    }

    const push =
      this._current !== null &&
      action === 'forward' ||
      action === 'clear';

    if (push === true) {
      this._history.push(this._current);
    } else if (action === 'backward') {
      this._history.pop();
    }

    this._previous = this._current;
    this._current = route;
    this._action = action;

    if (this._element !== null) {
      this._current.execute();
      return;
    }

    series(this._handlers.map((handler) => {
      return (seriesCallback) => {
        try {
          handler(this, seriesCallback);
        } catch (error) {
          this._router.emit('error', error);
        }
      };
    }), (error) => {
      if (error instanceof Error === true) {
        this.destroy();
        this._router.emit('error', error);
      }
    });
  }

  finish() {
    let action = this._action;

    if (action === 'clear') {
      this._clear();
      action = 'forward';
    }

    if (action === 'forward') {
      this._forward(this._current.element());
    } else if (action === 'backward') {
      this._backward(this._current.element());
    }

    this._current.emit('parameters',
      this._current.parameters());

    this._router.changeState();
  }

  popState(active = {}) {
    const route = this._routes.get(active.path);

    if (route instanceof Route === true) {
      route.parameters(active.parameters);
      route.go();
      return;
    }

    if (this._default instanceof Route === true) {
      this._default.go();
      return;
    }

    this.destroy();
  }

  error(message) {
    return new ScolaError(message);
  }

  user() {
    return this._router.user();
  }

  _forward(element) {
    const slider = this._element.slider();

    if (slider.has(element) === false) {
      slider.append(element);
    }

    if (this._previous) {
      this._previous.emit('remove');
    }

    this._current.emit('append');
    slider.forward();
  }

  _backward(element) {
    const slider = this._element.slider();

    if (slider.has(element) === false) {
      slider.prepend(element);
    }

    this._current.emit('append');

    slider.backward(() => {
      this._previous.destroy();
      this._previous = null;
    });
  }

  _clear() {
    this._element.slider().clear();

    this._history.forEach((route) => {
      if (route !== this._current) {
        route.destroy();
      }
    });

    this._history = [];
    this._previous = null;
  }
}
