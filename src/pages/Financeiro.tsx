import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useStore, calcPontoEquilibrio } from '../hooks/useStore'
import { fmtBRL, fmtPct, nanoid } from '../utils/format'
import Modal from '../components/ui/Modal'
import type { ItemMix } from '../types'

const GOLD = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND = '#E7DCC8'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: SAND, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: '#D4AD72', fontSize: 12 }}>
          {p.name}: {fmtBRL(p.value)}
        </p>
      ))}
    </div>
  )
}

const EMPTY_MIX: Omit<ItemMix, 'id'> = {
  produto: '',
  fornecedor: '',
  quantidade: 0,
  precoVenda: 0,
  custoCompra: 0,
  custoBordado: 0,
  custoEmbalagem: 3.20,
  margemContribuicao: 0,
  margemPercent: 0,
  faturamento: 0,
}

export default function Financeiro() {
  const { mixProdutos, custosFixos, parametros, dreMeses, addItemMix, deleteItemMix, updateItemMix } = useStore()
  const [tab, setTab] = useState<'mix' | 'pe' | 'dre'>('mix')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<ItemMix, 'id'>>(EMPTY_MIX)

  const pe = useMemo(
    () => calcPontoEquilibrio(custosFixos, mixProdutos, parametros),
    [custosFixos, mixProdutos, parametros]
  )

  const totalFat = mixProdutos.reduce((s, i) => s + i.faturamento, 0)
  const totalMC = mixProdutos.reduce((s, i) => s + i.margemContribuicao * i.quantidade, 0)
  const totalQtd = mixProdutos.reduce((s, i) => s + i.quantidade, 0)

  const setF = (k: keyof Omit<ItemMix, 'id'>, val: any) => {
    setForm((prev) => {
      const next = { ...prev, [k]: val }
      const faturamento = Number(next.quantidade) * Number(next.precoVenda)
      const custoVar = Number(next.custoCompra) + Number(next.custoBordado) + Number(next.custoEmbalagem)
      const comissao = Number(next.precoVenda) * parametros.comissaoVarejo
      const taxaCartao = Number(next.precoVenda) * parametros.taxaCartao * parametros.percentualCartao
      const mc = Number(next.precoVenda) - custoVar - comissao - taxaCartao - Number(next.precoVenda) * parametros.despesaVariavel
      next.faturamento = faturamento
      next.margemContribuicao = mc
      next.margemPercent = next.precoVenda > 0 ? (mc / Number(next.precoVenda)) * 100 : 0
      return next
    })
  }

  const handleSubmit = () => {
    if (!form.produto) return
    if (editId) {
      updateItemMix(editId, form)
      setEditId(null)
    } else {
      addItemMix(form)
    }
    setForm(EMPTY_MIX)
    setModalOpen(false)
  }

  const openEdit = (item: ItemMix) => {
    setEditId(item.id)
    setForm({ produto: item.produto, fornecedor: item.fornecedor, quantidade: item.quantidade, precoVenda: item.precoVenda, custoCompra: item.custoCompra, custoBordado: item.custoBordado, custoEmbalagem: item.custoEmbalagem, margemContribuicao: item.margemContribuicao, margemPercent: item.margemPercent, faturamento: item.faturamento })
    setModalOpen(true)
  }

  const chartDataPE = [
    { name: 'Custo Fixo', value: pe.custoFixoTotal },
    { name: 'PE Monetário', value: pe.peMonetario },
    { name: 'Faturamento Projetado', value: pe.faturamentoAtual },
  ]

  return (
    <div className="space-y-5">
      <p className="page-subtitle">Mix de produtos, ponto de equilíbrio e demonstrativo de resultado</p>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--sacra-sand)' }}>
        {([
          ['mix', 'Mix de Produtos'],
          ['pe', 'Ponto de Equilíbrio'],
          ['dre', 'DRE Comparativo'],
        ] as const).map(([t, lbl]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium transition-colors -mb-px"
            style={{
              borderBottom: tab === t ? '2px solid var(--sacra-gold)' : '2px solid transparent',
              color: tab === t ? 'var(--sacra-gold)' : 'var(--sacra-brown)',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* ── MIX ── */}
      {tab === 'mix' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kpi-card">
              <p className="kpi-label">Faturamento Projetado</p>
              <p className="kpi-value text-2xl">{fmtBRL(totalFat)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">MC Total</p>
              <p className="kpi-value text-2xl">{fmtBRL(totalMC)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Margem Média</p>
              <p className="kpi-value text-2xl">{totalFat > 0 ? fmtPct((totalMC / totalFat) * 100) : '—'}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Total de Peças</p>
              <p className="kpi-value text-2xl">{totalQtd}</p>
            </div>
          </div>

          <div className="card">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mixProdutos.map((i) => ({ name: i.produto, faturamento: i.faturamento, mc: i.margemContribuicao * i.quantidade }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B4C2A' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B4C2A' }} tickFormatter={(v) => fmtBRL(v)} width={75} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="faturamento" name="Faturamento" fill={GOLD} radius={[4, 4, 0, 0]} />
                <Bar dataKey="mc" name="Margem Contribuição" fill={COFFEE} radius={[4, 4, 0, 0]} />
                <Legend formatter={(v) => <span style={{ color: COFFEE, fontSize: 12 }}>{v}</span>} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => { setEditId(null); setForm(EMPTY_MIX); setModalOpen(true) }}>
              <Plus size={15} /> Adicionar Produto ao Mix
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="sacra-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Fornecedor</th>
                    <th className="text-center">Qtd</th>
                    <th>Preço Venda</th>
                    <th>Custo Compra</th>
                    <th>MC Unit.</th>
                    <th className="text-center">Margem %</th>
                    <th>Faturamento</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {mixProdutos.map((i) => (
                    <tr key={i.id}>
                      <td className="font-medium text-sm">{i.produto}</td>
                      <td className="text-sm text-gray-500">{i.fornecedor}</td>
                      <td className="text-center">{i.quantidade}</td>
                      <td>{fmtBRL(i.precoVenda)}</td>
                      <td>{fmtBRL(i.custoCompra)}</td>
                      <td>{fmtBRL(i.margemContribuicao)}</td>
                      <td className="text-center">
                        <span className="font-semibold text-sm" style={{ color: i.margemPercent >= 50 ? '#166534' : i.margemPercent >= 35 ? '#92400E' : '#991B1B' }}>
                          {fmtPct(i.margemPercent)}
                        </span>
                      </td>
                      <td className="font-semibold">{fmtBRL(i.faturamento)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-secondary p-1.5" onClick={() => openEdit(i)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn-danger p-1.5" onClick={() => deleteItemMix(i.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PE ── */}
      {tab === 'pe' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="kpi-card">
              <p className="kpi-label">Custo Fixo Total</p>
              <p className="kpi-value text-2xl">{fmtBRL(pe.custoFixoTotal)}</p>
              <p className="kpi-sub">por mês</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">PE Monetário</p>
              <p className="kpi-value text-2xl">{fmtBRL(pe.peMonetario)}</p>
              <p className="kpi-sub">receita mínima necessária</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Faturamento Projetado</p>
              <p className="kpi-value text-2xl">{fmtBRL(pe.faturamentoAtual)}</p>
              <p className="kpi-sub" style={{ color: pe.margemSegurancaPercent >= 0 ? '#166534' : '#991B1B' }}>
                {pe.margemSegurancaPercent >= 0 ? '▲' : '▼'} Margem de segurança: {fmtPct(pe.margemSegurancaPercent)}
              </p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Margem MC Média</p>
              <p className="kpi-value text-2xl">{fmtPct(pe.margemContribuicaoMedia)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Rácio CM</p>
              <p className="kpi-value text-2xl">{fmtPct(pe.razioCM)}</p>
              <p className="kpi-sub">MC% - despesa variável 2%</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Margem de Segurança</p>
              <p className="kpi-value text-2xl" style={{ color: pe.margemSeguranca >= 0 ? 'var(--sacra-gold)' : '#DC2626' }}>
                {fmtBRL(pe.margemSeguranca)}
              </p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-heading text-lg mb-4" style={{ color: COFFEE }}>Comparativo Visual</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartDataPE} layout="vertical" margin={{ top: 0, right: 50, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SAND} horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => fmtBRL(v)} tick={{ fontSize: 11, fill: '#6B4C2A' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B4C2A' }} width={160} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {chartDataPE.map((entry, i) => (
                    <rect key={i} fill={[SAND, GOLD, COFFEE][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── DRE ── */}
      {tab === 'dre' && (
        <div className="space-y-5">
          <div className="card">
            <h3 className="font-heading text-lg mb-4" style={{ color: COFFEE }}>DRE Comparativo — 2026</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dreMeses} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6B4C2A' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B4C2A' }} tickFormatter={(v) => fmtBRL(v)} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="receitaBruta" name="Receita Bruta" stroke={GOLD} strokeWidth={2} />
                <Line type="monotone" dataKey="margemContribuicao" name="Margem Contribuição" stroke="#C0955A90" strokeWidth={2} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="lucroOperacional" name="Lucro Operacional" stroke={COFFEE} strokeWidth={2} />
                <Legend formatter={(v) => <span style={{ color: COFFEE, fontSize: 12 }}>{v}</span>} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="sacra-table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Receita Bruta</th>
                    <th>Deduções</th>
                    <th>Receita Líquida</th>
                    <th>Custo Variável</th>
                    <th>Margem Contrib.</th>
                    <th>Custo Fixo</th>
                    <th>Lucro Operacional</th>
                    <th className="text-center">Margem %</th>
                  </tr>
                </thead>
                <tbody>
                  {dreMeses.map((m) => (
                    <tr key={m.mes}>
                      <td className="font-medium">{m.mes}</td>
                      <td>{fmtBRL(m.receitaBruta)}</td>
                      <td style={{ color: '#991B1B' }}>({fmtBRL(m.deducoes)})</td>
                      <td>{fmtBRL(m.receitaLiquida)}</td>
                      <td style={{ color: '#991B1B' }}>({fmtBRL(m.custoVariavel)})</td>
                      <td className="font-semibold">{fmtBRL(m.margemContribuicao)}</td>
                      <td style={{ color: '#991B1B' }}>({fmtBRL(m.custoFixo)})</td>
                      <td className="font-semibold" style={{ color: m.lucroOperacional >= 0 ? '#166534' : '#991B1B' }}>
                        {fmtBRL(m.lucroOperacional)}
                      </td>
                      <td className="text-center">
                        <span style={{ color: m.margemPercent >= 0 ? '#166534' : '#991B1B', fontWeight: 600, fontSize: 13 }}>
                          {fmtPct(m.margemPercent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mix */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditId(null); setForm(EMPTY_MIX) }}
        title={editId ? 'Editar Item do Mix' : 'Adicionar ao Mix'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalOpen(false); setEditId(null); setForm(EMPTY_MIX) }}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit}>Salvar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group span-2">
            <label className="form-label">Produto</label>
            <input className="sacra-input" placeholder="Nome do produto" value={form.produto} onChange={(e) => setF('produto', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Fornecedor</label>
            <input className="sacra-input" placeholder="Fornecedor" value={form.fornecedor} onChange={(e) => setF('fornecedor', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Quantidade</label>
            <input type="number" min={0} className="sacra-input" value={form.quantidade} onChange={(e) => setF('quantidade', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Preço de Venda (R$)</label>
            <input type="number" step="0.01" className="sacra-input" value={form.precoVenda} onChange={(e) => setF('precoVenda', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Custo Compra (R$)</label>
            <input type="number" step="0.01" className="sacra-input" value={form.custoCompra} onChange={(e) => setF('custoCompra', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Custo Bordado (R$)</label>
            <input type="number" step="0.01" className="sacra-input" value={form.custoBordado} onChange={(e) => setF('custoBordado', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Embalagem (R$)</label>
            <input type="number" step="0.01" className="sacra-input" value={form.custoEmbalagem} onChange={(e) => setF('custoEmbalagem', Number(e.target.value))} />
          </div>
          {form.precoVenda > 0 && (
            <div className="form-group span-2 p-3 rounded-xl" style={{ background: 'var(--sacra-cream)', border: '1px solid var(--sacra-sand)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#9A7540' }}>MC Unitária:</span>
                <span className="font-semibold">{fmtBRL(form.margemContribuicao)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span style={{ color: '#9A7540' }}>Margem %:</span>
                <span className="font-semibold" style={{ color: form.margemPercent >= 40 ? '#166534' : '#991B1B' }}>
                  {fmtPct(form.margemPercent)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
