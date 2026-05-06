import { DropZone } from '@/components/DropZone';
import { EditPanel } from '@/components/EditPanel';
import { Header } from '@/components/Header';
import { ProductTree } from '@/components/ProductTree';
import { ValidationPanel } from '@/components/ValidationPanel';
import { selectHasCsv, useProductStore } from '@/store/productStore';

export default function App() {
  const hasCsv = useProductStore(selectHasCsv);
  const draftDirty = useProductStore((state) => state.draftDirty);
  const selectRow = useProductStore((state) => state.selectRow);
  const setDraftDirty = useProductStore((state) => state.setDraftDirty);

  const handleSelectRequested = (rowId: string) => {
    if (draftDirty) {
      const confirmed = window.confirm('Hay cambios en el formulario actual sin Guardar. ¿Descartarlos y cambiar de producto?');
      if (!confirmed) return;
      setDraftDirty(false);
    }
    selectRow(rowId);
  };

  if (!hasCsv) {
    return <DropZone />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="grid min-h-0 flex-1 grid-cols-[30%_70%]">
        <ProductTree onSelectRequested={handleSelectRequested} />
        <EditPanel />
      </div>
      <ValidationPanel onSelectRequested={handleSelectRequested} />
    </div>
  );
}
