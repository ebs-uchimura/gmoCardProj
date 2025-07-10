/**
 * globalinfo.ts
 **
 * function：global variables
**/

/** const */
export namespace myDev {
  // dev flg
  export const DEV_FLG: boolean = false;
  export const DATECOUNT: number = 21;
  export const SQL_PORT: number = 3306;
  export const TIMELIMIT: number = 1209600;
  export const PAYSTATUS: string = 'CAPTURE';
  export const PENDINGSTATUS: string = 'AUTHENTICATED'; // 保留中
  export const VOIDDSTATUS: string = 'VOID'; // 金額変更中
  export const LOG_LEVEL: string = 'all';
}