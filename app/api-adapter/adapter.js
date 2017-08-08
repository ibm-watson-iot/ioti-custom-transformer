'use strict';

const config = require('../config/config');

/**
 * Generic adapter to talk with rest API.
 * By default it will use `app-adapter` for all record types.
 * If you need some customization for a specific record type, you can
 * create a <type>-adapter.js file to implement it. The file will be automatically used.
 **/
class BaseAdapter {

  constructor() {
    this.host = config.apiConfig.host;
    this.path = config.apiConfig.path;
    this.headers = {
      Authorization: config.apiConfig.auth
    };
  }

  findRecord(type, id, queryParams) {
    return this._getAdapter(type).findRecord(type, id, queryParams);
  }

  findAll(type, queryParams) {
    return this._getAdapter(type).findAll(type, queryParams);
  }

  updateRecord(type, record) {
    return this._getAdapter(type).updateRecord(type, record);
  }

  createRecord(type, record) {
    return this._getAdapter(type).createRecord(type, record);
  }

  _getAdapter(type) {
    try {
      return require(`./${type}-adapter`);
    } catch (e) {
      return require('./app-adapter');
    }
  }
}

module.exports = new BaseAdapter();
module.exports.BaseAdapter = BaseAdapter;

