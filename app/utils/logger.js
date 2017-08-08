/*******************************************************************************
 * Licensed Materials - Property of IBM
 * © Copyright IBM Corporation 2017. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

'use strict';

const winston = require('winston');

let logLevel = 'info';
if (process.env.DEBUG === 'true' || process.env.DEBUG === 1) {
  logLevel = 'debug';
}
if (process.env.LOG_LEVEL) {
  logLevel = process.env.LOG_LEVEL;
}

winston.config.allColors.info = [];

const transports = [
  new (winston.transports.Console)({
    level: logLevel,
    colorize: 'all',
    timestamp: function() {
      return Date.now();
    },
    formatter: function(options) {
      const meta = options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '';
      const level = winston.config.colorize(options.level, options.level.toUpperCase());
      options.timestamp = winston.config.colorize(options.level, options.timestamp());
      return `[${options.timestamp}] [${level}] ${options.message} ${meta}`;
    }
  })
];

if (process.env.LOGSTASH_LOGFILE) {
  transports.push(new winston.transports.File({
    filename: process.env.LOGSTASH_LOGFILE,
    logstash: true
  }));
}

const logger = new winston.Logger({
  transports: transports,
});

// FORMAT: s"[$time] [$level] [$function] $messages"
module.exports = {
  info: function(functionName, ...messages) {
    functionName = winston.config.colorize('info', functionName);
    logger.info(`[${functionName}]`, ...messages);
  },
  warn: function(functionName, ...messages) {
    functionName = winston.config.colorize('warn', functionName);
    logger.warn(`[${functionName}]`, ...messages);
  },
  error: function(functionName, ...messages) {
    functionName = winston.config.colorize('error', functionName);
    logger.error(`[${functionName}]`, ...messages);
  },
  debug: function(functionName, ...messages) {
    functionName = winston.config.colorize('debug', functionName);
    logger.debug(`[${functionName}]`, ...messages);
  },
  log: function(functionName, ...messages) {
    // functionName = winston.config.colorize('log', functionName);
    logger.log(`[${functionName}]`, ...messages);
  }
};

