export type CsvRow = Record<string, string>;

export type ProductRow = {
  id: string;
  originalIndex: number;
  data: CsvRow;
  originalData: CsvRow;
};

export type ProductNode = {
  parent: ProductRow;
  children: ProductRow[];
};

export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssue = {
  id: string;
  rowId: string;
  code: string;
  message: string;
  severity: ValidationSeverity;
};

export type CsvParseResult = {
  headers: string[];
  rows: ProductRow[];
};
