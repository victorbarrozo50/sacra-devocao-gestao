import { useState, useMemo } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useStore } from '../hooks/useStore'
import { fmtBRL } from '../utils/format'
import Modal from '../components/ui/Modal'
import type { CustoFixo } from '../types'

const PALETTE = ['#C0955A', '#3E2A1B', '#E7DCC8', '#9A7540', '#5C3D28', '#D4AD72', '#6B4C2A', '#F5EFE4']
const COFFEE = '#3E2A1B'
const GOLD = '#C0955A'

const EMPTY: Omit<CustoFixo, 'id'> = {
  categoria: '',
  descricao: '',
  valor: 0,
}

export default function Custos() {
  const { custosFixos, addCustoFixo, updateCustoFixo, deleteCustoFixo, parametros, updateParametros } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<CustoFixo, 'id'>>(EMPTY)
  const [tab, setTab] = useState<'fixos' | 'variaveis'>('fixos')

  const total = useMemo(
    () => custosFixos.reduce((s, c) => s + c.valor, 0),
    [custosFixos]
  )

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>()
    custosFixos.forEach((c) => {
      map.set(c.categoria, (map.get(c.categoria) ?? 0) + c.valor)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [custosFixos])

  const categorias = useMemo(
    () => [...new Set(custosFixos.map((c) => c.categoria))],
    [custosFixos]
  )

  const handleSubmit = () => {
    if (!form.categoria || !form.descricao || !form.valor) return
    if (editId) {
      updateCustoFixo(editId, form)
      setEditId(null)
    } else {
      addCustoFixo(form)
    }
    setForm(EMPTY)
    setModalOpen(false)
  }

  const openEdit = (c: CustoFixo) => {
    setEditId(c.id)
    setForm({ categoria: c.categoria, descricao: c.descricao, valor: c.valor })
    setModalOpen(true)
  }

  return (
    <div className="space-y-5">
      <p className="page-subtitle">Estrutura de custos fixos e parâmetros variáveis</p>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--sacra-sand)' }}>
        {([
          ['fixos', 'Custos Fixos'],
          ['variaveis', 'Parâmetros Variáveis'],
        ] as const).map(([t, lbl]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium -mb-px"
            style={{
              borderBottom: tab === t ? '2px solid var(--sacra-gold)' : '2px solid transparent',
              color: tab === t ? 'var(--sacra-gold)' : 'var(--sacra-brown)',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* ── CUSTOS FIXOS ── */}
      {tab === 'fixos' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="kpi-card">
              <p className="kpi-label">Total Mensal</p>
              <p className="kpi-value">{fmtBRL(total)}</p>
              <p className="kpi-sub">{custosFixos.length} itens</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Maior categoria</p>
              <p className="kpi-value text-2xl">
                {porCategoria.sort((a, b) => b.value - a.value)[0]?.name ?? '—'}
              </p>
              <p className="kpi-sub">
                {porCategoria.length > 0 ? fmtBRL(porCategoria.sort((a, b) => b.value - a.value)[0].value) : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Pie */}
            <div className="card">
              <h3 className="font-heading text-lg mb-3" style={{ color: COFFEE }}>Por Categoria</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={porCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {porCategoria.map((entry, i) => (
                      <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  <Legend formatter={(v) => <span style={{ color: COFFEE, fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Grouped list */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-heading text-lg" style={{ color: COFFEE }}>Resumo por Categoria</h3>
              </div>
              {porCategoria.sort((a, b) => b.value - a.value).map((cat, i) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: COFFEE }}>{cat.name}</span>
                    <span className="font-semibold">{fmtBRL(cat.value)}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'var(--sacra-sand)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(cat.value / total) * 100}%`,
                        background: PALETTE[i % PALETTE.length],
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between font-semibold" style={{ borderColor: 'var(--sacra-sand)' }}>
                <span>Total</span>
                <span style={{ color: GOLD }}>{fmtBRL(total)}</span>
              </div>
            </div>
          </div>

          {/* Tabela detalhada */}
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => { setEditId(null); setForm(EMPTY); setModalOpen(true) }}>
              <Plus size={15} /> Adicionar Custo
            </button>
          </div>

          {categorias.map((cat) => (
            <div key={cat} className="card p-0 overflow-hidden">
              <div
                className="px-4 py-2.5 flex items-center justify-between border-b"
                style={{ background: 'var(--sacra-cream)', borderColor: 'var(--sacra-sand)' }}
              >
                <h4 className="font-medium text-sm" style={{ color: COFFEE }}>{cat}</h4>
                <span className="text-sm font-semibold" style={{ color: GOLD }}>
                  {fmtBRL(custosFixos.filter((c) => c.categoria === cat).reduce((s, c) => s + c.valor, 0))}
                </span>
              </div>
              <table className="sacra-table">
                <tbody>
                  {custosFixos.filter((c) => c.categoria === cat).map((c) => (
                    <tr key={c.id}>
                      <td className="text-sm">{c.descricao}</td>
                      <td className="font-semibold w-32 text-right">{fmtBRL(c.valor)}</td>
                      <td className="w-20 text-right">
                        <div className="flex gap-1 justify-end">
                          <button className="btn-secondary p-1.5" onClick={() => openEdit(c)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn-danger p-1.5" onClick={() => deleteCustoFixo(c.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* ── VARIÁVEIS ── */}
      {tab === 'variaveis' && (
        <div className="space-y-5">
          <div className="card max-w-lg">
            <h3 className="font-heading text-lg mb-4" style={{ color: COFFEE }}>Comissões e Taxas</h3>
            <div className="space-y-4">
              {[
                { label: 'Comissão Varejo', key: 'comissaoVarejo', val: parametros.comissaoVarejo, pct: true },
                { label: 'Comissão Atacado', key: 'comissaoAtacado', val: parametros.comissaoAtacado, pct: true },
                { label: 'Taxa Cartão', key: 'taxaCartao', val: parametros.taxaCartao, pct: true },
                { label: '% Vendas no Cartão', key: 'percentualCartao', val: parametros.percentualCartao, pct: true },
                { label: 'Despesa Variável', key: 'despesaVariavel', val: parametros.despesaVariavel, pct: true },
                { label: 'Desconto Atacado Cartão', key: 'descontoAtacadoCartao', val: parametros.descontoAtacadoCartao, pct: true },
                { label: 'Desconto Atacado À Vista', key: 'descontoAtacadoVista', val: parametros.descontoAtacadoVista, pct: true },
              ].map(({ label, key, val, pct }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium" style={{ color: COFFEE }}>{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="sacra-input w-28 text-right"
                      value={val}
                      onChange={(e) => updateParametros({ [key]: Number(e.target.value) })}
                    />
                    {pct && <span className="text-sm" style={{ color: '#9A7540' }}>({(val * 100).toFixed(1)}%)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card max-w-lg">
            <h3 className="font-heading text-lg mb-4" style={{ color: COFFEE }}>Embalagem e Materiais</h3>
            <div className="space-y-3">
              {[
                ['Embalagem Pequena (R$)', 'embalagem.pequena'],
                ['Embalagem Média (R$)', 'embalagem.media'],
                ['Embalagem Grande (R$)', 'embalagem.grande'],
              ].map(([label, path]) => {
                const [, sub] = path.split('.')
                return (
                  <div key={path} className="flex items-center justify-between gap-4">
                    <label className="text-sm font-medium" style={{ color: COFFEE }}>{label}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="sacra-input w-28 text-right"
                      value={(parametros.embalagem as any)[sub]}
                      onChange={(e) =>
                        updateParametros({
                          embalagem: { ...parametros.embalagem, [sub]: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                )
              })}
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium" style={{ color: COFFEE }}>Etiquetas (R$)</label>
                <input type="number" step="0.01" min="0" className="sacra-input w-28 text-right" value={parametros.etiquetas} onChange={(e) => updateParametros({ etiquetas: Number(e.target.value) })} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium" style={{ color: COFFEE }}>Materiais (R$)</label>
                <input type="number" step="0.01" min="0" className="sacra-input w-28 text-right" value={parametros.materiais} onChange={(e) => updateParametros({ materiais: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Custo */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditId(null); setForm(EMPTY) }}
        title={editId ? 'Editar Custo' : 'Novo Custo Fixo'}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalOpen(false); setEditId(null); setForm(EMPTY) }}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit}>Salvar</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <input
              className="sacra-input"
              placeholder="Ex: Aluguel, Pessoal..."
              list="categorias-list"
              value={form.categoria}
              onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
            />
            <datalist id="categorias-list">
              {categorias.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input
              className="sacra-input"
              placeholder="Ex: Aluguel Sala 1"
              value={form.descricao}
              onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Valor Mensal (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="sacra-input"
              value={form.valor}
              onChange={(e) => setForm((p) => ({ ...p, valor: Number(e.target.value) }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
