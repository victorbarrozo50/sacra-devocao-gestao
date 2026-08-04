import { useState, useMemo, useRef } from 'react'
import { Search, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useStore } from '../hooks/useStore'
import { fmtBRL, fmtNum, fmtPct, fmtDate, today } from '../utils/format'
import { ABCBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import type { Bordado } from '../types'

const GOLD = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND = '#E7DCC8'
const CREAM = '#F5EFE4'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: SAND, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: '#D4AD72', fontSize: 12 }}>
          {p.name}: {p.value > 100 ? fmtBRL(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

type FormBordado = {
  codigo: string
  descricao: string
  precoMedio: number
  custoUnitario: number
  fornecedor: string
  dataUltimoPedido: string
  foto: string
}

const EMPTY: FormBordado = {
  codigo: '',
  descricao: '',
  precoMedio: 0,
  custoUnitario: 0,
  fornecedor: '',
  dataUltimoPedido: today(),
  foto: '',
}

export default function Bordados() {
  const { bordados, addBordado, updateBordado, deleteBordado } = useStore()
  const [search, setSearch] = useState('')
  const [curva, setCurva] = useState<'todas' | 'A' | 'B' | 'C'>('todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editCodigo, setEditCodigo] = useState<string | null>(null)
  const [form, setForm] = useState<FormBordado>(EMPTY)
  const [fotoPreview, setFotoPreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    let list = [...bordados].sort((a, b) => b.valorTotal - a.valorTotal)
    if (curva !== 'todas') list = list.filter((b) => b.curvaABC === curva)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (b) => b.descricao.toLowerCase().includes(q) || b.codigo.includes(q)
      )
    }
    return list
  }, [bordados, search, curva])

  const top10 = [...bordados]
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 10)
    .map((b) => ({
      name: b.descricao.replace('BORDADO ', '').split(' ').slice(0, 3).join(' '),
      receita: b.valorTotal,
      qtd: b.quantidadeTotal,
    }))

  const totalReceita = bordados.reduce((s, b) => s + b.valorTotal, 0)
  const totalQtd = bordados.reduce((s, b) => s + b.quantidadeTotal, 0)
  const qtdA = bordados.filter((b) => b.curvaABC === 'A').length
  const receitaA = bordados.filter((b) => b.curvaABC === 'A').reduce((s, b) => s + b.valorTotal, 0)

  function openNovo() {
    setEditCodigo(null)
    setForm(EMPTY)
    setFotoPreview('')
    setModalOpen(true)
  }

  function openEdit(b: Bordado) {
    setEditCodigo(b.codigo)
    setForm({
      codigo: b.codigo,
      descricao: b.descricao,
      precoMedio: b.precoMedio,
      custoUnitario: b.custoUnitario ?? 0,
      fornecedor: b.fornecedor ?? '',
      dataUltimoPedido: b.dataUltimoPedido ?? today(),
      foto: b.foto ?? '',
    })
    setFotoPreview(b.foto ?? '')
    setModalOpen(true)
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setFotoPreview(result)
      setForm((p) => ({ ...p, foto: result }))
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    if (!form.codigo || !form.descricao) return
    if (editCodigo) {
      updateBordado(editCodigo, {
        codigo: form.codigo,
        descricao: form.descricao,
        precoMedio: form.precoMedio,
        custoUnitario: form.custoUnitario,
        fornecedor: form.fornecedor,
        dataUltimoPedido: form.dataUltimoPedido,
        foto: form.foto || undefined,
      })
    } else {
      addBordado({
        codigo: form.codigo,
        descricao: form.descricao,
        precoMedio: form.precoMedio,
        custoUnitario: form.custoUnitario,
        fornecedor: form.fornecedor,
        dataUltimoPedido: form.dataUltimoPedido,
        foto: form.foto || undefined,
      })
    }
    setModalOpen(false)
    setEditCodigo(null)
    setForm(EMPTY)
    setFotoPreview('')
  }

  function handleDelete(codigo: string) {
    if (confirm(`Excluir bordado ${codigo}?`)) deleteBordado(codigo)
  }

  const set = <K extends keyof FormBordado>(k: K, v: FormBordado[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="kpi-label">Total de Designs</p>
          <p className="kpi-value">{bordados.length}</p>
          <p className="kpi-sub">{qtdA} na Curva A</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Receita Total</p>
          <p className="kpi-value text-2xl">{fmtBRL(totalReceita)}</p>
          <p className="kpi-sub">{fmtNum(totalQtd)} unidades</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Receita Curva A</p>
          <p className="kpi-value text-2xl">{fmtBRL(receitaA)}</p>
          <p className="kpi-sub">{fmtPct((receitaA / totalReceita) * 100)} do total</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Preço Médio</p>
          <p className="kpi-value text-2xl">{fmtBRL(totalQtd > 0 ? totalReceita / totalQtd : 0)}</p>
          <p className="kpi-sub">por unidade bordada</p>
        </div>
      </div>

      {/* Top 10 Bar */}
      <div className="card">
        <h3 className="font-heading text-lg mb-4" style={{ color: COFFEE }}>Top 10 Designs por Receita</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={top10} margin={{ top: 0, right: 0, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#6B4C2A' }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6B4C2A' }} tickFormatter={(v) => `R$${v}`} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="receita" name="Receita" fill={GOLD} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9A7540' }} />
          <input
            className="sacra-input pl-9"
            placeholder="Buscar design..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['todas', 'A', 'B', 'C'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurva(c)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: curva === c ? 'var(--sacra-gold)' : 'white',
                color: curva === c ? 'white' : 'var(--sacra-coffee)',
                border: `1px solid ${curva === c ? 'var(--sacra-gold)' : 'var(--sacra-sand)'}`,
              }}
            >
              {c === 'todas' ? 'Todos' : `Curva ${c}`}
            </button>
          ))}
        </div>
        <button className="btn-primary ml-auto" onClick={openNovo}>
          <Plus size={15} /> Novo Bordado
        </button>
      </div>

      {/* Cards com foto (para bordados cadastrados manualmente) */}
      {filtered.some((b) => b.foto) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filtered.filter((b) => b.foto).map((b) => (
            <div
              key={b.codigo}
              className="card p-0 overflow-hidden cursor-pointer group"
              onClick={() => openEdit(b)}
            >
              <div className="aspect-square overflow-hidden" style={{ background: CREAM }}>
                <img
                  src={b.foto}
                  alt={b.descricao}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold truncate" style={{ color: COFFEE }}>
                  {b.descricao.replace('BORDADO ', '')}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs" style={{ color: '#9A7540' }}>
                    {b.custoUnitario ? fmtBRL(b.custoUnitario) : '—'}
                  </span>
                  <ABCBadge value={b.curvaABC} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="sacra-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Código</th>
                <th>Design</th>
                <th>Fornecedor</th>
                <th>Custo Unit.</th>
                <th className="text-center">Qtd</th>
                <th>Preço Médio</th>
                <th>Receita Total</th>
                <th className="text-center">% Total</th>
                <th className="text-center">Curva</th>
                <th>Último Pedido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-8" style={{ color: '#9A7540' }}>
                    Nenhum design encontrado
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr key={b.codigo}>
                  <td className="w-10">
                    {b.foto ? (
                      <img
                        src={b.foto}
                        alt={b.descricao}
                        className="w-9 h-9 rounded-lg object-cover"
                        style={{ border: `1px solid ${SAND}` }}
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: CREAM, border: `1px solid ${SAND}` }}
                      >
                        <ImageIcon size={14} style={{ color: '#C0B090' }} />
                      </div>
                    )}
                  </td>
                  <td className="font-mono text-xs" style={{ color: '#9A7540' }}>{b.codigo}</td>
                  <td className="font-medium text-sm">{b.descricao.replace('BORDADO ', '')}</td>
                  <td className="text-xs" style={{ color: '#9A7540' }}>{b.fornecedor ?? '—'}</td>
                  <td className="text-sm">{b.custoUnitario ? fmtBRL(b.custoUnitario) : '—'}</td>
                  <td className="text-center">{fmtNum(b.quantidadeTotal)}</td>
                  <td>{fmtBRL(b.precoMedio)}</td>
                  <td className="font-semibold">{fmtBRL(b.valorTotal)}</td>
                  <td className="text-center text-sm">{fmtPct(b.percentualTotal)}</td>
                  <td className="text-center">
                    <ABCBadge value={b.curvaABC} />
                  </td>
                  <td className="text-xs whitespace-nowrap" style={{ color: '#9A7540' }}>
                    {b.dataUltimoPedido ? fmtDate(b.dataUltimoPedido) : '—'}
                  </td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <button className="btn-secondary p-1.5" onClick={() => openEdit(b)}>
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-danger p-1.5" onClick={() => handleDelete(b.codigo)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--sacra-cream)', fontWeight: 600 }}>
                  <td colSpan={3} className="px-4 py-2 text-sm">Total ({filtered.length} designs)</td>
                  <td></td>
                  <td></td>
                  <td className="text-center px-4 py-2">{fmtNum(filtered.reduce((s, b) => s + b.quantidadeTotal, 0))}</td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2">{fmtBRL(filtered.reduce((s, b) => s + b.valorTotal, 0))}</td>
                  <td className="text-center px-4 py-2">{fmtPct(filtered.reduce((s, b) => s + b.percentualTotal, 0))}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Bordado */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCodigo(null); setForm(EMPTY); setFotoPreview('') }}
        title={editCodigo ? 'Editar Bordado' : 'Novo Bordado'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalOpen(false); setEditCodigo(null); setForm(EMPTY); setFotoPreview('') }}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSubmit}>Salvar</button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Foto */}
          <div className="form-group">
            <label className="form-label">Foto do Bordado</label>
            <div className="flex items-start gap-4">
              <div
                className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer"
                style={{ background: CREAM, border: `2px dashed ${SAND}` }}
                onClick={() => fileRef.current?.click()}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1" style={{ color: '#C0B090' }}>
                    <ImageIcon size={24} />
                    <span className="text-xs text-center">Clique para<br/>adicionar</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  className="hidden"
                  onChange={handleFotoChange}
                />
                <button
                  className="btn-secondary w-full"
                  onClick={() => fileRef.current?.click()}
                >
                  {fotoPreview ? 'Trocar foto' : 'Selecionar foto'}
                </button>
                {fotoPreview && (
                  <button
                    className="btn-danger w-full"
                    onClick={() => { setFotoPreview(''); setForm((p) => ({ ...p, foto: '' })) }}
                  >
                    Remover foto
                  </button>
                )}
                <p className="text-xs" style={{ color: '#B09070' }}>
                  JPG, PNG ou WebP. Armazenado localmente.
                </p>
              </div>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Código *</label>
              <input
                className="sacra-input"
                placeholder="Ex: B001"
                value={form.codigo}
                onChange={(e) => set('codigo', e.target.value.toUpperCase())}
                disabled={!!editCodigo}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nome do Bordado *</label>
              <input
                className="sacra-input"
                placeholder="Ex: SAGRADO CORAÇÃO"
                value={form.descricao}
                onChange={(e) => set('descricao', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Custo Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="sacra-input"
                value={form.custoUnitario}
                onChange={(e) => set('custoUnitario', Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preço Médio de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="sacra-input"
                value={form.precoMedio}
                onChange={(e) => set('precoMedio', Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fornecedor</label>
              <input
                className="sacra-input"
                placeholder="Nome do fornecedor"
                value={form.fornecedor}
                onChange={(e) => set('fornecedor', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Data do Último Pedido</label>
              <input
                type="date"
                className="sacra-input"
                value={form.dataUltimoPedido}
                onChange={(e) => set('dataUltimoPedido', e.target.value)}
              />
            </div>
          </div>

          {/* Margem preview */}
          {form.custoUnitario > 0 && form.precoMedio > 0 && (
            <div
              className="p-3 rounded-xl flex items-center justify-between"
              style={{ background: CREAM, border: `1px solid ${SAND}` }}
            >
              <div>
                <p className="text-xs" style={{ color: '#9A7540' }}>Margem estimada</p>
                <p className="font-heading text-lg font-semibold" style={{ color: GOLD }}>
                  {fmtPct(((form.precoMedio - form.custoUnitario) / form.precoMedio) * 100)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#9A7540' }}>Lucro bruto unit.</p>
                <p className="font-semibold" style={{ color: COFFEE }}>
                  {fmtBRL(form.precoMedio - form.custoUnitario)}
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
