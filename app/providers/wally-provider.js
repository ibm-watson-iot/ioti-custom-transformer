'use strict';

const ibmiotf = require('ibmiotf');
const Promise = require('bluebird');
const request = require('request-promise');
const config = require('../config/config');
const logger = require('../utils/logger');
const IoTWHIApiClient = require('iotwhi-api-client').IoTWHIApiClient;

class WallyProvider {

  constructor() {
    this.config = config.wally;
    this.processedSensorEventTime = {};
    this.createdIotpDevice = {};
    this.iotPlatformClient = new ibmiotf.IotfApplication(config.iotfCredentials);
    this.iotPlatformClient.publishDeviceEvent = Promise.promisify(this.iotPlatformClient.publishDeviceEvent);
    this.deviceType = 'Wally';
    this.pollingRound = 0;
    this.desiredRole = 'administrator';
    this.iotwhiApiClient = new IoTWHIApiClient(
      config.apiConfig.host, config.apiConfig.path, config.tenantId, config.apiConfig.auth);
  }

  start() {
    const method = 'WallyProvider.start';
    logger.info(method, 'start polling with interval of', this.config.pollingInterval, 'minutes');
    this.iotPlatformClient.connect();
    this.iotPlatformClient.registerDeviceType(this.deviceType)
      .catch((resp) => {
        if (resp.status >= 400 && resp.status !== 409) {
          logger.error(method, 'Creating Device Type:', resp);
          return Promise.reject(resp);
        }
        return resp;
      })
      .then((resp) => {
        logger.info(method, 'Creating Device Type:', resp.status === 409 ? 'already created' : resp.message);
        this.poll();
      });
  }

  poll() {
    const method = 'WallyProvider.poll';
    this.pollingRound += 1;
    logger.info(method, this.pollingRound);
    this.run().then(() => {
      logger.info(method, 'next poll in ', this.config.pollingInterval, 'minutes');
      setTimeout(() => {
        this.poll();
      }, this.config.pollingInterval * 60 * 1000);
    });
  }

  run() {
    const method = 'WallyProvider.run';

    return Promise.resolve()
      .then(() => this.getAccountPlaces())
      .tap(() => logger.info(method, 'got account places'))
      .then((places) => {
        return Promise.all([
          this.getUsersDevices(),
          this.getAllSensorsData(places)
        ]);
      })
      .tap(() => logger.info(method, 'got userDevices and sensors'))
      .then(([userDevices, sensors]) => this.convertReadingsToEvents(userDevices, sensors))
      .tap(() => logger.info(method, 'converted readings to events'))
      .then(events => this.createDevices(events))
      .tap(() => logger.info(method, 'created devices'))
      .then(events => this.sendEvents(events))
      .tap(() => logger.info(method, 'events sent'));
  }

  getAccountPlaces() {
    const method = 'WallyProvider.getAccountPlaces';
    const accountsUrl = this.config.accounts;
    return Promise.resolve()
      .then(() => {
        return request.get({
          url: accountsUrl,
          json: true,
          headers: {
            Authorization: 'Bearer ' + this.config.token
          }
        });
      })
      .then((accounts) => {
        logger.info(method);
        logger.log(method, accounts);
        return accounts.reduce((places, account) => {
          places.push(...account.places);
          return places;
        }, []);
      })
      .catch((err) => {
        logger.error(method, err);
        return [];
      });
  }

  getUsersDevices() {
    if (!this.config.deviceFilter) {
      return Promise.resolve([]);
    }
    const method = 'WallyProvider.getUsersDevices';
    const queryParams = { limit: 50000, vendor: 'Wally' };
    return this.iotwhiApiClient.findAll('devices', queryParams, this.desiredRole)
      .then((data) => {
        logger.info(method, 'got all devices');
        logger.debug(method, 'devices:', JSON.stringify(data, null, 2));
        return data.items.reduce((mapping, doc) => {
          const vendorId = doc.vendorId;
          const userId = doc.userId;
          mapping[vendorId] = userId;
          return mapping;
        }, {});
      })
      .catch((err) => {
        logger.error(method, 'failed to get all devices', err.stack || err);
        return {};
      });
  }

  getAllSensorsData(places) {
    const method = 'WallyProvider.getAllSensorsData';
    logger.info(method, 'getting sensor data for', places.length, 'places');
    const promises = places.map(place => this.getSensorData(place, this.config.events));
    promises.push(...places.map(place => this.getSensorData(place, this.config.activities)));
    return Promise.all(promises).then((values) => {
      values = values.filter(v => v !== null);
      logger.info(method, 'data length:', values.length);
      return values;
    });
  }

