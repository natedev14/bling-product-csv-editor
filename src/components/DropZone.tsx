import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { FileSpreadsheet, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseBlingCsv } from '@/utils/csv';
import { useProductStore } from '@/store/productStore';
import { cn } from '@/lib/utils';

type DropZoneProps = {
  compact?: boolean;
  onLoaded?: () => void;
};

export function DropZone({ compact = false, onLoaded }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadCsv = useProductStore((state) => state.loadCsv);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Selecciona un archivo .csv válido.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parsed = await parseBlingCsv(file);
      loadCsv({ ...parsed, filename: file.name });
      onLoaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible leer el CSV.');
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files.item(0));
  };

  return (
    <div className={compact ? 'w-full' : 'flex min-h-[calc(100vh-80px)] items-center justify-center p-6'}>
      <Card className={cn('w-full border-dashed', compact ? 'border-0 shadow-none' : 'max-w-2xl')}>
        {!compact && (
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <FileSpreadsheet className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Bling Product CSV Editor</CardTitle>
            <CardDescription>
              Carga un CSV de productos de Bling para editar padres, variaciones, precios, stock, logística, imágenes y descripciones.
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0' : undefined}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
              if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50',
              compact && 'p-5',
            )}
          >
            <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Arrastra un CSV aquí o haz clic para seleccionarlo</p>
            <p className="mt-1 text-xs text-muted-foreground">Delimitador ; · UTF-8 BOM · comillas dobles · sin persistencia local</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => void handleFile(event.target.files?.item(0) ?? null)}
            />
            <Button className="mt-5" disabled={isLoading} type="button">
              {isLoading ? 'Leyendo CSV...' : 'Cargar CSV'}
            </Button>
          </div>
          {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
