/**
 * ElDialog.ts
 *
 * name：ElDialog
 * function：Dialog operation for electron
 * updated: 2025/03/01
 **/

'use strict';

/// import modules
import { dialog } from 'electron'; // electron
import ELLogger from './ElLogger'; // logger
// select image
const CHOOSE_IMG_FILE: string = '画像を選択してください';

// ElectronDialog class
class Dialog {
  static logger: any; // static logger
  // construnctor
  constructor(appname: string) {
    // logger setting
    Dialog.logger = new ELLogger(appname, 'dialog');
    Dialog.logger.info('dialog: initialize mode');
  }

  /// show question
  // show yes/no
  showQuetion(title: string, message: string, detail: string): number {
    try {
      Dialog.logger.info('dialog: showQuetion started.');
      // quetion message option
      const options: Electron.MessageBoxSyncOptions = {
        type: 'question',
        title: title,
        message: message,
        detail: detail,
        buttons: ['yes', 'no'],
        cancelId: -1, // Esc
      };
      // selected number
      const selected: number = dialog.showMessageBoxSync(options);
      Dialog.logger.info('dialog: showQuetion finished.');
      // return selected
      return selected;
    } catch (e: unknown) {
      // error
      Dialog.logger.error(e);
      return 99;
    }
  }

  // show image
  showImage(properties: any): any {
    try {
      Dialog.logger.info('dialog: showImage started.');
      // quetion message option
      const options: Electron.OpenDialogSyncOptions = {
        properties: properties, // file
        title: CHOOSE_IMG_FILE, // file selection
        defaultPath: '.', // root path
        filters: [
          { name: 'jpg|png', extensions: ['jpg', 'jpeg', 'png'] }, // jpg|png
        ],
      };
      // result
      const result: any = dialog.showOpenDialog(options);
      Dialog.logger.info('dialog: showImage finished.');
      // return selected
      return result;
    } catch (e: unknown) {
      // error
      Dialog.logger.error(e);
      return 99;
    }
  }

  // show message
  showmessage(type: string, message: string) {
    try {
      Dialog.logger.info('dialog: showmessage started.');
      // mode
      let tmpType:
        | 'none'
        | 'info'
        | 'error'
        | 'question'
        | 'warning'
        | undefined;
      // title
      let tmpTitle: string | undefined;

      // url
      switch (type) {
        // info mode
        case 'info':
          tmpType = 'info';
          tmpTitle = 'info';
          break;

        // error mode
        case 'error':
          tmpType = 'error';
          tmpTitle = 'error';
          break;

        // warning mode
        case 'warning':
          tmpType = 'warning';
          tmpTitle = 'warning';
          break;

        // others
        default:
          tmpType = 'none';
          tmpTitle = '';
      }

      // options
      const options: Electron.MessageBoxOptions = {
        type: tmpType, // type
        message: tmpTitle, // title
        detail: message, // description
      };
      // show dialog
      dialog.showMessageBox(options);
      Dialog.logger.info('dialog: showmessage finished.');
    } catch (e: unknown) {
      Dialog.logger.error(e);
    }
  }
}

// export module
export default Dialog;
