/**
 * gmodisableurl.ts
 **
 * function：GMO-PGカードURL無効化 アプリ
 **/

'use strict';

/// 定数
// 名前空間
import { myDev } from './consts/globalinfo';
import { myConst, gmoConst } from './consts/globalvariables';
import { myDevConst, gmoDevConst } from './consts/globalvariablesdev';

// import global interface
import { } from './@types/globalsql';

// モジュール
import { config as dotenv } from 'dotenv'; // 隠蔽用
import { setTimeout } from 'node:timers/promises'; // ウェイト
import * as path from 'path'; // パス
import axios from 'axios'; // http通信用
import Logger from './class/localLogger'; // local logger
import SQL from './class/MySql0627'; // DB操作用
// 可変要素
let globalDateCount: number; // 有効日数
let globalAppName: string; // アプリ名
let globalEnvfileName: string; // 環境ファイル名
let globalLogLevel: string; // ログレベル
let gmoDeleteRequestUrl: string; // デフォルトURL

// 開発モード
if (myDev.DEV_FLG) {
  globalDateCount = myDevConst.DATECOUNT; // 有効日数
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  globalLogLevel = myDevConst.LOG_LEVEL; // ログレベル
  gmoDeleteRequestUrl = gmoDevConst.GMO_DELREQUESTURL!; // リクエストAPI
  globalEnvfileName = '.devenv'; // 環境ファイル
} else {
  globalDateCount = myDevConst.DATECOUNT; // 有効日数
  globalAppName = myConst.APP_NAME!; // アプリ名
  globalLogLevel = myConst.LOG_LEVEL; // ログレベル
  gmoDeleteRequestUrl = gmoConst.GMO_DELREQUESTURL!; // リクエストAPI
  globalEnvfileName = '.env'; // 環境ファイル
}
// モジュール設定
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// 開発環境切り替え
let gmoShopid: string; // ショップID
let gmoShoppass: string; // ショップパスワード
let sqlHost: string; // SQLホスト名
let sqlUser: string; // SQLユーザ名
let sqlPass: string; // SQLパスワード
let sqlDb: string; // SQLデータベース名
// ロガー設定
const logger: Logger = new Logger(globalAppName, myDev.COMPANY_NAME, globalLogLevel);

// 開発モード
if (myDev.DEV_FLG) {
  gmoShopid = process.env.GMO_DEV_SHOPID!; // 検証用ショップID
  gmoShoppass = process.env.GMO_DEV_SHOPPASS!; // 検証用ショップパスワード
  sqlHost = process.env.SQL_DEV_HOST!; // 検証用SQLホスト名
  sqlUser = process.env.SQL_DEV_USER!; // 検証用SQLユーザ名
  sqlPass = process.env.SQL_DEV_PASS!; // 検証用SQLパスワード
  sqlDb = process.env.SQL_DEV_DBNAME!; // 検証用SQLデータベース名
} else {
  gmoShopid = process.env.GMO_SHOPID!; // ショップID
  gmoShoppass = process.env.GMO_SHOPPASS!; // ショップパスワード
  sqlHost = process.env.SQL_HOST!; // SQLホスト名
  sqlUser = process.env.SQL_ADMINUSER!; // SQLユーザ名
  sqlPass = process.env.SQL_ADMINPASS!; // SQLパスワード
  sqlDb = process.env.SQL_DBNAME!; // SQLデータベース名
}

// DB設定
const myDB: SQL = new SQL(
  sqlHost, // ホスト名
  sqlUser, // ユーザ名
  sqlPass, // ユーザパスワード
  Number(process.env.SQL_PORT), // ポート番号
  sqlDb!, // DB名
  logger // ロガー
);

// 期限過無効化
const disableTransaciton = async (): Promise<void> => {
  return new Promise(async resolve1 => {
    try {
      // 対象データ
      const transSelectArgs: selectargs = {
        table: 'transaction', // 注文
        columns: ['paid'], // 対象カラム
        values: [[0]], // 検索値
        spanval: globalDateCount, // 対象期間
        spandirection: 'before', // 前
        spanunit: 'day' // 単位
      };
      // 決済情報抽出
      const tmpDisablePaymentData: any = await myDB.selectDB(transSelectArgs);

      // エラー
      if (tmpDisablePaymentData === 'error') {
        // 顧客検索エラー
        throw new Error('DB: 注文データ選択エラー');
      } else if (tmpDisablePaymentData === 'empty') {
        // データなし
        logger.debug('DB: 注文データなし');
      } else {
        // 更新成功
        logger.debug('DB: 注文選択成功');
        // トランザクションキーを抽出
        await Promise.all(
          tmpDisablePaymentData.map(async (transaction: any): Promise<void> => {
            return new Promise(async resolve2 => {
              try {
                // 無効化URL取得
                const eraseResult: any = await publishDelUrl(
                  gmoShopid,
                  gmoShoppass,
                  transaction.orderid
                );
                logger.trace('4: ');
                logger.trace(eraseResult);

                // ステータス有り
                if (eraseResult.Status) {
                  // 決済チェック
                  const disableTransArgs: updateargs = {
                    table: 'transaction', // 注文
                    setcol: ['usable'], // 遷移先URL
                    setval: ['0'], // 遷移先URL値
                    selcol: ['paid'], // 対象ID
                    selval: ['0'], // 対象ID値
                    spanval: globalDateCount, // 対象期間
                    spandirection: 'before', // 前
                    spanunit: 'day' // 単位
                  };
                  // DBアップデート
                  const transactionDisableUp: any = await myDB.updateDB(
                    disableTransArgs
                  );
                  logger.trace('5: ');
                  logger.trace(transactionDisableUp);
                  // エラー
                  if (transactionDisableUp == 'error') {
                    // 更新エラー
                    throw new Error('DB: 注文データ更新エラー');
                  } else if (transactionDisableUp == 'empty') {
                    // 更新対象なし
                    logger.debug('DB: 注文データ更新対象なし');
                  } else {
                    // 更新成功
                    logger.debug('DB: 注文更新成功');
                  }
                }
              } catch (error) {
                // エラー型
                logger.error(error);
              } finally {
                // 待機1秒
                await setTimeout(1000);
                // 完了
                resolve2();
              }
            });
          })
        ).catch(err => {
          // エラー型
          logger.error(err);
        });
      }
      // 完了
      resolve1();
    } catch (e) {
      // エラー型
      logger.error(e);
    } finally {
      // 完了
      resolve1();
    }
  });
};

// 無効化URL発行
const publishDelUrl = (
  shopid: string,
  shoppass: string,
  orderid: string
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('publishDelUrl開始');
      // 送付JSON
      const param: any = {
        ShopID: shopid, // ショップID
        ShopPass: shoppass, // ショップパスワード
        OrderID: orderid // 注文ID
      };
      // 送信
      const rejectLinkUrl: any = await httpsPost(
        gmoDeleteRequestUrl, // 無効化URL
        JSON.stringify(param) // データ
      );
      //logger.trace(rejectLinkUrl);
      // エラー
      if (rejectLinkUrl == 'error') {
        // HTTP通信エラー（無効化URL取得）
        //throw new Error('HTTP通信エラー（無効化URL取得）');
      } else {
        // 値返し
        resolve(rejectLinkUrl);
        logger.debug('publishDelUrl完了');
      }
    } catch (e) {
      // エラー
      logger.error(e);
      reject('publishPayUrl error');
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
      logger.trace(data);

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
  // URL無効化
  await disableTransaciton();
  logger.info('finished');
})();
