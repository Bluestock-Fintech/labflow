import { useMemo, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBulkImportLibrariesMutation } from '../../app/api';
import { MAJOR_CITIES } from '../../data/cities';

const COLUMNS = ['name', 'mobile', 'email', 'address', 'city', 'area', 'pincode', 'latitude', 'longitude', 'map_link'];

function parseCsv(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return { rows: [], errors: [] };

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim());
    const row = {};
    header.forEach((col, idx) => {
      if (COLUMNS.includes(col)) row[col] = cells[idx] ?? '';
    });
    if (!row.name) {
      errors.push(`Row ${i + 1}: missing name — skipped`);
      continue;
    }
    if (row.latitude) row.latitude = Number(row.latitude);
    if (row.longitude) row.longitude = Number(row.longitude);
    Object.keys(row).forEach((k) => {
      if (row[k] === '') delete row[k];
    });
    rows.push(row);
  }

  return { rows, errors };
}

export default function AdminBulkImportPage() {
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState(null);
  const [bulkImport, { isLoading }] = useBulkImportLibrariesMutation();

  const { rows, errors } = useMemo(() => parseCsv(csvText), [csvText]);

  async function handleImport() {
    if (rows.length === 0) return;
    try {
      const res = await bulkImport(rows).unwrap();
      setResult({ ok: true, count: res.data.length });
      setCsvText('');
    } catch (err) {
      setResult({ ok: false, message: err?.data?.error?.message ?? 'Import failed' });
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Bulk Import Libraries</h1>
      <p className="text-sm text-gray-500 mb-5">
        Paste CSV with a header row. Columns: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{COLUMNS.join(', ')}</code>.
        Only <strong>name</strong> is required. Imported libraries are published as unclaimed listings (no owner) —
        the real library can claim/register later. Use the exact city name so the city filter matches it:{' '}
        <strong>{MAJOR_CITIES.join(', ')}</strong>.
      </p>

      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={`name,mobile,address,city,area,pincode,latitude,longitude\nSample Study Lab,9900000000,Paithan Gate,Aurangabad,Paithan Gate,431001,19.876,75.343`}
        rows={10}
        className="w-full rounded-xl border border-gray-300 p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {csvText && (
        <div className="mt-3 text-xs text-gray-500">
          {rows.length} row{rows.length === 1 ? '' : 's'} ready to import
          {errors.length > 0 && <span className="text-amber-600"> · {errors.length} skipped</span>}
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mt-2 text-xs text-amber-700 list-disc pl-4 space-y-0.5">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <button
        onClick={handleImport}
        disabled={rows.length === 0 || isLoading}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-50"
      >
        <UploadCloud className="w-4 h-4" strokeWidth={1.75} />
        {isLoading ? 'Importing…' : `Import ${rows.length || ''} librar${rows.length === 1 ? 'y' : 'ies'}`}
      </button>

      {result && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
            result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {result.ok ? <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /> : <AlertCircle className="w-4 h-4" strokeWidth={1.75} />}
          {result.ok ? `Imported ${result.count} libraries successfully.` : result.message}
        </div>
      )}
    </div>
  );
}