  getSensorData(place, url) {
    const method = 'WallyProvider.getSensorData';
    let requestUrl = url.replace(':place', place.id);
    requestUrl = requestUrl.replace(':org', this.config.org);
    return request.get({
      url: requestUrl,
      json: true,
      headers: {
        Authorization: 'Bearer ' + this.config.token
      }
    }).then((result) => {
      logger.debug(method, 'sensor data for place', place.id, '->', JSON.stringify(result, null, 2));
      if (Object.keys(result).length === 0) {
        return null;
      }
      return result;
    }).catch((err) => {
      logger.warn(method, err.stack || err);
      return null;
    });
  }

  convertReadingsToEvents(userDevices, sensorsData) {
    const method = 'WallyProvider.convertReadingsToEvents';
    const events = [];
    sensorsData.forEach((sensorData) => {
      const sensorIds = Object.keys(sensorData);
      sensorIds.forEach((sensorId) => {
        const gatewayId = sensorData[sensorId][0].gateway;
        if (this.config.deviceFilter && !userDevices[sensorId] && !userDevices[gatewayId]) {
          logger.warn(method, 'Unknown Sensor ', sensorId);
          return;
        }
        logger.info(method, 'sensorId:', sensorId);
        const userId = userDevices[sensorId];
        const sensorEvents = this.convertReadings(sensorId, userId, sensorData[sensorId]);
        events.push(...sensorEvents);
      });
    });
    return events;
  }

  convertReadings(sensorId, userId, sensorReadings) {
    const method = 'WallyProvider.convertReadings';
    let lastEventTime = this.processedSensorEventTime[sensorId] || '';
    logger.info(method, 'lastEventTime', lastEventTime);
    logger.debug(method, 'sensorReadings', sensorReadings);

    sensorReadings = sensorReadings.filter((sensorReading) => {
      return lastEventTime.localeCompare(sensorReading.time) < 0;
    });

    return sensorReadings.map((sensorReading) => {
      lastEventTime = sensorReading.time;
      const event = {
        deviceType: this.deviceType,
        id: sensorReading.id,
        snid: sensorReading.snid,
        gatewayId: sensorReading.gateway,
        type: sensorReading.type,
        hwType: sensorReading.hwType,
        location: {
          room: sensorReading.room,
          floor: sensorReading.floor,
          appliance: sensorReading.appliance
        }
      };

      if (userId !== undefined) {
        event.userId = userId;
      }

      if (sensorReading.payload) {
        event.data_type = 'EVENT';
        event.traitStates = sensorReading.traitStates;
      } else if (sensorReading.viewParams) {
        event.data_type = 'ACTIVITY';
        event.viewParams = sensorReading.viewParams;
        event.eventId = sensorReading.eventId;
      } else {
        event.data_type = 'UNKNOWN';
      }
      this.processedSensorEventTime[sensorId] = lastEventTime;
      return event;
    });
  }

  createDevices(events) {
    const method = 'WallyProvider.createDevices';
    if (!this.config.shouldCreateDevices) {
      logger.info(method, 'creating devices is disabled');
      return Promise.resolve(events);
    }
    logger.info(method, 'will create devices');
    return Promise.all(events.map((event) => {
      let info = null;
      if (this.createdIotpDevice[event.snid] !== undefined) {
        logger.info(method, 'device already created', event.snid);
        return null;
      }
      if (event.viewParams) {
        info = {
          serialNumber: event.snid,
          manufacturer: 'Wally',
          description: event.viewParams.hwType,
          hwVersion: event.viewParams.hwType,
          descriptiveLocation: event.viewParams.location
        };
      } else {
        info = {
          serialNumber: event.snid,
          manufacturer: 'Wally',
          description: event.type,
          hwVersion: event.hwType,
          descriptiveLocation: event.location.floor + ',' + event.location.room + ',' + event.location.appliance
        };
      }
      return Promise.resolve()
        .then(() => {
          return this.iotPlatformClient.registerDevice(
            this.deviceType, event.snid, config.iotfCredentials.apiToken, info, null
          );
        })
        .then((result) => {
          logger.info(method, 'registered Device', result);
          this.createdIotpDevice[event.snid] = result;
        })
        .catch((err) => {
          logger.warn(method, 'registerDevice failed', err.stack || err);
        });
    })).then(() => {
      return events;
    });
  }

  sendEvents(events) {
    const method = 'WallyProvider.sendEvents';
    logger.info(method, 'sending', events.length, 'events');
    logger.debug(method, 'sending:', events);

    const promises = events.map((event) => {
      return this.iotPlatformClient.publishDeviceEvent(
        this.deviceType, event.snid, 'event', 'json', JSON.stringify(event), undefined
      ).catch((err) => {
        logger.warn(method, 'failed to send event', event, err.stack || err);
      });
    });
    return Promise.all(promises);
  }
}


module.exports = new WallyProvider();
