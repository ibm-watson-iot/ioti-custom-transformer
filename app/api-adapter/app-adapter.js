'use strict';

const request = require('request-promise');
const pluralize = require('pluralize');
const BaseAdapter = require('./adapter').BaseAdapter;

class AppAdapter extends BaseAdapter {

  findRecord(type, id, queryParams) {
    const url = this._buildUrl(type, id);
    return request.get(url, { headers: this.headers, qs: queryParams, json: true });
  }

  findAll(type, queryParams) {
    const url = this._buildUrl(type);
    return request.get(url, { headers: this.headers, qs: queryParams, json: true });
  }

  updateRecord(type, record) {
    const url = this._buildUrl(type);
    return request.post(url, { headers: this.headers, json: true }).json(record);
  }

  createRecord(type, record) {
    const url = this._buildUrl(type);
    return request.post(url, { headers: this.headers, json: true }).json(record);
  }

  _buildUrl(modelName, id) {
    const parts = [this.host, this.path, pluralize(modelName), id].filter(i => i !== undefined);
    return parts.join('/');
  }
}

module.exports = new AppAdapter();
