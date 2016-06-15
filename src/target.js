import Route from './route';

export default class Target {
  constructor(router, name, creator) {
    this._router = router;
    this._name = name;
    this._creator = creator;

    this._routes = {};
    this._element = null;
    this._current = null;
  }

  destroy() {
    Object.keys(this._routes).forEach((key) => {
      this._routes[key].destroy();
    });

    if (this._element) {
      this._element.destroy();
      this._element = null;
    }

    this._current = null;
    this._router.pushState();
  }

  current() {
    return this._current;
  }

  route(path, creator) {
    if (creator) {
      this._routes[path] = new Route(this, path, creator);
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
      this._routes[active.path]
        .parameters(active.parameters, true)
        .go(false);
    } else if (this._default) {
      this._default.go();
    } else {
      this.destroy();
    }
  }

  go(route, push) {
    if (route === this._current) {
      return;
    }

    if (!this._element) {
      this._element = this._creator();
    }

    const current = this._current;
    this._current = route;

    let direction = this._direction(current, this._current);
    let element = route.element();

    if (!element) {
      element = route.element(true);

      if (direction === 'immediate') {
        this._element.slider().clearSlides();
        direction = 'forward';
      }

      if (direction === 'forward') {
        this._element.slider().append(element);
      } else {
        this._element.slider().prepend(element);
      }
    }

    if (direction === 'forward') {
      this._element.slider().forward();
    } else {
      this._element.slider().backward();
    }

    if (push !== false) {
      this._router.pushState();
    }
  }

  stringify() {
    return this._current.stringify() + '@' + this._name;
  }

  _direction(current, next) {
    current = current && current.path().split('.');
    next = next && next.path().split('.');

    if (!current || Math.abs(current.length - next.length) > 1) {
      return 'immediate';
    }

    if (this._contains(next, current)) {
      return 'forward';
    } else if (this._contains(current, next)) {
      return 'backward';
    }

    return 'immediate';
  }

  _contains(outer, inner) {
    return inner && outer ?
      outer.slice(0, inner.length).join() === inner.join() :
      false;
  }
}
