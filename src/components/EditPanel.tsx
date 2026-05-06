import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, type FieldError, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GripVertical, ImagePlus, Save, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { COLUMNS } from '@/constants';
import { selectSelectedRow, useProductStore } from '@/store/productStore';
import type { CsvRow, ProductRow } from '@/types';
import { isParentRow } from '@/utils/products';
import { PropagateButton } from '@/components/PropagateButton';

const optionalText = z.string().optional().default('');
const decimalText = z
  .string()
  .optional()
  .default('')
  .refine((value) => !value || /^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+(,\d+)?$|^-?\d+(\.\d+)?$/.test(value), {
    message: 'Usa número con coma o punto decimal.',
  });

const editFormSchema = z.object({
  code: z.string().min(1, 'Código es obligatorio.'),
  description: z.string().min(1, 'Descrição es obligatoria.'),
  tags: optionalText,
  category: optionalText,
  brand: optionalText,
  active: z.boolean(),
  price: decimalText,
  costPrice: decimalText,
  stock: decimalText,
  minStock: decimalText,
  maxStock: decimalText,
  netWeight: decimalText,
  grossWeight: decimalText,
  width: decimalText,
  height: decimalText,
  depth: decimalText,
  ncm: z
    .string()
    .optional()
    .default('')
    .refine((value) => !value || /^\d{4}\.\d{2}\.\d{2}$/.test(value), 'Formato esperado: 0000.00.00'),
  gtin: optionalText,
  images: z.array(z.object({ url: z.string().trim().optional().default('') })),
  shortDescription: optionalText,
  additionalInfo: optionalText,
});

type EditFormValues = z.infer<typeof editFormSchema>;

const blankFormValues: EditFormValues = {
  code: '',
  description: '',
  tags: '',
  category: '',
  brand: '',
  active: true,
  price: '',
  costPrice: '',
  stock: '',
  minStock: '',
  maxStock: '',
  netWeight: '',
  grossWeight: '',
  width: '',
  height: '',
  depth: '',
  ncm: '',
  gtin: '',
  images: [],
  shortDescription: '',
  additionalInfo: '',
};

function get(row: ProductRow | null, column: string) {
  return row?.data[column] ?? '';
}

function rowToFormValues(row: ProductRow | null): EditFormValues {
  if (!row) return blankFormValues;
  return {
    code: get(row, COLUMNS.code),
    description: get(row, COLUMNS.description),
    tags: get(row, COLUMNS.tags),
    category: get(row, COLUMNS.category),
    brand: get(row, COLUMNS.brand),
    active: get(row, COLUMNS.status).trim().toLowerCase() !== 'inativo',
    price: get(row, COLUMNS.price),
    costPrice: get(row, COLUMNS.costPrice),
    stock: get(row, COLUMNS.stock),
    minStock: get(row, COLUMNS.minStock),
    maxStock: get(row, COLUMNS.maxStock),
    netWeight: get(row, COLUMNS.netWeight),
    grossWeight: get(row, COLUMNS.grossWeight),
    width: get(row, COLUMNS.width),
    height: get(row, COLUMNS.height),
    depth: get(row, COLUMNS.depth),
    ncm: get(row, COLUMNS.ncm),
    gtin: get(row, COLUMNS.gtin),
    images: get(row, COLUMNS.imageUrls)
      .split('|')
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({ url })),
    shortDescription: get(row, COLUMNS.shortDescription),
    additionalInfo: get(row, COLUMNS.additionalInfo),
  };
}

function formValuesToRowData(values: EditFormValues): CsvRow {
  return {
    [COLUMNS.code]: values.code,
    [COLUMNS.description]: values.description,
    [COLUMNS.tags]: values.tags,
    [COLUMNS.category]: values.category,
    [COLUMNS.brand]: values.brand,
    [COLUMNS.status]: values.active ? 'Ativo' : 'Inativo',
    [COLUMNS.price]: values.price,
    [COLUMNS.costPrice]: values.costPrice,
    [COLUMNS.stock]: values.stock,
    [COLUMNS.minStock]: values.minStock,
    [COLUMNS.maxStock]: values.maxStock,
    [COLUMNS.netWeight]: values.netWeight,
    [COLUMNS.grossWeight]: values.grossWeight,
    [COLUMNS.width]: values.width,
    [COLUMNS.height]: values.height,
    [COLUMNS.depth]: values.depth,
    [COLUMNS.ncm]: values.ncm,
    [COLUMNS.gtin]: values.gtin,
    [COLUMNS.imageUrls]: values.images.map((image) => image.url.trim()).filter(Boolean).join('|'),
    [COLUMNS.shortDescription]: values.shortDescription,
    [COLUMNS.additionalInfo]: values.additionalInfo,
  };
}

