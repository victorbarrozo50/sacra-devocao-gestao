import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ReferenceLine,
} from 'recharts'
import {
  Plus, Trash2, Edit2, TrendingUp, TrendingDown, Target,
  DollarSign, ShoppingBag, BarChart2, ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react'
import { useStore, calcPontoEquilibrio, calcDREMeses } from '../hooks/useStore'
import { fmtBRL, fmtPct, today } from '../utils/format'
import Modal from '../components/ui/Modal'
import type { CustoFixo, ItemMix, MovimentacaoCaixa, LancamentoPD } from '../types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'
const CREAM  = '#F5EFE4'
const PALETTE = ['#C0955A', '#3E2A1B', '#9A7540', '#D4AD72', '#5C3D28', '#6B4C2A', '#E7DCC8', '#F5EFE4']

type Tab = 'dashboard' | 'caixa' | 'desempenho' | 'custos'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mesAtual() {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}
function fmtMesLabel(ym: string) {
  const [y, m] = ym.split('-')
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${meses[Number(m) - 1]}/${y}`
}

function ProgressBar({ value, max, color = GOLD }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: SAND }}>
        <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: '#9A7540' }}>
        <span>{fmtBRL(value)}</span>
        <span>{pct.toFixed(1)}% de {fmtBRL(max)}</span>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: SAND, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: '#D4AD72', fontSize: 12 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? fmtBRL(p.value) : `${p.value}`}
        </p>
      ))}
    </div>
  )
}

// ─── EMPTY forms ──────────────────────────────────────────────────────────────
const EMPTY_PD: Omit<LancamentoPD, 'id'> = {
  data: '',
  tipo: 'presente',
  descricao: '',
  valor: 0,
}

const EMPTY_SAIDA: Omit<MovimentacaoCaixa, 'id'> = {
  data: today(),
  descricao: '',
  valor: 0,
  categoria: '',
}

const EMPTY_MIX: Omit<ItemMix, 'id'> = {
  produto: '', fornecedor: '', quantidade: 0, precoVenda: 0,
  custoCompra: 0, custoBordado: 0, custoEmbalagem: 4.00,
  margemContribuicao: 0, margemPercent: 0, faturamento: 0,
}

const EMPTY_CUSTO: Omit<CustoFixo, 'id'> = { categoria: '', descricao: '', valor: 0 }

// ─── Main component ───────────────────────────────────────────────────────────
export default function HubFinanceiro() {
  const {
    vendas, compras, custosFixos, parametros, mixProdutos,
    movimentacoes, addMovimentacao, deleteMovimentacao,
    addCustoFixo, updateCustoFixo, deleteCustoFixo,
    addItemMix, updateItemMix, deleteItemMix,
    updateParametros,
    lancamentosPD, addLancamentoPD, deleteLancamentoPD,
  } = useStore()

  const dreMeses = useMemo(
    () => calcDREMeses(vendas, compras, custosFixos, parametros),
    [vendas, compras, custosFixos, parametros]
  )

  const [tab, setTab] = useState<Tab>('dashboard')
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual())

  // Modal states
  const [modalSaida, setModalSaida] = useState(false)
  const [formSaida, setFormSaida] = useState<Omit<MovimentacaoCaixa, 'id'>>(EMPTY_SAIDA)

  const [modalMix, setModalMix] = useState(false)
  const [editMixId, setEditMixId] = useState<string | null>(null)
  const [formMix, setFormMix] = useState<Omit<ItemMix, 'id'>>(EMPTY_MIX)

  const [modalCusto, setModalCusto] = useState(false)
  const [editCustoId, setEditCustoId] = useState<string | null>(null)
  const [formCusto, setFormCusto] = useState<Omit<CustoFixo, 'id'>>(EMPTY_CUSTO)

  const [modalMeta, setModalMeta] = useState(false)
  const [metaInput, setMetaInput] = useState(String(parametros.metaMensal ?? 15000))

  const [modalPD, setModalPD] = useState(false)
  const [formPD, setFormPD] = useState<Omit<LancamentoPD, 'id'>>({ ...EMPTY_PD, data: mesAtual() + '-01' })
  const [limitePDInput, setLimitePDInput] = useState(String(parametros.limitePresenteDoacao ?? 300))

  // ── Derived — período ──────────────────────────────────────────────────────
  const vendasMes = useMemo(
    () => vendas.filter((v) => v.data.startsWith(mesSelecionado)),
    [vendas, mesSelecionado]
  )
  const vendasHoje = useMemo(
    () => vendas.filter((v) => v.data === today()),
    [vendas]
  )
  const faturamentoMes = vendasMes.reduce((s, v) => s + v.total, 0)
  const faturamentoHoje = vendasHoje.reduce((s, v) => s + v.total, 0)
  const pecasVendidasMes = vendasMes.reduce((s, v) => s + v.quantidade, 0)
  const ticketMedio = vendasMes.length > 0 ? faturamentoMes / vendasMes.length : 0
  const metaMensal = parametros.metaMensal ?? 15000

  // PE
  const pe = useMemo(
    () => calcPontoEquilibrio(custosFixos, mixProdutos, parametros),
    [custosFixos, mixProdutos, parametros]
  )
  const faltaPE = Math.max(0, pe.peMonetario - faturamentoMes)

  // Mix totals
  const mixFat = mixProdutos.reduce((s, i) => s + i.faturamento, 0)
  const mixMC  = mixProdutos.reduce((s, i) => s + i.margemContribuicao * i.quantidade, 0)
  const mixQtd = mixProdutos.reduce((s, i) => s + i.quantidade, 0)

  // ── Derived — pagamentos ───────────────────────────────────────────────────
  const pgtoData = useMemo(() => {
    const map: Record<string, { valor: number; qtd: number }> = {}
    vendasMes.forEach((v) => {
      if (!map[v.formaPagamento]) map[v.formaPagamento] = { valor: 0, qtd: 0 }
      map[v.formaPagamento].valor += v.total
      map[v.formaPagamento].qtd += 1
    })
    const labels: Record<string, string> = { cartao: 'Cartão', pix: 'Pix', dinheiro: 'Dinheiro' }
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] ?? k, valor: v.valor, qtd: v.qtd }))
  }, [vendasMes])

  // ── Derived — ranking de peças por vendas ─────────────────────────────────
  const rankingPecas = useMemo(() => {
    const map = new Map<string, { fat: number; qtd: number; mc: number; pecas: number }>()
    vendasMes.forEach((v) => {
      const key = v.descricaoBordado || v.codigoBordado
      const cur = map.get(key) ?? { fat: 0, qtd: 0, mc: 0, pecas: 0 }
      const mixItem = mixProdutos.find((m) =>
        m.produto.toLowerCase().includes((v.produto ?? '').toLowerCase()) ||
        (v.descricaoBordado && m.produto.toLowerCase().includes(v.descricaoBordado.toLowerCase().replace('bordado ', '')))
      )
      cur.fat += v.total
      cur.qtd += 1
      cur.pecas += v.quantidade
      cur.mc += (mixItem?.margemContribuicao ?? 0) * v.quantidade
      map.set(key, cur)
    })
    return Array.from(map.entries())
      .map(([nome, d]) => ({ nome, fat: d.fat, qtd: d.qtd, mc: d.mc, pecas: d.pecas }))
      .sort((a, b) => b.fat - a.fat)
      .slice(0, 8)
  }, [vendasMes, mixProdutos])

  // ── Derived — movimentações do mês ────────────────────────────────────────
  const saidasMes = useMemo(
    () => movimentacoes.filter((m) => m.data.startsWith(mesSelecionado)),
    [movimentacoes, mesSelecionado]
  )
  const totalSaidas = saidasMes.reduce((s, m) => s + m.valor, 0)

  const totalComprasMes = useMemo(() => {
    return compras
      .filter((c) =>
        c.dataPedido.startsWith(mesSelecionado) &&
        c.status !== 'aguardando' &&
        c.status !== 'cancelado'
      )
      .reduce((s, c) => s + c.valorTotal + (c.frete ?? 0), 0)
  }, [compras, mesSelecionado])

  const saldoCaixa = faturamentoMes - totalSaidas - totalComprasMes

  // Unified timeline for cash flow display
  const timelineCaixa = useMemo(() => {
    const entradas = vendasMes.map((v) => ({
      id: v.id, data: v.data, descricao: `Venda · ${v.descricaoBordado.replace('BORDADO ', '')}`,
      valor: v.total, tipo: 'entrada' as const, categoria: 'Venda',
    }))
    const saidas = saidasMes.map((m) => ({
      id: m.id, data: m.data, descricao: m.descricao,
      valor: m.valor, tipo: 'saida' as const, categoria: m.categoria,
    }))
    return [...entradas, ...saidas].sort((a, b) => b.data.localeCompare(a.data))
  }, [vendasMes, saidasMes])

  // ── Derived — gastos por categoria (custos fixos + saídas) ───────────────
  const gastosPorCat = useMemo(() => {
    const map = new Map<string, number>()
    custosFixos.forEach((c) => map.set(c.categoria, (map.get(c.categoria) ?? 0) + c.valor))
    saidasMes.forEach((m) => map.set(m.categoria, (map.get(m.categoria) ?? 0) + m.valor))
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)
  }, [custosFixos, saidasMes])

  const totalGastosCat = gastosPorCat.reduce((s, g) => s + g.value, 0)

  const categoriasFixos = useMemo(
    () => [...new Set(custosFixos.map((c) => c.categoria))],
    [custosFixos]
  )
  const categoriasSaidas = useMemo(
    () => [...new Set(movimentacoes.map((m) => m.categoria))],
    [movimentacoes]
  )
  const todasCategorias = [...new Set([...categoriasFixos, ...categoriasSaidas])]

  // ── Form helpers ──────────────────────────────────────────────────────────
  function setMixField(k: keyof Omit<ItemMix, 'id'>, val: any) {
    setFormMix((prev) => {
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

  function handleSaveMix() {
    if (!formMix.produto) return
    if (editMixId) { updateItemMix(editMixId, formMix); setEditMixId(null) }
    else addItemMix(formMix)
    setFormMix(EMPTY_MIX); setModalMix(false)
  }

  function openEditMix(item: ItemMix) {
    setEditMixId(item.id)
    setFormMix({ produto: item.produto, fornecedor: item.fornecedor, quantidade: item.quantidade, precoVenda: item.precoVenda, custoCompra: item.custoCompra, custoBordado: item.custoBordado, custoEmbalagem: item.custoEmbalagem, margemContribuicao: item.margemContribuicao, margemPercent: item.margemPercent, faturamento: item.faturamento })
    setModalMix(true)
  }

  function handleSaveCusto() {
    if (!formCusto.categoria || !formCusto.descricao || !formCusto.valor) return
    if (editCustoId) { updateCustoFixo(editCustoId, formCusto); setEditCustoId(null) }
    else addCustoFixo(formCusto)
    setFormCusto(EMPTY_CUSTO); setModalCusto(false)
  }

  function openEditCusto(c: CustoFixo) {
    setEditCustoId(c.id)
    setFormCusto({ categoria: c.categoria, descricao: c.descricao, valor: c.valor })
    setModalCusto(true)
  }

  function handleSaveSaida() {
    if (!formSaida.descricao || !formSaida.valor) return
    addMovimentacao(formSaida)
    setFormSaida(EMPTY_SAIDA); setModalSaida(false)
  }

  // ── Mês selector ──────────────────────────────────────────────────────────
  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>()
    vendas.forEach((v) => set.add(v.data.slice(0, 7)))
    movimentacoes.forEach((m) => set.add(m.data.slice(0, 7)))
    set.add(mesAtual())
    return Array.from(set).sort().reverse()
  }, [vendas, movimentacoes])

  // ── Tab bar ───────────────────────────────────────────────────────────────
  const TABS: [Tab, string][] = [
    ['dashboard',  'Dashboard'],
    ['caixa',      'Movimentações'],
    ['desempenho', 'Desempenho'],
    ['custos',     'Custos & DRE'],
  ]

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b flex-wrap" style={{ borderColor: SAND }}>
        {TABS.map(([t, lbl]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium -mb-px transition-colors"
            style={{
              borderBottom: tab === t ? `2px solid ${GOLD}` : '2px solid transparent',
              color: tab === t ? GOLD : '#9A7540',
            }}
          >
            {lbl}
          </button>
        ))}

        {/* Mês selector — shared across tabs */}
        <div className="ml-auto flex items-center gap-2 pb-1">
          <span className="text-xs" style={{ color: '#9A7540' }}>Período:</span>
          <select
            className="sacra-select text-xs py-1 px-2"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
          >
            {mesesDisponiveis.map((m) => (
              <option key={m} value={m}>{fmtMesLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 · DASHBOARD
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div className="space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kpi-card">
              <p className="kpi-label">Faturamento do Dia</p>
              <p className="kpi-value text-2xl">{fmtBRL(faturamentoHoje)}</p>
              <p className="kpi-sub">{vendasHoje.length} venda{vendasHoje.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Faturamento do Mês</p>
              <p className="kpi-value text-2xl">{fmtBRL(faturamentoMes)}</p>
              <p className="kpi-sub">{vendasMes.length} vendas · {pecasVendidasMes} peças</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Ticket Médio</p>
              <p className="kpi-value text-2xl">{fmtBRL(ticketMedio)}</p>
              <p className="kpi-sub">por transação</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Saldo do Mês</p>
              <p
                className="kpi-value text-2xl"
                style={{ color: saldoCaixa >= 0 ? GOLD : '#DC2626' }}
              >
                {fmtBRL(saldoCaixa)}
              </p>
              <p className="kpi-sub">entradas − saídas − compras</p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} style={{ color: GOLD }} />
                  <h3 className="font-heading font-semibold text-sm" style={{ color: COFFEE }}>
                    Meta de Faturamento
                  </h3>
                </div>
                <button
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: CREAM, color: '#9A7540', border: `1px solid ${SAND}` }}
                  onClick={() => { setMetaInput(String(metaMensal)); setModalMeta(true) }}
                >
                  Editar meta
                </button>
              </div>
              <ProgressBar value={faturamentoMes} max={metaMensal} />
              <p className="text-xs" style={{ color: '#9A7540' }}>
                {faturamentoMes >= metaMensal
                  ? `🎉 Meta atingida! +${fmtBRL(faturamentoMes - metaMensal)}`
                  : `Faltam ${fmtBRL(metaMensal - faturamentoMes)} para a meta`}
              </p>
            </div>

            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} style={{ color: GOLD }} />
                <h3 className="font-heading font-semibold text-sm" style={{ color: COFFEE }}>
                  Ponto de Equilíbrio
                </h3>
              </div>
              <ProgressBar
                value={faturamentoMes}
                max={pe.peMonetario}
                color={faturamentoMes >= pe.peMonetario ? '#16A34A' : GOLD}
              />
              <p className="text-xs" style={{ color: '#9A7540' }}>
                {faturamentoMes >= pe.peMonetario
                  ? `✅ PE atingido · Margem de segurança: ${fmtBRL(faturamentoMes - pe.peMonetario)}`
                  : `Faltam ${fmtBRL(faltaPE)} para cobrir os custos fixos`}
              </p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Formas de pagamento */}
            <div className="card">
              <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: COFFEE }}>
                Vendas por Forma de Pagamento
              </h3>
              {pgtoData.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: '#B09070' }}>Nenhuma venda no período</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pgtoData} dataKey="valor" nameKey="name" cx="50%" cy="50%"
                        innerRadius={45} outerRadius={70} paddingAngle={3}>
                        {pgtoData.map((entry, i) => <Cell key={entry.name} fill={PALETTE[i]} stroke="none" />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmtBRL(v)} />
                      <Legend formatter={(v) => <span style={{ color: COFFEE, fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {pgtoData.map((p, i) => (
                      <div key={p.name} className="flex justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i] }} />
                          <span style={{ color: COFFEE }}>{p.name}</span>
                        </div>
                        <span style={{ color: '#9A7540' }}>{p.qtd} vendas · {fmtBRL(p.valor)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Top peças por faturamento */}
            <div className="card">
              <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: COFFEE }}>
                Top Peças · Faturamento
              </h3>
              {rankingPecas.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: '#B09070' }}>Nenhuma venda no período</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={rankingPecas.slice(0, 6).map((p) => ({ name: p.nome.replace('BORDADO ', '').slice(0, 18), fat: p.fat }))}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={SAND} horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => fmtBRL(v)} tick={{ fontSize: 9, fill: '#6B4C2A' }} tickCount={4} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 9, fill: '#6B4C2A' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="fat" name="Faturamento" fill={GOLD} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Indicadores rápidos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-3 text-center">
              <p className="text-xs mb-1" style={{ color: '#9A7540' }}>PE Monetário</p>
              <p className="font-heading font-semibold" style={{ color: COFFEE }}>{fmtBRL(pe.peMonetario)}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs mb-1" style={{ color: '#9A7540' }}>Margem MC Média</p>
              <p className="font-heading font-semibold" style={{ color: GOLD }}>{fmtPct(pe.margemContribuicaoMedia)}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs mb-1" style={{ color: '#9A7540' }}>Custo Fixo/Mês</p>
              <p className="font-heading font-semibold" style={{ color: COFFEE }}>{fmtBRL(pe.custoFixoTotal)}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs mb-1" style={{ color: '#9A7540' }}>Margem de Segurança</p>
              <p className="font-heading font-semibold" style={{ color: pe.margemSeguranca >= 0 ? '#16A34A' : '#DC2626' }}>
                {fmtBRL(pe.margemSeguranca)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 · MOVIMENTAÇÕES DE CAIXA
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'caixa' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ArrowUpCircle size={14} style={{ color: '#16A34A' }} />
                <p className="text-xs font-medium" style={{ color: '#16A34A' }}>Entradas</p>
              </div>
              <p className="font-heading font-bold text-lg" style={{ color: '#16A34A' }}>{fmtBRL(faturamentoMes)}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>{vendasMes.length} vendas</p>
            </div>
            <div className="card p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ArrowDownCircle size={14} style={{ color: '#DC2626' }} />
                <p className="text-xs font-medium" style={{ color: '#DC2626' }}>Saídas</p>
              </div>
              <p className="font-heading font-bold text-lg" style={{ color: '#DC2626' }}>{fmtBRL(totalSaidas)}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>{saidasMes.length} lançamentos</p>
            </div>
            <div className="card p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <DollarSign size={14} style={{ color: GOLD }} />
                <p className="text-xs font-medium" style={{ color: GOLD }}>Saldo</p>
              </div>
              <p className="font-heading font-bold text-lg" style={{ color: saldoCaixa >= 0 ? GOLD : '#DC2626' }}>
                {fmtBRL(saldoCaixa)}
              </p>
            </div>
          </div>

          {/* Add saída */}
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setModalSaida(true)}>
              <Plus size={15} /> Registrar Saída
            </button>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {timelineCaixa.length === 0 && (
              <div className="card text-center py-10 text-sm" style={{ color: '#B09070' }}>
                Nenhuma movimentação no período
              </div>
            )}
            {timelineCaixa.map((item) => (
              <div
                key={item.id}
                className="card p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: item.tipo === 'entrada' ? '#F0FDF4' : '#FEF2F2' }}
                  >
                    {item.tipo === 'entrada'
                      ? <TrendingUp size={14} style={{ color: '#16A34A' }} />
                      : <TrendingDown size={14} style={{ color: '#DC2626' }} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: COFFEE }}>{item.descricao}</p>
                    <p className="text-xs" style={{ color: '#9A7540' }}>
                      {item.categoria} · {item.data}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-heading font-semibold text-sm"
                    style={{ color: item.tipo === 'entrada' ? '#16A34A' : '#DC2626' }}
                  >
                    {item.tipo === 'entrada' ? '+' : '−'}{fmtBRL(item.valor)}
                  </span>
                  {item.tipo === 'saida' && (
                    <button
                      className="btn-danger p-1"
                      onClick={() => deleteMovimentacao(item.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 · DESEMPENHO
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'desempenho' && (
        <div className="space-y-5">
          {/* Mix KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kpi-card">
              <p className="kpi-label">Faturamento Projetado</p>
              <p className="kpi-value text-2xl">{fmtBRL(mixFat)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">MC Total</p>
              <p className="kpi-value text-2xl">{fmtBRL(mixMC)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Margem Média</p>
              <p className="kpi-value text-2xl">{mixFat > 0 ? fmtPct((mixMC / mixFat) * 100) : '—'}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Total de Peças (mix)</p>
              <p className="kpi-value text-2xl">{mixQtd}</p>
            </div>
          </div>

          {/* Chart faturamento x MC */}
          <div className="card">
            <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: COFFEE }}>
              Faturamento × Margem de Contribuição por Produto
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={mixProdutos.map((i) => ({
                  name: i.produto.slice(0, 16),
                  faturamento: i.faturamento,
                  mc: +(i.margemContribuicao * i.quantidade).toFixed(2),
                }))}
                margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B4C2A' }} interval={0} />
                <YAxis tick={{ fontSize: 9, fill: '#6B4C2A' }} tickFormatter={(v) => fmtBRL(v)} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="faturamento" name="Faturamento" fill={GOLD} radius={[4, 4, 0, 0]} />
                <Bar dataKey="mc" name="Margem Contribuição" fill={COFFEE} radius={[4, 4, 0, 0]} />
                <Legend formatter={(v) => <span style={{ color: COFFEE, fontSize: 11 }}>{v}</span>} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Ranking por vendas reais do mês */}
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: SAND, background: CREAM }}>
                <h3 className="font-heading font-semibold text-sm" style={{ color: COFFEE }}>
                  Ranking Vendas do Mês · {fmtMesLabel(mesSelecionado)}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="sacra-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Design</th>
                      <th className="text-right">Qtd</th>
                      <th className="text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingPecas.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-6 text-xs" style={{ color: '#B09070' }}>Sem vendas no período</td></tr>
                    ) : rankingPecas.map((p, i) => (
                      <tr key={p.nome}>
                        <td className="w-8 text-center font-bold text-xs" style={{ color: i < 3 ? GOLD : '#9A7540' }}>{i + 1}</td>
                        <td className="text-xs font-medium" style={{ color: COFFEE }}>{p.nome.replace('BORDADO ', '')}</td>
                        <td className="text-right text-xs">{p.pecas} un</td>
                        <td className="text-right font-semibold text-xs" style={{ color: GOLD }}>{fmtBRL(p.fat)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mix de produtos — editable */}
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: SAND, background: CREAM }}>
                <h3 className="font-heading font-semibold text-sm" style={{ color: COFFEE }}>Mix de Produtos</h3>
                <button
                  className="btn-primary text-xs px-2 py-1"
                  onClick={() => { setEditMixId(null); setFormMix(EMPTY_MIX); setModalMix(true) }}
                >
                  <Plus size={13} /> Adicionar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="sacra-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th className="text-right">Margem %</th>
                      <th className="text-right">Fat.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mixProdutos.map((i) => (
                      <tr key={i.id}>
                        <td className="text-xs font-medium" style={{ color: COFFEE }}>{i.produto}</td>
                        <td className="text-right">
                          <span className="text-xs font-semibold" style={{ color: i.margemPercent >= 50 ? '#16A34A' : i.margemPercent >= 35 ? '#92400E' : '#991B1B' }}>
                            {fmtPct(i.margemPercent)}
                          </span>
                        </td>
                        <td className="text-right text-xs font-semibold">{fmtBRL(i.faturamento)}</td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn-secondary p-1" onClick={() => openEditMix(i)}><Edit2 size={11} /></button>
                            <button className="btn-danger p-1" onClick={() => deleteItemMix(i.id)}><Trash2 size={11} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4 · CUSTOS & DRE
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'custos' && (
        <div className="space-y-6">

          {/* Gastos por categoria */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: COFFEE }}>
                Gastos por Categoria
              </h3>
              {gastosPorCat.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: '#B09070' }}>Nenhum custo cadastrado</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={gastosPorCat} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {gastosPorCat.map((entry, i) => <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [fmtBRL(v), 'Valor']} />
                    <Legend formatter={(v) => <span style={{ color: COFFEE, fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card space-y-2">
              <h3 className="font-heading font-semibold text-sm mb-1" style={{ color: COFFEE }}>
                Detalhamento por Categoria
              </h3>
              {gastosPorCat.map((g, i) => (
                <div key={g.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="font-medium" style={{ color: COFFEE }}>{g.name}</span>
                    </span>
                    <span style={{ color: '#9A7540' }}>
                      {fmtBRL(g.value)} · {g.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full mb-1" style={{ background: SAND }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${g.pct}%`, background: PALETTE[i % PALETTE.length] }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between font-semibold text-sm" style={{ borderColor: SAND }}>
                <span style={{ color: COFFEE }}>Total</span>
                <span style={{ color: GOLD }}>{fmtBRL(totalGastosCat)}</span>
              </div>
            </div>
          </div>

          {/* Custos fixos CRUD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold" style={{ color: COFFEE }}>Custos Fixos Mensais</h3>
              <button className="btn-primary text-xs px-3 py-1.5" onClick={() => { setEditCustoId(null); setFormCusto(EMPTY_CUSTO); setModalCusto(true) }}>
                <Plus size={13} /> Adicionar Custo
              </button>
            </div>
            {categoriasFixos.map((cat) => (
              <div key={cat} className="card p-0 overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between border-b" style={{ background: CREAM, borderColor: SAND }}>
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
                            <button className="btn-secondary p-1.5" onClick={() => openEditCusto(c)}><Edit2 size={12} /></button>
                            <button className="btn-danger p-1.5" onClick={() => deleteCustoFixo(c.id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* DRE MEI */}
          <div className="space-y-3">
            <h3 className="font-heading font-semibold" style={{ color: COFFEE }}>DRE Simplificada — Regime MEI</h3>
            <div className="card">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dreMeses} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#6B4C2A' }} tickFormatter={(v) => { const [y,m]=v.split('-'); const meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; return `${meses[+m-1]}/${y.slice(2)}` }} />
                  <YAxis tick={{ fontSize: 9, fill: '#6B4C2A' }} tickFormatter={(v) => fmtBRL(v)} width={82} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="receitaBruta" name="Receita Bruta" stroke={GOLD} strokeWidth={2} />
                  <Line type="monotone" dataKey="margemContribuicao" name="Margem Contrib." stroke="#C0955A90" strokeWidth={2} strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="lucroOperacional" name="Lucro Operacional" stroke={COFFEE} strokeWidth={2} />
                  <Legend formatter={(v) => <span style={{ color: COFFEE, fontSize: 11 }}>{v}</span>} />
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
                      <th>DAS / Deduções</th>
                      <th>Rec. Líquida</th>
                      <th>CMV</th>
                      <th>Margem Contrib.</th>
                      <th>Custo Fixo</th>
                      <th>Lucro Oper.</th>
                      <th className="text-center">Margem %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dreMeses.map((m) => (
                      <tr key={m.mes}>
                        <td className="font-medium text-xs">{m.mes}</td>
                        <td className="text-xs">{fmtBRL(m.receitaBruta)}</td>
                        <td className="text-xs" style={{ color: '#991B1B' }}>({fmtBRL(m.deducoes)})</td>
                        <td className="text-xs">{fmtBRL(m.receitaLiquida)}</td>
                        <td className="text-xs" style={{ color: '#991B1B' }}>({fmtBRL(m.custoVariavel)})</td>
                        <td className="text-xs font-semibold">{fmtBRL(m.margemContribuicao)}</td>
                        <td className="text-xs" style={{ color: '#991B1B' }}>({fmtBRL(m.custoFixo)})</td>
                        <td className="text-xs font-semibold" style={{ color: m.lucroOperacional >= 0 ? '#16A34A' : '#991B1B' }}>
                          {fmtBRL(m.lucroOperacional)}
                        </td>
                        <td className="text-center">
                          <span className="text-xs font-semibold" style={{ color: m.margemPercent >= 0 ? '#16A34A' : '#991B1B' }}>
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

          {/* Presentes & Doações */}
          {(() => {
            const limitePD = parametros.limitePresenteDoacao ?? 300
            const pdMes = lancamentosPD.filter(l => l.data.startsWith(mesSelecionado))
            const totalPresentes = pdMes.filter(l => l.tipo === 'presente').reduce((s, l) => s + l.valor, 0)
            const totalDoacoes = pdMes.filter(l => l.tipo === 'doacao').reduce((s, l) => s + l.valor, 0)
            const totalPD = totalPresentes + totalDoacoes
            const pctUsado = limitePD > 0 ? Math.min((totalPD / limitePD) * 100, 100) : 0

            const chartData = (() => {
              const meses = [...new Set(lancamentosPD.map(l => l.data.slice(0, 7)))].sort().slice(-6)
              if (meses.length === 0) return []
              return meses.map(mes => ({
                mes: fmtMesLabel(mes),
                presentes: lancamentosPD.filter(l => l.data.startsWith(mes) && l.tipo === 'presente').reduce((s, l) => s + l.valor, 0),
                doacoes: lancamentosPD.filter(l => l.data.startsWith(mes) && l.tipo === 'doacao').reduce((s, l) => s + l.valor, 0),
              }))
            })()

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold" style={{ color: COFFEE }}>Presentes & Doações</h3>
                  <div className="flex gap-2">
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}40` }}
                      onClick={() => { setLimitePDInput(String(limitePD)); updateParametros({ limitePresenteDoacao: Number(limitePDInput) }) }}
                    >
                      Limite: {fmtBRL(limitePD)}/mês
                    </button>
                    <button className="btn-primary text-xs px-3 py-1.5" onClick={() => { setFormPD({ ...EMPTY_PD, data: mesSelecionado + '-01' }); setModalPD(true) }}>
                      <Plus size={13} /> Novo Lançamento
                    </button>
                  </div>
                </div>

                {/* KPI + progress */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="kpi-card">
                    <p className="kpi-label">Presentes</p>
                    <p className="kpi-value text-xl">{fmtBRL(totalPresentes)}</p>
                    <p className="kpi-sub">{pdMes.filter(l => l.tipo === 'presente').length} lançamentos</p>
                  </div>
                  <div className="kpi-card">
                    <p className="kpi-label">Doações</p>
                    <p className="kpi-value text-xl">{fmtBRL(totalDoacoes)}</p>
                    <p className="kpi-sub">{pdMes.filter(l => l.tipo === 'doacao').length} lançamentos</p>
                  </div>
                  <div className="kpi-card">
                    <p className="kpi-label">Total / Limite</p>
                    <p className="kpi-value text-xl" style={{ color: totalPD > limitePD ? '#991B1B' : COFFEE }}>{fmtBRL(totalPD)}</p>
                    <p className="kpi-sub">{pctUsado.toFixed(0)}% do limite</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="card">
                  <div className="flex justify-between text-xs mb-2" style={{ color: COFFEE }}>
                    <span>Uso do limite mensal</span>
                    <span style={{ color: totalPD > limitePD ? '#991B1B' : '#16A34A' }}>
                      {fmtBRL(totalPD)} / {fmtBRL(limitePD)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: SAND }}>
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{ width: `${pctUsado}%`, background: totalPD > limitePD ? '#991B1B' : GOLD }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1.5">
                    <button
                      className="underline"
                      style={{ color: GOLD }}
                      onClick={() => { setLimitePDInput(String(limitePD)); setModalPD(false) }}
                      onDoubleClick={() => {
                        const v = prompt('Novo limite mensal (R$):', String(limitePD))
                        if (v !== null) updateParametros({ limitePresenteDoacao: Number(v) })
                      }}
                    >
                      ✏️ Alterar limite (duplo clique)
                    </button>
                    <span style={{ color: '#9A7540' }}>{(limitePD - totalPD) > 0 ? `${fmtBRL(limitePD - totalPD)} disponível` : 'Limite atingido'}</span>
                  </div>
                </div>

                {/* Chart */}
                {chartData.length > 0 && (
                  <div className="card">
                    <p className="text-xs font-semibold mb-3" style={{ color: COFFEE, opacity: 0.6 }}>
                      Histórico de gastos (últimos 6 meses)
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#6B4C2A' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#6B4C2A' }} tickFormatter={(v) => fmtBRL(v)} width={72} />
                        <Tooltip content={<ChartTooltip />} />
                        <ReferenceLine y={limitePD} stroke="#991B1B" strokeDasharray="4 2" label={{ value: 'Limite', position: 'right', fontSize: 10, fill: '#991B1B' }} />
                        <Bar dataKey="presentes" name="Presentes" fill={GOLD} radius={[4, 4, 0, 0]} stackId="pd" />
                        <Bar dataKey="doacoes" name="Doações" fill={COFFEE} radius={[4, 4, 0, 0]} stackId="pd" />
                        <Legend formatter={(v) => <span style={{ color: COFFEE, fontSize: 11 }}>{v}</span>} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Entries list */}
                {pdMes.length > 0 && (
                  <div className="card p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="sacra-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pdMes.sort((a, b) => b.data.localeCompare(a.data)).map((l) => (
                            <tr key={l.id}>
                              <td className="text-xs">{l.data}</td>
                              <td>
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                  style={{
                                    background: l.tipo === 'presente' ? `${GOLD}20` : `${COFFEE}15`,
                                    color: l.tipo === 'presente' ? GOLD : COFFEE,
                                  }}
                                >
                                  {l.tipo === 'presente' ? '🎁 Presente' : '🤝 Doação'}
                                </span>
                              </td>
                              <td className="text-sm">{l.descricao}</td>
                              <td className="font-semibold">{fmtBRL(l.valor)}</td>
                              <td>
                                <button className="btn-danger p-1" onClick={() => deleteLancamentoPD(l.id)}>
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {pdMes.length === 0 && (
                  <div className="card text-center py-6">
                    <p className="text-sm" style={{ color: COFFEE, opacity: 0.4 }}>
                      Nenhum lançamento em {fmtMesLabel(mesSelecionado)}. Use o botão para registrar.
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Parâmetros de custeio */}
          <div className="space-y-3">
            <h3 className="font-heading font-semibold" style={{ color: COFFEE }}>Parâmetros de Custeio</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card">
                <h4 className="font-medium text-sm mb-3" style={{ color: COFFEE }}>Comissões e Taxas</h4>
                <div className="space-y-3">
                  {([
                    ['Comissão Varejo', 'comissaoVarejo'],
                    ['Comissão Atacado', 'comissaoAtacado'],
                    ['Taxa Cartão', 'taxaCartao'],
                    ['% Vendas no Cartão', 'percentualCartao'],
                    ['Despesa Variável', 'despesaVariavel'],
                  ] as const).map(([label, key]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <label className="text-xs font-medium" style={{ color: COFFEE }}>{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" step="0.01" min="0" max="1"
                          className="sacra-input w-24 text-right text-xs"
                          value={(parametros as any)[key]}
                          onChange={(e) => updateParametros({ [key]: Number(e.target.value) })}
                        />
                        <span className="text-xs w-10" style={{ color: '#9A7540' }}>
                          ({((parametros as any)[key] * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h4 className="font-medium text-sm mb-3" style={{ color: COFFEE }}>Embalagem e Materiais</h4>
                <div className="space-y-3">
                  {[
                    ['Embalagem Pequena (R$)', 'pequena'],
                    ['Embalagem Média (R$)', 'media'],
                    ['Embalagem Grande (R$)', 'grande'],
                  ].map(([label, sub]) => (
                    <div key={sub} className="flex items-center justify-between gap-4">
                      <label className="text-xs font-medium" style={{ color: COFFEE }}>{label}</label>
                      <input
                        type="number" step="0.01" min="0"
                        className="sacra-input w-24 text-right text-xs"
                        value={(parametros.embalagem as any)[sub]}
                        onChange={(e) => updateParametros({ embalagem: { ...parametros.embalagem, [sub]: Number(e.target.value) } })}
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs font-medium" style={{ color: COFFEE }}>Etiquetas (R$)</label>
                    <input type="number" step="0.01" min="0" className="sacra-input w-24 text-right text-xs" value={parametros.etiquetas} onChange={(e) => updateParametros({ etiquetas: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs font-medium" style={{ color: COFFEE }}>Materiais (R$)</label>
                    <input type="number" step="0.01" min="0" className="sacra-input w-24 text-right text-xs" value={parametros.materiais} onChange={(e) => updateParametros({ materiais: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══════════════════════════════════════════════════════════ */}

      {/* Presentes & Doações — novo lançamento */}
      <Modal
        open={modalPD}
        onClose={() => setModalPD(false)}
        title="Novo Lançamento — Presentes & Doações"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalPD(false)}>Cancelar</button>
            <button
              className="btn-primary"
              disabled={!formPD.descricao || formPD.valor <= 0 || !formPD.data}
              onClick={() => { addLancamentoPD(formPD); setModalPD(false); setFormPD({ ...EMPTY_PD, data: mesSelecionado + '-01' }) }}
            >
              Salvar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Data</label>
            <input type="date" className="sacra-input" value={formPD.data} onChange={(e) => setFormPD((p) => ({ ...p, data: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="sacra-select" value={formPD.tipo} onChange={(e) => setFormPD((p) => ({ ...p, tipo: e.target.value as 'presente' | 'doacao' }))}>
              <option value="presente">🎁 Presente</option>
              <option value="doacao">🤝 Doação</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input className="sacra-input" placeholder="Ex: Presente de aniversário cliente, Doação creche..." value={formPD.descricao} onChange={(e) => setFormPD((p) => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <input type="number" step="0.01" min="0" className="sacra-input" value={formPD.valor || ''} onChange={(e) => setFormPD((p) => ({ ...p, valor: Number(e.target.value) }))} />
          </div>
        </div>
      </Modal>

      {/* Meta mensal */}
      <Modal
        open={modalMeta}
        onClose={() => setModalMeta(false)}
        title="Meta de Faturamento Mensal"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalMeta(false)}>Cancelar</button>
            <button className="btn-primary" onClick={() => { updateParametros({ metaMensal: Number(metaInput) }); setModalMeta(false) }}>
              Salvar
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Meta de faturamento (R$)</label>
          <input
            type="number" step="100" min="0"
            className="sacra-input"
            value={metaInput}
            onChange={(e) => setMetaInput(e.target.value)}
          />
        </div>
      </Modal>

      {/* Saída manual */}
      <Modal
        open={modalSaida}
        onClose={() => { setModalSaida(false); setFormSaida(EMPTY_SAIDA) }}
        title="Registrar Saída"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalSaida(false); setFormSaida(EMPTY_SAIDA) }}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveSaida}>Salvar</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Data</label>
            <input type="date" className="sacra-input" value={formSaida.data} onChange={(e) => setFormSaida((p) => ({ ...p, data: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <input
              className="sacra-input"
              placeholder="Ex: Aluguel, Material, Contas..."
              list="cats-saida"
              value={formSaida.categoria}
              onChange={(e) => setFormSaida((p) => ({ ...p, categoria: e.target.value }))}
            />
            <datalist id="cats-saida">
              {todasCategorias.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input className="sacra-input" placeholder="Ex: Aluguel agosto" value={formSaida.descricao} onChange={(e) => setFormSaida((p) => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <input type="number" step="0.01" min="0" className="sacra-input" value={formSaida.valor} onChange={(e) => setFormSaida((p) => ({ ...p, valor: Number(e.target.value) }))} />
          </div>
        </div>
      </Modal>

      {/* Mix produto */}
      <Modal
        open={modalMix}
        onClose={() => { setModalMix(false); setEditMixId(null); setFormMix(EMPTY_MIX) }}
        title={editMixId ? 'Editar Item do Mix' : 'Adicionar ao Mix'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalMix(false); setEditMixId(null); setFormMix(EMPTY_MIX) }}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveMix}>Salvar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group span-2">
            <label className="form-label">Produto</label>
            <input className="sacra-input" value={formMix.produto} onChange={(e) => setMixField('produto', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Fornecedor</label>
            <input className="sacra-input" value={formMix.fornecedor} onChange={(e) => setMixField('fornecedor', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Quantidade</label>
            <input type="number" min={0} className="sacra-input" value={formMix.quantidade} onChange={(e) => setMixField('quantidade', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Preço Venda (R$)</label>
            <input type="number" step="0.01" className="sacra-input" value={formMix.precoVenda} onChange={(e) => setMixField('precoVenda', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Custo Compra (R$)</label>
            <input type="number" step="0.01" className="sacra-input" value={formMix.custoCompra} onChange={(e) => setMixField('custoCompra', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Custo Bordado (R$)</label>
            <input type="number" step="0.01" className="sacra-input" value={formMix.custoBordado} onChange={(e) => setMixField('custoBordado', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Embalagem (R$)</label>
            <input type="number" step="0.01" className="sacra-input" value={formMix.custoEmbalagem} onChange={(e) => setMixField('custoEmbalagem', Number(e.target.value))} />
          </div>
          {formMix.precoVenda > 0 && (
            <div className="form-group span-2 p-3 rounded-xl" style={{ background: CREAM, border: `1px solid ${SAND}` }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#9A7540' }}>MC Unitária:</span>
                <span className="font-semibold">{fmtBRL(formMix.margemContribuicao)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span style={{ color: '#9A7540' }}>Margem %:</span>
                <span className="font-semibold" style={{ color: formMix.margemPercent >= 40 ? '#16A34A' : '#991B1B' }}>
                  {fmtPct(formMix.margemPercent)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Custo fixo */}
      <Modal
        open={modalCusto}
        onClose={() => { setModalCusto(false); setEditCustoId(null); setFormCusto(EMPTY_CUSTO) }}
        title={editCustoId ? 'Editar Custo' : 'Novo Custo Fixo'}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalCusto(false); setEditCustoId(null); setFormCusto(EMPTY_CUSTO) }}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveCusto}>Salvar</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <input
              className="sacra-input"
              placeholder="Ex: Aluguel, Pessoal..."
              list="cats-fixo"
              value={formCusto.categoria}
              onChange={(e) => setFormCusto((p) => ({ ...p, categoria: e.target.value }))}
            />
            <datalist id="cats-fixo">
              {categoriasFixos.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input className="sacra-input" value={formCusto.descricao} onChange={(e) => setFormCusto((p) => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Valor Mensal (R$)</label>
            <input type="number" step="0.01" min="0" className="sacra-input" value={formCusto.valor} onChange={(e) => setFormCusto((p) => ({ ...p, valor: Number(e.target.value) }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
