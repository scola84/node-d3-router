import EventEmitter from 'events';

export default class Route extends EventEmitter {
  constructor(target, path, creator) {
    super();

    this._target = target;
    this._path = path;
    this._creator = creator;

    this._parameters = {};
    this._element = null;
  }

  destroy(element) {
    if (this._element) {
      if (element !== false) {
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

  target() {
    return this._target;
  }

  path() {
    return this._path;
  }

  element() {
    if (!this._element) {
      this._element = this._creator(this, this._target.router());
      this._element.root().on('destroy', () => this.destroy(false));
    }

    return this._element;
  }

  parameter(name, value, emit = false) {
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

  parameters(parameters, emit = false) {
    if (typeof parameters === 'undefined') {
      return this._parameters;
    }

    parameters = typeof parameters === 'string' ?
      this._parse(parameters) : parameters;

    Object.assign(this._parameters, parameters);

    if (emit === true) {
      this.emit('parameters', this._parameters);
    }

    return this;
  }

  go(change) {
    this.emit('go');
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
