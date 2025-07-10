/**
 * Mkdir.ts
 *
 * name：Mkdir
 * function：Mkdir operation for electron
 * updated: 2025/03/09
 **/

"use strict";

// define modules
import { promises, existsSync } from "node:fs"; // file system
// file system definition
const { mkdir } = promises;

// Mkdir class
class Mkdir {
  // construnctor
  constructor() {
  }

  // mkDir
  mkDir = async (dir: string): Promise<void> => {
    return new Promise(async (resolve, _) => {
      try {
        // not exists
        if (!existsSync(dir)) {
          // make dir
          await mkdir(dir);
          resolve();
        } else {
          throw Error("mkDir: already exists.");
        }
      } catch (e: unknown) {
        resolve();
      }
    });
  };

  // mkDirAll
  mkDirAll = async (dirs: string[]): Promise<void> => {
    return new Promise(async (resolve1, _) => {
      try {
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
                  throw Error("mkDir: already exists.");
                }
              } catch (err: unknown) {
                resolve2();
              }
            });
          })
        ).then(() => resolve1());

        // make dir
      } catch (e: unknown) {
        resolve1();
      }
    });
  };
}

// export module
export default Mkdir;
