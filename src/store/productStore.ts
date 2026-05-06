import { create } from 'zustand';
import type { CsvParseResult, CsvRow, ProductRow } from '@/types';
import { hasRowChanged } from '@/utils/products';
import { COLUMNS } from '@/constants';

interface ProductState {
  filename: string | null;
  headers: string[];
  rows: ProductRow[];
  selectedRowId: string | null;
  draftDirty: boolean;
  loadCsv: (payload: CsvParseResult & { filename: string }) => void;
  resetSession: () => void;
  selectRow: (rowId: string | null) => void;
  setDraftDirty: (dirty: boolean) => void;
  updateRow: (rowId: string, data: CsvRow) => void;
  propagateToChildren: (parentRowId: string, columns: string[]) => number;
  markExported: () => void;
}

const initialState = {
  filename: null,
  headers: [],
  rows: [],
  selectedRowId: null,
  draftDirty: false,
};

export const useProductStore = create<ProductState>((set, get) => ({
  ...initialState,
  loadCsv: ({ filename, headers, rows }) => {
    set({ filename, headers, rows, selectedRowId: rows[0]?.id ?? null, draftDirty: false });
  },
  resetSession: () => set(initialState),
  selectRow: (rowId) => set({ selectedRowId: rowId }),
  setDraftDirty: (dirty) => set({ draftDirty: dirty }),
  updateRow: (rowId, data) => {
    set((state) => ({
      rows: state.rows.map((row) => (row.id === rowId ? { ...row, data: { ...row.data, ...data } } : row)),
    }));
  },
  propagateToChildren: (parentRowId, columns) => {
    const { rows } = get();
    const parent = rows.find((row) => row.id === parentRowId);
    if (!parent) return 0;

    const parentCode = parent.data[COLUMNS.code]?.trim() ?? '';
    let updatedCount = 0;

    set((state) => ({
      rows: state.rows.map((row) => {
        const isChild = (row.data[COLUMNS.parentCode]?.trim() ?? '') === parentCode;
        if (!isChild) return row;
        updatedCount += 1;
        const nextData = { ...row.data };
        for (const column of columns) {
          nextData[column] = parent.data[column] ?? '';
        }
        return { ...row, data: nextData };
      }),
    }));

    return updatedCount;
  },
  markExported: () => {
    set((state) => ({
      rows: state.rows.map((row) => ({ ...row, originalData: { ...row.data } })),
      draftDirty: false,
    }));
  },
}));

export const selectSelectedRow = (state: ProductState) =>
  state.rows.find((row) => row.id === state.selectedRowId) ?? null;

export const selectDirtyRows = (state: ProductState) => state.rows.filter(hasRowChanged);

export const selectHasCsv = (state: ProductState) => state.rows.length > 0 && state.headers.length > 0;
