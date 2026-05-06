import { useMemo, useRef, useState } from 'react';
import { FileUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseBlingCsv } from '@/utils/csv';
import { useProductStore } from '@/store/productStore';
import { hasRowChanged } from '@/utils/products';
import { ExportButton } from '@/components/ExportButton';

export function Header() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadCsv = useProductStore((state) => state.loadCsv);
  const filename = useProductStore((state) => state.filename);
  const draftDirty = useProductStore((state) => state.draftDirty);
  const rows = useProductStore((state) => state.rows);
  const dirtyRows = useMemo(() => rows.filter(hasRowChanged), [rows]);
  const [isLoading, setIsLoading] = useState(false);

  const hasUnexportedChanges = dirtyRows.length > 0 || draftDirty;

  const handleNewCsvClick = () => {
    if (hasUnexportedChanges) {
      const confirmed = window.confirm(
        'Hay cambios no exportados o un borrador sin guardar. Si cargas otro CSV, se perderán en esta sesión. ¿Continuar?',
      );
      if (!confirmed) return;
    }
    inputRef.current?.click();
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setIsLoading(true);
    try {
      const parsed = await parseBlingCsv(file);
      loadCsv({ ...parsed, filename: file.name });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No fue posible cargar el CSV.');
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">Bling Product CSV Editor</h1>
          <p className="truncate text-xs text-muted-foreground">{filename ?? 'Sin archivo cargado'}</p>
        </div>
        {dirtyRows.length > 0 && <Badge variant="warning">{dirtyRows.length} modificados/no exportados</Badge>}
        {draftDirty && <Badge variant="destructive">Borrador sin guardar</Badge>}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.item(0) ?? null)}
        />
        <Button type="button" variant="outline" onClick={handleNewCsvClick} disabled={isLoading}>
          <FileUp className="mr-2 h-4 w-4" />
          {isLoading ? 'Cargando...' : 'Cargar nuevo CSV'}
        </Button>
        <ExportButton />
      </div>
    </header>
  );
}
