import { useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Circle, Package, Rows3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COLUMNS } from '@/constants';
import { useProductStore } from '@/store/productStore';
import { cn } from '@/lib/utils';
import { buildProductTree, displayName, hasRowChanged } from '@/utils/products';
import { issuesByRowId, validateRows } from '@/utils/validation';

type ProductTreeProps = {
  onSelectRequested: (rowId: string) => void;
};

export function ProductTree({ onSelectRequested }: ProductTreeProps) {
  const rows = useProductStore((state) => state.rows);
  const selectedRowId = useProductStore((state) => state.selectedRowId);
  const draftDirty = useProductStore((state) => state.draftDirty);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => buildProductTree(rows), [rows]);
  const issues = useMemo(() => issuesByRowId(validateRows(rows)), [rows]);
  const parentCount = tree.length;
  const variationCount = rows.length - parentCount;

  const toggleExpanded = (rowId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-r bg-card">
      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Árbol de productos</h2>
            <p className="mt-1 text-xs text-muted-foreground">Padres expansibles y variaciones hijas</p>
          </div>
          <Rows3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{parentCount} padres</Badge>
          <Badge variant="secondary">{variationCount} variaciones</Badge>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-3">
          {tree.map(({ parent, children }) => {
            const isExpanded = expanded.has(parent.id);
            return (
              <div key={parent.id} className="rounded-lg">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={children.length === 0}
                    onClick={() => toggleExpanded(parent.id)}
                    aria-label={isExpanded ? 'Contraer producto' : 'Expandir producto'}
                  >
                    {children.length === 0 ? (
                      <Circle className="h-3 w-3 text-muted-foreground" />
                    ) : isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <TreeItemButton
                    selected={selectedRowId === parent.id}
                    label={parent.data[COLUMNS.description] || 'Sin descripción'}
                    code={parent.data[COLUMNS.code] || 'Sin SKU'}
                    dirty={hasRowChanged(parent) || (selectedRowId === parent.id && draftDirty)}
                    hasErrors={Boolean(issues[parent.id]?.some((issue) => issue.severity === 'error'))}
                    hasWarnings={Boolean(issues[parent.id]?.some((issue) => issue.severity === 'warning'))}
                    icon={<Package className="h-4 w-4" />}
                    onClick={() => onSelectRequested(parent.id)}
                  />
                </div>
                {isExpanded && (
                  <div className="ml-9 mt-1 space-y-1 border-l pl-2">
                    {children.map((child) => (
                      <TreeItemButton
                        key={child.id}
                        selected={selectedRowId === child.id}
                        label={child.data[COLUMNS.description] || 'Sin descripción'}
                        code={child.data[COLUMNS.code] || 'Sin SKU'}
                        dirty={hasRowChanged(child) || (selectedRowId === child.id && draftDirty)}
                        hasErrors={Boolean(issues[child.id]?.some((issue) => issue.severity === 'error'))}
                        hasWarnings={Boolean(issues[child.id]?.some((issue) => issue.severity === 'warning'))}
                        onClick={() => onSelectRequested(child.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}

type TreeItemButtonProps = {
  selected: boolean;
  label: string;
  code: string;
  dirty: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  icon?: ReactNode;
  onClick: () => void;
};

function TreeItemButton({ selected, label, code, dirty, hasErrors, hasWarnings, icon, onClick }: TreeItemButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent',
        selected && 'bg-primary/10 text-primary hover:bg-primary/10',
      )}
      title={`${code} · ${label}`}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{code}</span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
      {dirty && <span title="Cambios no exportados" className="h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400" />}
      {hasErrors && <span title="Errores de validación"><AlertCircle className="h-4 w-4 shrink-0 text-destructive" /></span>}
      {!hasErrors && hasWarnings && <span title="Avisos de validación"><AlertCircle className="h-4 w-4 shrink-0 text-yellow-600" /></span>}
    </button>
  );
}
