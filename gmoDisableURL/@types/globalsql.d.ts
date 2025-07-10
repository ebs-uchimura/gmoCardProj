/**
 * globalsql.d.ts
 **
 * function：global sql type
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
