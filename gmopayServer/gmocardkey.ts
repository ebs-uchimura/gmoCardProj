/**
 * gmocardkey.ts
 **
 * function：LINE カード決済 サーバ
 **/

'use strict';

// 定数
// 名前空間
import { myDev } from './consts/globalinfo'; // 開発切り替え
import { myConst } from './consts/globalvariables'; // 本番環境
import { myDevConst } from './consts/globalvariablesdev'; // 開発環境
// 開発環境切り替え
let globalDefaultPort: number; // ポート番号
let globalServerUrl: string; // サーバURL
let globalAppName: string; // アプリ名
let globalEnvfileName: string; // 環境ファイル名
let globalLogPath: string; // ログファイルパス
let sqlHost: string; // SQLホスト名
let sqlUser: string; // SQLユーザ名
let sqlPass: string; // SQLパスワード
let sqlDb: string; // SQLデータベース名
let cryptoKey: string; // 暗号化キー

// import global interface
import { } from './@types/globalsql';
// モジュール
import { config as dotenv } from 'dotenv'; // 秘匿情報用
import * as path from 'node:path'; // パス用
import express from 'express'; // express
import helmet from 'helmet'; // セキュリティ対策用
import moment from 'moment'; // 日付操作用
import URLSafeBase64 from 'urlsafe-base64'; // urlsafe用
import Crypto from './class/Crypto0414'; // 暗号化用
import SQL from './class/MySql0627'; // DB操作用
import Logger from './class/Logger'; // logger

// 開発モード
if (myDev.DEV_FLG) {
  globalServerUrl = myDevConst.DEVELOPMENT_URL!; // 検証用サーバURL
  globalDefaultPort = Number(myDevConst.DEFAULT_PORT); // ポート番号
  globalAppName = myDevConst.APP_NAME!; // アプリ名
  globalEnvfileName = '.devenv'; // 環境変数
  globalLogPath = myDevConst.LOG_PATH; // ログファイルパス
} else {
  globalServerUrl = myConst.DEFAULT_URL!; // サーバURL
  globalDefaultPort = Number(myConst.DEFAULT_PORT); // ポート番号
  globalAppName = myConst.APP_NAME!; // アプリ名
  globalEnvfileName = '.env'; // 環境変数
  globalLogPath = myConst.LOG_PATH; // ログファイルパス
}
// モジュール設定
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// 開発モード
if (myDev.DEV_FLG) {
  sqlHost = process.env.SQL_DEV_HOST!; // SQLホスト名
  sqlUser = process.env.SQL_DEV_USER!; // SQLユーザ名
  sqlPass = process.env.SQL_DEV_PASS!; // SQLパスワード
  sqlDb = process.env.SQL_DEV_KEYDBNAME!; // SQLデータベース名
  cryptoKey = process.env.CRYPTO_256_DEV_KEY!; // 暗号化キー(開発用)
} else {
  sqlHost = process.env.SQL_HOST!; // SQLホスト名
  sqlUser = process.env.SQL_ADMINUSER!; // SQLユーザ名
  sqlPass = process.env.SQL_ADMINPASS!; // SQLパスワード
  sqlDb = process.env.SQL_KEYDBNAME!; // SQLデータベース名
  cryptoKey = process.env.CRYPTO_256_KEY!; // 暗号化キー
}
// loggeer instance
const logger: Logger = new Logger(globalAppName, globalLogPath, myDev.LOG_LEVEL);

// DB設定
const myDB: SQL = new SQL(
  sqlHost, // ホスト名
  sqlUser, // ユーザ名
  sqlPass, // ユーザパスワード
  Number(myDev.SQL_PORT), // ポート番号
  sqlDb, // DB名
  logger, // ロガー
);

// express設定
const app: any = express(); // express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // ejs使用
app.use(express.static('public')); // public設定
app.use(express.json()); // json設定
app.use(
  express.urlencoded({
    extended: true // body parser使用
  })
);
// ヘルメット使用
app.use(helmet());

// トップページ
app.get('/', async (_: any, res: any) => {
  // ファイル名
  logger.debug('connected');
  res.status(404).render('404', {});
});

