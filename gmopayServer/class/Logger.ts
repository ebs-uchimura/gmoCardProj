/**
 * Logger.ts
 *
 * name：Logger
 * function：Logging operation
 * updated: 2025/05/04
 **/

'use strict';

// define modules
import * as log4js from 'log4js'; // Logger
import * as path from 'path'; // path

// Logger class
class Logger {
  // logger
  static logger: any;
  // logger
  static mkdirManager: any;
  // logger dir path
  static loggerDir: string;

  // construnctor
  constructor(dirname: string, logpath: string, level?: string) {
    try {
      // log4js options
      let log4jsOptions: any;
      // log level
      const loglevel: string = level ?? 'all';

      // log mode
      // logger dir path
      Logger.loggerDir = path.join(logpath, dirname);
      // Logger config
      const prefix: string = `${dirname}-${new Date().toJSON().slice(0, 10)}`;
      // set log4js options
      log4jsOptions = {
        appenders: {
          app: {
            type: 'dateFile',
            filename: path.join(Logger.loggerDir, `${prefix}.log`)
          },
          result_raw: {
            type: 'file',
            filename: path.join(Logger.loggerDir, `${prefix}_debug.log`)
          },
          result: {
            type: 'logLevelFilter',
            appender: 'result_raw',
            level: loglevel
          },
          out: { type: 'stdout' }
        },
        categories: {
          default: { appenders: ['out', 'result', 'app'], level: loglevel }
        }
      };

      // logger config
      log4js.configure(log4jsOptions);
      // logger instance
      Logger.logger = log4js.getLogger(); // logger instance
    } catch (e) {
      console.log(e);
    }
  }

  // log info
  info = (message: string) => {
    Logger.logger.info(message);
  };

  // log debug info
  debug = (message: string) => {
    Logger.logger.debug(message);
  };

  // log trace info
  trace = (message: string) => {
    Logger.logger.trace(message);
  };

  // log fatal info
  fatal = (message: string) => {
    Logger.logger.fatal(message);
  };

  // log error
  error = (e: unknown) => {
    // error
    if (e instanceof Error) {
      // error
      Logger.logger.error(e.stack);
      Logger.logger.error(e.message);
    }
  };

  // shutdown logger
  exit = () => {
    log4js.shutdown((err: unknown) => {
      if (err) throw err;
      process.exit(0);
    });
  };
}

// export module
export default Logger;
