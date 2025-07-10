/**
 * Crypto.ts
 *
 * Crypto
 * encrypt & decrypt operation
 * updated: 2025/06/16
 **/

'use strict';

// define modules
import * as crypto from 'node:crypto'; // crypto

// crypto class
class Crypto {
  static logger: any; // logger
  static pepper: any; // pepper
  static algorithm: string; // algorithm
  static key: string; // key

  // construnctor
  constructor(logger: any, key?: string, pepper?: string) {
    try {
      // loggeer instance
      Crypto.logger = logger;
      // crypto algorithm
      Crypto.algorithm = 'aes-256-cbc';
      // secret key
      Crypto.key = key ?? '';
      // pepper
      Crypto.pepper = pepper ?? '';
      Crypto.logger.debug('crypto: constructed');

    } catch (e: unknown) {
      Crypto.logger.error(e);
    }
  }

  // encrypt
  encrypt = async (plain: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        // make salt
        const iv: Buffer = crypto.randomBytes(16);
        // make cipher
        const cipher: any = crypto.createCipheriv(
          Crypto.algorithm,
          Buffer.from(Crypto.key),
          iv
        );
        // make encrypt
        const encrypted: any =
          cipher.update(plain, 'utf8', 'base64') + cipher.final('base64');
        // encrypt result
        const ivWithEncrypted: any = {
          iv: iv.toString('base64'),
          encrypted: encrypted
        };
        // return result
        resolve(ivWithEncrypted);
        Crypto.logger.debug('crypto: encrypt finished.');

      } catch (e: unknown) {
        Crypto.logger.error(e);
        reject('error');
      }
    });
  };

  // decrypt
  decrypt = async (encrypted: string, iv: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // make query
        const decipher: any = crypto.createDecipheriv(
          Crypto.algorithm,
          Buffer.from(Crypto.key),
          Buffer.from(iv, 'base64')
        );
        // make decrypt
        const decrypted: string =
          decipher.update(encrypted, 'base64', 'utf8') + decipher.final('utf8');
        // return result
        resolve(decrypted);
        Crypto.logger.debug('crypto: decrypt finished.');

      } catch (e: unknown) {
        Crypto.logger.error(e);
        reject('error');
      }
    });
  };

  // random
  random = async (length: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // return random text
        resolve(
          crypto
            .randomBytes(length)
            .reduce((p, i) => p + (i % 36).toString(36), '')
        );
        Crypto.logger.debug('crypto: random finished.');

      } catch (e: unknown) {
        Crypto.logger.error(e);
        reject('error');
      }
    });
  };

  // genPassword
  genPassword = async (password: string, pepper: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        // make query
        const salt: string = crypto.randomBytes(32).toString('hex');
        // return random text
        const genHash: string = crypto
          .pbkdf2Sync(password + pepper, salt, 10000, 64, 'sha512')
          .toString('hex');
        // return hash&salt
        resolve({
          salt: salt,
          hash: genHash
        });
        Crypto.logger.debug('crypto: generate password finished.');

      } catch (e: unknown) {
        Crypto.logger.error(e);
        reject('error');
      }
    });
  };

  // validPassword
  validPassword = async (
    password: string,
    hash: string,
    salt: string,
    pepper: string
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      try {
        // make query
        const checkHash: string = crypto
          .pbkdf2Sync(password + pepper, salt, 10000, 64, 'sha512')
          .toString('hex');
        // validate
        resolve(hash === checkHash);
        Crypto.logger.debug('crypto: validate password finished.');

      } catch (e: unknown) {
        Crypto.logger.error(e);
        reject('error');
      }
    });
  };
}

// export module
export default Crypto;
