/**
 * Crypto.ts
 *
 * Crypto
 * encrypt & decrypt operation
 * updated: 2025/02/25
 **/

"use strict";

// define modules
import * as crypto from "crypto"; // crypto

// crypto class
class Crypto {
  static algorithm: string; // algorithm
  static key: string; // key

  // construnctor
  constructor(key: string) {
    console.log("sql: initialize mode");
    // crypto algorithm
    Crypto.algorithm = "aes-256-cbc";
    // secret key
    Crypto.key = key;
  }

  // encrypt
  encrypt = async (plain: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("sql: encrypt started.");
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
          cipher.update(plain, "utf8", "base64") + cipher.final("base64");
        // return result
        const ivWithEncrypted: any = {
          iv: iv.toString("base64"),
          encrypted: encrypted,
        };
        console.log("sql: encrypt finished.");
        resolve(ivWithEncrypted);
      } catch (e: unknown) {
        // error
        console.log(e);
        reject("error");
      }
    });
  };

  // decrypt
  decrypt = async (encrypted: string, iv: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("sql: decrypt started.");
        // make query
        const decipher = crypto.createDecipheriv(
          Crypto.algorithm,
          Buffer.from(Crypto.key),
          Buffer.from(iv, "base64")
        );
        // make decrypt
        const decrypted: string =
          decipher.update(encrypted, "base64", "utf8") + decipher.final("utf8");
        console.log("sql: decrypt finished.");
        // return result
        resolve(decrypted);
      } catch (e: unknown) {
        // error
        console.log(e);
        reject("error");
      }
    });
  };

  // random
  random = async (length: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("sql: random started.");
        // return random text
        resolve(
          crypto
            .randomBytes(length)
            .reduce((p, i) => p + (i % 36).toString(36), "")
        );
        console.log("sql: random finished.");
      } catch (e: unknown) {
        // エラー
        console.log(e);
        reject("error");
      }
    });
  };

  // genPassword
  genPassword = async (password: string, pepper: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("sql: generate password started.");
        // make query
        const salt: string = crypto.randomBytes(32).toString("hex");
        // return random text
        const genHash: string = crypto
          .pbkdf2Sync(password + pepper, salt, 10000, 64, "sha512")
          .toString("hex");
        console.log("sql: generate password finished.");
        // return hash&salt
        resolve({
          salt: salt,
          hash: genHash,
        });
      } catch (e: unknown) {
        // error
        console.log(e);
        reject("error");
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
        console.log("sql: validate password started.");
        // make query
        const checkHash: string = crypto
          .pbkdf2Sync(password + pepper, salt, 10000, 64, "sha512")
          .toString("hex");
        // validate
        resolve(hash === checkHash);
        console.log("sql: validate password finished.");
      } catch (e: unknown) {
        // error
        console.log(e);
        reject("error");
      }
    });
  };
}

// export module
export default Crypto;
