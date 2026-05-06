import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COLUMNS } from '@/constants';
import { useProductStore } from '@/store/productStore';
import { validateRows } from '@/utils/validation';

export function ValidationPanel({ onSelectRequested }: { onSelectRequested: (rowId: string) => void }) {
  const rows = useProductStore((state) => state.rows);
  const [open, setOpen] = useState(false);
  const issues = useMemo(() => validateRows(rows), [rows]);
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="shrink-0 border-t bg-background">
      <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-3">
          <AlertTriangle className={errors > 0 ? 'h-5 w-5 text-destructive' : 'h-5 w-5 text-muted-foreground'} />
          <div>
            <h2 className="text-sm font-semibold">ValidationPanel</h2>
            <p className="text-xs text-muted-foreground">SKUs duplicados, padres inexistentes, NCM inválido y preço 0 en productos activos.</p>
          </div>
          <Badge variant={errors > 0 ? 'destructive' : 'secondary'}>{errors} errores</Badge>
          <Badge variant={warnings > 0 ? 'warning' : 'secondary'}>{warnings} avisos</Badge>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {open ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronUp className="mr-2 h-4 w-4" />}
            {open ? 'Ocultar' : 'Ver validación'}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <ScrollArea className="max-h-52 border-t">
          {issues.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Sin problemas detectados en la validación actual.</div>
          ) : (
            <div className="divide-y">
              {issues.map((issue) => {
                const row = rows.find((item) => item.id === issue.rowId);
                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => onSelectRequested(issue.rowId)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent"
                  >
                    <span
                      className={
                        issue.severity === 'error'
                          ? 'mt-1 h-2.5 w-2.5 rounded-full bg-destructive'
                          : 'mt-1 h-2.5 w-2.5 rounded-full bg-yellow-400'
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {row?.data[COLUMNS.code] ?? 'Sin SKU'} · {row?.data[COLUMNS.description] ?? 'Sin descripción'}
                      </span>
                      <span className="block text-xs text-muted-foreground">{issue.message}</span>
                    </span>
                    <Badge variant={issue.severity === 'error' ? 'destructive' : 'warning'}>{issue.code}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
