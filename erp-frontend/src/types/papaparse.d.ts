declare module 'papaparse' {
  interface ParseResult<T = any> {
    data: T[];
    errors: any[];
    meta: any;
  }

  interface ParseConfig<T = any> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    transformHeader?: (header: string) => string;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult<T>, parser: any) => void;
    complete?: (results: ParseResult<T>, file?: File) => void;
    error?: (error: any, file?: File) => void;
    download?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    chunk?: (results: ParseResult<T>, parser: any) => void;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string | void;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => any;
  }

  interface UnparseConfig {
    quotes?: boolean | boolean[];
    quoteChar?: string;
    escapeChar?: string;
    delimiter?: string;
    header?: boolean;
    newline?: string;
    skipEmptyLines?: boolean | 'greedy';
    columns?: string[];
  }

  const Papa: {
    parse<T = any>(input: string | File, config?: ParseConfig<T>): ParseResult<T>;
    unparse(data: any[], config?: UnparseConfig): string;
    unparse(data: any[][], config?: UnparseConfig): string;
    unparse(data: { fields: string[]; data: any[][] }, config?: UnparseConfig): string;
  };

  export = Papa;
}
