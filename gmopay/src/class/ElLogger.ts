/**
 * ElLogger.ts
 *
 * name：ElLogger
 * function：Logging operation for electron
 * updated: 2025/05/17
 **/

'use strict';

// define modules
import * as path from 'node:path'; // path
import { app } from 'electron'; // electron
import logger from 'electron-log'; // Logger

// Logger class
class ELLogger {
  // construnctor
  constructor(companyname: string, appname: string, level: any) {
    // log dir path
    const dirpath: string = path.join(
      app.getPath('home'),
      companyname,
      appname
    );
    // Logger config
    const prefix: string = getNowDate(0);
    // filename tmp
    logger.transports.file.fileName = `${appname}.log`;
    // filename tmp
    logger.transports.console.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    // set production
    logger.transports.console.level = level;
    // set production
    logger.transports.file.level = level;
    // filename now
    const curr: string = logger.transports.file.fileName;
    // file saving path
    logger.transports.file.resolvePathFn = () =>
      `${dirpath}/${prefix}_${curr}`;
  }

  // debug
  debug = (message: string) => {
    logger.debug(message);
  };

  // inquire
  info = (message: string) => {
    logger.info(message);
  };

  // empty or not
  error = (e: unknown) => {
    if (e instanceof Error) {
      // error
      logger.error(process.pid, e.stack);
    }
  };
}

// get now date
const getNowDate = (diff: number): string => {
  // now
  const d: Date = new Date();
  // combine date string
  const prefix: string =
    d.getFullYear() +
    ('00' + (d.getMonth() + 1)).slice(-2) +
    ('00' + (d.getDate() + diff)).slice(-2);
  return prefix;
};

// export module
export default ELLogger;
