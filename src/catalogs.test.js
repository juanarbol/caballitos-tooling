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
      ['9781234567890', '', 'ADMINISTRACION', 'Mi libro', 'Autor X', 'Editorial Y', '4', '12000', 'https://example.com/img.jpg'],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Catalogo');

    const result = buildCatalogCsv(wb, 'icaro');
    expect(result.count).toBe(1);
    expect(result.csvText).toContain('Handle,Title');
    expect(result.csvText).toContain('Mi libro');
  });

  it('builds Siglo CSV rows for a valid workbook', () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['ISBN', 'CODIGO', 'TITULO', 'AUTOR', 'EDITORIAL', 'BODEGA', 'PRECIO', 'LINK_IMAGEN', 'RESEÑA'],
      ['9781234567890', 'A-100', 'Libro del siglo', 'Autor Z', 'Editorial W', '11', '15000', 'https://example.com/img.jpg', 'Revisión'],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Catalogo');

    const result = buildCatalogCsv(wb, 'siglo');
    expect(result.count).toBe(1);
    expect(result.csvText).toContain('SIGLO');
    expect(result.csvText).toContain('Libro del siglo');
  });

  it('allows disabling the default skip filter for Icaro', () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['ISBN', 'AÑO', 'CATEGORIA', 'NOMBRE LIBRO', 'AUTOR', 'EDITORIAL', 'CANTIDAD', 'PVP', 'link imagen'],
      ['9781234567890', '', 'ADMINISTRACION', 'Mi libro', 'Autor X', 'Editorial Y', '3', '12000', 'https://example.com/img.jpg'],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Catalogo');

    const result = buildCatalogCsv(wb, 'icaro', { skipMode: 'none' });
    expect(result.count).toBe(1);
    expect(result.csvText).toContain('Mi libro');
  });

  it('exposes both catalog handlers', () => {
    expect(Object.keys(catalogs)).toEqual(['icaro', 'siglo']);
  });
});
