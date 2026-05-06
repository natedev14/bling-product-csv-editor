import { useState } from 'react';
import { CopyPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PROPAGABLE_FIELDS } from '@/constants';
import { useProductStore } from '@/store/productStore';
import type { ProductRow } from '@/types';

export function PropagateButton({ parentRow }: { parentRow: ProductRow }) {
  const propagateToChildren = useProductStore((state) => state.propagateToChildren);
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(() => new Set());
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const toggleColumn = (column: string) => {
    setSelectedColumns((current) => {
      const next = new Set(current);
      if (next.has(column)) next.delete(column);
      else next.add(column);
      return next;
    });
  };

  const handlePropagate = () => {
    const columns = [...selectedColumns];
    const count = propagateToChildren(parentRow.id, columns);
    setLastMessage(`${columns.length} campos propagados a ${count} variaciones.`);
    setSelectedColumns(new Set());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <CopyPlus className="mr-2 h-4 w-4" />
          Propagar a hijos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Propagar campos del padre</DialogTitle>
          <DialogDescription>
            Selecciona qué columnas del producto padre se copiarán a todas sus variaciones en Zustand. No se exporta nada hasta usar Exportar.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[420px] rounded-lg border p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {PROPAGABLE_FIELDS.map((field) => (
              <label key={field.column} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent">
                <Checkbox checked={selectedColumns.has(field.column)} onCheckedChange={() => toggleColumn(field.column)} />
                <span>
                  <span className="block text-sm font-medium">{field.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{parentRow.data[field.column] || 'Vacío'}</span>
                </span>
              </label>
            ))}
          </div>
        </ScrollArea>
        {lastMessage && <p className="text-sm text-muted-foreground">{lastMessage}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={selectedColumns.size === 0} onClick={handlePropagate}>
            Confirmar propagación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
