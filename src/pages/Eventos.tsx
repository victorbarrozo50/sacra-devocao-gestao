import { useState, useMemo } from 'react'
import {
  Plus, Edit2, Trash2, X, MapPin, Phone, Mail,
  ChevronLeft, ChevronRight, Package, CalendarDays,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useStore } from '../hooks/useStore'
import { fmtBRL, fmtDate, today } from '../utils/format'
import Modal from '../components/ui/Modal'
import type { Evento, ClassificacaoEvento, PecaEvento } from '../types'

const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'
const CREAM  = '#F5EFE4'

const CLASSIFICACOES: ClassificacaoEvento[] = [
  'religioso', 'feira', 'pop_up', 'bazar', 'feriado', 'sazonal', 'exposicao',
]

const CLASS_CFG: Record<ClassificacaoEvento, { label: string; dot: string; bg: string; text: string }> = {
  religioso: { label: 'Religioso',  dot: '#7C3AED', bg: '#F5F3FF', text: '#5B21B6' },
  feira:     { label: 'Feira',      dot: '#EA580C', bg: '#FFF7ED', text: '#C2410C' },
  pop_up:    { label: 'Pop-Up',     dot: '#2563EB', bg: '#EFF6FF', text: '#1D4ED8' },
  bazar:     { label: 'Bazar',      dot: '#E11D48', bg: '#FFF1F2', text: '#BE123C' },
  feriado:   { label: 'Feriado',    dot: '#DC2626', bg: '#FEF2F2', text: '#991B1B' },
  sazonal:   { label: 'Sazonal',    dot: '#16A34A', bg: '#F0FDF4', text: '#166534' },
  exposicao: { label: 'Exposição',  dot: '#0284C7', bg: '#F0F9FF', text: '#0369A1' },
}

function ClassBadge({ c }: { c: ClassificacaoEvento }) {
  const cfg = CLASS_CFG[c]
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}>
      {cfg.label}
    </span>
  )
}

function diasRestantes(data: string): number {
  const d = new Date(); d.setHours(0,0,0,0)
  const e = new Date(data + 'T00:00:00')
  return Math.round((e.getTime() - d.getTime()) / 86400000)
}

function fmtDias(dias: number): string {
  if (dias === 0) return 'Hoje!'
  if (dias === 1) return 'Amanhã'
  if (dias < 0)  return `Há ${Math.abs(dias)}d`
  return `Em ${dias} dias`
}

const EMPTY_EV: Omit<Evento, 'id'> = {
  nome: '', data: today(), dataFim: '', classificacao: 'religioso',
  local: '', descricao: '', emailContato: '', telefoneContato: '',
  custo: undefined, pecasRecomendadas: [],
}

// Auto-suggest pieces based on event name matching bordados
function autoSuggest(ev: Evento, bordados: { codigo: string; descricao: string; quantidadeTotal: number }[]): PecaEvento[] {
  const q = ev.nome.toLowerCase()
  const matched = bordados.filter(b => {
    const words = b.descricao.toLowerCase().replace('bordado ', '').split(/\s+/)
    return words.filter(w => w.length >= 4).some(w => q.includes(w))
  })
  const topSellers = bordados
    .filter(b => !matched.find(m => m.codigo === b.codigo))
    .sort((a, b_) => b_.quantidadeTotal - a.quantidadeTotal)
    .slice(0, 5)
  return [...matched.slice(0, 3), ...topSellers.slice(0, Math.max(0, 5 - matched.length))]
    .map(b => ({ bordadoCodigo: b.codigo, bordadoNome: b.descricao, quantidade: 5 }))
}

