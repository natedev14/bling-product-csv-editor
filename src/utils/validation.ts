import { COLUMNS } from '@/constants';
import type { ProductRow, ValidationIssue } from '@/types';
import { isZeroBrazilianNumber } from '@/utils/numbers';

const ncmRegex = /^\d{4}\.\d{2}\.\d{2}$/;

export function validateRows(rows: ProductRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const codeMap = new Map<string, ProductRow[]>();

  for (const row of rows) {
    const code = row.data[COLUMNS.code]?.trim() ?? '';
    if (!code) continue;
    const codeRows = codeMap.get(code) ?? [];
    codeRows.push(row);
    codeMap.set(code, codeRows);
  }

  for (const [sku, skuRows] of codeMap.entries()) {
    if (skuRows.length > 1) {
      for (const row of skuRows) {
        issues.push({
          id: `duplicate-${row.id}`,
          rowId: row.id,
          code: 'SKU_DUPLICADO',
          severity: 'error',
          message: `SKU duplicado: ${sku}`,
        });
      }
    }
  }

  const parentCodes = new Set(
    rows
      .filter((row) => !(row.data[COLUMNS.parentCode] ?? '').trim())
      .map((row) => row.data[COLUMNS.code]?.trim() ?? '')
      .filter(Boolean),
  );

  for (const row of rows) {
    const parentCode = row.data[COLUMNS.parentCode]?.trim() ?? '';
    if (parentCode && !parentCodes.has(parentCode)) {
      issues.push({
        id: `missing-parent-${row.id}`,
        rowId: row.id,
        code: 'PAI_INEXISTENTE',
        severity: 'error',
        message: `Variación con Código Pai inexistente: ${parentCode}`,
      });
    }

    const ncm = row.data[COLUMNS.ncm]?.trim() ?? '';
    if (ncm && !ncmRegex.test(ncm)) {
      issues.push({
        id: `invalid-ncm-${row.id}`,
        rowId: row.id,
        code: 'NCM_INVALIDO',
        severity: 'error',
        message: `NCM inválido: ${ncm}. Formato esperado: 0000.00.00`,
      });
    }

    const status = row.data[COLUMNS.status]?.trim().toLowerCase() ?? '';
    if (status === 'ativo' && isZeroBrazilianNumber(row.data[COLUMNS.price])) {
      issues.push({
        id: `zero-price-${row.id}`,
        rowId: row.id,
        code: 'PRECO_ZERO_ATIVO',
        severity: 'warning',
        message: 'Produto activo con Preço en 0.',
      });
    }
  }

  return issues;
}

export function issuesByRowId(issues: ValidationIssue[]) {
  return issues.reduce<Record<string, ValidationIssue[]>>((acc, issue) => {
    acc[issue.rowId] = [...(acc[issue.rowId] ?? []), issue];
    return acc;
  }, {});
}
