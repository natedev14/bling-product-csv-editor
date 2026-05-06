import { COLUMNS } from '@/constants';
import type { ProductNode, ProductRow } from '@/types';

export function isParentRow(row: ProductRow) {
  return (row.data[COLUMNS.parentCode] ?? '').trim() === '';
}

export function isChildRow(row: ProductRow) {
  return !isParentRow(row);
}

export function buildProductTree(rows: ProductRow[]): ProductNode[] {
  const childrenByParent = new Map<string, ProductRow[]>();
  const parents: ProductRow[] = [];

  for (const row of rows) {
    const parentCode = row.data[COLUMNS.parentCode]?.trim() ?? '';
    if (!parentCode) {
      parents.push(row);
    } else {
      const children = childrenByParent.get(parentCode) ?? [];
      children.push(row);
      childrenByParent.set(parentCode, children);
    }
  }

  return parents.map((parent) => ({
    parent,
    children: childrenByParent.get(parent.data[COLUMNS.code]?.trim() ?? '') ?? [],
  }));
}

export function hasRowChanged(row: ProductRow) {
  const keys = new Set([...Object.keys(row.data), ...Object.keys(row.originalData)]);
  for (const key of keys) {
    if ((row.data[key] ?? '') !== (row.originalData[key] ?? '')) return true;
  }
  return false;
}

export function displayName(row: ProductRow) {
  const code = row.data[COLUMNS.code]?.trim() || 'Sin SKU';
  const description = row.data[COLUMNS.description]?.trim() || 'Sin descripción';
  return `${code} · ${description}`;
}
