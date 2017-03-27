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
    this._previous = null;
  }

  destroy(change = 'push') {
    this._element = null;
    this._current = null;

    this._router.changeState(change);
    this.emit('destroy');
  }

  current() {
    return this._current;
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
    if (this._routes.has(path) === false) {
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

  element(value = null, destroy = () => {}) {
    if (value === null) {
      return this._element;
    }

    if (value === false) {
      this.destroy('replace');
      return this;
    }

    if (this._element !== null) {
      return this;
    }

    this.once('destroy', destroy);

    this._element = value;
    this._current.execute();

    return this;
  }

  prepare(route) {
    const action = this._action(route, this._current);

    if (action === 'stay') {
      this._router.changeState('replace');
      return;
    }

    this._previous = this._current;
    this._current = route;

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
        this.destroy('replace');
        this._router.emit('error', error);
      }
    });
  }

  finish(change) {
    let action = this._action(this._current, this._previous);

    if (action === 'clear') {
      this._clear();
      action = 'forward';
    }

    if (action === 'forward') {
      this._forward(this._current.element());
    } else if (action === 'backward') {
      this._backward(this._current.element());
    }

    this._router.changeState(change);

    this.emit('go', this._current);
    this._current.emit('go', this._current);
  }

  popState(active = {}) {
    const route = this._routes.get(active.path);

    if (route instanceof Route === true) {
      route.parameters(active.parameters);
      route.go('replace');
      return;
    }

    if (this._default instanceof Route === true) {
      this._default.go('replace');
      return;
    }

    this.destroy();
  }

  _action(next, current = null) {
    if (current === null) {
      return 'clear';
    }

    current = current.path();
    next = next.path();

    if (next === current) {
      return 'stay';
    }

    current = current.split('.');
    next = next.split('.');

    if (Math.abs(current.length - next.length) > 1) {
      return 'clear';
    } else if (this._contains(next, current) === true) {
      return 'forward';
    } else if (this._contains(current, next) === true) {
      return 'backward';
    }

    return 'clear';
  }

  _contains(outer, inner) {
    return outer
      .slice(0, inner.length)
      .join() === inner.join();
  }

  _forward(element) {
    const slider = this._element.slider();

    if (slider.has(element) === false) {
      slider.append(element);
    }

    slider.forward();
  }

  _backward(element) {
    const slider = this._element.slider();

    if (slider.has(element) === false) {
      slider.prepend(element);
    }

    slider.backward(() => {
      this._previous.destroy();
      this._previous = null;
    });
  }

  _clear() {
    this._element.slider().clear();

    if (this._previous) {
      this._previous.destroy();
      this._previous = null;
    }
  }
}