// 決済画面
app.get('/card', async (req: any, res: any) => {
  try {
    // モード
    logger.debug('card: payment mode started');
    // データなしエラー
    if (!req.query.token || !req.query.key) {
      throw new Error('no necessary data');
    }
    // iv抽出処理
    const ivArgs: selectargs = {
      table: 'iv',
      columns: ['ivkey', 'usable'],
      values: [[req.query.key], [1]],
      spanval: myDev.DATECOUNT,
      spancol: 'created_at',
      spandirection: 'after',
      spanunit: 'day'
    };
    // iv抽出
    const tmpIvData: any = await myDB.selectDB(ivArgs);
    // エラーなし
    if (tmpIvData == 'error' || tmpIvData == 'empty') {
      // 認証エラー
      res.render('error', {
        title: '認証エラー',
        message: 'カスタマーサポートに連絡して下さい（0120-88-0606）'
      });
    } else {
      // 暗号化インスタンス
      const mainCrypto: Crypto = new Crypto(cryptoKey, logger);
      // 暗号URL
      const decryptedUrl: any = await mainCrypto.decrypt(
        req.query.token,
        tmpIvData[0].urliv
      );
      // 暗号化失敗
      if (!decryptedUrl) {
        throw new Error('card: decrypt card url failed.');
      }
      // 合計購入数
      const usertotal: number = Number(req.query.total);
      // 作成日時
      const createDate: string = new Date(Number(req.query.date)).toISOString();
      // 現在の時刻
      const nowDate: string = new Date().toISOString();
      // 時刻差分
      const timediff: number = moment(nowDate).diff(
        moment(createDate),
        'seconds'
      );

      // 発行から14日以内なら有効
      if (timediff < myDev.TIMELIMIT) {
        // 暗号店舗名
        const decryptedName: any = await mainCrypto.decrypt(
          req.query.user,
          tmpIvData[0].nameiv
        )!;
        // 暗号化失敗
        if (!decryptedName) {
          throw new Error('card: decrypt name failed.');
        }
        logger.debug('card: payment finished');
        // 決済ページ
        res.render('card', {
          url: decryptedUrl,
          shopname: decryptedName,
          total: usertotal
        });

      } else {
        logger.debug('card: payment error');
        // 有効期限切れ
        res.render('error', {
          title: '有効期限エラー',
          message: 'URLの有効期限は7日です。再発行を依頼してください。（0120-88-0606）'
        });
      }
    }
  } catch (e) {
    // エラー
    logger.error(e);
    res.status(404).render('404', {});
  }
});

// 編集画面
app.get('/edit', async (req: any, res: any) => {
  try {
    // モード
    logger.debug('edit: edit mode start');
    // データなし判定
    if (!req.query.token) {
      throw new Error('no token');
    }
    // 対象データ
    const ivArgs: selectargs = {
      table: 'iv',
      columns: ['ivkey', 'usable'],
      values: [req.query.key, 1],
      spanval: myDev.DATECOUNT,
      spancol: 'created_at',
      spandirection: 'after',
      spanunit: 'day'
    };
    // iv抽出
    const tmpIvData: any = await myDB.selectDB(ivArgs);
    // エラーなし
    if (tmpIvData == 'error' || tmpIvData == 'empty') {
      // 認証エラー
      res.render('error', {
        title: '認証エラー',
        message: 'カスタマーサポートに連絡して下さい（0120-88-0606）'
      });
    } else {
      // 暗号化インスタンス
      const mainCrypto: Crypto = new Crypto(cryptoKey, logger);
      // 暗号URL
      const decryptedUrl: any = await mainCrypto.decrypt(
        req.query.token,
        tmpIvData[0].urliv
      )!;
      // 暗号URLなし
      if (!decryptedUrl) {
        throw new Error('edit: decrypt edit url failed.');
      }
      // 作成日時
      const createDate: string = new Date(Number(req.query.date)).toISOString();
      // 現在の時刻
      const nowDate: string = new Date().toISOString();
      // 時刻差分
      const timediff: number = moment(nowDate).diff(
        moment(createDate),
        'seconds'
      );
      // 発行から14日以内なら有効
      if (timediff < myDev.TIMELIMIT) {
        // 暗号店舗名
        const decryptedName: any = await mainCrypto.decrypt(
          req.query.user,
          tmpIvData[0].nameiv
        )!;
        // 暗号化失敗
        if (!decryptedName) {
          throw new Error('edit: decrypt name failed.');
        }
        logger.debug('edit: edit finished');
        // ファイル名
        res.render('edit', {
          url: decryptedUrl,
          shopname: decryptedName
        });

      } else {
        logger.debug('edit: card edit error');
        // 有効期限切れ
        res.render('error', {
          title: '有効期限エラー',
          message: 'URLの有効期限は7日です。再発行を依頼してください。'
        });
      }
    }
  } catch (e) {
    // エラー
    logger.error(e);
    res.status(404).render('404', {});
  }
});