// ── Calendar helpers ────────────────────────────────────────────────────────
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay() }
const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function Eventos() {
  const { eventos, bordados, addEvento, updateEvento, deleteEvento } = useStore()

  // calendar state
  const now = new Date()
  const [calYear, setCalYear]   = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  // modals
  const [detailEv, setDetailEv]   = useState<Evento | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState<Omit<Evento, 'id'>>(EMPTY_EV)

  // pieces editor inside new/edit modal
  const [pecaSelect, setPecaSelect] = useState('')
  const [pecaQtd, setPecaQtd]       = useState(5)
  const [formPecas, setFormPecas]   = useState<PecaEvento[]>([])

  // filter
  const [classFilter, setClassFilter] = useState<ClassificacaoEvento | 'todos'>('todos')

  // ── Computed ───────────────────────────────────────────────────────────────
  const eventosByDate = useMemo(() => {
    const map: Record<string, Evento[]> = {}
    eventos.forEach(e => {
      if (!map[e.data]) map[e.data] = []
      map[e.data].push(e)
    })
    return map
  }, [eventos])

  const upcoming = useMemo(() =>
    [...eventos]
      .filter(e => diasRestantes(e.data) >= 0)
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 8),
  [eventos])

  const chartData = useMemo(() =>
    upcoming.slice(0, 10).map(e => ({
      nome: e.nome.length > 22 ? e.nome.slice(0, 20) + '…' : e.nome,
      dias: diasRestantes(e.data),
      classificacao: e.classificacao,
      dot: CLASS_CFG[e.classificacao].dot,
    })),
  [upcoming])

  const totalEventos   = eventos.length
  const totalCusto     = eventos.reduce((s, e) => s + (e.custo ?? 0), 0)
  const proximoEvento  = upcoming[0] ?? null
  const feriadosSazo   = eventos.filter(e => e.classificacao === 'feriado' || e.classificacao === 'sazonal').length

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openNovo() {
    setEditId(null)
    setForm(EMPTY_EV)
    setFormPecas([])
    setPecaSelect('')
    setPecaQtd(5)
    setEditModalOpen(true)
  }

  function openEdit(e: Evento) {
    setDetailEv(null)
    setEditId(e.id)
    setForm({
      nome: e.nome, data: e.data, dataFim: e.dataFim ?? '',
      classificacao: e.classificacao, local: e.local ?? '',
      descricao: e.descricao ?? '', emailContato: e.emailContato ?? '',
      telefoneContato: e.telefoneContato ?? '', custo: e.custo,
      pecasRecomendadas: [],
    })
    setFormPecas(e.pecasRecomendadas ?? [])
    setPecaSelect('')
    setPecaQtd(5)
    setEditModalOpen(true)
  }

  function handleSalvar() {
    if (!form.nome || !form.data) return
    const payload = { ...form, pecasRecomendadas: formPecas }
    if (editId) updateEvento(editId, payload)
    else addEvento(payload)
    setEditModalOpen(false)
  }

  function handleDelete(id: string, nome: string) {
    if (confirm(`Excluir evento "${nome}"?`)) {
      deleteEvento(id)
      if (detailEv?.id === id) setDetailEv(null)
    }
  }

  function addPeca() {
    if (!pecaSelect) return
    const b = bordados.find(x => x.codigo === pecaSelect)
    if (!b || formPecas.find(p => p.bordadoCodigo === pecaSelect)) return
    setFormPecas(prev => [...prev, { bordadoCodigo: b.codigo, bordadoNome: b.descricao, quantidade: pecaQtd }])
    setPecaSelect('')
    setPecaQtd(5)
  }

  function updatePecaQtd(codigo: string, qtd: number) {
    setFormPecas(prev => prev.map(p => p.bordadoCodigo === codigo ? { ...p, quantidade: qtd } : p))
  }

  // ── Calendar render ────────────────────────────────────────────────────────
  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const daysInMonth  = getDaysInMonth(calYear, calMonth)
  const firstWeekday = getFirstWeekday(calYear, calMonth)

  const calCells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // pad to complete last row
  while (calCells.length % 7 !== 0) calCells.push(null)

  const todayStr = today()

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <p className="page-subtitle">Calendário de eventos, feriados e oportunidades sazonais</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="kpi-label">Total de Eventos</p>
          <p className="kpi-value">{totalEventos}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Próximo Evento</p>
          {proximoEvento ? (
            <>
              <p className="kpi-value text-xl leading-tight">{proximoEvento.nome}</p>
              <p className="kpi-sub font-semibold" style={{ color: GOLD }}>
                {fmtDias(diasRestantes(proximoEvento.data))}
              </p>
            </>
          ) : (
            <p className="kpi-value">—</p>
          )}
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Feriados + Sazonais</p>
          <p className="kpi-value">{feriadosSazo}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Investimento Total</p>
          <p className="kpi-value text-2xl">{fmtBRL(totalCusto)}</p>
          <p className="kpi-sub">em eventos</p>
        </div>
      </div>

      {/* Filter chips + Add */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(['todos', ...CLASSIFICACOES] as const).map(c => {
            const active = classFilter === c
            const cfg = c !== 'todos' ? CLASS_CFG[c] : null
            return (
              <button key={c} onClick={() => setClassFilter(c)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={{
                  background: active ? (cfg?.dot ?? GOLD) : (cfg?.bg ?? SAND),
                  color: active ? '#fff' : (cfg?.text ?? COFFEE),
                }}>
                {c === 'todos' ? 'Todos' : cfg!.label}
              </button>
            )
          })}
        </div>
        <button className="btn-primary" onClick={openNovo}>
          <Plus size={15} /> Novo Evento
        </button>
      </div>

      {/* Main grid: Calendar + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── CALENDAR ── */}
        <div className="lg:col-span-2 card">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="btn-secondary p-1.5"><ChevronLeft size={16} /></button>
            <h3 className="font-heading font-semibold text-base" style={{ color: COFFEE }}>
              {MONTHS_PT[calMonth]} {calYear}
            </h3>
            <button onClick={nextMonth} className="btn-secondary p-1.5"><ChevronRight size={16} /></button>
          </div>

          {/* Weekday headers + Day cells (scrollable on small screens) */}
          <div className="overflow-x-auto">
          <div style={{ minWidth: 280 }}>
          <div className="grid grid-cols-7 mb-1">
            {DAYS_PT.map(d => (
              <div key={d} className="text-center text-xs font-semibold py-1"
                style={{ color: '#9A7540' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {calCells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const evs = (eventosByDate[dateStr] ?? []).filter(
                e => classFilter === 'todos' || e.classificacao === classFilter
              )
              const isToday = dateStr === todayStr
              return (
                <div key={day}
                  className={`min-h-[52px] rounded-lg p-1 ${evs.length > 0 ? 'cursor-pointer hover:opacity-80' : ''}`}
                  style={{
                    background: isToday ? `${GOLD}20` : 'transparent',
                    border: isToday ? `1.5px solid ${GOLD}` : '1px solid transparent',
                  }}
                  onClick={() => evs.length > 0 && setDetailEv(evs[0])}>
                  <p className="text-xs font-medium mb-0.5" style={{
                    color: isToday ? GOLD : COFFEE,
                    fontWeight: isToday ? 700 : 400,
                  }}>{day}</p>
                  <div className="flex flex-wrap gap-0.5">
                    {evs.slice(0, 3).map(e => (
                      <span key={e.id}
                        className="w-2 h-2 rounded-full block"
                        style={{ background: CLASS_CFG[e.classificacao].dot }}
                        title={e.nome} />
                    ))}
                  </div>
                  {evs.length > 0 && (
                    <p className="text-xs leading-tight truncate mt-0.5"
                      style={{ color: CLASS_CFG[evs[0].classificacao].text, fontSize: '10px' }}>
                      {evs[0].nome}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          </div>{/* min-width wrapper */}
          </div>{/* overflow-x-auto */}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t" style={{ borderColor: SAND }}>
            {CLASSIFICACOES.map(c => (
              <span key={c} className="flex items-center gap-1 text-xs" style={{ color: '#9A7540' }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CLASS_CFG[c].dot }} />
                {CLASS_CFG[c].label}
              </span>
            ))}
          </div>
        </div>

        {/* ── UPCOMING LIST ── */}
        <div className="space-y-2">
          <h3 className="font-heading font-semibold text-sm" style={{ color: '#9A7540' }}>
            Próximos eventos
          </h3>
          {upcoming.length === 0 && (
            <p className="text-sm" style={{ color: '#B09070' }}>Nenhum evento futuro</p>
          )}
          {upcoming.map(e => {
            const dias = diasRestantes(e.data)
            return (
              <div key={e.id}
                className="card p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDetailEv(e)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: COFFEE }}>{e.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>{fmtDate(e.data)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <ClassBadge c={e.classificacao} />
                    <span className="text-xs font-bold" style={{ color: dias <= 7 ? '#DC2626' : GOLD }}>
                      {fmtDias(dias)}
                    </span>
                  </div>
                </div>
                {e.local && (
                  <p className="flex items-center gap-1 text-xs mt-1" style={{ color: '#B09070' }}>
                    <MapPin size={10} /> {e.local}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CHART: Dias Restantes ── */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-heading font-semibold text-sm mb-4" style={{ color: COFFEE }}>
            Contagem regressiva — próximos eventos
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 36)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={SAND} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9A7540' }} tickLine={false}
                label={{ value: 'dias restantes', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#B09070' }} />
              <YAxis type="category" dataKey="nome" width={170} tick={{ fontSize: 11, fill: COFFEE }} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'white', border: `1px solid ${SAND}`, borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} dias`, 'Restam']} />
              <Bar dataKey="dias" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.dot} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── MODAL: Detalhe do Evento ── */}
      {detailEv && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailEv(null)}>
          <div className="modal-box w-full" style={{ maxWidth: 640 }}>
            {/* Header */}
            <div className="modal-header">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ClassBadge c={detailEv.classificacao} />
                  {detailEv.custo != null && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: CREAM, color: '#9A7540' }}>
                      Custo: {fmtBRL(detailEv.custo)}
                    </span>
                  )}
                </div>
                <h3 className="font-heading text-xl font-semibold" style={{ color: COFFEE }}>
                  {detailEv.nome}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: '#9A7540' }}>
                  {fmtDate(detailEv.data)}
                  {detailEv.dataFim && ` → ${fmtDate(detailEv.dataFim)}`}
                  {' · '}
                  <span className="font-semibold" style={{
                    color: diasRestantes(detailEv.data) <= 7 && diasRestantes(detailEv.data) >= 0
                      ? '#DC2626' : GOLD,
                  }}>
                    {fmtDias(diasRestantes(detailEv.data))}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => openEdit(detailEv)}>
                  <Edit2 size={12} /> Editar
                </button>
                <button onClick={() => setDetailEv(null)} className="p-1.5 rounded-lg" style={{ color: '#9A7540' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body space-y-4">
              {/* Info row */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detailEv.local && (
                  <div className="flex items-start gap-2 p-3 rounded-xl"
                    style={{ background: CREAM, border: `1px solid ${SAND}` }}>
                    <MapPin size={14} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#9A7540' }}>Local</p>
                      <p style={{ color: COFFEE }}>{detailEv.local}</p>
                    </div>
                  </div>
                )}
                {(detailEv.telefoneContato || detailEv.emailContato) && (
                  <div className="flex flex-col gap-1 p-3 rounded-xl"
                    style={{ background: CREAM, border: `1px solid ${SAND}` }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: '#9A7540' }}>Contato</p>
                    {detailEv.telefoneContato && (
                      <p className="flex items-center gap-1 text-sm" style={{ color: COFFEE }}>
                        <Phone size={12} style={{ color: GOLD }} /> {detailEv.telefoneContato}
                      </p>
                    )}
                    {detailEv.emailContato && (
                      <p className="flex items-center gap-1 text-sm" style={{ color: COFFEE }}>
                        <Mail size={12} style={{ color: GOLD }} /> {detailEv.emailContato}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {detailEv.descricao && (
                <p className="text-sm italic p-3 rounded-xl"
                  style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: '#6B4C2A' }}>
                  {detailEv.descricao}
                </p>
              )}

              {/* Recomendações de peças */}
              {(() => {
                const pecas = (detailEv.pecasRecomendadas && detailEv.pecasRecomendadas.length > 0)
                  ? detailEv.pecasRecomendadas
                  : autoSuggest(detailEv, bordados)
                const isAuto = !detailEv.pecasRecomendadas || detailEv.pecasRecomendadas.length === 0
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={14} style={{ color: GOLD }} />
                      <p className="text-sm font-semibold" style={{ color: COFFEE }}>
                        Peças recomendadas
                      </p>
                      {isAuto && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: SAND, color: '#9A7540' }}>sugestão automática</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {pecas.map(p => (
                        <div key={p.bordadoCodigo}
                          className="flex items-center justify-between px-3 py-2 rounded-lg"
                          style={{ background: CREAM, border: `1px solid ${SAND}` }}>
                          <span className="text-sm" style={{ color: COFFEE }}>
                            {p.bordadoNome.replace('BORDADO ', '')}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${GOLD}20`, color: GOLD }}>
                            {p.quantidade} un
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Delete button */}
              <div className="pt-2 border-t" style={{ borderColor: SAND }}>
                <button className="btn-danger" onClick={() => handleDelete(detailEv.id, detailEv.nome)}>
                  <Trash2 size={13} /> Excluir evento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Novo / Editar Evento ── */}
      <Modal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditId(null) }}
        title={editId ? 'Editar Evento' : 'Novo Evento'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditModalOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSalvar}>Salvar</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-grid">
            <div className="form-group span-2">
              <label className="form-label">Nome do Evento *</label>
              <input className="sacra-input" placeholder="Ex: Bazar Paroquial São José"
                value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Classificação</label>
              <select className="sacra-select" value={form.classificacao}
                onChange={e => setForm(p => ({ ...p, classificacao: e.target.value as ClassificacaoEvento }))}>
                {CLASSIFICACOES.map(c => (
                  <option key={c} value={c}>{CLASS_CFG[c].label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Custo estimado (R$)</label>
              <input type="number" step="0.01" min="0" className="sacra-input"
                placeholder="Opcional"
                value={form.custo ?? ''}
                onChange={e => setForm(p => ({ ...p, custo: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Data de início *</label>
              <input type="date" className="sacra-input" value={form.data}
                onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Data de fim</label>
              <input type="date" className="sacra-input" value={form.dataFim ?? ''}
                onChange={e => setForm(p => ({ ...p, dataFim: e.target.value }))} />
            </div>
            <div className="form-group span-2">
              <label className="form-label">Local</label>
              <input className="sacra-input" placeholder="Ex: Paróquia São José, Natal RN"
                value={form.local ?? ''} onChange={e => setForm(p => ({ ...p, local: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="sacra-input" placeholder="(84) 99999-0000"
                value={form.telefoneContato ?? ''} onChange={e => setForm(p => ({ ...p, telefoneContato: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input type="email" className="sacra-input" placeholder="contato@evento.com"
                value={form.emailContato ?? ''} onChange={e => setForm(p => ({ ...p, emailContato: e.target.value }))} />
            </div>
            <div className="form-group span-2">
              <label className="form-label">Descrição / observações</label>
              <textarea className="sacra-input" rows={2} placeholder="Detalhes do evento..."
                value={form.descricao ?? ''} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
            </div>
          </div>

          {/* Peças recomendadas editor */}
          <div>
            <p className="form-label mb-2">Peças recomendadas para o evento</p>
            <div className="flex gap-2 mb-2">
              <select className="sacra-select flex-1 text-sm" value={pecaSelect}
                onChange={e => setPecaSelect(e.target.value)}>
                <option value="">Selecionar bordado...</option>
                {bordados
                  .filter(b => !formPecas.find(p => p.bordadoCodigo === b.codigo))
                  .map(b => (
                    <option key={b.codigo} value={b.codigo}>
                      {b.descricao.replace('BORDADO ', '')}
                    </option>
                  ))}
              </select>
              <input type="number" min={1} className="sacra-input w-20 text-center text-sm"
                value={pecaQtd} onChange={e => setPecaQtd(Number(e.target.value))} />
              <button className="btn-secondary text-xs px-3 whitespace-nowrap" onClick={addPeca}>
                <Plus size={13} /> Add
              </button>
            </div>
            {formPecas.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {formPecas.map(p => (
                  <div key={p.bordadoCodigo}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: CREAM, border: `1px solid ${SAND}` }}>
                    <span className="flex-1 text-xs truncate" style={{ color: COFFEE }}>
                      {p.bordadoNome.replace('BORDADO ', '')}
                    </span>
                    <input type="number" min={1} className="sacra-input w-16 text-center text-xs py-1"
                      value={p.quantidade}
                      onChange={e => updatePecaQtd(p.bordadoCodigo, Number(e.target.value))} />
                    <span className="text-xs" style={{ color: '#9A7540' }}>un</span>
                    <button className="text-red-400 hover:text-red-600"
                      onClick={() => setFormPecas(prev => prev.filter(x => x.bordadoCodigo !== p.bordadoCodigo))}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
