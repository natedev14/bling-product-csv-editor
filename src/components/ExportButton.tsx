import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { COLUMNS } from '@/constants';
import { useProductStore } from '@/store/productStore';
import { downloadCsv, exportBlingCsv, getExportFilename } from '@/utils/csv';
import { isParentRow } from '@/utils/products';
import { validateRows } from '@/utils/validation';

export function ExportButton() {
  const headers = useProductStore((state) => state.headers);
  const rows = useProductStore((state) => state.rows);
  const draftDirty = useProductStore((state) => state.draftDirty);
  const markExported = useProductStore((state) => state.markExported);
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    const issues = validateRows(rows);
    const parents = rows.filter(isParentRow).length;
    const variations = rows.length - parents;
    return {
      parents,
      variations,
      issues,
      errors: issues.filter((issue) => issue.severity === 'error').length,
      warnings: issues.filter((issue) => issue.severity === 'warning').length,
    };
  }, [rows]);

  const handleOpen = () => {
    if (draftDirty) {
      const confirmed = window.confirm(
        'El producto seleccionado tiene cambios de formulario sin Guardar. Esos cambios no se exportarán. ¿Continuar con el resumen de exportación?',
      );
      if (!confirmed) return;
    }
    setOpen(true);
  };

  const handleExport = () => {
    const csv = exportBlingCsv(headers, rows);
    downloadCsv(csv, getExportFilename());
    markExported();
    setOpen(false);
  };

  return (
    <>
      <Button type="button" onClick={handleOpen} disabled={rows.length === 0}>
        <Download className="mr-2 h-4 w-4" />
        Exportar
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exportación CSV</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Se generará un CSV UTF-8 con BOM, delimitador <strong>;</strong> y todos los campos entre comillas dobles.
                </p>
                <div className="rounded-lg border bg-background p-3 text-foreground">
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt>Productos padre</dt>
                    <dd className="text-right font-medium">{summary.parents}</dd>
                    <dt>Variaciones</dt>
                    <dd className="text-right font-medium">{summary.variations}</dd>
                    <dt>Errores pendientes</dt>
                    <dd className="text-right font-medium text-destructive">{summary.errors}</dd>
                    <dt>Avisos pendientes</dt>
                    <dd className="text-right font-medium text-yellow-700">{summary.warnings}</dd>
                  </dl>
                </div>
                {summary.issues.length > 0 && (
                  <div className="max-h-40 overflow-auto rounded-lg border bg-background p-3">
                    <p className="mb-2 font-medium text-foreground">Primeros problemas detectados:</p>
                    <ul className="space-y-1">
                      {summary.issues.slice(0, 6).map((issue) => {
                        const row = rows.find((item) => item.id === issue.rowId);
                        return (
                          <li key={issue.id}>
                            <span className={issue.severity === 'error' ? 'text-destructive' : 'text-yellow-700'}>{issue.code}</span>{' '}
                            · {row?.data[COLUMNS.code] ?? 'Sin SKU'} · {issue.message}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>
              {summary.errors > 0 ? 'Exportar con errores' : 'Descargar CSV'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
