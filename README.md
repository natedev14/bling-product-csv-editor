# Bling Product CSV Editor

Editor visual frontend-only para CSVs de productos del ERP Bling.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v3
- Papa Parse
- Zustand
- Shadcn/ui local sobre Radix UI
- React Hook Form + Zod

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

El proyecto ya incluye:

```ts
base: '/nombre-del-repo/'
```

en `vite.config.ts`, y los scripts:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

Antes de publicar, reemplaza `nombre-del-repo` por el nombre real del repositorio en `vite.config.ts` y, opcionalmente, en `homepage` dentro de `package.json`.

## Reglas implementadas

- La app arranca sin datos y solo muestra el DropZone.
- Parsing CSV con delimitador `;`, `skipEmptyLines`, strip BOM y limpieza de tabs `\t` en todos los valores.
- Preserva todas las columnas originales, incluidas las no editadas.
- Árbol padre → hijos usando `Código Pai` contra `Código`.
- Formulario explícito: no hay auto-guardado.
- Dot amarillo para filas modificadas/no exportadas.
- Confirmación al cargar nuevo CSV con cambios pendientes.
- Imágenes separadas por `|`, con preview, eliminar, agregar y reordenar por drag.
- Inputs numéricos aceptan coma decimal brasileña.
- Propagación de campos del padre a todas sus variaciones.
- Validación de SKUs duplicados, padre inexistente, NCM inválido y preço 0 en productos activos.
- Exportación CSV con Papa Parse, `delimiter: ';'`, `quotes: true` y BOM UTF-8.
