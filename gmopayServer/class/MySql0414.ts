/**
 * MySql.ts
 *
 * name：SQL
 * function：SQL operation
 * updated: 2025/04/11
 **/

'use strict';

// import global interface
import { } from '../@types/globalsql';

// define modules
import * as mysql from 'mysql2'; // mysql
import Logger from './Logger'; // logger

// SQL class
class SQL {

  static logger: any; // logger
  static pool: any; // sql pool
  static encryptkey: string; // encryptkey

  // construnctor
  constructor(
    host: string,
    user: string,
    pass: string,
    port: number,
    db: string,
    logger: Logger,
    key?: string,

  ) {
    // loggeer instance
    SQL.logger = logger;
    // DB config
    SQL.pool = mysql.createPool({
      host: host, // host
      user: user, // username
      password: pass, // password
      database: db, // db name
      port: port, // port number
      waitForConnections: true, // wait for conn
      idleTimeout: 1000000, // timeout(ms)
      insecureAuth: false, // allow insecure
    });
    // encrypted key
    SQL.encryptkey = key!;
  }

  // inquire
  doInquiry = async (sql: string, inserts: string[]): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        // make query
        const qry: any = mysql.format(sql, inserts);
        // connect ot mysql
        const promisePool: any = SQL.pool.promise();
         // query name
        const [rows, _] = await promisePool.query(qry); 

