/**
 * gmoupdate.ts
 **
 * function：GMO-PGカード定期更新用 アプリ
 **/

// 定数
// import global interface
import { } from './@types/globalsql';
// 名前空間
import { myVal } from './consts/globalinfo'; // 開発切り替え
import { myConst } from './consts/globalvariables'; // 本番環境
import { myDevConst } from './consts/globalvariablesdev'; // 開発環境
// 開発環境切り替え
let globalAppName: string; // アプリ名
let globalEnvfileName: string; // 環境ファイル名
let globalServerUrl: string; // サーバURL
let sqlHost: string; // SQLホスト名
let sqlUser: string; // SQLユーザ名
let sqlPass: string; // SQLパスワード
let sqlDb: string; // SQLデータベース名
// モジュール
import * as path from 'node:path'; // パス
import * as cron from 'node-cron'; // cron
import axios from 'axios'; // http通信用
import { config as dotenv } from 'dotenv'; // 秘匿情報用
import { setTimeout } from 'node:timers/promises'; // ウェイト
import Logger from './class/Logger'; // ロガー
import SQL from './class/MySql0627'; // DB操作用

// 開発モード
if (myVal.DEV_FLG) {
  globalServerUrl = myDevConst.DEVELOPMENT_URL!; // 検証用サーバURL
  globalAppName = myDevConst.APP_NAME; // 検証用アプリ名
  globalEnvfileName = '.devenv'; // 検証用環境変数
} else {
  globalServerUrl = myConst.DEFAULT_URL!; // サーバURL
  globalAppName = myConst.APP_NAME; // アプリ名
  globalEnvfileName = '.env'; // 環境変数
}
// モジュール設定
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// loggeer instance
const logger: Logger = new Logger(myVal.COMPANY_NAME, myVal.LOG_LEVEL);

// 開発モード
if (myVal.DEV_FLG) {
  sqlHost = process.env.SQL_DEV_HOST!; // 検証用SQLホスト名
  sqlUser = process.env.SQL_DEV_USER!; // 検証用SQLユーザ名
  sqlPass = process.env.SQL_DEV_PASS!; // 検証用SQLパスワード
  sqlDb = process.env.SQL_DEV_DBNAME!; // 検証用SQLデータベース名
} else {
  sqlHost = process.env.SQL_HOST!; // SQLホスト名
  sqlUser = process.env.SQL_ADMINUSER!; // SQLユーザ名
  sqlPass = process.env.SQL_ADMINPASS!; // SQLパスワード
  sqlDb = process.env.SQL_DBNAME!; // SQLデータベース名
}

console.log

// DB設定
const myDB: SQL = new SQL(
  sqlHost, // ホスト名
  sqlUser, // ユーザ名
  sqlPass, // ユーザパスワード
  Number(process.env.SQL_PORT), // ポート番号
  sqlDb, // DB名
  logger // ロガー
);

// スケジューリング
const initialSheduleCron = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info('initialSheduleCron: スケジューリング開始');
      // スケジュール（平日毎分)
      cron.schedule(
        '* 7-21 * * 1-5',
        async () => {
          // 支払チェック
          await checkPaymentStatus();
          logger.info('initialSheduleCron: 支払更新完了 ');
        },
        {
          scheduled: true,
          timezone: 'Asia/Tokyo'
        }
      );
      // 完了
      resolve();
      logger.info('initialSheduleCron: スケジューリング完了');
    } catch (e) {
      // エラー
      logger.error(e);
      reject();
    }
  });
};

