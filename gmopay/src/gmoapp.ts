/**
 * gmoapp.ts
 **
 * function：GMO-PGカード決済アプリ
 **/

'use strict';

// 定数
// import global interface
import { } from '../@types/globalobj';
import { } from '../@types/globaljoinsql';
// 名前空間
import { myVal } from './consts/globalinfo'; // 開発切り替え
import { myConst } from './consts/globalvariables'; // 本番環境
import { myDevConst } from './consts/globalvariablesdev'; // 開発環境
// 開発環境切り替え
let globalPageCount: number; // ページ数
let globalDateCount: number; // 日数
let globalServerUrl: string; // サーバURL
let gmoPayRequestUrl: string; // 決済リクエストAPI
let gmoEditRequestUrl: string; // 編集リクエストAPI
let globalAppName: string; // アプリ名
let globalEnvfileName: string; // 環境ファイル名
// モジュール
import * as path from 'node:path'; // path
import { config as dotenv } from 'dotenv'; // 隠蔽用
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from 'electron'; // electron
import axios from 'axios'; // http通信用
import URLSafeBase64 from 'urlsafe-base64'; // urlsafe
import Dialog from './class/ElDialog0414'; // ダイアログ
import ELLogger from './class/ElLogger'; // Electronロガー
import SQL from './class/MySqlJoin0612'; // DB操作用
import Crypto from './class/Crypto0616'; // 暗号化用
import MKDir from './class/ElMkdir0414'; // フォルダ生成用

// 開発モード
if (myVal.DEV_FLG) {
  globalEnvfileName = '../.devenv'; // 環境変数
  globalPageCount = myDevConst.PAGECOUNT; // ページ数
  globalDateCount = myDevConst.DATECOUNT; // 日数
  globalAppName = myDevConst.APP_NAME; // 検証用サーバURL
  globalServerUrl = myDevConst.DEVELOPMENT_URL; // 基本URL
  gmoPayRequestUrl = myDevConst.GMO_DEV_PAY_REQUESTURL!; // 決済リクエストAPI(開発用)
  gmoEditRequestUrl = myDevConst.GMO_DEV_EDIT_REQUESTURL!; // 編集リクエストAPI(開発用)
} else {
  globalEnvfileName = '../.env'; // 環境変数
  globalPageCount = myConst.PAGECOUNT; // ページ数
  globalDateCount = myConst.DATECOUNT; // 日数
  globalAppName = myConst.APP_NAME; // サーバURL
  globalServerUrl = myConst.DEFAULT_URL; // 基本URL
  gmoPayRequestUrl = myConst.GMO_PAY_REQUESTURL!; // 決済リクエストAPI
  gmoEditRequestUrl = myConst.GMO_EDIT_REQUESTURL!; // 編集リクエストAPI
}

// モジュール設定
dotenv({ path: path.join(__dirname, globalEnvfileName) });
// ロガー初期化
const logger: ELLogger = new ELLogger(myVal.COMPANY_NAME, globalAppName, myVal.LOG_LEVEL);

// 開発環境切り替え
let sqlHost: string; // SQLホスト名
let sqlUser: string; // SQLユーザ名
let sqlPass: string; // SQLパスワード
let sqlDb: string; // SQLデータベース名
let gmoConfigid: string; // 設定ID
let gmoShopid: string; // ショップID
let gmoShoppass: string; // ショップパスワード
let cryptoKey: string; // 暗号化キー

// 開発モード
if (myVal.DEV_FLG) {
  sqlHost = process.env.SQL_DEV_HOST!; // SQLホスト名(開発用)
  sqlUser = process.env.SQL_DEV_TESTUSER!; // SQLユーザ名(開発用)
  sqlPass = process.env.SQL_DEV_TESTPASS!; // SQLパスワード(開発用)
  sqlDb = process.env.SQL_DEV_DBNAME!; // SQLデータベース名(開発用)
  gmoConfigid = process.env.GMO_DEV_CONFIGID!; // 設定ID(開発用)
  gmoShopid = process.env.GMO_DEV_SHOPID!; // ショップID(開発用)
  gmoShoppass = process.env.GMO_DEV_SHOPPASS!; // ショップパスワード(開発用)
  cryptoKey = process.env.CRYPTO_256_DEV_KEY!; //  暗号化キー(開発用)

} else {
  sqlHost = process.env.SQL_HOST!; // SQLホスト名
  sqlUser = process.env.SQL_ADMINUSER!; // SQLユーザ名
  sqlPass = process.env.SQL_ADMINPASS!; // SQLパスワード
  sqlDb = process.env.SQL_DBNAME!; // SQLデータベース名
  gmoConfigid = process.env.GMO_CONFIGID!; // 設定ID
  gmoShopid = process.env.GMO_SHOPID!; // ショップID
  gmoShoppass = process.env.GMO_SHOPPASS!; // ショップパスワード
  cryptoKey = process.env.CRYPTO_256_KEY!; // 暗号化キー
}

/// モジュール
// ダイアログ
const dialogMaker: Dialog = new Dialog(logger);
// フォルダ作成
const mkdirManager = new MKDir(logger);
// mkdir設定
mkdirManager.mkDir(path.join(app.getPath('home'), 'ebisudo', 'gmocardapp'));

// DB設定
const myDB: SQL = new SQL(
  sqlHost, // ホスト名
  sqlUser, // ユーザ名
  sqlPass, // ユーザパスワード
  Number(process.env.SQL_PORT), // ポート番号
  sqlDb, // DB名
  logger
);

// モード一覧
const GLOBALMODE: modeObj = Object.freeze({
  all: 'all', // 全体表示
  normal: 'normal',
  paid: 'paid',
  nopaid: 'nopaid',
  pending: 'pending',
});

// 決済状態取得
const getStatusCode = (code: string): any => {
  // モード一覧
  const PAYMENTMODE: paymentObj = Object.freeze({
    null: 'null',
    CAPTURE: 'CAPTURE',
    UNPROSESSED: 'UNPROSESSED',
    AUTHENTICATED: 'AUTHENTICATED',
    VOID: 'VOID',
    RETURN: 'RETURN',
    RETURNX: 'RETURNX',
  });
  // 結果
  switch (code) {
    case PAYMENTMODE.null:
      return '未決済';
    case PAYMENTMODE.CAPTURE:
      return '決済済';
    case PAYMENTMODE.UNPROSESSED:
      return 'エラー';
    case PAYMENTMODE.AUTHENTICATED:
      return '保留中';
    case PAYMENTMODE.VOID:
      return '金額変更中';
    case PAYMENTMODE.RETURN:
      return '返品';
    case PAYMENTMODE.RETURNX:
      return '月跨返品';
    default:
      return null;
  }
}
// 短縮URL
const globalShortenUrl: string = myVal.SHORT_URL;

