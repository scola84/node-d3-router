/* eslint prefer-reflect: "off" */

import { dispatch } from 'd3-dispatch';

export default class Route {
  constructor(target, path, creator) {
    this._target = target;
    this._path = path;
    this._creator = creator;

    this._dispatch = dispatch('go', 'destroy');
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

    this._dispatch.call('destroy');
  }

  on(typenames, callback) {
    this._dispatch.on(typenames, callback);
    return this;
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

  parameters(parameters) {
    if (typeof parameters === 'undefined') {
      return this._parameters;
    }

    this._parameters = typeof parameters === 'string' ?
      this._parse(parameters) : parameters;

    return this;
  }

  go(push) {
    this._dispatch.call('go');
    this._target.go(this, push);

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