// 支払確認
const checkPaymentStatus = async (): Promise<void> => {
  return new Promise(async resolve1 => {
    try {
      logger.info('checkPaymentStatus: 支払確認開始');
      // 対象データ
      const transSelectArgs: selectargs = {
        table: 'transaction', // 注文
        columns: ['usable'], // 使用可能
        values: [[1]], // 使用可能
        spanval: myVal.DATECOUNT, // 範囲
        spancol: 'created_at', // 対象
        spandirection: 'after', // 以降
        spanunit: 'day', // 日
        fields: ['transactionkey'] // 選択カラム
      };
      // 決済情報抽出
      const tmpPaymentData: any = await myDB.selectDB(transSelectArgs);

      // エラー
      if (tmpPaymentData === 'error') {
        // 顧客検索エラー
        throw new Error('DB: 注文データ選択エラー');
      } else if (tmpPaymentData === 'empty') {
        // データなし
        logger.debug('DB: 注文データなし');
        // 完了
        resolve1();
      } else {
        // チェック対象一覧送信
        const finalPaymentData: any = await fetchData(
          tmpPaymentData,
          'checkpayment'
        );

        // トランザクションキーを抽出
        await Promise.all(
          // トランザクションキーを抽出
          finalPaymentData.map(async (transaciton: any): Promise<void> => {
            return new Promise(async resolve2 => {
              try {
                // 一時カラム配列
                let tmpColArray: string[] = [];
                // 一時値配列
                let tmpValArray: any[] = [];

                // エラー有の場合はエラーコード
                if (transaciton.errcode != '') {
                  logger.debug('エラーモード');
                  // 配列初期値
                  tmpColArray = ['status', 'errcode'];
                  tmpValArray = [myVal.ERRSTATUS, transaciton.errcode];
                } else {
                  logger.debug('通常モード');
                  // 配列初期値
                  tmpColArray = ['status'];
                  tmpValArray = [transaciton.status];
                }
                // 支払
                tmpColArray.push('paid');
                // 決済完了時
                if (transaciton.status == myVal.PAYSTATUS) {
                  tmpValArray.push(1);
                } else {
                  tmpValArray.push(0);
                }
                // 対象データ
                const updateTransArgs: updateargs = {
                  table: 'transaction', // 注文
                  setcol: tmpColArray, // 遷移先URL
                  setval: tmpValArray, // 遷移先URL値
                  selcol: ['transactionkey', 'usable'], // 対象ID
                  selval: [transaciton.orderkey, 1], // 対象ID値
                  spanval: myVal.DATECOUNT, // 範囲
                  spancol: 'created_at', // 対象
                  spandirection: 'after', // 最新
                  spanunit: 'day' // 日
                };
                // DBアップデート
                const transactionDel: any = await myDB.updateDB(
                  updateTransArgs
                );
                // エラー
                if (transactionDel == 'error') {
                  // 更新エラー
                  throw new Error('DB: 注文データ更新エラー');
                } else if (transactionDel == 'empty') {
                  // 更新対象なし
                  logger.debug('DB: 注文データ更新対象なし');
                } else {
                  // 更新成功
                  logger.debug('DB: 注文更新成功');
                }
                // 待機1秒
                await setTimeout(1000);
              } catch (error) {
                // エラー
                logger.error(error);
              } finally {
                // 完了
                resolve2();
              }
            });
          })
        ).catch((err: unknown) => {
          // エラー
          logger.error(err);
        });
        logger.info('checkPaymentStatus: 支払確認完了');
      }
    } catch (e) {
      // エラー
      logger.error(e);
    } finally {
      // 完了
      resolve1();
    }
  });
};

// fetch data
const fetchData = async (sendArray: string[], url: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('fetchData開始');
      // 決済チェック
      const resultObj: any = await httpsPost(
        `${globalServerUrl}/${url}`,
        sendArray
      );
      setTimeout(500);

      // エラーなら
      if (resultObj == 'error') {
        throw new Error('DB: 通信エラー');
      }
      // 完了
      resolve(resultObj);
    } catch (e) {
      // エラー
      logger.error(e);
      reject('error');
    }
  });
};

// post送信
const httpsPost = async (hostname: string, data: any): Promise<any> => {
  return new Promise(async resolve => {
    try {
      logger.debug('httpsPost開始');
      // 対象データ
      let targetData: any;

      // post送信
      axios
        .post(hostname, data, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then((response: any) => {
          // 対象データ
          targetData = response.data;
          // リンクURL返し
          resolve(targetData);
          logger.debug('httpsPost完了');
        })
        .catch((err: unknown) => {
          // エラー
          logger.error(err);
          resolve('error');
        });
    } catch (e) {
      // エラー
      logger.error(e);
      resolve('error');
    }
  });
};

// 実行
(async () => {
  // スケジュールセット
  //await initialSheduleCron();
  await checkPaymentStatus();
  logger.info('finished');
})();
