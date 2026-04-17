'use client';

import { useState, useRef, useCallback } from 'react';
import {
  CalendarDays, ClipboardList, Package, DollarSign, BookOpen, Bot,
  Plus, Trash2, Upload, Search, ChevronRight, AlertTriangle, Clock, CheckCircle2,
  Send, X, TrendingDown
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Feira {
  id: number; nome: string; data: string; local: string; status: 'plan' | 'and' | 'ok';
}
interface Task {
  id: number; nome: string; prazo: string; feiraId: string; done: boolean;
}
interface Material {
  id: number; nome: string; qty: number; cat: string; status: 'pendente' | 'ok' | 'falta';
}
interface Custo {
  id: number; desc: string; feiraId: string; cat: string; val: number;
}
interface Deadline {
  id: number; item: string; description: string; deadline: string; deadline_display: string;
  urgency: 'urgent' | 'warning' | 'ok'; category: string;
  start_by: string; start_by_display: string; action: string;
}
interface ChatMsg { role: 'user' | 'ai'; text: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  try { return new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  try { return Math.ceil((new Date(dateStr + 'T12:00').getTime() - Date.now()) / 86400000); }
  catch { return null; }
}
function urgencyOf(dateStr: string): 'urgent' | 'warning' | 'ok' {
  const d = daysUntil(dateStr);
  if (d === null) return 'ok';
  if (d <= 14) return 'urgent';
  if (d <= 30) return 'warning';
  return 'ok';
}

// ─── Badge ───────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    gray: 'bg-slate-100 text-slate-600',
    purple: 'bg-purple-50 text-purple-700',
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[color] ?? map.gray}`}>{label}</span>;
}

function statusBadge(s: string) {
  if (s === 'plan') return <Badge label="Planejado" color="blue" />;
  if (s === 'and') return <Badge label="Em andamento" color="amber" />;
  if (s === 'ok') return <Badge label="Concluído" color="green" />;
  if (s === 'pendente') return <Badge label="Pendente" color="amber" />;
  if (s === 'falta') return <Badge label="Precisa comprar" color="red" />;
  return <Badge label={s} color="gray" />;
}

function urgencyBadge(u: string) {
  if (u === 'urgent') return <Badge label="Urgente" color="red" />;
  if (u === 'warning') return <Badge label="Atenção" color="amber" />;
  return <Badge label="Em dia" color="green" />;
}

const DEFAULT_TASKS: Task[] = [
  { id: 1, nome: 'Confirmar inscrição e pagamento da feira', prazo: '', feiraId: '', done: false },
  { id: 2, nome: 'Definir equipe responsável pelo estande', prazo: '', feiraId: '', done: false },
  { id: 3, nome: 'Contratar empresa de montagem do estande', prazo: '', feiraId: '', done: false },
  { id: 4, nome: 'Preparar catálogos e materiais impressos', prazo: '', feiraId: '', done: false },
  { id: 5, nome: 'Organizar transporte de equipamentos', prazo: '', feiraId: '', done: false },
  { id: 6, nome: 'Reservar hospedagem para a equipe', prazo: '', feiraId: '', done: false },
  { id: 7, nome: 'Montar layout e sinalização do estande', prazo: '', feiraId: '', done: false },
  { id: 8, nome: 'Testar demonstrações dos produtos', prazo: '', feiraId: '', done: false },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FeirasDashboard() {
  const [tab, setTab] = useState<'dash' | 'plan' | 'estande' | 'orc' | 'manual' | 'chat'>('dash');
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [mats, setMats] = useState<Material[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [manualText, setManualText] = useState('');
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [analysisReady, setAnalysisReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dlFilter, setDlFilter] = useState<'all' | 'urgent' | 'warning' | 'ok'>('all');
  const [chkFilter, setChkFilter] = useState('all');
  const [fileName, setFileName] = useState('');
  const [fileB64, setFileB64] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'txt' | ''>('');
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: 'ai', text: 'Olá! Sou o agente de feiras da Rhino Máquinas. Posso ajudar com planejamento, cronograma, estande, materiais, orçamento e análise do manual da feira. Como posso ajudar?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(100);

  const uid = () => ++nextId.current;

  // ── computed ──
  const totalCustos = custos.reduce((a, c) => a + c.val, 0);
  const tasksDone = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round(tasksDone / tasks.length * 100) : 0;
  const urgentDL = deadlines.filter(d => d.urgency === 'urgent').length;

  // ── feiras ──
  const [fNome, setFNome] = useState(''); const [fData, setFData] = useState('');
  const [fLocal, setFLocal] = useState(''); const [fStatus, setFStatus] = useState<'plan' | 'and' | 'ok'>('plan');
  function addFeira() {
    if (!fNome) return;
    setFeiras(p => [...p, { id: uid(), nome: fNome, data: fData, local: fLocal, status: fStatus }]);
    setFNome(''); setFData(''); setFLocal('');
  }

  // ── tasks ──
  const [tNome, setTNome] = useState(''); const [tPrazo, setTPrazo] = useState(''); const [tFeira, setTFeira] = useState('');
  function addTask() {
    if (!tNome) return;
    setTasks(p => [...p, { id: uid(), nome: tNome, prazo: tPrazo, feiraId: tFeira, done: false }]);
    setTNome(''); setTPrazo('');
  }
  function toggleTask(id: number) { setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t)); }

  // ── materiais ──
  const [mNome, setMNome] = useState(''); const [mQty, setMQty] = useState('1');
  const [mCat, setMCat] = useState('Estrutura'); const [mStatus, setMStatus] = useState<'pendente' | 'ok' | 'falta'>('pendente');
  function addMat() {
    if (!mNome) return;
    setMats(p => [...p, { id: uid(), nome: mNome, qty: parseInt(mQty) || 1, cat: mCat, status: mStatus }]);
    setMNome(''); setMQty('1');
  }

  // ── custos ──
  const [oDesc, setODesc] = useState(''); const [oFeira, setOFeira] = useState('');
  const [oCat, setOCat] = useState('Inscrição / taxa'); const [oVal, setOVal] = useState('');
  function addCusto() {
    const val = parseFloat(oVal);
    if (!oDesc || !val) return;
    setCustos(p => [...p, { id: uid(), desc: oDesc, feiraId: oFeira, cat: oCat, val }]);
    setODesc(''); setOVal('');
  }

  // ── file ──
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name);
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = ev => { setFileB64((ev.target!.result as string).split(',')[1]); setFileType('pdf'); };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => { setManualText(ev.target!.result as string); setFileType('txt'); };
      reader.readAsText(file);
    }
  }

  // ── analyze ──
  async function analyzeManual() {
    if (!manualText && !fileB64) { alert('Cole o texto do manual ou faça upload de um arquivo.'); return; }
    setAnalyzing(true);
    const today = new Date().toISOString().split('T')[0];
    const sysPrompt = `Você é especialista em logística de feiras industriais. Analise o manual/regulamento fornecido e extraia TODOS os prazos, datas de entrega e exigências.\n\nHoje é ${today}. Para cada prazo:\n1. Calcule dias restantes\n2. Urgência: "urgent" (<15 dias ou vencido), "warning" (15-30 dias), "ok" (>30 dias)\n3. Sugira quando a Rhino deve COMEÇAR (antecipação recomendada)\n\nResponda APENAS JSON válido sem markdown:\n{"summary":"resumo 2-3 frases","deadlines":[{"id":1,"item":"nome","description":"detalhe","deadline":"YYYY-MM-DD","deadline_display":"como aparece no manual","urgency":"urgent|warning|ok","category":"Credenciamento|Montagem|Marketing|Logística|Documentação|Pagamento|Outros","start_by":"YYYY-MM-DD","start_by_display":"recomendação em texto","action":"ação concreta para a Rhino"}]}`;
    try {
      let messages: object[];
      if (fileType === 'pdf' && fileB64) {
        messages = [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileB64 } }, { type: 'text', text: 'Analise este manual e extraia todos os prazos.' }] }];
      } else {
        messages = [{ role: 'user', content: `Analise este manual de feira:\n\n${manualText}` }];
      }
      const resp = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: sysPrompt, messages })
      });
      const data = await resp.json();
      const raw = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '{}';
      let parsed: { summary?: string; deadlines?: Deadline[] };
      try { parsed = JSON.parse(raw); }
      catch { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { summary: '', deadlines: [] }; }
      setDeadlines(parsed.deadlines ?? []);
      setAnalysisSummary(parsed.summary ?? 'Análise concluída.');
      setAnalysisReady(true);
    } catch { alert('Erro ao analisar. Tente novamente.'); }
    setAnalyzing(false);
  }

  function importToTasks() {
    const existing = new Set(tasks.map(t => t.nome));
    const toAdd = deadlines.filter(d => !existing.has(d.item)).map(d => ({
      id: uid(), nome: d.item + (d.deadline_display ? ` (prazo: ${d.deadline_display})` : ''),
      prazo: d.start_by || d.deadline || '', feiraId: '', done: false
    }));
    if (!toAdd.length) { alert('Todos os prazos já foram importados.'); return; }
    setTasks(p => [...p, ...toAdd]);
    setTab('plan');
    alert(`${toAdd.length} prazo(s) importado(s) como tarefas!`);
  }

  // ── chat ──
  const sendMsg = useCallback(async (override?: string) => {
    const text = (override ?? chatInput).trim(); if (!text || chatLoading) return;
    setChatInput('');
    setChatMsgs(p => [...p, { role: 'user', text }]);
    setChatLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const ctx = {
      hoje: today,
      feiras: feiras.map(f => ({ nome: f.nome, data: f.data, local: f.local, status: f.status })),
      tarefas: { total: tasks.length, concluidas: tasksDone },
      materiais: mats.map(m => ({ nome: m.nome, qty: m.qty, cat: m.cat, status: m.status })),
      orcamento: { total: totalCustos, itens: custos.length },
      prazos_manual: deadlines.map(d => ({ item: d.item, prazo: d.deadline_display, urgencia: d.urgency, acao: d.action, inicio: d.start_by_display })),
    };
    const history = chatMsgs.concat({ role: 'user', text }).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          system: `Você é o agente de feiras da Rhino Máquinas (máquinas industriais). Responda em português brasileiro, de forma direta e prática. Hoje é ${today}.\n\nDados:\n${JSON.stringify(ctx, null, 2)}`,
          messages: history
        })
      });
      const data = await resp.json();
      const reply = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? 'Não consegui responder.';
      setChatMsgs(p => [...p, { role: 'ai', text: reply }]);
    } catch { setChatMsgs(p => [...p, { role: 'ai', text: 'Erro de conexão. Tente novamente.' }]); }
    setChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [chatInput, chatLoading, chatMsgs, feiras, tasks, tasksDone, mats, custos, totalCustos, deadlines]);

  // ─── Filtered data ───────────────────────────────────────────────────────
  const filteredTasks = chkFilter === 'all' ? tasks : tasks.filter(t => t.feiraId === chkFilter || !t.feiraId);
  const filteredDL = dlFilter === 'all' ? deadlines : deadlines.filter(d => d.urgency === dlFilter);
  const sortedDL = [...filteredDL].sort((a, b) => ({ urgent: 0, warning: 1, ok: 2 }[a.urgency] ?? 2) - ({ urgent: 0, warning: 1, ok: 2 }[b.urgency] ?? 2));
  const sortedFeiras = [...feiras].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''));

  const catMap: Record<string, number> = {};
  custos.forEach(c => { catMap[c.cat] = (catMap[c.cat] ?? 0) + c.val; });
  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  const matCats: Record<string, { total: number; ok: number; falta: number; pendente: number }> = {};
  mats.forEach(m => {
    if (!matCats[m.cat]) matCats[m.cat] = { total: 0, ok: 0, falta: 0, pendente: 0 };
    matCats[m.cat].total++; matCats[m.cat][m.status]++;
  });

  // ─── UI helpers ──────────────────────────────────────────────────────────
  const input = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white';
  const select = 'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white';
  const btn = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors';
  const btnPrimary = `${btn} bg-[#008434] text-white hover:bg-[#006b2a]`;
  const btnGhost = `${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`;

  const TABS = [
    { id: 'dash', label: 'Visão Geral', icon: CalendarDays },
    { id: 'plan', label: 'Planejamento', icon: ClipboardList },
    { id: 'estande', label: 'Estande & Materiais', icon: Package },
    { id: 'orc', label: 'Orçamento', icon: DollarSign },
    { id: 'manual', label: 'Manual da Feira', icon: BookOpen },
    { id: 'chat', label: 'Agente IA', icon: Bot },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#001e0e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">RM</div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">Agente de Feiras — Rhino Máquinas</h1>
            <p className="text-xs text-slate-500">Planejamento · Estande & Materiais · Orçamento · Manual</p>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-white border-b border-slate-200 px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as typeof tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === id ? 'border-[#008434] text-[#008434]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── VISÃO GERAL ── */}
        {tab === 'dash' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Feiras planejadas', value: feiras.length, sub: 'este ano', icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Tarefas concluídas', value: `${pct}%`, sub: `${tasksDone} de ${tasks.length}`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Itens de estande', value: mats.length, sub: 'cadastrados', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Prazos críticos', value: urgentDL, sub: 'do manual', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                  <div className="text-xs text-slate-400">{sub}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Linha do tempo</h3>
                {!sortedFeiras.length ? (
                  <p className="text-sm text-slate-400 text-center py-6">Cadastre feiras em Planejamento.</p>
                ) : (
                  <div className="space-y-0">
                    {sortedFeiras.map((f, i) => (
                      <div key={f.id} className="flex gap-3 pb-4 relative">
                        <div className="relative flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#008434] mt-1.5 z-10 relative" />
                          {i < sortedFeiras.length - 1 && <div className="absolute left-[4.5px] top-4 bottom-0 w-px bg-slate-200" />}
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">{f.data ? fmtDate(f.data) : 'Sem data'} · {f.local || 'Sem local'}</div>
                          <div className="text-sm font-medium text-slate-800 flex items-center gap-2">{f.nome} {statusBadge(f.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Prazos urgentes do manual</h3>
                {!deadlines.length ? (
                  <p className="text-sm text-slate-400 text-center py-6">Analise um manual para ver os prazos aqui.</p>
                ) : (
                  <div className="space-y-3">
                    {deadlines.filter(d => d.urgency === 'urgent').slice(0, 3).concat(deadlines.filter(d => d.urgency === 'warning').slice(0, 2)).slice(0, 4).map(d => {
                      const days = daysUntil(d.deadline);
                      const dText = days === null ? '—' : days < 0 ? 'Vencido' : days === 0 ? 'Hoje' : `${days}d`;
                      return (
                        <div key={d.id} className="flex items-center gap-3">
                          <div className={`w-1 h-8 rounded-full flex-shrink-0 ${d.urgency === 'urgent' ? 'bg-red-400' : 'bg-amber-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{d.item}</div>
                            <div className="text-xs text-slate-400 truncate">{d.start_by_display || d.action}</div>
                          </div>
                          <div className={`text-sm font-semibold flex-shrink-0 ${d.urgency === 'urgent' ? 'text-red-600' : 'text-amber-600'}`}>{dText}</div>
                        </div>
                      );
                    })}
                    {deadlines.length > 4 && (
                      <button onClick={() => setTab('manual')} className="text-xs text-[#008434] hover:underline flex items-center gap-1">
                        Ver todos os {deadlines.length} prazos <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Atalhos para o agente</h3>
              <div className="flex flex-wrap gap-2">
                {['Quais são as próximas etapas de preparação para as feiras?', 'Gere um checklist completo para participação em feiras de máquinas industriais.', 'Como organizar o estande para atrair mais visitantes?', 'Analise os prazos do manual e diga o que é mais urgente.'].map(q => (
                  <button key={q} onClick={() => { setTab('chat'); setTimeout(() => sendMsg(q), 80); }}
                    className="text-xs border border-slate-200 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-50 hover:border-slate-300 flex items-center gap-1">
                    {q.slice(0, 40)}… <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── PLANEJAMENTO ── */}
        {tab === 'plan' && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Feiras do ano</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left pb-2 text-xs font-medium text-slate-400 pr-4">Feira</th>
                    <th className="text-left pb-2 text-xs font-medium text-slate-400 pr-4">Data</th>
                    <th className="text-left pb-2 text-xs font-medium text-slate-400 pr-4">Local</th>
                    <th className="text-left pb-2 text-xs font-medium text-slate-400 pr-4">Status</th>
                    <th />
                  </tr></thead>
                  <tbody>
                    {!feiras.length ? (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">Nenhuma feira cadastrada.</td></tr>
                    ) : feiras.map(f => (
                      <tr key={f.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 font-medium text-slate-800 pr-4">{f.nome}</td>
                        <td className="py-3 text-slate-500 pr-4">{f.data ? fmtDate(f.data) : '—'}</td>
                        <td className="py-3 text-slate-500 pr-4">{f.local || '—'}</td>
                        <td className="py-3 pr-4">{statusBadge(f.status)}</td>
                        <td className="py-3"><button onClick={() => setFeiras(p => p.filter(x => x.id !== f.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <input value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Nome da feira" className={`${input} flex-[2] min-w-[140px]`} />
                <input type="date" value={fData} onChange={e => setFData(e.target.value)} className={`${input} w-auto`} />
                <input value={fLocal} onChange={e => setFLocal(e.target.value)} placeholder="Cidade / local" className={`${input} flex-1 min-w-[120px]`} />
                <select value={fStatus} onChange={e => setFStatus(e.target.value as 'plan' | 'and' | 'ok')} className={select}>
                  <option value="plan">Planejado</option><option value="and">Em andamento</option><option value="ok">Concluído</option>
                </select>
                <button onClick={addFeira} className={btnPrimary}><Plus className="w-4 h-4" /> Adicionar</button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cronograma de tarefas</h3>
                <div className="text-xs text-slate-400">{tasksDone}/{tasks.length} concluídas · {pct}%</div>
              </div>
              <div className="flex gap-2 flex-wrap mb-4">
                {[{ id: 'all', label: 'Todas' }, ...feiras.map(f => ({ id: String(f.id), label: f.nome }))].map(({ id, label }) => (
                  <button key={id} onClick={() => setChkFilter(id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${chkFilter === id ? 'bg-[#008434] text-white border-[#008434]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mb-4">
                <div className="h-full bg-[#008434] rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="space-y-2">
                {filteredTasks.map(t => {
                  const u = t.prazo ? urgencyOf(t.prazo) : null;
                  return (
                    <label key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${t.done ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="w-4 h-4 accent-[#008434] flex-shrink-0" />
                      <span className={`flex-1 text-sm ${t.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.nome}</span>
                      {t.prazo && <span className={`text-xs flex-shrink-0 font-medium ${u === 'urgent' ? 'text-red-500' : u === 'warning' ? 'text-amber-500' : 'text-slate-400'}`}>{fmtDate(t.prazo)}</span>}
                      <button onClick={e => { e.preventDefault(); setTasks(p => p.filter(x => x.id !== t.id)); }} className="text-slate-200 hover:text-red-400 flex-shrink-0"><X className="w-4 h-4" /></button>
                    </label>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <input value={tNome} onChange={e => setTNome(e.target.value)} placeholder="Nova tarefa..." className={`${input} flex-[2] min-w-[160px]`} onKeyDown={e => e.key === 'Enter' && addTask()} />
                <input type="date" value={tPrazo} onChange={e => setTPrazo(e.target.value)} className={`${input} w-auto`} />
                <select value={tFeira} onChange={e => setTFeira(e.target.value)} className={select}>
                  <option value="">Geral</option>
                  {feiras.map(f => <option key={f.id} value={String(f.id)}>{f.nome}</option>)}
                </select>
                <button onClick={addTask} className={btnPrimary}><Plus className="w-4 h-4" /> Tarefa</button>
              </div>
            </div>
          </>
        )}

        {/* ── ESTANDE ── */}
        {tab === 'estande' && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Materiais e itens do estande</h3>
              {!mats.length ? (
                <p className="text-sm text-slate-400 text-center py-6">Nenhum item cadastrado.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  {mats.map(m => (
                    <div key={m.id} className="bg-slate-50 rounded-lg p-3 relative">
                      <button onClick={() => setMats(p => p.filter(x => x.id !== m.id))} className="absolute top-2 right-2 text-slate-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      <div className="text-sm font-medium text-slate-800 mb-1 pr-4 truncate">{m.nome}</div>
                      <div className="text-xs text-slate-400 mb-2">Qtd: {m.qty} · {m.cat}</div>
                      {statusBadge(m.status)}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                <input value={mNome} onChange={e => setMNome(e.target.value)} placeholder="Item / material" className={`${input} flex-[2] min-w-[140px]`} />
                <input type="number" value={mQty} onChange={e => setMQty(e.target.value)} placeholder="Qtd" className={`${input} w-20`} />
                <select value={mCat} onChange={e => setMCat(e.target.value)} className={select}>
                  {['Estrutura', 'Marketing / impressos', 'Equipamento / máquina', 'Tecnologia', 'Logística', 'Outros'].map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={mStatus} onChange={e => setMStatus(e.target.value as 'pendente' | 'ok' | 'falta')} className={select}>
                  <option value="pendente">Pendente</option><option value="ok">Disponível</option><option value="falta">Precisa comprar</option>
                </select>
                <button onClick={addMat} className={btnPrimary}><Plus className="w-4 h-4" /> Adicionar</button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Resumo por categoria</h3>
              {!Object.keys(matCats).length ? (
                <p className="text-sm text-slate-400 text-center py-6">Sem itens.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left pb-2 text-xs font-medium text-slate-400 pr-4">Categoria</th>
                    <th className="text-left pb-2 text-xs font-medium text-slate-400 pr-4">Itens</th>
                    <th className="text-left pb-2 text-xs font-medium text-slate-400">Status</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(matCats).map(([cat, v]) => (
                      <tr key={cat} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 font-medium text-slate-700 pr-4">{cat}</td>
                        <td className="py-3 text-slate-500 pr-4">{v.total} {v.total === 1 ? 'item' : 'itens'}</td>
                        <td className="py-3 flex gap-1.5 flex-wrap">
                          {v.falta > 0 && <Badge label={`${v.falta} a comprar`} color="red" />}
                          {v.ok > 0 && <Badge label={`${v.ok} ok`} color="green" />}
                          {v.pendente > 0 && <Badge label={`${v.pendente} pendente`} color="amber" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── ORÇAMENTO ── */}
        {tab === 'orc' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-400 mb-1">Total planejado</div>
                <div className="text-2xl font-semibold text-slate-900">R$ {Math.round(totalCustos).toLocaleString('pt-BR')}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-400 mb-1">Maior categoria</div>
                <div className="text-lg font-semibold text-slate-900">{sortedCats[0]?.[0] ?? '—'}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-400 mb-1">Itens cadastrados</div>
                <div className="text-2xl font-semibold text-slate-900">{custos.length}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Itens de custo</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left pb-2 text-xs font-medium text-slate-400 pr-4">Descrição</th>
                    <th className="text-left pb-2 text-xs font-medium text-slate-400 pr-4">Feira</th>
                    <th className="text-left pb-2 text-xs font-medium text-slate-400 pr-4">Categoria</th>
                    <th className="text-left pb-2 text-xs font-medium text-slate-400">Valor</th>
                    <th />
                  </tr></thead>
                  <tbody>
                    {!custos.length ? (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-400">Nenhum custo cadastrado.</td></tr>
                    ) : custos.map(c => {
                      const f = feiras.find(x => String(x.id) === c.feiraId);
                      return (
                        <tr key={c.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-3 text-slate-700 pr-4">{c.desc}</td>
                          <td className="py-3 text-slate-400 text-xs pr-4">{f?.nome ?? 'Geral'}</td>
                          <td className="py-3 pr-4"><Badge label={c.cat} color="gray" /></td>
                          <td className="py-3 font-semibold text-slate-800">R$ {c.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3"><button onClick={() => setCustos(p => p.filter(x => x.id !== c.id))} className="text-slate-200 hover:text-red-400"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <input value={oDesc} onChange={e => setODesc(e.target.value)} placeholder="Descrição" className={`${input} flex-[2] min-w-[140px]`} />
                <select value={oFeira} onChange={e => setOFeira(e.target.value)} className={select}>
                  <option value="">Geral</option>
                  {feiras.map(f => <option key={f.id} value={String(f.id)}>{f.nome}</option>)}
                </select>
                <select value={oCat} onChange={e => setOCat(e.target.value)} className={select}>
                  {['Inscrição / taxa', 'Estande / estrutura', 'Transporte', 'Hospedagem', 'Marketing', 'Alimentação', 'Equipamentos', 'Outros'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={oVal} onChange={e => setOVal(e.target.value)} placeholder="R$ valor" className={`${input} w-28`} />
                <button onClick={addCusto} className={btnPrimary}><Plus className="w-4 h-4" /> Adicionar</button>
              </div>
            </div>

            {sortedCats.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Distribuição por categoria</h3>
                <div className="space-y-3">
                  {sortedCats.map(([cat, val]) => {
                    const pctC = totalCustos ? Math.round(val / totalCustos * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium">{cat}</span>
                          <span className="text-slate-400">R$ {Math.round(val).toLocaleString('pt-BR')} ({pctC}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full bg-[#008434] rounded-full" style={{ width: `${pctC}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── MANUAL ── */}
        {tab === 'manual' && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Importar manual da feira</h3>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#008434] hover:bg-green-50/30 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600 mb-1">Arraste o manual aqui ou clique para selecionar</p>
                <p className="text-xs text-slate-400">Aceita PDF ou TXT — a IA irá extrair todos os prazos e entregas</p>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={handleFile} className="hidden" />
              </div>

              {fileName && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <BookOpen className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 flex-1 truncate">{fileName}</span>
                  <button onClick={() => { setFileName(''); setFileB64(''); setFileType(''); }} className="text-slate-300 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="mt-4">
                <label className="text-xs text-slate-400 block mb-2">Ou cole o conteúdo do manual:</label>
                <textarea value={manualText} onChange={e => setManualText(e.target.value)}
                  placeholder="Cole aqui o texto do manual da feira (regulamento, cronograma, exigências, prazos de entrega de materiais...)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-y min-h-[120px]" />
              </div>

              <button onClick={analyzeManual} disabled={analyzing}
                className={`${btnPrimary} w-full justify-center mt-4 py-3 text-base`}>
                {analyzing ? <><Clock className="w-4 h-4 animate-spin" /> Analisando com IA...</> : <><Search className="w-4 h-4" /> Analisar manual com IA</>}
              </button>
            </div>

            {analysisReady && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resumo da análise</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysisSummary}</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prazos e entregas identificados</h3>
                    <button onClick={importToTasks} className={`${btnGhost} text-xs`}>
                      <TrendingDown className="w-3.5 h-3.5" /> Importar como tarefas
                    </button>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-4">
                    {(['all', 'urgent', 'warning', 'ok'] as const).map(f => (
                      <button key={f} onClick={() => setDlFilter(f)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${dlFilter === f ? 'bg-[#008434] text-white border-[#008434]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        {f === 'all' ? `Todos (${deadlines.length})` : f === 'urgent' ? `Urgente (${deadlines.filter(d => d.urgency === 'urgent').length})` : f === 'warning' ? `Atenção (${deadlines.filter(d => d.urgency === 'warning').length})` : `Em dia (${deadlines.filter(d => d.urgency === 'ok').length})`}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {!sortedDL.length ? (
                      <p className="text-sm text-slate-400 text-center py-6">Nenhum prazo para este filtro.</p>
                    ) : sortedDL.map(d => {
                      const days = daysUntil(d.deadline);
                      const dText = days === null ? 'Sem data' : days < 0 ? `Vencido há ${Math.abs(days)}d` : days === 0 ? 'Vence hoje!' : days === 1 ? 'Amanhã' : `${days} dias`;
                      const startDays = daysUntil(d.start_by);
                      const startAlert = startDays !== null && startDays <= 3
                        ? `⚠️ Iniciar ${startDays <= 0 ? 'imediatamente' : startDays === 1 ? 'amanhã' : `em ${startDays} dias`}!`
                        : `▶ ${d.start_by_display || 'Iniciar em breve'}`;
                      return (
                        <div key={d.id} className="flex gap-3 p-4 border border-slate-200 rounded-xl">
                          <div className={`w-1 rounded-full flex-shrink-0 ${d.urgency === 'urgent' ? 'bg-red-400' : d.urgency === 'warning' ? 'bg-amber-400' : 'bg-green-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-semibold text-slate-800">{d.item}</span>
                              <Badge label={d.category || 'Geral'} color="gray" />
                              {urgencyBadge(d.urgency)}
                            </div>
                            <p className="text-xs text-slate-500 mb-2">{d.description}</p>
                            <div className={`text-xs font-medium mb-1 ${(startDays ?? 99) <= 3 ? 'text-red-600' : 'text-slate-500'}`}>{startAlert}</div>
                            <div className="text-xs text-slate-500"><span className="font-medium">Ação:</span> {d.action}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-sm font-bold ${d.urgency === 'urgent' ? 'text-red-600' : d.urgency === 'warning' ? 'text-amber-600' : 'text-green-600'}`}>
                              {d.deadline_display || '—'}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">{dText}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col" style={{ minHeight: '560px' }}>
            <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[420px]">
              {chatMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-[#001e0e] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Bot className="w-4 h-4 text-[#ffba00]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#008434] text-white rounded-br-sm' : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-[#001e0e] flex items-center justify-center mr-2">
                    <Bot className="w-4 h-4 text-[#ffba00]" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex flex-wrap gap-2 px-5 pb-3 border-t border-slate-100 pt-3">
              {['Gere um cronograma 3 meses antes da feira', 'Itens essenciais para o estande de máquinas', 'Principais feiras industriais no Brasil 2025/2026', 'Como calcular ROI de participação em feiras?'].map(q => (
                <button key={q} onClick={() => sendMsg(q)} className="text-xs border border-slate-200 rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-50 truncate max-w-[220px]">{q}</button>
              ))}
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-200">
              <textarea
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder="Pergunte sobre planejamento, estande, orçamento, prazos do manual..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none"
                rows={2}
              />
              <button onClick={() => sendMsg()} disabled={chatLoading || !chatInput.trim()}
                className="self-end px-4 py-2.5 bg-[#008434] text-white rounded-xl hover:bg-[#006b2a] disabled:opacity-40 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
