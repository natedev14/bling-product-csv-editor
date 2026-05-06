import Papa from 'papaparse';
import { COLUMNS, REQUIRED_HEADERS } from '@/constants';
import type { CsvParseResult, CsvRow, ProductRow } from '@/types';

const stripBom = (value: string) => value.replace(/^\uFEFF/, '');

export const cleanCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/^\uFEFF/, '').replace(/\t/g, '');
};

const makeRowId = (row: CsvRow, index: number) => {
  const code = row[COLUMNS.code]?.trim() || 'sem-codigo';
  const parentCode = row[COLUMNS.parentCode]?.trim() || 'pai';
  return `${index}-${parentCode}-${code}`;
};

export function parseBlingCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      delimiter: ';',
      skipEmptyLines: true,
      header: false,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors.map((error) => error.message).join('\n')));
          return;
        }

        const rawRows = result.data.filter((row) => row.some((cell) => cleanCell(cell).trim() !== ''));
        if (rawRows.length === 0) {
          reject(new Error('El CSV está vacío.'));
          return;
        }

        const headers = rawRows[0].map((header, index) => (index === 0 ? stripBom(cleanCell(header)) : cleanCell(header)));
        const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
        if (missingHeaders.length > 0) {
          reject(new Error(`Faltan columnas obligatorias: ${missingHeaders.join(', ')}`));
          return;
        }

        const rows: ProductRow[] = rawRows.slice(1).map((rawRow, index) => {
          const data = headers.reduce<CsvRow>((acc, header, columnIndex) => {
            acc[header] = cleanCell(rawRow[columnIndex] ?? '');
            return acc;
          }, {});

          return {
            id: makeRowId(data, index),
            originalIndex: index,
            data,
            originalData: { ...data },
          };
        });

        resolve({ headers, rows });
      },
      error: (error) => reject(error),
    });
  });
}

export function exportBlingCsv(headers: string[], rows: ProductRow[]) {
  const data = rows
    .slice()
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map((row) => headers.map((header) => row.data[header] ?? ''));

  return `\uFEFF${Papa.unparse(
    {
      fields: headers,
      data,
    },
    {
      delimiter: ';',
      quotes: true,
      newline: '\r\n',
    },
  )}`;
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getExportFilename(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `produtos_${yyyy}-${mm}-${dd}.csv`;
}