export function EditPanel() {
  const selectedRow = useProductStore(selectSelectedRow);
  const updateRow = useProductStore((state) => state.updateRow);
  const setDraftDirty = useProductStore((state) => state.setDraftDirty);
  const draggedImageIndex = useRef<number | null>(null);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    mode: 'onChange',
    defaultValues: blankFormValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    form.reset(rowToFormValues(selectedRow));
    setDraftDirty(false);
  }, [selectedRow?.id]);

  useEffect(() => {
    setDraftDirty(isDirty);
    return () => setDraftDirty(false);
  }, [isDirty, setDraftDirty]);

  const watchedImages = form.watch('images');

  const productTypeLabel = useMemo(() => {
    if (!selectedRow) return '';
    return isParentRow(selectedRow) ? 'Producto padre' : `Variación de ${selectedRow.data[COLUMNS.parentCode]}`;
  }, [selectedRow]);

  if (!selectedRow) {
    return (
      <main className="flex h-full items-center justify-center bg-muted/20 p-6">
        <Card className="max-w-xl text-center">
          <CardHeader>
            <CardTitle>Selecciona un producto</CardTitle>
            <CardDescription>El panel de edición aparecerá cuando elijas un padre o una variación en el árbol.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const onSubmit = (values: EditFormValues) => {
    updateRow(selectedRow.id, formValuesToRowData(values));
    form.reset(values);
    setDraftDirty(false);
  };

  return (
    <main className="flex h-full min-h-0 flex-col bg-muted/20">
      <div className="flex items-center justify-between gap-4 border-b bg-background p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold">{selectedRow.data[COLUMNS.description] || 'Sin descripción'}</h1>
            <Badge variant="outline">{productTypeLabel}</Badge>
            {isDirty && <Badge variant="warning">Borrador sin guardar</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">SKU: {selectedRow.data[COLUMNS.code] || 'Sin SKU'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isParentRow(selectedRow) && <PropagateButton parentRow={selectedRow} />}
          <Button type="submit" form="edit-product-form" disabled={!isDirty}>
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <form id="edit-product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
          <FieldGroup title="Identificación" description="Campos principales para que Bling identifique y clasifique el producto.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <TextField label="Código" error={form.formState.errors.code} registration={form.register('code')} />
              <TextField label="Descrição" error={form.formState.errors.description} registration={form.register('description')} />
              <TextField label="Grupo de Tags/Tags" registration={form.register('tags')} />
              <TextField label="Categoria do produto" registration={form.register('category')} />
              <TextField label="Marca" registration={form.register('brand')} />
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Situação</Label>
                  <p className="text-xs text-muted-foreground">Ativo/Inativo</p>
                </div>
                <Controller
                  control={form.control}
                  name="active"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
            </div>
          </FieldGroup>

          <FieldGroup title="Precios y stock" description="Acepta coma decimal brasileña, por ejemplo 26,99 o 0,00.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <TextField label="Preço" error={form.formState.errors.price} registration={form.register('price')} />
              <TextField label="Preço de custo" error={form.formState.errors.costPrice} registration={form.register('costPrice')} />
              <TextField label="Estoque" error={form.formState.errors.stock} registration={form.register('stock')} />
              <TextField label="Estoque mínimo" error={form.formState.errors.minStock} registration={form.register('minStock')} />
              <TextField label="Estoque máximo" error={form.formState.errors.maxStock} registration={form.register('maxStock')} />
            </div>
          </FieldGroup>

          <FieldGroup title="Logística" description="Dimensiones, peso fiscal y códigos para marketplace/ERP.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TextField label="Peso líquido" error={form.formState.errors.netWeight} registration={form.register('netWeight')} />
              <TextField label="Peso bruto" error={form.formState.errors.grossWeight} registration={form.register('grossWeight')} />
              <TextField label="Largura" error={form.formState.errors.width} registration={form.register('width')} />
              <TextField label="Altura" error={form.formState.errors.height} registration={form.register('height')} />
              <TextField label="Profundidade" error={form.formState.errors.depth} registration={form.register('depth')} />
              <TextField label="NCM" placeholder="0000.00.00" error={form.formState.errors.ncm} registration={form.register('ncm')} />
              <TextField label="GTIN/EAN" registration={form.register('gtin')} />
            </div>
          </FieldGroup>

          <FieldGroup title="Imágenes" description="Las URLs se guardan unidas por | en la columna URL Imagens Externas.">
            <div className="space-y-3">
              {fields.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Este producto no tiene URLs de imagen. Agrega una para ver el preview en vivo.
                </div>
              )}
              {fields.map((field, index) => {
                const imageUrl = watchedImages?.[index]?.url ?? '';
                return (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => {
                      draggedImageIndex.current = index;
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedImageIndex.current === null || draggedImageIndex.current === index) return;
                      move(draggedImageIndex.current, index);
                      draggedImageIndex.current = null;
                    }}
                    className="grid gap-3 rounded-lg border bg-background p-3 md:grid-cols-[96px_1fr_auto]"
                  >
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                          onLoad={(event) => {
                            event.currentTarget.style.display = 'block';
                          }}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>URL {index + 1}</Label>
                      <Input placeholder="https://..." {...form.register(`images.${index}.url` as const)} />
                      <p className="text-xs text-muted-foreground">Arrastra el bloque para reordenar.</p>
                    </div>
                    <div className="flex items-center gap-2 md:flex-col md:justify-center">
                      <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Eliminar imagen">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Button type="button" variant="outline" onClick={() => append({ url: '' })}>
                <ImagePlus className="mr-2 h-4 w-4" />
                Agregar URL
              </Button>
            </div>
          </FieldGroup>

          <FieldGroup title="Descripciones" description="Texto largo preservado como HTML o texto plano según venga en el CSV.">
            <div className="grid gap-4 lg:grid-cols-2">
              <TextareaField label="Descrição Curta" registration={form.register('shortDescription')} />
              <TextareaField label="Informações Adicionais" registration={form.register('additionalInfo')} />
            </div>
          </FieldGroup>
        </form>
      </ScrollArea>
    </main>
  );
}

function FieldGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TextField({
  label,
  registration,
  error,
  placeholder,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input placeholder={placeholder} {...registration} />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

function TextareaField({ label, registration }: { label: string; registration: UseFormRegisterReturn }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea className="min-h-[180px] font-mono text-xs" {...registration} />
    </div>
  );
}
