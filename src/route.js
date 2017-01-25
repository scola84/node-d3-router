import series from 'async/series';
import EventEmitter from 'events';

export default class Route extends EventEmitter {
  constructor() {
    super();

    this._target = null;
    this._path = null;
    this._handlers = [];

    this._parameters = {};
    this._element = null;
  }

  destroy() {
    this._element = null;
    this.emit('destroy');
  }

  target(value = null) {
    if (value === null) {
      return this._target;
    }

    this._target = value;
    return this;
  }

  path(value = null) {
    if (value === null) {
      return this._path;
    }

    this._path = value;
    return this;
  }

  render(...handlers) {
    if (handlers.length === 0) {
      return this._handlers;
    }

    this._handlers = handlers;
    return this;
  }

  default () {
    this._target.default(this);
    return this;
  }

  parameter(name, value = null) {
    if (value === null) {
      return this._parameters[name];
    }

    if (value === null) {
      delete this._parameters[name];
    } else {
      this._parameters[name] = value;
    }

    this.emit('parameters', this._parameters);
    return this;
  }

  parameters(value = null) {
    if (value === null) {
      return this._parameters;
    }

    value = typeof value === 'string' ?
      this._parse(value) : value;

    Object.assign(this._parameters, value);

    this.emit('parameters', this._parameters);
    return this;
  }

  element(value = null) {
    if (value === null) {
      return this._element;
    }

    if (value === false) {
      this._target.destroy('replace');
      return this;
    }

    if (this._element) {
      return this;
    }

    this._element = value;
    this._target.finish(this._change);

    return this;
  }

  go(change) {
    this._change = change;
    this._target.prepare(this);
  }

  execute() {
    if (this._element) {
      this._target.finish(this._change);
      return;
    }

    series(this._handlers.map((handler) => {
      return (seriesCallback) => {
        try {
          handler(this, seriesCallback);
        } catch (error) {
          seriesCallback(error);
        }
      };
    }), (error) => {
      if (error) {
        this._target
          .router()
          .emit('error', error);
      }
    });
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
