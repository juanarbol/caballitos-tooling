import './style.css';
import * as XLSX from 'xlsx';
import { buildCatalogCsv, validateCatalogSchema, catalogs } from './catalogs';

const catalogSelect = document.getElementById('catalogSelect');
const skipThresholdInput = document.getElementById('skipThresholdInput');
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const productCount = document.getElementById('productCount');

function triggerDownload(csvText, fileName = 'import.csv') {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function onConvertClick() {
  const file = fileInput.files[0];
  if (!file) {
    statusBadge.textContent = 'Missing file';
    statusBadge.className = 'rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700';
    statusText.textContent = 'Please choose an Excel file before converting.';
    return;
  }

  const catalogKey = catalogSelect.value;
  const catalog = catalogs[catalogKey];

  convertBtn.disabled = true;
  statusBadge.textContent = 'Working';
  statusBadge.className = 'rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700';
  statusText.textContent = `Reading ${catalog.label} file ${file.name}...`;

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '' });

    const schema = validateCatalogSchema(rows, catalogKey);
    if (!schema.valid) {
      throw new Error(schema.errors.join('; '));
    }

    const rawThreshold = String(skipThresholdInput.value || '').trim();
    const skipThreshold = /^\d+(\.\d+)?$/.test(rawThreshold) ? Number(rawThreshold) : 1;

    const { csvText, fileName, count } = buildCatalogCsv(workbook, catalogKey, {
      skipThreshold,
    });
    productCount.textContent = String(count);
    triggerDownload(csvText, fileName);

    statusBadge.textContent = 'Done';
    statusBadge.className = 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700';
    statusText.textContent = `Converted ${count} ${catalog.label} products and downloaded the CSV.`;
  } catch (error) {
    console.error(error);
    statusBadge.textContent = 'Error';
    statusBadge.className = 'rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700';
    statusText.textContent = error.message || 'The file could not be processed. Please upload a valid Excel workbook.';
  } finally {
    convertBtn.disabled = false;
  }
}

convertBtn.addEventListener('click', onConvertClick);
