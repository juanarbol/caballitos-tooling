import * as XLSX from 'xlsx';

export const PRODUCT_CATEGORY = 'Media > Books > Print Books';
export const TYPE = 'Libro Físico';
export const PUBLISHED = 'true';
export const OPTION1_NAME = 'Title';
export const OPTION1_VALUE = 'Default Title';
export const INVENTORY_TRACKER = 'shopify';
export const INVENTORY_POLICY = 'deny';
export const FULFILLMENT_SERVICE = 'manual';
export const REQUIRES_SHIPPING = 'true';
export const TAXABLE = 'true';
export const IMAGE_POSITION = '1';
export const GIFT_CARD = 'false';
export const WEIGHT_UNIT = 'kg';
export const LEIDO = 'false';

export const CSV_HEADER = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags',
  'Published', 'Option1 Name', 'Option1 Value', 'Option1 Linked To', 'Option2 Name',
  'Option2 Value', 'Option2 Linked To', 'Option3 Name', 'Option3 Value', 'Option3 Linked To',
  'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
  'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price',
  'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
  'Unit Price Total Measure', 'Unit Price Total Measure Unit', 'Unit Price Base Measure',
  'Unit Price Base Measure Unit', 'Variant Barcode', 'Image Src', 'Image Position',
  'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description',
  'Google Shopping / Google Product Category', 'Google Shopping / Gender',
  'Google Shopping / Age Group', 'Google Shopping / MPN', 'Google Shopping / Condition',
  'Google Shopping / Custom Product', 'Google Shopping / Custom Label 0',
  'Google Shopping / Custom Label 1', 'Google Shopping / Custom Label 2',
  'Google Shopping / Custom Label 3', 'Google Shopping / Custom Label 4',
  'Páginas (product.metafields.book.pages)', 'Editorial (product.metafields.book.publisher)',
  'Leído (product.metafields.book.read)', 'Proveedor (product.metafields.book.vendor)',
  'Autor (product.metafields.custom.author)', 'Karrot Created ID (product.metafields.karrot.created_id)',
  'Karrot Updated At (product.metafields.karrot.updated_at)',
  'Tipo de cubierta de libro (product.metafields.shopify.book-cover-type)',
  'Género (product.metafields.shopify.genre)',
  'Versión de idioma (product.metafields.shopify.language-version)',
  'Público objetivo (product.metafields.shopify.target-audience)', 'Variant Image',
  'Variant Weight Unit', 'Variant Tax Code', 'Cost per item', 'Status',
];

export const METAFIELD_HEADERS = [
  'Páginas (product.metafields.book.pages)', 'Editorial (product.metafields.book.publisher)',
  'Leído (product.metafields.book.read)', 'Proveedor (product.metafields.book.vendor)',
  'Autor (product.metafields.custom.author)', 'Karrot Created ID (product.metafields.karrot.created_id)',
  'Karrot Updated At (product.metafields.karrot.updated_at)',
  'Tipo de cubierta de libro (product.metafields.shopify.book-cover-type)',
  'Género (product.metafields.shopify.genre)',
  'Versión de idioma (product.metafields.shopify.language-version)',
  'Público objetivo (product.metafields.shopify.target-audience)',
];

export const MAIN_HEADER = CSV_HEADER.filter((h) => !METAFIELD_HEADERS.includes(h));