/*
 メイン
*/
// ウィンドウ定義
let mainWindow: Electron.BrowserWindow;
// 起動確認フラグ
let isQuiting: boolean;

// ウィンドウ作成
const createWindow = (): void => {
  try {
    // ウィンドウ
    mainWindow = new BrowserWindow({
      width: 1200, // 幅
      height: 1000, // 高さ
      webPreferences: {
        nodeIntegration: false, // Node.js利用許可
        contextIsolation: true, // コンテキスト分離
        preload: path.join(__dirname, 'preload/preload.js') // プリロード
      }
    });

    // メニューバー非表示
    mainWindow.setMenuBarVisibility(false);
    // index.htmlロード
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
    // 準備完了
    mainWindow.once('ready-to-show', () => {
      // 開発モード
      // mainWindow.webContents.openDevTools();
    });

    // 最小化のときはトレイ常駐
    mainWindow.on('minimize', (event: any): void => {
      // キャンセル
      event.preventDefault();
      // ウィンドウを隠す
      mainWindow.hide();
      // falseを返す
      event.returnValue = false;
    });

    // 閉じる
    mainWindow.on('close', (event: any): void => {
      // 起動中
      if (!isQuiting) {
        // apple以外
        if (process.platform !== 'darwin') {
          // 終了
          app.quit();
          // falseを返す
          event.returnValue = false;
        }
      }
    });

    // ウィンドウが閉じたら後片付けする
    mainWindow.on('closed', (): void => {
      // ウィンドウをクローズ
      mainWindow.destroy();
    });

  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // メッセージ表示
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
};

// サンドボックス有効化
app.enableSandbox();

// メインプロセス(Nodejs)の多重起動防止
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.info('メインプロセスが多重起動しました。終了します。');
  app.quit();
}

