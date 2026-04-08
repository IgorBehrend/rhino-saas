'use client';

import { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ExportConfig {
  filename: string;
  sheetName: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

interface ImportResult {
  success: number;
  errors: string[];
}

interface ExcelToolsProps {
  exportConfig?: ExportConfig;
  onImport?: (rows: Record<string, string>[]) => Promise<ImportResult>;
  importTemplateHeaders?: string[];
  importTemplateSample?: string[][];
  showImport?: boolean;
  showExport?: boolean;
}

function buildXLS(config: ExportConfig): string {
  const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${esc(config.sheetName)}">
    <Table>
      <Row>${config.headers.map(h => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>
      ${config.rows.map(row => `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${esc(cell ?? '')}</Data></Cell>`).join('')}</Row>`).join('')}
    </Table>
  </Worksheet>
</Workbook>`;
}

function downloadXLS(config: ExportConfig) {
  const blob = new Blob([buildXLS(config)], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${config.filename}.xls`; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): string[][] {
  return text.trim().split('\n').map(line => {
    const cols: string[] = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim()); return cols;
  });
}

export default function ExcelTools({ exportConfig, onImport, importTemplateHeaders = [], importTemplateSample = [], showImport = false, showExport = true }: ExcelToolsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting]   = useState(false);
  const [result, setResult]         = useState<ImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  function downloadTemplate() {
    if (!importTemplateHeaders.length) return;
    downloadXLS({ filename: 'modelo_importacao_maquinas', sheetName: 'Modelo', headers: importTemplateHeaders, rows: importTemplateSample });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;
    setImporting(true); setResult(null);
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const text  = ev.target?.result as string;
        const rows  = parseCSV(text);
        const hdrs  = rows[0]?.map(h => h.toLowerCase().trim()) ?? [];
        const data  = rows.slice(1).filter(r => r.some(c => c)).map(row => {
          const obj: Record<string, string> = {};
          hdrs.forEach((h, i) => { obj[h] = row[i] ?? ''; });
          return obj;
        });
        const res = await onImport(data);
        setResult(res); setShowResult(true);
      } catch {
        setResult({ success: 0, errors: ['Erro ao ler o arquivo. Use o modelo fornecido.'] });
        setShowResult(true);
      } finally {
        setImporting(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  return (
    <div className="flex items-center gap-2">
      {showExport && exportConfig && (
        <button onClick={() => downloadXLS(exportConfig)} className="btn-secondary text-xs gap-1.5" title="Exportar para Excel">
          <Download className="w-3.5 h-3.5" /> Exportar XLS
        </button>
      )}
      {showImport && onImport && (
        <>
          <button onClick={downloadTemplate} className="btn-secondary text-xs gap-1.5" title="Baixar modelo">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Baixar Modelo
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing} className="btn-primary text-xs gap-1.5">
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {importing ? 'Importando...' : 'Importar XLS/CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" onChange={handleFile} className="hidden" />
        </>
      )}
      {showResult && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowResult(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
            <button onClick={() => setShowResult(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-3 mb-4">
              {result.errors.length === 0 ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <AlertCircle className="w-8 h-8 text-amber-500" />}
              <div>
                <p className="font-semibold text-slate-900">Importação concluída</p>
                <p className="text-sm text-slate-500">{result.success} equipamentos importados</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-amber-700 mb-1">Erros ({result.errors.length}):</p>
                {result.errors.map((e, i) => <p key={i} className="text-xs text-amber-600">{e}</p>)}
              </div>
            )}
            <button onClick={() => setShowResult(false)} className="btn-primary w-full mt-4 justify-center">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