        // empty
        if (SQL.isEmpty(rows)) {
          // return error
          resolve('empty');
        } else {
          // result object
          resolve(rows);
        }
      } catch (e: unknown) {
        // error
        SQL.logger.debug('inquiry: error');
        console.log(e);
        resolve('error');
      }
    });
  };

  // count db
  countDB = async (args: countargs): Promise<number> => {
    return new Promise(async (resolve) => {
      try {
        // total
        let total: number;
        // query string
        let queryString: string;
        // array
        let placeholder: any[];
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[][] = args.values;
        // span (optional)
        const spanval: any = args.spanval ?? null;
        // spancol (optional)
        const spancol: any = args.spancol ?? null;
        // spandirection (optional)
        const spandirection: any = args.spandirection ?? null;
        // spanunit (optional)
        const spanunit: any = args.spanunit ?? null;
        // col length
        const colLen: number = columns.length;
        // value length
        const valLen: number = values.length;

        // query
        queryString = 'SELECT COUNT(*) FROM ??';
        // placeholder
        placeholder = [table];

        // if column not null
        if (colLen > 0 && valLen > 0) {
          // add where phrase
          queryString += ' WHERE';

          // loop for array
          for (let i: number = 0; i < colLen; i++) {
            // not
            if (columns[i].includes('*')) {
              // query
              queryString += '?? <> ?';
            } else {
              // query
              queryString += ' ?? IN (?)';
            }
            // push column
            placeholder.push(columns[i]);
            // push value
            placeholder.push(values[i]);

            // other than last one
            if (i < colLen - 1) {
              // add 'and' phrase
              queryString += ' AND';
            }
          }
        }

        // if column not null
        if (spanval && spancol && spanunit && spandirection) {
          // flg
          if (spandirection == 'after') {
            // query
            queryString += ` AND ?? > date(current_timestamp - interval ? ${spanunit})`;
          } else if (spandirection == 'before') {
            // query
            queryString += ` AND ?? < date(current_timestamp - interval ? ${spanunit})`;
          }
          // push span column
          placeholder.push(spancol);
          // push span limit
          placeholder.push(spanval);
        }

        // do query
        await this.doInquiry(queryString, placeholder)
          .then((result: any) => {
            // result exists
            if (result == 'error' || result == 'empty') {
              total = 0;
            } else {
              // set total
              total = result[0]['COUNT(*)'];
            }
            SQL.logger.debug(`countDB: total is ${total}`);
            // return total
            resolve(total);
          })
          .catch((err: unknown) => {
            // error type
            console.log(err);
            resolve(0);
          });
      } catch (e: unknown) {
        // error
        SQL.logger.debug('countDB: error');
        console.log(e);
        resolve(0);
      }
    });
  };

  // select db
  selectDB = async (args: selectargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        // query string
        let queryString: string;
        // array
        let placeholder: any[];
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[][] = args.values;
        // fields (optional)
        const fields: any = args.fields ?? null;
        // span (optional)
        const spanval: any = args.spanval ?? null;
        // spancol (optional)
        const spancol: any = args.spancol ?? null;
        // spandirection(optional)
        const spandirection: any = args.spandirection ?? null;
        // spanunit(optional)
        const spanunit: any = args.spanunit ?? null;
        // reverse (optional)
        const reverse: any = args.reverse ?? false;
        // order (optional)
        const order: any = args.order ?? null;
        // limit (optional)
        const limit: any = args.limit ?? null;
        // order (optional)
        const offset: any = args.offset ?? null;
        // col length
        const colLen: number = columns.length;
        // value length
        const valLen: number = values.length;

        // if fields exists
        if (fields) {
          // query
          queryString = 'SELECT ?? FROM ??';
          // placeholder
          placeholder = [fields, table];
        } else {
          // query
          queryString = 'SELECT * FROM ??';
          // placeholder
          placeholder = [table];
        }

        // if column not null
        if (colLen > 0 && valLen > 0) {
          // add where phrase
          queryString += ' WHERE';

          // loop for array
          for (let i: number = 0; i < colLen; i++) {
            // add in phrase
            queryString += ' ?? IN (?)';
            // push column
            placeholder.push(columns[i]);
            // push value
            placeholder.push(values[i]);

            // other than last one
            if (i < colLen - 1) {
              // add 'and' phrase
              queryString += ' AND';
            }
          }
        }

        // if column not null
        if (spanval && spandirection) {
          // flg
          if (spandirection == 'after') {
            // query
            queryString += ` AND ?? > date(current_timestamp - interval ? ${spanunit})`;
          } else if (spandirection == 'before') {
            // query
            queryString += ` AND ?? < date(current_timestamp - interval ? ${spanunit})`;
          }
          // push span column
          placeholder.push(spancol);
          // push span limit
          placeholder.push(spanval);
        }

        // query
        queryString += ' ORDER BY ??';

        // if reverse
        if (reverse) {
          // query
          queryString += ' ASC';
        } else {
          // query
          queryString += ' DESC';
        }

        // if order exists
        if (order) {
          // push order key
          placeholder.push(order);
        } else {
          // push default id
          placeholder.push('id');
        }

        // if limit exists
        if (limit) {
          // query
          queryString += ' LIMIT ?';
          // push limit
          placeholder.push(limit);
        }

        // if offset exists
        if (offset) {
          // query
          queryString += ' OFFSET ?';
          // push offset
          placeholder.push(offset);
        }

        // do query
        await this.doInquiry(queryString, placeholder)
          .then((result: any) => {
            // do query
            resolve(result);
          })
          .catch((err: unknown) => {
            // error
            console.log(err);
            resolve('error');
          });
      } catch (e: unknown) {
        // error
        SQL.logger.debug('selectDB: error');
        console.log(e);
        resolve('error');
      }
    });
  };

  // update
  updateDB = async (args: updateargs): Promise<any> => {
    return new Promise(async (resolve1) => {
      try {
        // not
        let tmpQuery: string = '';
        // query string
        let queryString: string = 'UPDATE ?? SET ?? = ? WHERE ';
        // query string
        let tmpqueryString: string = '';
        // placeholder array
        let placeholder: any[] = [];
        // tmp placeholder array
        let tmpPlaceholder: any[] = [];
        // table
        const table: string = args.table;
        // select columns
        const selcol: string[] = args.selcol;
        // select values
        const selval: any[] = args.selval;
        // set column
        const setcol: string[] = args.setcol;
        // set value
        const setval: any[] = args.setval;
        // span value
        const spanval: any = args.spanval ?? null;
        // spancol (optional)
        const spancol: any = args.spancol ?? null;
        // span value
        const spandirection: any = args.spandirection ?? null;
        // spanunit(optional)
        const spanunit: any = args.spanunit ?? null;
        // selcol length
        const selcolLen: number = selcol.length;
        // setcol length
        const setcolLen: number = setcol.length;
        // promise
        const promises: Promise<any>[] = [];

        // set all conditions
        for (let i: number = 0; i < selcolLen; i++) {
          // initialize
          tmpQuery = '';
          // not
          if (selcol[i].includes('*')) {
            // query
            queryString += '?? <> ?';
            // replace asterisk
            tmpQuery = selcol[i].replace('*', '');
          } else {
            // query
            queryString += '?? = ?';
            // set directly
            tmpQuery = selcol[i];
          }

          // push column
          tmpPlaceholder.push(tmpQuery);
          // push value
          tmpPlaceholder.push(selval[i]);
          // other than last one
          if (i < selcolLen - 1) {
            // add 'and' phrase
            queryString += ' AND ';
          }
        }
        // save query temporary
        tmpqueryString = queryString;

        // set all values and execute
        for (let j = 0; j < setcolLen; j++) {
          // placeholder
          placeholder = [table];
          // add promise
          promises.push(
            new Promise(async (resolve2) => {
              // push column
              placeholder.push(setcol[j]);
              // push value
              placeholder.push(setval[j]);
              // add conditions
              placeholder.push(...tmpPlaceholder);

              // add span
              if (spanval && spanunit && spandirection) {
                // flg
                if (spandirection == 'after') {
                  // query
                  queryString = tmpqueryString + ` AND ?? > date(current_timestamp - interval ? ${spanunit})`;
                } else if (spandirection == 'before') {
                  // query
                  queryString = tmpqueryString + ` AND ?? < date(current_timestamp - interval ? ${spanunit})`;
                }
                placeholder.push(spancol);
                placeholder.push(spanval);
              }

              // do query
              await this.doInquiry(queryString, placeholder)
                .then((result: any) => {
                  // result
                  let tmpResult: any;

                  // result exists
                  if (result == 'error' || result == 'empty') {
                    tmpResult = result;
                  } else if (result.changedRows == 0) {
                    tmpResult = 'empty';
                  } else {
                    tmpResult = result
                  }
                  // do query
                  resolve2(tmpResult);
                })
                .catch((err: unknown) => {
                  // error
                  console.log(err);
                  resolve2('error');
                });
            })
          );
        }
        // complete
        Promise.all(promises).then((results: any) => {
          resolve1(results);
        });
      } catch (e: unknown) {
        // error
        SQL.logger.debug('updateDB: error');
        console.log(e);
        resolve1('error');
      }
    });
  };

  // insert
  insertDB = async (args: insertargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[] = args.values;
        // query string
        const queryString: string = 'INSERT INTO ??(??) VALUES (?)';
        // placeholder
        const placeholder: any[] = [table, columns, values];

        // do query
        await this.doInquiry(queryString, placeholder)
          .then((result: any) => {
            // result exists
            if (result == 'error' || result == 'empty') {
              // return error message
              resolve(result);
            } else {
              // return inserted ID
              resolve(result.insertId);
            }
          })
          .catch((err: unknown) => {
            // error
            console.log(err);
            resolve('error');
          });
      } catch (e: unknown) {
        // error
        SQL.logger.debug('insertDB: error');
        console.log(e);
        resolve('error');
      }
    });
  };

  // insert
  insertNoDupDB = async (args: insertnodupargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        // query string
        let queryString: string;
        // placeholder array
        let placeholder: any[] = [];
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[] = args.values;
        // select columns
        const selcol: string[] = args.selcol;
        // select columns
        const selval: any[] = args.selval;
        // selcol length
        const selcolLen: number = args.selcol.length;
        // query string
        queryString =
          'INSERT INTO ??(??) SELECT (?) WHERE NOT EXISTS (SELECT * FROM ?? WHERE ?? = ?';
        // placeholder
        placeholder = [table, columns, values, table];
        // loop for conditions
        for (let i: number = 0; i < selcolLen; i++) {
          // push column
          placeholder.push(selcol[i]);
          // push value
          placeholder.push(selval[i]);
          // other than last one
          if (i < selcolLen - 1) {
            // add 'and' phrase
            queryString += ' AND ?? = ?';
          }
        }

        // do query
        await this.doInquiry(queryString, placeholder)
          .then((result: any) => {
            // result exists
            if (result == 'error' || result == 'empty') {
              resolve(result);
            } else {
              resolve(result.insertId);
            }
          })
          .catch((err: unknown) => {
            // error
            console.log(err);
            resolve('error');
          });
      } catch (e: unknown) {
        // error
        SQL.logger.debug('insertNoDupDB: error');
        console.log(e);
        resolve('error');
      }
    });
  };

  // empty or not
  static isEmpty(obj: Object) {
    // check whether blank
    return !Object.keys(obj).length;
  }
}

// export module
export default SQL;