// 処理開始
app.on('ready', async () => {
  // フォルダ作成
  await mkdirManager.mkDir(
    path.join(app.getPath('home'), 'ebisudo', 'gmocardapp')
  );
  logger.info('app: electron is ready');
  // ウィンドウを開く
  createWindow();
  // アイコン
  const icon: Electron.NativeImage = nativeImage.createFromPath(
    path.join(__dirname, '../assets/gmocard128.ico')
  );
  // トレイ
  const mainTray: Electron.Tray = new Tray(icon);
  // コンテキストメニュー
  const contextMenu: Electron.Menu = Menu.buildFromTemplate([
    // 表示
    {
      label: '表示',
      click: () => {
        mainWindow.show();
      }
    },
    // 閉じる
    {
      label: '閉じる',
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);
  // コンテキストメニューセット
  mainTray.setContextMenu(contextMenu);
  // ダブルクリックで再表示
  mainTray.on('double-click', () => mainWindow.show());
});

// 起動時
app.on('activate', () => {
  // 起動ウィンドウなし
  if (BrowserWindow.getAllWindows().length === 0) {
    // 再起動
    createWindow();
  }
});

// 閉じるボタン
app.on('before-quit', () => {
  // 閉じるフラグ
  isQuiting = true;
});

// 終了
app.on('window-all-closed', () => {
  logger.info('app: close app');
  // 閉じる
  app.quit();
});

/* IPC */
/* ページ表示 */
ipcMain.on('page', async (event, arg) => {
  try {
    logger.info('ipc: page mode');
    // 遷移先
    let url: string;
    // 履歴フラグ
    let historyFlg: boolean = false;
    // 履歴編集フラグ
    let editHistoryFlg: boolean = false;

    // urlセット
    switch (arg) {
      // 終了
      case 'exit_page':
        // apple以外
        if (process.platform !== 'darwin') {
          app.quit();
          return false;
        }
        // 遷移先
        url = '';
        break;

      // トップページ
      case 'top_page':
        // 遷移先
        url = '../index.html';
        break;

      // URL発行画面（購入）
      case 'regist_page':
        // 遷移先
        url = '../regist.html';
        break;

      // URL発行画面（編集）
      case 'edit_page':
        // 遷移先
        url = '../edit.html';
        break;

      // ユーザ登録画面
      case 'reguser_page':
        // 遷移先
        url = '../reguser.html';
        break;

      // ユーザ編集画面
      case 'edituser_page':
        // 遷移先
        url = '../edituser.html';
        break;

      // 履歴画面
      case 'history_page':
        // 履歴フラグ
        historyFlg = true;
        // 遷移先
        url = '../history.html';
        break;

      // 履歴画面（編集）
      case 'edit_history_page':
        // 履歴編集フラグ
        editHistoryFlg = true;
        // 遷移先
        url = '../history.html';
        break;

      // 金額変更画面
      case 'change_page':
        // 遷移先
        url = '../change.html';
        break;

      default:
        // 遷移先
        url = '';
    }

    // ページ遷移
    await mainWindow.loadFile(path.join(__dirname, url));
    logger.info(`url: ${url}`);

    // 履歴
    if (historyFlg) {
      logger.info('history mode');
      // 履歴
      const historyArray: historyObj = await getHistoryData(
        GLOBALMODE.normal, // ノーマルモード
        false
      );
      // 送信
      event.sender.send('history_finish', historyArray);
    }

    // 履歴編集
    if (editHistoryFlg) {
      logger.info('edit history mode');
      // 履歴編集
      const historyeditArray: historyObj = await getHistoryData(
        GLOBALMODE.normal, // ノーマルモード
        true
      );
      // 送信
      event.sender.send('history_finish', historyeditArray);
    }
  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // メッセージ表示
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

/* URL発行関係 */
// URL発行画面（購入）
ipcMain.on('publish', async (event: any, arg: any) => {
  try {
    logger.info('ipc: publish mode started');

    // 暗号化インスタンス
    const pubCrypto: Crypto = new Crypto(logger, cryptoKey);
    // 一時キー
    const tmpKey: string = await pubCrypto.random(10);
    // 顧客名
    const tmpCustomername: string = String(arg.customername);
    // 顧客番号
    const customerNo: number = Number(arg.customerno);
    // カンマ無し価格
    const totalPriceStr: number = removeComma(String(arg.price));
    // 空欄エラー処理
    if (
      tmpCustomername == '' ||
      isNaN(customerNo) ||
      isNaN(Number(totalPriceStr))
    ) {
      // データ欠損エラー
      throw new Error('データが欠損しています');
    }
    // トランザクションキー発行
    const transactionkey: string = await pubCrypto.random(8);
    // 対象データ
    const userCountArgs: countargs = {
      table: 'ebisudouser', // 注文
      columns: ['customerno', 'usable'], // カラム
      values: [[customerNo], [1]] // 値
    };
    // 顧客情報抽出
    const tmpUserCount: number = await myDB.countDB(userCountArgs);
    // エラー
    if (tmpUserCount == 0) {
      // DB検索エラー（顧客情報）
      throw new Error('顧客情報検索エラー');
    } else {
      logger.debug('sql: user select success');
    }
    // 0埋め顧客番号
    const zeropadCustomerNo: string = String(customerNo).padStart(7, '0');
    // 注文ID
    const gmoOrderID: string = `EB${zeropadCustomerNo}-${transactionkey}`;
    // 最終URL
    const finalUrl: string = await publishPayUrl(
      gmoShopid, // ショップID
      gmoShoppass, // ショップパスワード
      gmoConfigid, // 設定ID
      gmoOrderID, // 注文ID
      String(totalPriceStr), // 合計
      '0', // 税
      String(customerNo) // 顧客番号
    );
    // 暗号化URL
    const cipherUrl: any = await pubCrypto.encrypt(finalUrl)!;
    // 暗号化顧客名
    const cipherName: any = await pubCrypto.encrypt(tmpCustomername)!;
    // 現在の時刻
    const date: string = String(Date.now());
    // 暗号化済みURL
    const base64EncodeUrl: any = URLSafeBase64.encode(cipherUrl.encrypted);
    // デコード後文字列
    const decodedUrl: string = base64EncodeUrl.toString('utf8');
    // 暗号化済みURL
    const base64EncodeName: any = URLSafeBase64.encode(cipherName.encrypted);
    // デコード後文字列
    const decodedName: string = base64EncodeName.toString('utf8');
    // 送付用
    const finalPubQueryUrl: string = `${globalServerUrl}/card?key=${tmpKey}&token=${decodedUrl}&user=${decodedName}&total=${totalPriceStr}&date=${date}`;
    // URLパラメータ
    const urlParam: any = {
      url: finalPubQueryUrl
    };
    // 短縮URL生成
    const shortUrl: string = await httpsPost(
      `${globalShortenUrl}/create`, // URL
      JSON.stringify(urlParam), // 送信データ
      3 // 短縮URLモード
    );
    // 送付成功
    if (shortUrl == 'error') {
      throw new Error('短縮URL送付エラー');
    }
    // iv送付用
    const ivParam: any = {
      key: tmpKey, // ivキー
      urlIv: cipherUrl.iv, // url用iv
      nameIv: cipherName.iv //  店舗名用iv
    };
    // iv送付用
    const ivSended: string = await httpsPost(
      `${globalServerUrl}/iv`, // URL
      JSON.stringify(ivParam), // 送信データ
      4 // iv送付モード
    );
    // 送付成功
    if (ivSended != 'success') {
      throw new Error('暗号化IV送付エラー');
    }

    // 対象データ
    const insertTransArgs: insertargs = {
      table: 'transaction', // 注文
      columns: [
        'customerno', // 顧客番号
        'transactionkey', // トランザクションキー
        'totalprice', // 合計
        'settlementurl', // 最終URL
        'orderid', // オーダーID
        'shorturl', // 短縮URL
        'paid', // 支払フラグ
        'usable' // 使用可能
      ],
      values: [
        String(customerNo), // 顧客番号
        transactionkey, // トランザクションキー
        Number(totalPriceStr), // 合計
        finalPubQueryUrl, // 最終URL
        gmoOrderID, // オーダーID
        shortUrl, // 短縮URL
        '0', // 支払フラグ
        1 // 使用可能
      ]
    };
    // トランザクションDB格納
    const tmpReg: any = await myDB.insertDB(insertTransArgs);

    // エラー
    if (tmpReg === 'error' || tmpReg === 'empty') {
      // DB追加エラー（トランザクション）
      throw new Error('注文追加エラー');
    } else {
      logger.info(
        `initial insertion to transaction completed for No:${customerNo}.`
      );
    }
    // URL返し
    event.sender.send(
      'payment_publish_finish',
      `${globalShortenUrl}/${shortUrl}`
    );
    // メッセージ表示
    dialogMaker.showmessage('info', '発行が完了しました');
    logger.info('ipc: publish mode finished');
  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // メッセージ表示
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

// URL発行画面（編集）
ipcMain.on('edit', async (event: any, arg: any) => {
  try {
    logger.info('ipc: edit mode started');

    // 暗号化インスタンス
    const editCrypto: Crypto = new Crypto(logger, cryptoKey);
    // 一時キー
    const tmpKey: string = await editCrypto.random(10);
    // 顧客番号
    const customerNo: number = Number(arg);

    // 顧客番号無し
    if (isNaN(customerNo)) {
      // 顧客番号無しエラー
      throw new Error('顧客番号なし');
    }
    // 対象データ
    const userSelectArgs: selectargs = {
      table: 'ebisudouser', // ユーザ
      columns: ['customerno', 'usable'], // カラム
      values: [[customerNo], [1]] // 値
    };
    // 顧客番号抽出
    const customerNoData: any = await myDB.selectDB(userSelectArgs);

    // エラー
    if (customerNoData === 'error') {
      // 顧客番号なし
      throw new Error('顧客番号なし');
    } else if (customerNoData === 'empty') {
      // 顧客検索エラー
      throw new Error('顧客番号検索エラー');
    } else {
      logger.info(`ebisudouser selection completed for No:${customerNo}.`);
    }
    // 編集キー発行
    const editkey: string = await editCrypto.random(8);
    // 設定ID
    const configurationID: string = gmoConfigid;
    // ショップID
    const gmoShopID: string = gmoShopid;
    // ショップパスワード
    const shopPassword: string = gmoShoppass;

    // 最終URL
    const finalUrl: string = await publishEditUrl(
      gmoShopID, // ショップID
      shopPassword, // ショップパスワード
      configurationID, // 設定ID
      String(customerNo), // 顧客番号
      editkey // 編集キー
    );
    // 暗号化URL
    const cipherUrl: any = await editCrypto.encrypt(finalUrl)!;
    // 暗号化顧客名
    const cipherName: any = await editCrypto.encrypt(
      customerNoData[0].ebisuusername
    )!;
    // 現在の時刻
    const date: string = String(Date.now());
    // 暗号化済みURL
    const base64EncodeUrl: any = URLSafeBase64.encode(cipherUrl.encrypted);
    // デコード後文字列
    const decodedUrl: string = base64EncodeUrl.toString('utf8');
    // 暗号化済みURL
    const base64EncodeName: any = URLSafeBase64.encode(cipherName.encrypted);
    // デコード後文字列
    const decodedName: string = base64EncodeName.toString('utf8');
    // 送付用URL
    const finalEditQueryUrl: string = `${globalServerUrl}/edit?key=${tmpKey}&token=${decodedUrl}&user=${decodedName}&date=${date}`;
    // URL
    const urlParam: any = {
      url: finalEditQueryUrl // 送付用URL
    };
    // 短縮URL生成
    const shortUrl: string = await httpsPost(
      `${globalShortenUrl}/create`, // 送付用URL
      JSON.stringify(urlParam), // 送付データ
      3 // 短縮URL生成
    );
    // 送付成功
    if (shortUrl == 'error') {
      throw new Error('短縮URL送付エラー');
    }
    // iv送付用
    const ivParam: any = {
      key: tmpKey, // ivキー
      urlIv: cipherUrl.iv, // URL用iv
      nameIv: cipherName.iv // 店舗名用iv
    };
    // iv送付用
    const ivSended: string = await httpsPost(
      `${globalServerUrl}/iv`, // URL用iv
      JSON.stringify(ivParam), // 送付データ
      4 // iv送付
    );
    // 送付成功
    if (ivSended != 'success') {
      throw new Error('暗号化IV送付エラー');
    }
    // URL返し
    event.sender.send('edit_publish_finish', `${globalShortenUrl}/${shortUrl}`);
    // メッセージ表示
    dialogMaker.showmessage('info', '発行が完了しました');
    logger.info('ipc: edit mode finished');

  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // メッセージ表示
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

// 顧客名検索（登録・編集URL発行）
ipcMain.on('searchshop', async (event: any, arg: any) => {
  try {
    logger.info('ipc: search shop mode started');
    // 顧客番号
    const customerNo: number = Number(arg);
    // 顧客番号無し
    if (isNaN(customerNo)) {
      throw new Error('顧客番号に数字以外が含まれています');
    }
    // 対象データ
    const userSelectArgs: selectargs = {
      table: 'ebisudouser', // ユーザ
      columns: ['customerno', 'usable'], // カラム
      values: [[customerNo], [1]] // 値
    };
    // 顧客番号抽出
    const customerNoData: any = await myDB.selectDB(userSelectArgs);
    // エラー
    if (customerNoData === 'error') {
      // 顧客検索エラー
      throw new Error('顧客番号検索エラー');
    } else if (customerNoData === 'empty') {
      // 顧客番号なし
      throw new Error('該当する顧客番号がありません');
    } else {
      logger.info(`ebisudouser selection completed for No:${customerNo}.`);
    }
    // 店舗名返し
    event.sender.send('search_finish', customerNoData[0].ebisuusername);
    logger.info('ipc: search shop mode finished');

  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

// 注文ID検索
ipcMain.on('searchorderid', async (event: any, arg: any) => {
  try {
    logger.info('ipc: search orderid mode started');
    // 注文ID
    const orderid: number = Number(arg);
    // 注文ID無し
    if (isNaN(orderid)) {
      throw new Error('注文IDなし');
    }
    // 選択対象
    const priceSelectjoinArgs: joinargs = {
      table: 'transaction', // 注文
      columns: ['id', 'usable'], // 更新カラム
      values: [[orderid], [1]], // 更新値
      originid: 'customerno', // ID
      jointable: 'ebisudouser', // 連結テーブル
      joincolumns: ['usable'], // 連結カラム
      joinvalues: [[1]], // 連結値
      joinid: 'customerno', // 連結カラム
    };
    // 注文金額抽出
    const priceData: any = await myDB.selectJoinDB(priceSelectjoinArgs);

    // エラー
    if (priceData === 'error') {
      // 注文検索エラー
      throw new Error('注文検索エラー');
    } else if (priceData === 'empty') {
      // 注文IDなし
      throw new Error('対象の注文IDが存在しません');
    } else {
      logger.info(`transaction orderid completed for No:${orderid}.`);
    }
    // 金額返し
    event.sender.send('orderid_finish', {
      shopname: priceData[0].ebisuusername, // 店舗名
      price: priceData[0].totalprice // 価格
    });
    logger.info('ipc: search orderid mode finished');

  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

// 金額更新
ipcMain.on('changeprice', async (event: any, arg: any) => {
  try {
    // モード
    logger.info('ipc: change price mode started');
    // 注文ID
    const orderid: number = Number(arg.id);
    // カンマ無し価格
    const totalPrice: number = removeComma(String(arg.price));

    // 注文ID無し
    if (isNaN(orderid)) {
      throw new Error('注文IDなし');
    }
    // 変更金額無し
    if (isNaN(Number(totalPrice))) {
      throw new Error('変更金額なし');
    }

    // アップデート結果
    const uploadTransArgs: updateargs = {
      table: 'transaction', // 注文
      setcol: ['totalprice'], // 合計
      setval: [totalPrice], // 合計金額
      selcol: ['id'], // ID
      selval: [orderid] // ID値
    };
    // アップデート
    const transactionDel: any = await myDB.updateDB(uploadTransArgs);

    // エラーなし
    if (transactionDel == 'error' || transactionDel == 'empty') {
      // 完了メッセージ
      throw new Error('注文更新エラー');
    } else {
      // 完了メッセージ
      dialogMaker.showmessage('info', '編集が完了しました');
      // 変更
      event.sender.send('price_edit_finish', '');
      logger.info('ipc: change price mode finished');
    }
  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

/* 履歴関係 */
// URL再表示ボタン（履歴）
ipcMain.on('showurl', async (event: any, arg: any) => {
  try {
    logger.info('ipc: showurl mode started');
    // 対象データ
    const transSelectArgs: selectargs = {
      table: 'transaction', // 注文
      columns: ['id', 'usable'], // カラム
      values: [[Number(arg)], [1]] // 値
    };
    // url取得
    const urlData: any = await myDB.selectDB(transSelectArgs);

    // エラー
    if (urlData === 'error') {
      // 注文検索エラー
      throw new Error('該当する注文IDがありません');
    } else if (urlData === 'empty') {
      // 注文IDなし
      throw new Error('注文IDなし');
    } else {
      // 送信
      event.sender.send(
        'showurl', // 短縮URL
        `${globalShortenUrl}/${urlData[0].shorturl}` // URL
      );
      // クリップボード
      dialogMaker.showmessage('info', 'URLをクリップボードにコピーしました');
    }
  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

// 履歴検索
ipcMain.on('searchhistory', async (event: any, arg: any) => {
  try {
    logger.info('ipc: search history mode started');
    // 顧客番号
    const customerNo: number = Number(arg.customeno);
    // 編集フラグ
    const editFlg: boolean = arg.editflg;

    // 顧客番号無し
    if (isNaN(customerNo)) {
      // 顧客番号なし
      throw new Error('顧客番号なし');
    }

    // 送信用
    const resultArray: any = await gethistory(
      GLOBALMODE.normal, // ノーマルモード
      0, // オフセット
      globalPageCount, // 上限
      true, // 検索フラグ
      editFlg, // 編集フラグ
      customerNo // 顧客番号
    );

    // 履歴オブジェクト
    const historyObj: historyObj = {
      start: 1, // 開始位置
      total: resultArray.total, // データ総数
      result: resultArray.result, // データ
      mode: GLOBALMODE.normal, // モード
      searchflg: true, // 検索フラグ
      editflg: editFlg, // 編集フラグ
      customerno: customerNo // 顧客番号
    };
    // 送信
    event.sender.send('history_finish', historyObj);
    logger.info('ipc: search history mode finished');

  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

// 履歴変更
ipcMain.on('changehistory', async (event: any, arg: any) => {
  try {
    logger.info('ipc: change history mode started');
    // 開始位置
    let startPosition: number;
    // 受領データ
    const page: number = arg.page; // 件数
    const mode: string = arg.mode; // モード
    const customerno: any = arg.customerno; // 顧客番号
    const direction: string = arg.direction; // 方向
    const searchflg: boolean = arg.searchflg; // 検索フラグ
    const editflg: boolean = arg.editflg; // 編集フラグ

    // 進行方向
    if (direction == 'prev') {
      // 前へ
      startPosition = page - globalPageCount + 1;
    } else if (direction == 'forward') {
      // 次へ
      startPosition = globalPageCount + page + 1;
    } else {
      // 開始地点
      startPosition = 1;
    }

    // 履歴取得
    const resultArray: any = await gethistory(
      mode, // ノーマルモード
      page, // オフセット
      globalPageCount, // 上限
      searchflg, // 検索フラグ
      editflg, // 編集フラグ
      customerno // 顧客番号
    );

    // 送信
    event.sender.send('history_finish', {
      start: startPosition, // 開始位置
      total: resultArray.total, // 合計金額
      result: resultArray.result, // 結果
      mode: mode, // モード
      customerno: customerno, // 顧客番号
      searchflg: searchflg, // 検索フラグ
      editflg: editflg // 編集フラグ
    });
    logger.info('ipc: delete history mode finished');

  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

// 履歴編集
ipcMain.on('deletehistory', async (event: any, arg: any) => {
  try {
    logger.info('ipc: delete history mode');

    // データなしの場合戻る
    if (arg == 'none') {
      return false;
    } else {
      // selected number
      const selected: number = dialogMaker.showQuetion(
        '質問',
        '履歴削除',
        '本当に削除してよろしいですか？'
      );
      // はいを選択
      if (selected == 0) {
        // アップデート処理
        arg.forEach(async (id: any) => {
          // 対象データ
          const transCountArgs: countargs = {
            table: 'transaction', // 注文
            columns: ['id', 'usable'], // カラム
            values: [[Number(id)], [1]], // 値
            spanval: globalPageCount // 範囲日数
          };
          // 対象データ取得
          const targetDataCount: number = await myDB.countDB(transCountArgs);

          // エラー
          if (targetDataCount === 0) {
            // トランザクション検索エラー
            throw new Error('注文カウントエラー');
          } else {
            // アップデート結果
            const uploadTransArgs: updateargs = {
              table: 'transaction', // 注文
              setcol: ['usable'], // 使用可能
              setval: ['0'], // 使用不可
              selcol: ['id'], // ID
              selval: [id] // ID値
            };
            // アップデート
            const transactionDel: any = await myDB.updateDB(uploadTransArgs);

            // エラーなし
            if (transactionDel === 'error') {
              // トランザクション検索エラー
              throw new Error('注文更新エラー');
            }
          }
        });
        // 完了メッセージ
        dialogMaker.showmessage('info', '編集が完了しました');
        // 店舗名返し
        event.sender.send('history_edit_finish', '');
      } else {
        return false;
      }
    }
  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

/* ユーザ登録関係 */
// ユーザ登録
ipcMain.on('reguser', async (event: any, arg: any) => {
  try {
    logger.info('ipc: ebisdouser reg mode');

    // 受領データ
    const customerno: number = Number(arg.customerno); // 顧客番号
    const customername: string = arg.customername; // 顧客名

    // 対象データ
    const userSelectArgs: selectargs = {
      table: 'ebisudouser',
      columns: ['customerno'],
      values: [[customerno]]
    };

    // 顧客情報抽出
    const tmpUserData: any = await myDB.selectDB(userSelectArgs);

    // エラーの場合新規登録
    if (tmpUserData === 'error') {
      // トランザクション検索エラー
      throw new Error('ユーザ更新エラー');
    } else if (tmpUserData === 'empty') {
      logger.info('new reg mode');
      // 対象データ
      const userArgs: insertargs = {
        table: 'ebisudouser', // ユーザ
        columns: [
          'ebisuusername', // 顧客名
          'customerno', // 顧客番号
          'usable' // 使用可能
        ],
        values: [customername, customerno, 1]
      };
      // トランザクションDB格納
      const tmpReg: any = await myDB.insertDB(userArgs);

      // エラー
      if (tmpReg === 'error' || tmpReg === 'empty') {
        throw new Error('顧客追加エラー');
      } else {
        logger.info(
          `initial insertion to ebisudouser completed for ${customername}.`
        );
        // メッセージ表示
        dialogMaker.showmessage('info', '登録が完了しました');
        // 送信
        event.sender.send('userreg_finish', '');
      }
    } else {
      // 使用不可状態
      if (tmpUserData[0].usable == 0) {
        logger.info('update reg mode');
        // アップデート結果
        const updateUserArgs: updateargs = {
          table: 'ebisudouser', // ユーザ
          setcol: ['usable'], // 使用可能
          setval: [1],
          selcol: ['customerno'], // 顧客番号
          selval: [tmpUserData[0].customerno]
        };
        // アップデート
        const customerDel: any = await myDB.updateDB(updateUserArgs);
        // エラー
        if (customerDel === 'error' || customerDel === 'empty') {
          // 顧客更新エラー
          throw new Error('顧客更新エラー');
        } else {
          // メッセージ表示
          dialogMaker.showmessage('info', '登録が完了しました');
          // 送信
          event.sender.send('userreg_finish', '');
        }
      } else {
        logger.info('already registered');
        // メッセージ表示
        dialogMaker.showmessage('info', 'すでに登録されています');
      }
    }
  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

// ユーザ編集
ipcMain.on('edituser', async (event: any, arg: any) => {
  try {
    logger.info('ipc: ebisdouser edit mode');

    // 受領データ
    const customerno: number = Number(arg.customerno); // 顧客番号
    const newcustomername: string = arg.newcustomername; // 新顧客名

    // アップデート結果
    const uploadTransArgs: updateargs = {
      table: 'ebisudouser', // ユーザ
      setcol: ['ebisuusername'], // 合計
      setval: [newcustomername], // 合計金額
      selcol: ['customerno', 'usable'], // ID
      selval: [customerno, 1] // ID値
    };
    // アップデート
    const customerDel: any = await myDB.updateDB(uploadTransArgs);
    // エラー
    if (customerDel === 'error' || customerDel === 'empty') {
      // 顧客更新エラー
      throw new Error('顧客更新エラー');
    } else {
      // メッセージ表示
      dialogMaker.showmessage('info', '変更が完了しました');
      // 送信
      event.sender.send('useredit_finish', '');
    }
  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

// エラー
ipcMain.on('error', async (_: any, arg: any) => {
  logger.info('ipc: error mode');
  // エラー型
  dialogMaker.showmessage('error', `${arg})`);
});

// メッセージ表示
ipcMain.on('showmessage', (_: any, arg: any) => {
  try {
    logger.info('ipc: showmessage mode');
    // メッセージ表示
    dialogMaker.showmessage(arg.type, arg.message);
  } catch (e) {
    // エラー
    logger.error(e);
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
});

/* 処理 */
// URL発行
const publishPayUrl = (
  shopid: string,
  shoppass: string,
  confid: string,
  orderid: string,
  amount: string,
  tax: string,
  customerno: string
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('publishPayUrl started');
      // 送付JSON
      const param: any = {
        geturlparam: {
          ShopID: shopid, // ショップID
          ShopPass: shoppass // ショップパスワード
        },
        configid: confid, // 設定ID
        transaction: {
          OrderID: orderid, // 注文ID
          Amount: amount, // 利用金額
          Tax: tax, // 税送料
          RetUrl: `${globalServerUrl}/cancel`, // 戻り先URL
          CompleteUrl: `${globalServerUrl}/complete`, // 完了時戻り先URL
          NotifyMailaddress: process.env.GMO_MAILADDRESS, // 決済完了通知先メールアドレス
          ExpireDays: '7', // 取引有効日数
          ResultSkipFlag: '1' // 結果画面スキップフラグ
        },
        credit: {
          JobCd: myVal.PAYSTATUS, // 決済モード
          TdFlag: '2', // 本人認証サービス利用フラグ
          MemberID: customerno, // 顧客番号
          SecCodeRequiredFlag: '1', // セキュリティコード必須フラグ
          Tds2Type: '1', // 3DS2.0未対応時取り扱い
          RegistMemberID: customerno, // 登録用顧客番号
          CardMaxCnt: '5', // 最大カード登録枚数
          Tds2InputShowFlag: '1' // セキュリティ項目入力表示
        }
      };

      // 送信
      const paymentUrl: string = await httpsPost(
        gmoPayRequestUrl,
        JSON.stringify(param),
        1
      );

      // エラーでなければ
      if (paymentUrl != 'error') {
        // 値返し
        resolve(paymentUrl);
        logger.debug('publishPayUrl finished');
      } else {
        // HTTP通信エラー（支払URL取得）
        throw new Error('HTTP通信エラー（支払URL取得）');
      }
    } catch (e) {
      // エラー
      logger.error(e);
      // エラー型
      if (e instanceof Error) {
        // エラー処理
        dialogMaker.showmessage('error', `${e.message}`);
      }
      reject('publishPayUrl error');
    }
  });
};

// URL発行
const publishEditUrl = (
  shopid: string,
  shoppass: string,
  confid: string,
  customerNo: string,
  editkey: string
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('publishEditUrl started');
      // 送付JSON
      const param: any = {
        // URL発行情報
        configid: confid, // 設定ID
        geturlparam: {
          ShopID: shopid, // ショップID
          ShopPass: shoppass // ショップパスワード
        },
        member: {
          MemberID: customerNo, // 会員ID
          Cardeditno: editkey // カード編集番号
        }
      };
      // 決済チェック
      const editUrl: string = await httpsPost(
        gmoEditRequestUrl,
        JSON.stringify(param),
        1
      );
      // エラーでなければ
      if (editUrl != 'error') {
        // 値返し
        resolve(editUrl);
        logger.debug('publishEditUrl finished');
      } else {
        // HTTP通信エラー（編集URL取得）
        throw new Error('HTTP通信エラー（編集URL取得）');
      }
    } catch (e) {
      // エラー
      logger.error(e);
      // エラー型
      if (e instanceof Error) {
        // エラー処理
        dialogMaker.showmessage('error', `${e.message}`);
      }
      reject('publishEditUrl error');
    }
  });
};

// 履歴取得
const gethistory = async (
  mode: string, // ノーマルモード
  offset: number, // オフセット
  limit: number, // 上限
  searchflg: boolean = false, // 検索フラグ
  editflg: boolean = false, // 編集フラグ
  customerno: any // 顧客番号
): Promise<any> => {
  return new Promise(async (resolve1, reject1) => {
    try {
      logger.debug('gethistory started');
      // カウント数
      let ebisudoUserCount: number;
      // 検索カラム
      let searchColumns: string[];
      // 検索値
      let searchValues: any[];
      // 選択対象
      let userSelectjoinArgs: joinargs;
      // 履歴情報
      let ebisudoUserData: any;

      // 検索モード
      if (searchflg) {
        // 検索カラム
        searchColumns = ['customerno', 'usable'];
        // 検索値
        searchValues = [[customerno], [1]];
      } else {
        // 検索カラム
        searchColumns = ['usable'];
        // 検索値
        searchValues = [[1]];
      }

      // 全体検索
      if (mode == GLOBALMODE.all) {
        // カウント対象
        const allcountargs: countjoinargs = {
          table: 'ebisudouser', // ユーザ
          columns: searchColumns, // カラム
          values: searchValues, // 値
          jointable: 'transaction', // 注文
          joincolumns: ['usable'], // 使用可能
          joinvalues: [[1]], // 使用可能
          joinid1: 'customerno', // 顧客番号
          joinid2: 'customerno' // 顧客番号
        };

        // 対象件数
        ebisudoUserCount = await myDB.countJoinDB(allcountargs);

      } else {
        // カウント対象
        const usercountargs: countjoinargs = {
          table: 'ebisudouser', // ユーザ
          columns: searchColumns, // カラム
          values: searchValues, // 値
          jointable: 'transaction', // 注文
          joincolumns: ['usable'], // 使用可能
          joinvalues: [[1]], // 使用可能
          joinid1: 'customerno', // 顧客番号
          joinid2: 'customerno', // 顧客番号
          spantable: 'transaction', // 注文
          spanval: globalDateCount, // 範囲
          spandirection: 'after', // 最新
          spanunit: 'day' // 日
        };
        // 対象件数
        ebisudoUserCount = await myDB.countJoinDB(usercountargs);
      }

      // urlセット
      switch (mode) {
        // 全体モード
        case GLOBALMODE.all:
          // 選択対象
          userSelectjoinArgs = {
            table: 'ebisudouser', // ユーザ
            columns: searchColumns, // カラム
            values: searchValues, // 値
            originid: 'customerno', // 顧客番号
            jointable: 'transaction', // 注文
            joincolumns: ['usable'], // 使用可能
            joinvalues: [[1]], // 使用可能
            joinid: 'customerno', // 顧客番号
            ordertable: 'transaction', // 注文
            order: 'id', // 並び替えカラム
            limit: limit, // 制限
            offset: offset // オフセット
          };
          // 結果
          ebisudoUserData = await myDB.selectJoinDB(userSelectjoinArgs);
          break;

        // 通常モード
        case GLOBALMODE.normal:
          // 選択対象
          userSelectjoinArgs = {
            table: 'ebisudouser', // ユーザ
            columns: searchColumns, // カラム
            values: searchValues, // 値
            originid: 'customerno', // 顧客番号
            jointable: 'transaction', // 注文
            joincolumns: ['usable'], // 使用可能
            joinvalues: [[1]], // 使用可能
            joinid: 'customerno', // 顧客番号
            ordertable: 'transaction', // 注文
            order: 'id', // 並び替えカラム
            limit: limit, // 制限
            offset: offset, // オフセット
            spantable: 'transaction', // 注文
            spanval: globalDateCount, // 範囲
            spandirection: 'after', // 最新
            spanunit: 'day', // 日
            reverse: false // 反転
          };
          // 結果
          ebisudoUserData = await myDB.selectJoinDB(userSelectjoinArgs);
          break;

        // 支払済モード
        case GLOBALMODE.paid:
          // 選択対象
          userSelectjoinArgs = {
            table: 'ebisudouser', // ユーザ
            columns: searchColumns, // カラム
            values: searchValues, // 値
            originid: 'customerno', // 顧客番号
            jointable: 'transaction', // 注文
            joincolumns: ['paid', 'usable'], // 使用可能
            joinvalues: [[1], [1]], // 使用可能
            joinid: 'customerno', // 顧客番号
            ordertable: 'transaction', // 注文
            order: 'id', // 並び替えカラム
            limit: limit, // 制限
            offset: offset, // オフセット
            spantable: 'transaction', // 注文
            spanval: globalDateCount, // 範囲
            spandirection: 'after', // 最新
            spanunit: 'day', // 日
            reverse: false // 反転
          };
          // 結果
          ebisudoUserData = await myDB.selectJoinDB(userSelectjoinArgs);
          break;

        // 未払いモード
        case GLOBALMODE.nopaid:
          // 選択対象
          userSelectjoinArgs = {
            table: 'ebisudouser', // ユーザ
            columns: searchColumns, // カラム
            values: searchValues, // 値
            originid: 'customerno', // 顧客番号
            jointable: 'transaction', // 注文
            joincolumns: ['paid', 'usable'], // 使用可能
            joinvalues: [[0], [1]], // 使用可能
            joinid: 'customerno', // 顧客番号
            ordertable: 'transaction', // 注文
            order: 'id', // 並び替えカラム
            limit: limit, // 制限
            offset: offset, // オフセット
            spantable: 'transaction', // 注文
            spanval: globalDateCount, // 範囲
            spandirection: 'after', // 最新
            spanunit: 'day', // 日
            reverse: false // 反転
          };
          // 結果
          ebisudoUserData = await myDB.selectJoinDB(userSelectjoinArgs);
          break;

        // 保留中モード
        case GLOBALMODE.pending:
          // 選択対象
          userSelectjoinArgs = {
            table: 'ebisudouser', // ユーザ
            columns: searchColumns, // カラム
            values: searchValues, // 値
            originid: 'customerno', // 顧客番号
            jointable: 'transaction', // 注文
            joincolumns: ['status', 'usable'], // 使用可能
            joinvalues: [['AUTHENTICATED', 'VOID', 'ERROR'], [1]], // 使用可能
            joinid: 'customerno', // 顧客番号
            ordertable: 'transaction', // 注文
            order: 'id', // 並び替えカラム
            limit: limit, // 制限
            offset: offset, // オフセット
            spantable: 'transaction', // 注文
            spanval: 7, // 範囲
            spandirection: 'after', // 最新
            spanunit: 'day', // 日
            reverse: false // 反転
          };
          // 結果
          ebisudoUserData = await myDB.selectJoinDB(userSelectjoinArgs);
          break;

        // それ以外
        default:
          // 結果
          ebisudoUserData = 'error';
          // 対象件数
          ebisudoUserCount = 0;
          break;
      }

      // エラー
      if (ebisudoUserData == 'error' || ebisudoUserData == 'empty') {
        // 編集モード
        if (editflg) {
          // 戻り値
          resolve1({
            result: [
              {
                id: 0, // 注文ID
                customerno: 0, // 顧客番号
                shopname: '', // ユーザ名
                total: 0, // 合計金額
                payment: '', // 支払済
                status: '', // 支払ステータス
                publishdate: '', // URL発行日時
                updatedate: '', // 更新日時
                orderid: '', // オーダーID
                delete: '' // 削除
              }
            ],
            total: 0 // トータルページ数
          });
        } else {
          // 戻り値
          resolve1({
            result: [
              {
                id: 0, // 注文ID
                copy: 0, // URLコピー
                customerno: 0, // 顧客番号
                shopname: '', // ユーザ名
                total: 0, // 合計金額
                payment: '', // 支払済
                status: '', // 支払ステータス
                publishdate: '', // URL発行日時
                updatedate: '', // 更新日時
                orderid: '' // オーダーID
              }
            ],
            total: 0 // トータルページ数
          });
        }
      } else {
        // ループして配列格納
        const historyOptions: any = await Promise.all(
          ebisudoUserData.map((trans: any): Promise<historyargs> => {
            return new Promise((resolve2, _) => {
              // エラーコード
              let finalErrorCode: string = trans.errcode ?? "";
              // ステータス
              let finalStatusCode: string = String(getStatusCode(trans.status ?? 'null') ?? finalErrorCode);

              // 編集モード
              if (editflg) {
                // 履歴
                resolve2({
                  id: trans.id, // 注文ID
                  customerno: trans.customerno, // 顧客番号
                  shopname: trans.ebisuusername, // ユーザ名
                  total: trans.totalprice, // 合計金額
                  payment: String(trans.paid), // 支払済
                  status: finalStatusCode, // 支払ステータス
                  publishdate: trans.created_at
                    .toLocaleString({ timeZone: 'Asia/Tokyo' })
                    .slice(0, 19)
                    .replace('T', ' '), // URL発行日時
                  updatedate: trans.updated_at
                    .toLocaleString({ timeZone: 'Asia/Tokyo' })
                    .slice(0, 19)
                    .replace('T', ' '), // 更新日時
                  orderid: trans.orderid, // オーダーID
                  delete: '' // 削除
                });
              } else {
                // 履歴
                resolve2({
                  id: trans.id, // 注文ID
                  copy: trans.id, // URLコピー
                  customerno: trans.customerno, // 顧客番号
                  shopname: trans.ebisuusername, // ユーザ名
                  total: trans.totalprice, // 合計金額
                  payment: String(trans.paid), // 支払済
                  status: finalStatusCode, // 支払ステータス
                  publishdate: trans.created_at
                    .toLocaleString({ timeZone: 'Asia/Tokyo' })
                    .slice(0, 19)
                    .replace('T', ' '), // URL発行日時
                  updatedate: trans.updated_at
                    .toLocaleString({ timeZone: 'Asia/Tokyo' })
                    .slice(0, 19)
                    .replace('T', ' '), // 更新日時
                  orderid: trans.orderid // オーダーID
                });
              }
            });
          })
        );
        // 戻り値
        resolve1({
          result: historyOptions, // 受け渡しデータ
          total: ebisudoUserCount // 件数
        });
        logger.debug('gethistory finished');
      }
    } catch (e) {
      // エラー
      logger.error(e);
      // エラー型
      if (e instanceof Error) {
        // エラー処理
        dialogMaker.showmessage('error', `${e.message}`);
      }
      reject1('gethistory error');
    }
  });
};

/* 汎用関数 */
// 履歴取得
const getHistoryData = async (
  mode: string,
  editflg: boolean
): Promise<historyObj> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('getHistoryData started');
      // 送信用
      const resultArray: any = await gethistory(
        mode, // ノーマルモード
        0, // オフセット
        globalPageCount, // 上限
        false, // 検索フラグ
        editflg, // 編集フラグ
        null
      );
      // 履歴オブジェクト
      const historyObj: historyObj = {
        start: 1, // 開始位置
        total: resultArray.total, // データ総数
        result: resultArray.result, // データ
        mode: GLOBALMODE.normal, // モード
        searchflg: false, // 検索フラグ
        editflg: editflg // 編集フラグ
      };
      // 送信
      resolve(historyObj);
      logger.debug('getHistoryData finished');
    } catch (e) {
      // エラー
      logger.error(e);
      // エラー型
      if (e instanceof Error) {
        // エラー処理
        dialogMaker.showmessage('error', `${e.message}`);
      }
      reject('getHistoryData error');
    }
  });
};

// post送信
const httpsPost = async (
  hostname: string,
  data: any,
  flg: number
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    logger.debug('httpsPost started');
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
        switch (flg) {
          case 1:
            // 対象データ
            targetData = response.data.LinkUrl;
            break;

          case 2:
            // 対象データ
            targetData = response.data.OrderID;
            break;

          case 3:
            // 対象データ
            targetData = response.data;
            break;

          case 4:
            // 対象データ
            targetData = 'success';
            break;

          default:
            logger.info(`Sorry, we are out of ${response}.`);
        }

        // 受信データ
        if (targetData != 'error') {
          // リンクURL返し
          resolve(targetData);
          logger.debug('httpsPost finished');
        } else {
          // エラー返し
          throw new Error('データが欠損しています。');
        }
      })
      .catch((err: unknown) => {
        // エラー
        logger.error(err);
        // エラー型
        if (err instanceof Error) {
          // エラー処理
          dialogMaker.showmessage('error', err.message);
        }
        reject('httpsPost error');
      });
  });
};

// remove comma
const removeComma = (number: string): number => {
  var removed = number.replace(/,/g, '');
  return parseInt(removed, 10);
};