// GMO決済戻り先
app.post('/complete', async (req: any, res: any) => {
  try {
    // モード
    logger.debug('complete: complete mode start');
    // 変数定義
    let tmpText: string = '';
    // 結果文字列
    let finalString: string = '';
    // BASE64デコード
    const base64EncodeUtf: Buffer = URLSafeBase64.decode(req.body.result);
    // デコード後文字列
    const decodedString: string = base64EncodeUtf.toString('utf8');
    // 不要文字列削除用1
    const regex: RegExp = /\"TranDate\":\"[0-9]{14}\"}}/;
    // 不要文字列削除用2
    const regexwithreg: RegExp = /\"Result\":\"(SUCCESS|FAIL)\"}}/;
    // 判定用
    const successreg: RegExp = /registcard/;

    // 結果正常
    if (successreg.test(decodedString)) {
      // 不要文字あり
      const resultwithreg: any = decodedString.match(regexwithreg);
      // マッチあり
      if (resultwithreg) {
        // TranDate:- 以降を削除
        finalString = decodedString.substring(
          0,
          Number(resultwithreg.index) + resultwithreg[0].length
        );
      } else {
        // そのまま
        finalString = decodedString;
      }
    } else {
      // 不要文字あり
      const result: any = decodedString.match(regex);
      // マッチあり
      if (result) {
        // Result:- 以降を削除
        finalString = decodedString.substring(
          0,
          Number(result.index) + result[0].length
        );
      } else {
        // そのまま
        finalString = decodedString;
      }
    }
    logger.debug('decode success');
    // JSONパース
    const resultData: any = JSON.parse(finalString);
    // 顧客番号
    const customerNo: string = resultData.transactionresult.OrderID
      .split('-')[0]
      .slice(2);
    // ゼロ無し顧客番号
    const trimmedCustomerNo: number = Number(customerNo);
    // ユーザキー
    const userKey: string = resultData.transactionresult.OrderID.split('-')[1];
    // 分岐
    switch (resultData.transactionresult.Result) {
      // 決済成功
      case 'PAYSUCCESS':
        logger.debug('pay success');
        // 決済ステータスが'CAPTURE'
        if (resultData.credit.Status == myDev.PAYSTATUS) {
          // 送付テキスト
          tmpText = 'ご注文ありがとうございました。×ボタンでページを閉じてください。';
          // ファイル名
          await updateTransactionkeyDB(userKey, trimmedCustomerNo, myDev.PAYSTATUS, '');
          logger.debug('transaction update success');
          break;
        }

      // 決済途中
      case 'PAYSTART':
        logger.debug('pay invalid');
        // 送付テキスト
        tmpText = '不正な操作です。一旦ページを閉じて開きなおしてください。';
        break;

      // 決済エラー
      case 'ERROR':
        logger.debug('pay error');
        // 送付テキスト
        tmpText = '決済エラーです。ページを閉じてください。';
        break;

      // それ以外
      default:
        logger.debug(
          `Sorry, we are out of ${resultData.transactionresult.Result}.`
        );
    }
    // 画面描画
    res.render('complete', {
      text: tmpText // 表示内容
    });
  } catch (e) {
    // エラー
    logger.error(e);
    res.status(404).render('404', {});
  }
});

