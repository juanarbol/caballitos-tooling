import { describe, it, expect } from 'vitest';
import { validateCatalogSchema, buildCatalogCsv, catalogs } from './catalogs';
import * as XLSX from 'xlsx';

describe('catalog schema validation', () => {
  it('accepts a valid Icaro workbook header', () => {
    const rows = [
      ['ISBN', 'AÑO', 'CATEGORIA', 'NOMBRE LIBRO', 'AUTOR', 'EDITORIAL', 'CANTIDAD', 'PVP', 'link imagen'],
      ['9781234567890', '', 'ADMINISTRACION', 'Mi libro', 'Autor X', 'Editorial Y', '3', '12000', 'https://example.com/img.jpg'],
    ];

    expect(validateCatalogSchema(rows, 'icaro')).toEqual({ valid: true, errors: [] });
  });

  it('accepts an Icaro workbook when the header starts after introductory rows', () => {
    const rows = [
      ['CATALOGO DE LIBROS', '', '', '', '', '', '', '', ''],
      ['Listado para Librerias y Libreros  08/09/2026', '', '', '', '', '', '', '', ''],
      ['ISBN', 'AÑO', 'CATEGORIA', 'NOMBRE LIBRO', 'AUTOR', 'EDITORIAL', 'CANTIDAD', 'PVP', 'link imagen'],
      ['9781234567890', '', 'ADMINISTRACION', 'Mi libro', 'Autor X', 'Editorial Y', '4', '12000', 'https://example.com/img.jpg'],
    ];

    expect(validateCatalogSchema(rows, 'icaro')).toEqual({ valid: true, errors: [] });
  });

  it('rejects a missing column for Icaro', () => {
    const rows = [
      ['ISBN', 'NOMBRE LIBRO', 'AUTOR', 'EDITORIAL', 'CANTIDAD'],
      ['9781234567890', 'Mi libro', 'Autor X', 'Editorial Y', '3'],
    ];

    expect(validateCatalogSchema(rows, 'icaro').valid).toBe(false);
  });

  it('accepts a valid Siglo workbook header', () => {
    const rows = [
      ['ISBN', 'CODIGO', 'TIPO', 'TITULO', 'AUTOR', 'EDITORIAL', 'BODEGA', 'PRECIO', 'LINK_IMAGEN', 'RESEÑA'],
      ['9781234567890', 'A-100', 'Libro', 'Libro del siglo', 'Autor Z', 'Editorial W', '11', '15000', 'https://example.com/img.jpg', 'Revisión'],
    ];

    expect(validateCatalogSchema(rows, 'siglo')).toEqual({ valid: true, errors: [] });
  });
});

