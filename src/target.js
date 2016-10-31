import Route from './route';

export default class Target {
  constructor() {
    this._router = null;
    this._name = null;

    this._authorize = null;
    this._render = null;

    this._routes = {};
    this._element = null;
    this._current = null;
  }

  destroy(element = true, change = 'push') {
    Object.keys(this._routes).forEach((key) => {
      this._routes[key].destroy(element);
    });

    if (this._element) {
      this._element.root().on('destroy.scola-router', null);

      if (element === true) {
        this._element.destroy();
      }

      this._element = null;
    }

    this._current = null;
    this._router.changeState(change);
  }

  router(value) {
    if (typeof value === 'undefined') {
      return this._router;
    }

    this._router = value;
    return this;
  }

  name(value) {
    if (typeof value === 'undefined') {
      return this._name;
    }

    this._name = value;
    return this;
  }

  authorize(value) {
    if (typeof value === 'undefined') {
      return this._authorize;
    }

    this._authorize = value;
    return this;
  }

  render(value) {
    if (typeof value === 'undefined') {
      return this._render;
    }

    this._render = value;
    return this;
  }

  element() {
    return this._element;
  }

  current() {
    return this._current;
  }

  route(path) {
    if (!this._routes[path]) {
      this._routes[path] = new Route()
        .target(this)
        .path(path);
    }

    return this._routes[path];
  }

  default (route) {
    if (route) {
      this._default = route;
      return this;
    }

    return this._default;
  }

  popState(active) {
    if (active) {
      if (this._routes[active.path]) {
        this._routes[active.path]
          .parameters(active.parameters, true)
          .go();
        return;
      }
    } else if (this._default) {
      this._default.go();
      return;
    }

    this.destroy();
  }

  go(route, change) {
    if (this._authorize) {
      const authorized = this._authorize(this._router.user());

      if (authorized !== true) {
        return;
      }
    }

    if (this._element === null) {
      this._element = this._render(this, this._router);

      if (this._element === null) {
        this.destroy(false, 'replace');
        return;
      }

      this._element.root().on('destroy.scola-router', () => {
        this.destroy(false);
      });
    }

    const current = this._current;
    this._current = route;

    const element = route.element();

    if (element === null) {
      this.destroy(true, 'replace');
      return;
    }

    let action = this._action(current, this._current);

    if (action === 'clear') {
      this._element.slider().clear();
      action = 'forward';
    }

    if (action === 'forward') {
      this._element.slider().append(element).forward();
    } else if (action === 'backward') {
      this._element.slider().prepend(element).backward();
    }

    this._router.changeState(change);
  }

  stringify() {
    return this._current.stringify() + '@' + this._name;
  }

  _action(current, next) {
    if (current && next && current.path() === next.path()) {
      return 'stay';
    }

    current = current && current.path().split('.');
    next = next && next.path().split('.');

    if (!current || Math.abs(current.length - next.length) > 1) {
      return 'clear';
    }

    if (this._contains(next, current)) {
      return 'forward';
    } else if (this._contains(current, next)) {
      return 'backward';
    }

    return 'clear';
  }

  _contains(outer, inner) {
    return inner && outer ?
      outer.slice(0, inner.length).join() === inner.join() :
      false;
  }
}