// 決済状態確認
app.post('/checkpayment', async (req: any, res: any) => {
  try {
    // モード
    logger.debug('checkpayment: checkpayment mode started');
    // トランザクションキー一式
    const transactionkeySetArray: any = req.body;
    // トランザクションキーを抽出
    const tmpTransactionArray: any = await Promise.all(
      // トランザクションキーを抽出
      transactionkeySetArray.map(async (token: any): Promise<any> => {
        return new Promise(async (resolve, reject) => {
          try {
            // 対象データ
            const transactionKeyArgs: selectargs = {
              table: 'transactionkey',
              columns: ['orderkey', 'usable'],
              values: [[token.transactionkey], [1]],
              spanval: myDev.DATECOUNT,
              spancol: 'created_at',
              spandirection: 'after',
              spanunit: 'day',
            };
            // トランザクションキー抽出
            const tmpTransactionData: any = await myDB.selectDB(transactionKeyArgs);
            // ヒットなし
            if (tmpTransactionData == 'error') {
              // エラー
              reject();
            } else if (tmpTransactionData == 'empty') {
              // エラー
              resolve('');
            } else {
              // 結果を返す
              resolve(tmpTransactionData);
            }
          } catch (error) {
            // エラー
            logger.error(error);
          }
        })
      }));
    // 空白除去
    const cleanedArray = tmpTransactionArray.filter(removeEmpty);
    // 結果返し
    res.send(cleanedArray.flat());

  } catch (e) {
    // エラー
    logger.error(e);
    res.send([]);
  }
});

// iv受取
app.post('/iv', async (req: any, res: any) => {
  try {
    // モード
    logger.debug('iv: iv mode start');
    // iv用キー
    const setKey: any = req.body.key;
    // urliv
    const urlIv: any = req.body.urlIv;
    // nameiv
    const nameIv: any = req.body.nameIv;
    // 対象データ
    const insertIvArgs: insertargs = {
      table: 'iv',
      columns: ['ivkey', 'urliv', 'nameiv', 'usable'],
      values: [setKey, urlIv, nameIv, 1]
    };
    // ivDB格納
    const tmpReg: any = await myDB.insertDB(insertIvArgs);
    logger.debug(tmpReg);
    // エラー
    if (tmpReg == 'error' || tmpReg == 'empty') {
      res.send([]);
    } else {
      // 完了ページ
      logger.debug('iv: initial insertion to transaction completed.');
      res.send('completed');
    }
  } catch (e) {
    // エラー
    logger.error(e);
    res.status(404).render('404', {});
  }
});

// GMO決済結果
app.post('/notify', async (req: any, _: any) => {
  try {
    // モード
    logger.debug('notify: notify mode start');
    // 受信データ
    const resultStr: string = req.body.OrderID ?? '';
    // ステータス
    const resultStatus: string = req.body.Status ?? '';
    // エラー詳細コード
    const errorInfo: string = req.body.ErrInfo ?? '';
    // データなし
    if (!resultStr.includes('-')) {
      throw new Error('no orderid exists.');
    }
    // 受信データ
    const notifyObj: string[] = resultStr.split('-');
    // 顧客番号
    const customerNo: string = notifyObj[0].slice(2);
    // ゼロ無し顧客番号
    const trimmedCustomerNo: number = Number(customerNo);
    // ユーザキー
    const userKey: string = notifyObj[1];
    // 既に存在するレコード
    const existingRecords: any = await selectTransactionkeyDB(
      trimmedCustomerNo,
      userKey,
    );
    // エラー
    if (existingRecords == 'error') {
      // エラー
      logger.debug('error');

      // ヒットなし
    } else if (existingRecords == 'empty') {
      // 追加処理
      await insertTransactionkeyDB(userKey, trimmedCustomerNo, resultStatus, errorInfo);
      logger.debug('notify insert completed');

      // ステータス有り
    } else if (existingRecords.status) {
      // 現在の登録が支払い完了で更新が保留中
      if (existingRecords.status == myDev.PAYSTATUS && resultStatus == myDev.PENDINGSTATUS) {
        // アップデートなし
        logger.debug('no update');

        // 現在の登録が支払い完了で更新が金額変更中
      } else if (existingRecords.status == myDev.PAYSTATUS && resultStatus == myDev.VOIDDSTATUS) {
        // アップデートなし
        logger.debug('no update');

      } else {
        // 更新処理
        await updateTransactionkeyDB(userKey, trimmedCustomerNo, resultStatus, errorInfo);
        logger.debug('notify update completed');
      }
    }

  } catch (e) {
    // エラー
    logger.error(e);
  }
});

