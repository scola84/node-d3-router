import { ScolaError } from '@scola/error';
import series from 'async/series';
import EventEmitter from 'events';

export default class Route extends EventEmitter {
  constructor() {
    super();

    this._target = null;
    this._path = null;
    this._handlers = [];

    this._append = false;
    this._element = null;
    this._parameters = {};
  }

  destroy() {
    if (this._element === null) {
      return;
    }

    this._parameters = {};
    this._element = null;

    if (this._append === true) {
      this.remove();
    }

    this.emit('destroy');
  }

  append() {
    this._append = true;
    this.emit('append');

    return this;
  }

  remove() {
    this._append = false;
    this.emit('remove');

    return this;
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
      return typeof this._parameters[name] === 'undefined' ?
        null : this._parameters[name];
    }

    if (value === false) {
      delete this._parameters[name];
    } else {
      this._parameters[name] = value;
    }

    if (this._element !== null) {
      this.emit('parameters', this._parameters);
    }

    this._target
      .router()
      .changeState();

    return this;
  }

  parameters(value = null) {
    if (value === null) {
      return this._parameters;
    }

    value = typeof value === 'string' ?
      this._parse(value) : value;

    Object.keys(value).forEach((name) => {
      if (value[name] === false) {
        delete this._parameters[name];
      } else {
        this._parameters[name] = value[name];
      }
    });

    if (this._element !== null) {
      this.emit('parameters', this._parameters);
    }

    this._target
      .router()
      .changeState();

    return this;
  }

  element(value = null) {
    if (value === null) {
      return this._element;
    }

    if (value === false) {
      this._target.destroy();
      return this;
    }

    if (this._element !== null) {
      return this;
    }

    this._element = value;
    this._target.finish();

    return this;
  }

  go(action = 'forward') {
    this._target.prepare(this, action);
  }

  execute() {
    if (this._element !== null) {
      this._target.finish();
      return;
    }

    const router = this._target.router();

    series(this._handlers.map((handler) => {
      return (seriesCallback) => {
        try {
          handler(this, seriesCallback);
        } catch (error) {
          router.emit('error', error);
        }
      };
    }), (error) => {
      if (error instanceof Error === true) {
        router.emit('error', error);
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

  error(message) {
    return new ScolaError(message);
  }

  user() {
    return this._target
      .router()
      .user();
  }

  _parse(string = '') {
    const parameters = {};
    const parts = string.length > 0 ? string.split('&') : [];

    parts.forEach((part) => {
      const [key, value] = part.split('=');
      parameters[decodeURIComponent(key)] =
        decodeURIComponent(value);
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