export function stripAccents(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

export function slugify(value) {
  return stripAccents(cleanText(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function digitsOnly(value) {
  return cleanText(value).replace(/[^0-9]/g, '');
}

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;

  const raw = typeof value === 'number' ? String(value) : String(value).trim();
  if (!raw) return fallback;

  const normalized = raw.replace(/\s+/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return fallback;

  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : fallback;
}

export function hasPositiveNumericQuantity(value) {
  if (value === null || value === undefined || value === '') return false;
  const n = toNumber(value, Number.NaN);
  return Number.isFinite(n) && n > 0;
}

export function shouldSkipQuantity(value, threshold = 1) {
  if (!hasPositiveNumericQuantity(value)) return false;
  const safeThreshold = Number.isFinite(threshold) ? Math.max(threshold, 0) : 1;
  return Number(value) < safeThreshold;
}

export function escapeHtml(value) {
  return cleanText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function toBodyHtml(value) {
  const text = cleanText(value);
  if (!text) return '';
  return text
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n');
}

export function csvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function csvRow(values) {
  return values.map(csvField).join(',') + '\n';
}

export function makeUnique(base, seen, disambiguator) {
  if (!seen.has(base)) {
    seen.add(base);
    return base;
  }

  const withDisambiguator = disambiguator ? `${base}-${disambiguator}` : base;
  if (withDisambiguator !== base && !seen.has(withDisambiguator)) {
    seen.add(withDisambiguator);
    return withDisambiguator;
  }

  let n = 2;
  let candidate = `${withDisambiguator}-${n}`;
  while (seen.has(candidate)) {
    n += 1;
    candidate = `${withDisambiguator}-${n}`;
  }

  seen.add(candidate);
  return candidate;
}

export function projectRow(row, header) {
  return header.map((key) => (row[key] === undefined ? '' : row[key]));
}

export const catalogs = {
  icaro: {
    label: 'Icaro',
    vendor: 'ICARO',
    status: 'draft',
    fileName: 'icaro_import.csv',
    readCatalog(rows) {
      const headerRowIndex = rows.findIndex((row) => Array.isArray(row) && row.includes('ISBN') && row.includes('NOMBRE LIBRO'));
      const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
      const header = (headerRowIndex >= 0 ? rows[headerRowIndex] : []).map((h) => cleanText(h));
      const col = (name) => header.indexOf(name);

      const idx = {
        isbn: col('ISBN'),
        categoria: col('CATEGORIA'),
        titulo: col('NOMBRE LIBRO'),
        autor: col('AUTOR'),
        editorial: col('EDITORIAL'),
        cantidad: col('CANTIDAD'),
        precio: col('PVP'),
        linkImagen: col('link imagen'),
      };

      return rows.slice(startIndex).map((row) => ({
        isbn: cleanText(row[idx.isbn]),
        categoria: cleanText(row[idx.categoria]),
        titulo: cleanText(row[idx.titulo]),
        autor: cleanText(row[idx.autor]),
        editorial: cleanText(row[idx.editorial]),
        cantidad: toNumber(row[idx.cantidad]),
        precio: toNumber(row[idx.precio]),
        linkImagen: cleanText(row[idx.linkImagen]),
      }));
    },
    convertRow(book, seenHandles, seenSkus) {
      const title = book.titulo;
      const isbnDigits = digitsOnly(book.isbn);
      const barcode = isbnDigits;
      const handleBase = slugify(title) || slugify(book.editorial) || 'producto';
      const handle = makeUnique(handleBase, seenHandles, isbnDigits.slice(-6) || book.editorial || 'icaro');
      const skuBase = `ICARO-${isbnDigits || slugify(title) || 'CONV'}-ONLINE`;
      const sku = makeUnique(skuBase, seenSkus);
      const bodyHtml = toBodyHtml(title);
      const seoDescription = cleanText(`${book.autor} ${book.editorial}` || title).slice(0, 320);
      const authorAndCategory = [book.autor, book.categoria].filter(Boolean).join(', ');

      return {
        Handle: handle,
        Title: title,
        'Body (HTML)': bodyHtml,
        Vendor: this.vendor,
        'Product Category': PRODUCT_CATEGORY,
        Type: TYPE,
        Tags: authorAndCategory,
        Published: PUBLISHED,
        'Option1 Name': OPTION1_NAME,
        'Option1 Value': OPTION1_VALUE,
        'Variant SKU': sku,
        'Variant Grams': '',
        'Variant Inventory Tracker': INVENTORY_TRACKER,
        'Variant Inventory Qty': book.cantidad || 0,
        'Variant Inventory Policy': INVENTORY_POLICY,
        'Variant Fulfillment Service': FULFILLMENT_SERVICE,
        'Variant Price': book.precio ? book.precio.toFixed(2) : '',
        'Variant Requires Shipping': REQUIRES_SHIPPING,
        'Variant Taxable': TAXABLE,
        'Variant Barcode': barcode,
        'Image Src': book.linkImagen,
        'Image Position': book.linkImagen ? IMAGE_POSITION : '',
        'Image Alt Text': title,
        'Gift Card': GIFT_CARD,
        'SEO Title': title,
        'SEO Description': seoDescription,
        'Páginas (product.metafields.book.pages)': '',
        'Editorial (product.metafields.book.publisher)': book.editorial,
        'Leído (product.metafields.book.read)': LEIDO,
        'Proveedor (product.metafields.book.vendor)': this.vendor,
        'Autor (product.metafields.custom.author)': book.autor,
        'Variant Weight Unit': WEIGHT_UNIT,
        Status: this.status,
      };
    },
    shouldSkip(book, threshold = 1) {
      if (!book.titulo || !book.precio || book.precio <= 0) return true;
      return shouldSkipQuantity(book.cantidad, threshold);
    },
  },
  siglo: {
    label: 'Siglo',
    vendor: 'SIGLO',
    status: 'draft',
    fileName: 'siglo_import.csv',
    readCatalog(rows) {
      const header = rows[0].map((h) => cleanText(h));
      const col = (name) => header.indexOf(name);

      const idx = {
        editorial: col('EDITORIAL'),
        codigo: col('CODIGO'),
        linkImagen: col('LINK_IMAGEN'),
        isbn: col('ISBN'),
        idbarras: col('IDBARRAS'),
        titulo: col('TITULO'),
        autor: col('AUTOR'),
        precio: col('PRECIO'),
        bodega: col('BODEGA'),
        paginas: col('PAGINAS'),
        formato: col('FORMATO'),
        peso: col('PESO'),
        resena: col('RESEÑA'),
      };

      return rows.slice(1).map((row) => ({
        editorial: cleanText(row[idx.editorial]),
        codigo: cleanText(row[idx.codigo]),
        linkImagen: cleanText(row[idx.linkImagen]),
        isbn: cleanText(row[idx.isbn]),
        idbarras: cleanText(row[idx.idbarras]),
        titulo: cleanText(row[idx.titulo]),
        autor: cleanText(row[idx.autor]),
        precio: toNumber(row[idx.precio]),
        bodega: toNumber(row[idx.bodega]),
        paginas: cleanText(row[idx.paginas]),
        formato: cleanText(row[idx.formato]),
        peso: toNumber(row[idx.peso]),
        resena: cleanText(row[idx.resena]),
      }));
    },
    convertRow(book, seenHandles, seenSkus) {
      const title = book.titulo;
      const isbnDigits = digitsOnly(book.isbn) || digitsOnly(book.idbarras) || digitsOnly(book.codigo);
      const barcode = digitsOnly(book.idbarras) || isbnDigits;
      const handleBase = slugify(title) || slugify(book.codigo) || 'producto';
      const handle = makeUnique(handleBase, seenHandles, isbnDigits.slice(-6) || book.codigo);
      const skuBase = `SIGLO-${isbnDigits || book.codigo}-CONV`;
      const sku = makeUnique(skuBase, seenSkus);
      const bodyHtml = toBodyHtml(book.resena);
      const seoDescription = cleanText(book.resena).slice(0, 320);

      return {
        Handle: handle,
        Title: title,
        'Body (HTML)': bodyHtml,
        Vendor: this.vendor,
        'Product Category': PRODUCT_CATEGORY,
        Type: TYPE,
        Tags: book.autor,
        Published: PUBLISHED,
        'Option1 Name': OPTION1_NAME,
        'Option1 Value': OPTION1_VALUE,
        'Variant SKU': sku,
        'Variant Grams': book.peso || '',
        'Variant Inventory Tracker': INVENTORY_TRACKER,
        'Variant Inventory Qty': book.bodega,
        'Variant Inventory Policy': INVENTORY_POLICY,
        'Variant Fulfillment Service': FULFILLMENT_SERVICE,
        'Variant Price': book.precio.toFixed(2),
        'Variant Requires Shipping': REQUIRES_SHIPPING,
        'Variant Taxable': TAXABLE,
        'Variant Barcode': barcode,
        'Image Src': book.linkImagen,
        'Image Position': book.linkImagen ? IMAGE_POSITION : '',
        'Image Alt Text': title,
        'Gift Card': GIFT_CARD,
        'SEO Title': title,
        'SEO Description': seoDescription,
        'Páginas (product.metafields.book.pages)': book.paginas,
        'Editorial (product.metafields.book.publisher)': book.editorial,
        'Leído (product.metafields.book.read)': LEIDO,
        'Proveedor (product.metafields.book.vendor)': this.vendor,
        'Autor (product.metafields.custom.author)': book.autor,
        'Variant Weight Unit': WEIGHT_UNIT,
        Status: this.status,
      };
    },
    shouldSkip(book, threshold = 1) {
      if (!book.titulo || !book.precio || book.precio <= 0) return true;
      return shouldSkipQuantity(book.bodega, threshold);
    },
  },
};

export function buildCatalogCsv(workbook, catalogKey, options = {}) {
  const catalog = catalogs[catalogKey];
  if (!catalog) {
    throw new Error(`Unsupported catalog: ${catalogKey}`);
  }

  const skipThreshold = Number.isFinite(Number(options.skipThreshold))
    ? Number(options.skipThreshold)
    : 1;

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const books = catalog.readCatalog(rows);
  const seenHandles = new Set();
  const seenSkus = new Set();

  const lines = [csvRow(MAIN_HEADER)];
  let count = 0;

  for (const book of books) {
    const shouldSkip = catalog.shouldSkip(book, skipThreshold);
    if (shouldSkip) continue;
    const row = catalog.convertRow(book, seenHandles, seenSkus);
    lines.push(csvRow(projectRow(row, MAIN_HEADER)));
    count += 1;
  }

  return { csvText: lines.join(''), fileName: catalog.fileName, count };
}

export function validateCatalogSchema(rows, catalogKey) {
  const catalog = catalogs[catalogKey];
  if (!catalog) {
    throw new Error(`Unsupported catalog: ${catalogKey}`);
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { valid: false, errors: ['Empty workbook'] };
  }

  const required = catalogKey === 'icaro'
    ? ['ISBN', 'NOMBRE LIBRO', 'AUTOR', 'EDITORIAL', 'CANTIDAD', 'PVP']
    : ['ISBN', 'TITULO', 'AUTOR', 'EDITORIAL', 'PRECIO', 'BODEGA'];

  const headerRow = rows.find((row) => Array.isArray(row) && row.some((cell) => required.includes(cleanText(cell))));
  const header = Array.isArray(headerRow) ? headerRow.map((h) => cleanText(h)) : [];
  const missing = required.filter((key) => !header.includes(key));

  return {
    valid: missing.length === 0,
    errors: missing.length ? [`Faltan columnas requeridas: ${missing.join(', ')}`] : [],
  };
}
