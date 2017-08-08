'use strict';

let config = {
  apiConfig: {},
  iotfCredentials: {},
  wally: {}
};

const appEnv = process.env.APP_ENV || 'dev';


if (appEnv === 'dev') {
  // some defaults
}

if (appEnv === 'prod') {
  // some defaults
}

config = require(`./config-${appEnv}`)(config);

module.exports = config;
