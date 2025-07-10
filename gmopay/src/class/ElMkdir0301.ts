/**
 * ELMkdir.ts
 *
 * name：ELMkdir
 * function：Mkdir operation for electron
 * updated: 2025/03/01
 **/

'use strict';

// define modules
import { promises, existsSync } from 'fs'; // file system
import ELLogger from './ElLogger'; // logger
// file system definition
const { mkdir } = promises;

// Mkdir class
class Mkdir {
  static logger: any; // static logger

  // construnctor
  constructor(appname: string) {
    // logger setting
    Mkdir.logger = new ELLogger(appname, 'mkdir');
    Mkdir.logger.info('mkdir: mkdir initialized.');
  }

  // mkDir
  mkDir = async (dir: string): Promise<void> => {
    return new Promise(async (resolve, _) => {
      try {
        Mkdir.logger.info('mkdir: mkdir started.');
        // not exists
        if (!existsSync(dir)) {
          // make dir
          await mkdir(dir);
          resolve();
          Mkdir.logger.info('mkdir: mkdir completed.');
        } else {
          throw Error('already exists.');
        }
      } catch (err: unknown) {
        // error
        Mkdir.logger.error(err);
        resolve();
      }
    });
  };

  // mkDirAll
  mkDirAll = async (dirs: string[]): Promise<void> => {
    return new Promise(async (resolve1, _) => {
      try {
        Mkdir.logger.info('mkdir: all mkdir started.');
        // make all dir
        Promise.all(
          dirs.map(async (dir: string): Promise<void> => {
            return new Promise(async (resolve2, _) => {
              try {
                // not exists
                if (!existsSync(dir)) {
                  // make dir
                  await mkdir(dir);
                  resolve2();
                } else {
                  // error
                  throw Error('already exists.');
                }
              } catch (err: unknown) {
                // error
                resolve2();
              }
            });
          })
        ).then(() => resolve1());
        Mkdir.logger.info('mkdir: mkDirAll started.');

        // make dir
      } catch (e: unknown) {
        // error
        Mkdir.logger.error(e);
        resolve1();
      }
    });
  };
}

// export module
export default Mkdir;