// GMO決済戻り先
app.post('/cancel', async (_: any, res: any) => {
  // モード
  logger.debug('cancel: cancel mode start');
  // 画面描画
  res.render('cancel', {
    text: '処理を中断しました。ページを閉じてください。'
  });
});

// GMO決済戻り先
app.post('/button', async (_: any, __: any) => {
  // モード
  logger.debug('cancel mode');
  // 画面描画
});

// エラーハンドラー(500)
app.use((err: any, _: any, res: any, next: any) => {
  if (err.name === 'TypeError') {
    res.status(500).render('error', { title: '500', message: 'forbidden' });
  } else {
    next(err);
  }
});

// エラーハンドラー(それ以外)
app.all('*', (req: any, res: any) => {
  if (req.path == '/403') {
    res.status(403).render('403', {});
  } else {
    res.status(404).render('404', {});
  }
});

// 3000番待機
app.listen(globalDefaultPort, () => {
  logger.debug(
    `GMO card app listening at ${globalServerUrl}:${globalDefaultPort}`
  );
});

// 存在チェック
const selectTransactionkeyDB = async (
  cutomerno: number,
  key: string,
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('selectTransactionkeyDB start');
      // 対象データ
      const selectTransArgs: selectargs = {
        table: 'transactionkey',
        columns: ['customerno', 'orderkey', 'usable'],
        values: [[cutomerno], [key], [1]],
        spanval: myDev.DATECOUNT,
        spancol: 'created_at',
        spandirection: 'after',
        spanunit: 'day'
      };
      // トランザクションDB格納
      const transactionResult: any = await myDB.selectDB(selectTransArgs);
      // エラー
      if (transactionResult == 'error') {
        // トランザクションエラー
        throw new Error('transaction update error');
      } else if (transactionResult == 'empty') {
        // 結果なし
        logger.debug('select existing transaction empty.');
        // 結果
        resolve('empty');
      } else {
        logger.debug('select existing transaction completed.');
        // 結果
        resolve(transactionResult[0]);
      }
    } catch (e) {
      // エラー
      logger.error(e);
      reject('error');
    }
  });
};

// 設定更新
const updateTransactionkeyDB = async (
  key: string,
  cutomerno: number,
  status: string,
  err: string,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('updateTransactionkeyDB start');
      /// 対象データ
      const updateTransArgs: updateargs = {
        table: 'transactionkey', // 注文
        setcol: ['status', 'errcode'], // 遷移先URL
        setval: [status, err], // 遷移先URL値
        selcol: ['orderkey', 'customerno', 'usable'], // 対象ID
        selval: [key, cutomerno, 1], // 対象ID値
        spancol: 'created_at', // 対象
        spanval: myDev.DATECOUNT, // 範囲
        spandirection: 'after', // 最新
        spanunit: 'day' // 日
      };
      // トランザクションDB格納
      const tmpReg: any = await myDB.updateDB(updateTransArgs);
      // エラー
      if (tmpReg == 'error' || tmpReg == 'empty') {
        // トランザクションエラー
        throw new Error('transaction update error');
      } else {
        logger.debug('transaction update completed.');
        // 完了ページ
        resolve();
      }
    } catch (e) {
      // エラー
      logger.error(e);
      reject();
    }
  });
};

// 設定登録
const insertTransactionkeyDB = async (
  key: string,
  cutomerno: number,
  status: string,
  err: string,
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('insertTransactionkeyDB start');
      // 対象データ
      const insertTransArgs: insertargs = {
        table: 'transactionkey',
        columns: ['orderkey', 'customerno', 'status', 'errcode', 'usable'],
        values: [key, cutomerno, status, err, 1]
      };
      // トランザクションDB格納
      const tmpReg: any = await myDB.insertDB(insertTransArgs);
      // エラー
      if (tmpReg == 'error' || tmpReg == 'empty') {
        // トランザクションエラー
        throw new Error('transaction insertion error');
      } else {
        logger.debug('initial insertion to transaction completed.');
        // 完了ページ
        resolve();
      }
    } catch (e) {
      // エラー
      logger.error(e);
      reject();
    }
  });
};

// 空白除去
const removeEmpty = (element: any) => {
  return element !== '';
}
