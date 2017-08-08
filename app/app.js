'use strict';

const wally = require('./providers/wally-provider');

module.exports = {
  start() {
    wally.start();
  }
};

module.exports.start();
