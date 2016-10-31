import { EventEmitter } from 'events';

export default class Route extends EventEmitter {
  constructor() {
    super();

    this._target = null;
    this._path = null;

    this._authorize = null;
    this._render = null;

    this._parameters = {};
    this._element = null;
  }

  destroy(element = true) {
    if (this._element) {
      this._element.root().on('destroy.scola-router', null);

      if (element === true) {
        this._element.destroy();
      }

      this._element = null;
    }

    this.emit('destroy');
  }

  route(...args) {
    return this._target.route(...args);
  }

  default () {
    this._target.default(this);
    return this;
  }

  target(value) {
    if (typeof value === 'undefined') {
      return this._target;
    }

    this._target = value;
    return this;
  }

  path(value) {
    if (typeof value === 'undefined') {
      return this._path;
    }

    this._path = value;
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
    if (this._authorize) {
      const authorized = this._authorize(this._target.router().user());

      if (authorized !== true) {
        return null;
      }
    }

    if (this._element === null) {
      this._element = this._render(this, this._target.router());

      if (this._element !== null) {
        this._element.root().on('destroy.scola-router', () => {
          this.destroy(false);
        });

        this.emit('parameters', this._parameters);
      }
    }

    return this._element;
  }

  parameter(name, value, emit) {
    if (typeof value === 'undefined') {
      return this._parameters[name];
    }

    if (value === null) {
      delete this._parameters[name];
    } else {
      this._parameters[name] = value;
    }

    if (emit === true) {
      this.emit('parameters', this._parameters);
    }

    return this;
  }

  parameters(value, emit) {
    if (typeof value === 'undefined') {
      return this._parameters;
    }

    value = typeof value === 'string' ?
      this._parse(value) : value;

    Object.assign(this._parameters, value);

    if (emit === true) {
      this.emit('parameters', this._parameters);
    }

    return this;
  }

  go(change) {
    this._target.go(this, change);
    return this;
  }

  stringify() {
    let string = this._path;

    if (Object.keys(this._parameters).length > 0) {
      string += ':' + this._format(this._parameters);
    }

    return string;
  }

  _parse(string) {
    const parameters = {};
    const parts = string ? string.split('&') : [];

    parts.forEach((part) => {
      const [key, value] = part.split('=');
      parameters[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return parameters;
  }

  _format(parameters) {
    const parts = [];

    Object.keys(parameters).forEach((key) => {
      parts.push(encodeURIComponent(key) + '=' +
        encodeURIComponent(parameters[key]));
    });

    return parts.join('&');
  }
}
