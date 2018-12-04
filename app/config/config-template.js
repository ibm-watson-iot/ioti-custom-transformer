'use strict';

module.exports = function(config) {
  process.env.WALLY_POLL_INTERVAL = 1;

  // auth info for wally endpoint
  process.env.WALLY_ORG = '';
  process.env.WALLY_TOKEN = '';

  // if we should create devices in iotpf
  process.env.WALLY_CREATE_DEVICES = 'true';

  // if we should only process devices registered with IoT4I
  process.env.WALLY_FILTER_DEVICES = 'false';

  config.tenantId = '';

  // iot4i api config
  config.apiConfig = {
    host: 'http://localhost:10010',
    path: 'api/v1',
    auth: 'Bearer <API TOKEN>'
  };

  // copy credentials for iotpf access here
  const org = '';
  config.iotfCredentials = {
    id: 'custom-transformer-app',
    iotCredentialsIdentifier: '',
    mqtt_host: org + '.messaging.internetofthings.ibmcloud.com',
    domain: 'internetofthings.ibmcloud.com',
    type: 'deviceType',
    mqtt_u_port: 1883,
    mqtt_s_port: 8883,
    http_host: org + '.internetofthings.ibmcloud.com',
    org: org,
    'auth-key': '',
    'auth-token': ''
  };

  config.wally = {
    deviceFilter: process.env.WALLY_FILTER_DEVICES === 'true',
    token: process.env.WALLY_TOKEN,
    shouldCreateDevices: process.env.WALLY_CREATE_DEVICES === 'true',
    pollingInterval: process.env.WALLY_POLL_INTERVAL,
    accounts: `https://api.snsr.net/v2/${process.env.WALLY_ORG}/accounts`,
    events:
    `https://api.snsr.net/v2/${process.env.WALLY_ORG}/:place/events?time=-${process.env.WALLY_POLL_INTERVAL}m`,
    activities:
    `https://api.snsr.net/v2/${process.env.WALLY_ORG}/:place/activities?time=-${process.env.WALLY_POLL_INTERVAL}m`
  };

  return config;
};
