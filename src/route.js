import { formatQuery, parseQuery } from '@scola/http';

export default class Route {
  constructor(target, path, creator) {
    this._target = target;
    this._path = path;
    this._creator = creator;

    this._parameters = null;
    this._element = null;
  }

  destroy() {
    if (this._element) {
      this._element.destroy();
      this._element = null;
    }
  }

  path() {
    return this._path;
  }

  default () {
    this._target.default(this);
    return this;
  }

  route(...args) {
    return this._target.route(...args);
  }

  parameters(parameters, raw) {
    this._parameters = raw && parameters ?
      parseQuery(parameters) : parameters;
    return this;
  }

  go(push) {
    this._target.go(this, push);
    return this;
  }

  element(create) {
    if (!this._element && create) {
      this._element = this._creator(this._parameters);
    }

    return this._element;
  }

  stringify() {
    return this._path + (this._parameters ?
      ':' + formatQuery(this._parameters) : '');
  }

}
