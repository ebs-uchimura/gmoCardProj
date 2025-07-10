/**
 * globaljoinsql.d.ts
 **
 * function：global joinsql type
**/

export { };

declare global {
  // count arguments
  interface countargs {
    table: string;
    columns: string[];
    values: any[][];
    spanval?: number;
    spancol?: string;
    spandirection?: string;
    spanunit?: string;
  }

  // count join arguments
  interface countjoinargs {
    table: string;
    columns: string[];
    values: any[][];
    jointable: string;
    joincolumns: string[];
    joinvalues: any[];
    joinid1: string;
    joinid2: string;
    spantable?: string;
    spanval?: number;
    spancol?: string;
    spandirection?: string;
    spanunit?: string;
  }

  // select arguments
  interface selectargs {
    table: string;
    columns: string[];
    values: any[][];
    limit?: number;
    offset?: number;
    spanval?: number;
    spancol?: string;
    spandirection?: string;
    spanunit?: string;
    order?: string;
    reverse?: boolean;
    fields?: string[];
  }

  // join & select arguments
  interface joinargs {
    table: string;
    columns: string[];
    values: any[][];
    originid: string;
    jointable: string;
    joincolumns: string[];
    joinvalues: any[][];
    joinid: string;
    limit?: number;
    offset?: number;
    spantable?: string;
    spanval?: number;
    spancol?: string;
    spandirection?: string;
    spanunit?: string;
    order?: string;
    ordertable?: string;
    reverse?: boolean;
    fields?: string[];
  }

  // join & select 3 arguments
  interface joindoubleargs {
    table: string;
    columns: string[];
    values: any[][];
    originid1: string;
    originid2: string;
    jointable1: string;
    jointable2: string;
    joincolumns1: string[];
    joincolumns2: string[];
    joinvalues1: any[][];
    joinvalues2: any[][];
    joinid1: string;
    joinid2: string;
    limit?: number;
    offset?: number;
    spantable?: string;
    spanval?: number;
    spancol?: string;
    spandirection?: string;
    spanunit?: string;
    order?: string;
    ordertable?: string;
    reverse?: boolean;
    fields?: string[];
  }

  // update arguments
  interface updateargs {
    table: string;
    setcol: string[];
    setval: any[];
    selcol: string[];
    selval: any[];
    spanval?: number;
    spancol?: string;
    spandirection?: string;
    spanunit?: string;
  }

  // join & update arguments
  interface updatejoinargs {
    table: string;
    setcol: string[];
    setval: any[];
    selcol: string[];
    selval: any[];
    jointable: string;
    joincolumns: string[];
    joinvalues: any[];
    joinid1: string;
    joinid2: string;
    spantable?: string;
    spanval?: number;
    spancol?: string;
    spandirection?: string;
    spanunit?: string;
  }

  // insert arguments
  interface insertargs {
    table: string;
    columns: string[];
    values: any[];
  }

  // insert arguments
  interface insertnodupargs {
    table: string;
    columns: string[];
    values: any[];
    selcol: string[];
    selval: any[];
  }
}