describe('catalog conversion', () => {
  it('builds Icaro CSV rows for a valid workbook', () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['ISBN', 'AÑO', 'CATEGORIA', 'NOMBRE LIBRO', 'AUTOR', 'EDITORIAL', 'CANTIDAD', 'PVP', 'link imagen'],
      ['9781234567890', '', 'ADMINISTRACION', 'Mi libro', 'Autor X', 'Editorial Y', '1', '12000', 'https://example.com/img.jpg'],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Catalogo');

    const result = buildCatalogCsv(wb, 'icaro');
    expect(result.count).toBe(1);
    expect(result.csvText).toContain('Handle,Title');
    expect(result.csvText).toContain('Mi libro');
    expect(result.csvText).toContain('\nmi-libro,');
    expect(result.csvText).toContain('ICARO-9781234567890');
    expect(result.csvText).not.toContain('ONLINE');
    expect(result.csvText).toContain('Procedencia,PROPIO,');
    expect(result.csvText).toContain(',ICARO,');
  });

  it('builds Siglo CSV rows for a valid workbook', () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['ISBN', 'CODIGO', 'TITULO', 'AUTOR', 'EDITORIAL', 'BODEGA', 'PRECIO', 'LINK_IMAGEN', 'RESEÑA'],
      ['9781234567890', 'A-100', 'Libro del siglo', 'Autor Z', 'Editorial W', '1', '15000', 'https://example.com/img.jpg', 'Revisión'],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Catalogo');

    const result = buildCatalogCsv(wb, 'siglo');
    expect(result.count).toBe(1);
    expect(result.csvText).toContain('SIGLO');
    expect(result.csvText).toContain('Libro del siglo');
    expect(result.csvText).toContain('Procedencia,PROPIO,');
    expect(result.csvText).toContain(',SIGLO,');
  });

  it.each([
    ['icaro', 'ICARO', 'ICARO-9781234567890-CONSIG', 'ICARO-9781234567890-CONSIG-VIRTUAL', 'mi-libro-icaro-consig', 'mi-libro-icaro-consig-virtual'],
    ['siglo', 'SIGLO', 'SIGLO-9781234567890-CONSIG', 'SIGLO-9781234567890-CONSIG-VIRTUAL', 'libro-del-siglo-siglo-consig', 'libro-del-siglo-siglo-consig-virtual'],
  ])('uses the selected consignment SKU, handle, and origin for %s', (catalogKey, vendor, consignmentSku, virtualSku, consignmentHandle, virtualHandle) => {
    const wb = XLSX.utils.book_new();
    const rows = catalogKey === 'icaro'
      ? [
        ['ISBN', 'AÑO', 'CATEGORIA', 'NOMBRE LIBRO', 'AUTOR', 'EDITORIAL', 'CANTIDAD', 'PVP', 'link imagen'],
        ['9781234567890', '', 'ADMINISTRACION', 'Mi libro', 'Autor X', 'Editorial Y', '1', '12000', ''],
      ]
      : [
        ['ISBN', 'CODIGO', 'TITULO', 'AUTOR', 'EDITORIAL', 'BODEGA', 'PRECIO', 'LINK_IMAGEN', 'RESEÑA'],
        ['9781234567890', 'A-100', 'Libro del siglo', 'Autor Z', 'Editorial W', '1', '15000', '', ''],
      ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Catalogo');

    const consignmentResult = buildCatalogCsv(wb, catalogKey, { consignmentType: 'consignment' });
    const virtualResult = buildCatalogCsv(wb, catalogKey, { consignmentType: 'virtual' });
    const draftResult = buildCatalogCsv(wb, catalogKey, { status: 'draft' });

    expect(consignmentResult.csvText).toContain(consignmentSku);
    expect(virtualResult.csvText).toContain(virtualSku);
    expect(consignmentResult.csvText).toContain(',active\n');
    expect(draftResult.csvText).toContain(',draft\n');
    expect(consignmentResult.csvText).toContain(`\n${consignmentHandle},`);
    expect(virtualResult.csvText).toContain(`\n${virtualHandle},`);
    expect(consignmentResult.csvText).toContain(`Procedencia,CONSIGNACION ${vendor},`);
    expect(virtualResult.csvText).toContain(`Procedencia,CONSIGNACION ${vendor} VIRTUAL,`);
    expect(consignmentResult.csvText).toContain(`,${vendor}-CONSIGNACION,`);
    expect(virtualResult.csvText).toContain(`,${vendor}-CONSIGNACION-VIRTUAL,`);
  });

  it('skips rows when the quantity is smaller than the configured threshold', () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['ISBN', 'AÑO', 'CATEGORIA', 'NOMBRE LIBRO', 'AUTOR', 'EDITORIAL', 'CANTIDAD', 'PVP', 'link imagen'],
      ['9781234567890', '', 'ADMINISTRACION', 'Mi libro', 'Autor X', 'Editorial Y', '3', '12000', 'https://example.com/img.jpg'],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Catalogo');

    const result = buildCatalogCsv(wb, 'icaro', { skipThreshold: 10 });
    expect(result.count).toBe(0);
    expect(result.csvText).toContain('Handle,Title');
  });

  it('exposes both catalog handlers', () => {
    expect(Object.keys(catalogs)).toEqual(['icaro', 'siglo']);
  });
});
