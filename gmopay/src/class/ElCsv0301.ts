/**
 * ElCsv.ts
 *
 * name：ElCsv
 * function：CSV operation for electron
 * updated: 2025/03/01
 **/

'use strict';

// define modules
import { dialog } from 'electron'; // electron
import { promises } from 'fs'; // file system
import { parse } from 'csv'; // csv parser
import { stringify } from 'csv'; // csv stringify
import iconv from 'iconv-lite'; // encoding
import { FileFilter } from 'electron/main'; // file filter
import ELLogger from './ElLogger'; // logger

// file system definition
const { readFile, writeFile } = promises;

// csv dialog option
interface csvDialog {
  properties: any; // file open
  title: string; // header title
  defaultPath: string; // default path
  filters: FileFilter[]; // filter
}

// CSV class
class CSV {
  static logger: any; // static logger
  static defaultencoding: string; // defaultencoding

  // construnctor
  constructor(appname: string, encoding: string) {
    // DB config
    CSV.defaultencoding = encoding;
    // logger setting
    CSV.logger = new ELLogger(appname, 'csv');
    CSV.logger.info('csv: initialize mode');
  }

  // getCsvData
  getCsvData = async (filenames: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        CSV.logger.info('csv: getCsvData mode');
        // filename exists
        if (filenames.length) {
          // read file
          const data: any = await readFile(filenames[0]);
          // encoding
          const str: string = iconv.decode(data, CSV.defaultencoding);
          // csv parse
          const tmpRecords: any = parse(str, {
            columns: false, // no column
            from_line: 2, // ignore first line
            skip_empty_lines: true, // ignore empty cell
          });
          CSV.logger.info(`you got csv named ${data}`);
          // resolve
          resolve({
            record: tmpRecords, // dataa
            filename: filenames[0], // filename
          });


        } else {
          // nofile, exit
          reject();
        }

      } catch (e: unknown) {
        // error
        CSV.logger.error(e);
        reject();
      }
    });
  }

  // makeCsvData
  makeCsvData = async (arr: any[], columns: { [key: string]: any }, filename: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        CSV.logger.info('csv: makeCsvData mode');
        // csvdata
        const csvData: any = stringify(arr, { header: true, columns: columns });
        // write to csv file
        await writeFile(filename, iconv.encode(csvData, 'shift_jis'));
        // complete
        resolve();

      } catch (e: unknown) {
        // error
        CSV.logger.error(e);
        reject();
      }
    });
  }

  // showCSVDialog
  showCSVDialog = async (mainWindow: any): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        CSV.logger.info('csv: showCSVDialog mode');
        // options
        const dialogOptions: csvDialog = {
          properties: ['openFile'], // file open
          title: 'choose csv file', // header title
          defaultPath: '.', // default path
          filters: [
            { name: 'csv(Shif-JIS)', extensions: ['csv'] } // filter
          ],
        }
        // show file dialog
        dialog.showOpenDialog(mainWindow, dialogOptions).then((result: any) => {

          // file exists
          if (result.filePaths.length > 0) {
            // resolved
            resolve(result.filePaths);

            // no file
          } else {
            // rejected
            reject(result.canceled);
          }

        }).catch((err: unknown) => {
          // error
          CSV.logger.error(err);
          // rejected
          reject('error');
        });

      } catch (e: unknown) {
        // error
        CSV.logger.error(e);
        // error type
        if (e instanceof Error) {
          reject('error');
        }
      }
    });
  }
}

// export module
export default CSV;