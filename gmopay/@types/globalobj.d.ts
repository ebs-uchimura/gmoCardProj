/**
 * globalobjs.d.ts
 **
 * function：グローバル宣言
**/

export { };

declare global {
  // 履歴
  type historyargs = {
    id: string; // 注文ID
    customerno: string; // 顧客番号
    shopname: string; // ユーザ名
    total: string; // 合計金額
    payment: string; // 支払済
    status: string; // 支払ステータス
    publishdate: string; // URL発行日時
    updatedate: string; // 更新日時
    orderid: string; // オーダーID
    copy?: string; // 注文IDコピー
    delete?: string; // 削除
  };
  // 送付結果情報
  interface modeObj {
    all: string;
    normal: string;
    paid: string;
    nopaid: string;
    pending: string;
  }
  // 履歴情報
  interface historyObj {
    start: number;
    total: string;
    result: any;
    mode: string;
    searchflg: boolean;
    editflg: boolean;
    customerno?: number;
  }
  // 支払情報
  interface paymentObj {
    null: string;
    CAPTURE: string;
    UNPROSESSED: string;
    AUTHENTICATED: string;
    VOID: string;
    RETURN: string;
    RETURNX: string;
  }
}
