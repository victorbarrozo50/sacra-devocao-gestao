import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { useStore } from '../hooks/useStore'
import type { Compra } from '../types'
import { fmtBRL, fmtDate, today } from '../utils/format'

// ─── Colors ──────────────────────────────────────────────────────────────────
const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'
const GREEN  = '#16A34A'
const RED    = '#DC2626'
const ORANGE = '#EA580C'
const BLUE   = '#2563EB'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function custoRealTotal(c: Compra): number {
  return c.precoUnitario * c.qtdTotal + (c.custoBordado ?? 0) * c.qtdTotal + (c.frete ?? 0)
}

function addDays(base: string, n: number): string {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000
  )
}

function mesFmt(ym: string): string {
  const [year, month] = ym.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(month, 10) - 1]}/${year.slice(2)}`
}

/** Normaliza string para matching insensível a maiúsculas/espaços */
function norm(s: string): string {
  return s.trim().toLowerCase()
}

// ─── Types ────────────────────────────────────────────────────────────────────
type EstoqueItem = {
  bordado: string
  produto: string
  fornecedor: string
  qtdEntrada: number
  qtdSaida: number
  qtdAtual: number
  custoMedio: number
  valorCusto: number
  precoVenda: number
  valorVenda: number
  // Lead time declarado nos campos (leadTimeProduto + leadTimeBordado)
  leadTimeDeclarado: number
  // Lead time real medido pelas datas (dataPedido → dataEntregaBordado)
  leadTimeReal: number | null
  // Lead time efetivo usado para projeções (real se disponível, senão declarado)
  leadTimeMedio: number
  ultimaEntrada: string | null
  ultimaSaida: string | null
  taxaConsumoMensal: number
  diasEstoque: number
  dataEstimadaZero: string | null
  dataEstimadaReposicao: string
  status: 'ok' | 'baixo' | 'critico' | 'zerado'
}

type FornecedorStat = {
  fornecedor: string
  nOrdens: number
  qtdComprado: number
  qtdVendido: number
  qtdEstoque: number
  leadTimeDeclarado: number   // média das ordens
  leadTimeReal: number | null // média das ordens com datas completas
  produtos: string[]
}

function statusColor(s: EstoqueItem['status']): string {
  switch (s) {
    case 'ok':      return GREEN
    case 'baixo':   return ORANGE
    case 'critico': return RED
    case 'zerado':  return '#6B7280'
  }
}

function statusLabel(s: EstoqueItem['status']): string {
  switch (s) {
    case 'ok':      return 'OK'
    case 'baixo':   return 'Baixo'
    case 'critico': return 'Crítico'
    case 'zerado':  return 'Zerado'
  }
}

const tipStyle: CSSProperties = {
  background: '#fff',
  border: `1px solid ${SAND}`,
  borderRadius: 8,
  fontSize: 12,
  padding: '8px 12px',
}

// ─── Ranking types ────────────────────────────────────────────────────────────
type RankingCriteria = 'desejo' | 'faturamento' | 'margem_contrib' | 'margem_pct' | 'lead_time'

type RankItem = {
  nome: string
  desejo: number
  faturamento: number
  margemContrib: number
  margemPct: number
  leadTime: number
  curvaABC: 'A' | 'B' | 'C'
  score: number
}

function abcColor(c: 'A' | 'B' | 'C'): string {
  return c === 'A' ? GREEN : c === 'B' ? GOLD : '#9CA3AF'
}

function RankingTable({ items, criteria }: { items: RankItem[]; criteria: RankingCriteria }) {
  const maxScore = items[0]?.score ?? 1

  const fmtVal = (item: RankItem): string => {
    switch (criteria) {
      case 'desejo':        return `${Math.round(item.desejo)} pts`
      case 'faturamento':   return fmtBRL(item.faturamento)
      case 'margem_contrib':return fmtBRL(item.margemContrib)
      case 'margem_pct':    return `${item.margemPct.toFixed(1)}%`
      case 'lead_time':     return item.leadTime > 0 ? `${item.leadTime}d` : '—'
    }
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <span className="text-xs font-mono w-5 text-right flex-shrink-0 mt-0.5" style={{ color: COFFEE, opacity: 0.4 }}>
            {idx + 1}
          </span>
          <span
            className="flex-shrink-0 mt-0.5 text-white font-bold rounded"
            style={{ background: abcColor(item.curvaABC), fontSize: 10, padding: '1px 5px', lineHeight: '16px' }}
          >
            {item.curvaABC}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs leading-tight" style={{ color: COFFEE, fontWeight: 500 }}>{item.nome}</p>
            <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${SAND}80` }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${maxScore > 0 ? Math.max(2, (item.score / maxScore) * 100) : 0}%`, background: abcColor(item.curvaABC) }}
              />
            </div>
          </div>
          <span className="text-xs flex-shrink-0 font-semibold" style={{ color: COFFEE, opacity: 0.75, minWidth: 64, textAlign: 'right', marginTop: 2 }}>
            {fmtVal(item)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Estoque() {
  const { compras, vendas, skus, wishlist, comprasHistorico, produtos, variantes, ajustarEstoque } = useStore()
  const todayStr = today()
  const [selectedBordado, setSelectedBordado] = useState<string | null>(null)
  const [rankCriteria, setRankCriteria] = useState<RankingCriteria>('desejo')
  const [popupItem, setPopupItem] = useState<EstoqueItem | null>(null)
  const [varSearch, setVarSearch] = useState('')

  // ── 1. estoqueItems ──────────────────────────────────────────────────────────
  const estoqueItems = useMemo<EstoqueItem[]>(() => {
    const comprasEstoque = compras.filter(
      c => c.status === 'concluido' && c.adicionadoAoEstoque === true
    )

    // Agrupa compras por bordado (chave = código do bordado)
    const byBordado = new Map<string, Compra[]>()
    for (const c of comprasEstoque) {
      const key = c.bordado || c.produto
      if (!byBordado.has(key)) byBordado.set(key, [])
      byBordado.get(key)!.push(c)
    }

    // Agrupa vendas por bordado — tenta cruzar codigoBordado E descricaoBordado
    // normalizado, para tolerar variações de digitação
    const vendasByBordado = new Map<string, typeof vendas>()
    for (const v of vendas) {
      // Índice primário: codigoBordado
      const k1 = norm(v.codigoBordado)
      if (k1) {
        if (!vendasByBordado.has(k1)) vendasByBordado.set(k1, [])
        vendasByBordado.get(k1)!.push(v)
      }
      // Índice secundário: descricaoBordado (só adiciona se for diferente do primário)
      const k2 = norm(v.descricaoBordado)
      if (k2 && k2 !== k1) {
        if (!vendasByBordado.has(k2)) vendasByBordado.set(k2, [])
        vendasByBordado.get(k2)!.push(v)
      }
    }

    const getVendasParaBordado = (bordado: string) => {
      const n = norm(bordado)
      return vendasByBordado.get(n) ?? []
    }

    const items: EstoqueItem[] = []

    for (const [bordado, cList] of byBordado.entries()) {
      const qtdEntrada = cList.reduce((s, c) => s + c.qtdTotal, 0)
      const custoTotal = cList.reduce((s, c) => s + custoRealTotal(c), 0)
      const custoMedio = qtdEntrada > 0 ? custoTotal / qtdEntrada : 0

      // ── Lead time declarado (soma leadTimeProduto + leadTimeBordado) ──────────
      const ltsDeclarados = cList
        .map(c => (c.leadTimeProduto ?? 0) + (c.leadTimeBordado ?? 0))
        .filter(lt => lt > 0)
      const leadTimeDeclarado = ltsDeclarados.length > 0
        ? Math.round(ltsDeclarados.reduce((a, b) => a + b, 0) / ltsDeclarados.length)
        : 30

      // ── Lead time real (dataPedido → dataEntregaBordado ou dataEntregaProduto) ─
      const ltsReais = cList
        .map(c => {
          const fim = c.dataEntregaBordado ?? c.dataEntregaProduto
          if (!fim || !c.dataPedido) return null
          const d = diffDays(c.dataPedido, fim)
          return d > 0 ? d : null
        })
        .filter((d): d is number => d !== null)
      const leadTimeReal = ltsReais.length > 0
        ? Math.round(ltsReais.reduce((a, b) => a + b, 0) / ltsReais.length)
        : null

      // Usa o real quando disponível (mais preciso)
      const leadTimeMedio = leadTimeReal ?? leadTimeDeclarado

      // Fornecedor principal (mais frequente entre as ordens)
      const fornecedorFreq = new Map<string, number>()
      for (const c of cList) {
        if (c.fornecedor) fornecedorFreq.set(c.fornecedor, (fornecedorFreq.get(c.fornecedor) ?? 0) + 1)
      }
      let fornecedor = ''
      let maxFreq = 0
      for (const [f, n] of fornecedorFreq) {
        if (n > maxFreq) { maxFreq = n; fornecedor = f }
      }

      // Ultima entrada
      const datas = cList
        .map(c => c.dataEntregaBordado ?? c.dataEntregaProduto ?? c.dataPedido)
        .filter(Boolean) as string[]
      const datasOrdered = [...datas].sort()
      const ultimaEntrada = datasOrdered.length > 0 ? datasOrdered[datasOrdered.length - 1] : null

      // Saídas via vendas (cruzamento por código normalizado)
      const vendasList = getVendasParaBordado(bordado)
      const qtdSaida = vendasList.reduce((s, v) => s + v.quantidade, 0)
      const saidasDatas = vendasList.map(v => v.data).filter(Boolean).sort()
      const ultimaSaida = saidasDatas.length > 0 ? saidasDatas[saidasDatas.length - 1] : null

      const qtdAtual = Math.max(0, qtdEntrada - qtdSaida)

      // Taxa de consumo mensal baseada no span desde a primeira venda
      let taxaConsumoMensal = 0
      if (vendasList.length > 0 && saidasDatas.length > 0) {
        const span = Math.max(1, diffDays(saidasDatas[0], todayStr))
        taxaConsumoMensal = qtdSaida / (span / 30)
      }

      const taxaDiaria = taxaConsumoMensal / 30
      const diasEstoque = taxaDiaria > 0 ? Math.round(qtdAtual / taxaDiaria) : 9999
      const dataEstimadaZero = taxaDiaria > 0 ? addDays(todayStr, diasEstoque) : null
      const dataEstimadaReposicao = addDays(
        dataEstimadaZero ?? todayStr,
        leadTimeMedio
      )

      const skuMatch = skus.find(s => norm(s.bordado) === norm(bordado))
      const precoVenda = skuMatch?.precoVenda ?? 0

      let status: EstoqueItem['status']
      if (qtdAtual === 0) {
        status = 'zerado'
      } else if (diasEstoque < leadTimeMedio) {
        status = 'critico'
      } else if (diasEstoque < leadTimeMedio * 1.5) {
        status = 'baixo'
      } else {
        status = 'ok'
      }

      items.push({
        bordado,
        produto: cList[0]?.produto ?? '',
        fornecedor,
        qtdEntrada,
        qtdSaida,
        qtdAtual,
        custoMedio,
        valorCusto: custoMedio * qtdAtual,
        precoVenda,
        valorVenda: precoVenda * qtdAtual,
        leadTimeDeclarado,
        leadTimeReal,
        leadTimeMedio,
        ultimaEntrada,
        ultimaSaida,
        taxaConsumoMensal,
        diasEstoque: diasEstoque === 9999 ? 999 : diasEstoque,
        dataEstimadaZero,
        dataEstimadaReposicao,
        status,
      })
    }

    return items.sort((a, b) => {
      const order = { zerado: 0, critico: 1, baixo: 2, ok: 3 }
      return order[a.status] - order[b.status]
    })
  }, [compras, vendas, skus, todayStr])

  // ── 2. fornecedorStats ─────────────────────────────────────────────────────
  const fornecedorStats = useMemo<FornecedorStat[]>(() => {
    const byForn = new Map<string, FornecedorStat>()

    const comprasEstoque = compras.filter(
      c => c.status === 'concluido' && c.adicionadoAoEstoque === true
    )

    for (const c of comprasEstoque) {
      const forn = c.fornecedor || '(sem fornecedor)'
      if (!byForn.has(forn)) {
        byForn.set(forn, {
          fornecedor: forn,
          nOrdens: 0,
          qtdComprado: 0,
          qtdVendido: 0,
          qtdEstoque: 0,
          leadTimeDeclarado: 0,
          leadTimeReal: null,
          produtos: [],
        })
      }
      const stat = byForn.get(forn)!
      stat.nOrdens++
      stat.qtdComprado += c.qtdTotal

      if (c.produto && !stat.produtos.includes(c.produto)) stat.produtos.push(c.produto)
    }

    // Agrega lead time médio por fornecedor
    for (const [forn, stat] of byForn.entries()) {
      const csForn = comprasEstoque.filter(c => (c.fornecedor || '(sem fornecedor)') === forn)

      const ltsDecl = csForn
        .map(c => (c.leadTimeProduto ?? 0) + (c.leadTimeBordado ?? 0))
        .filter(l => l > 0)
      stat.leadTimeDeclarado = ltsDecl.length > 0
        ? Math.round(ltsDecl.reduce((a, b) => a + b, 0) / ltsDecl.length)
        : 0

      const ltsReais = csForn
        .map(c => {
          const fim = c.dataEntregaBordado ?? c.dataEntregaProduto
          if (!fim || !c.dataPedido) return null
          const d = diffDays(c.dataPedido, fim)
          return d > 0 ? d : null
        })
        .filter((d): d is number => d !== null)
      stat.leadTimeReal = ltsReais.length > 0
        ? Math.round(ltsReais.reduce((a, b) => a + b, 0) / ltsReais.length)
        : null
    }

    // Cruza com estoqueItems para qtdVendido e qtdEstoque por fornecedor
    for (const item of estoqueItems) {
      const forn = item.fornecedor || '(sem fornecedor)'
      const stat = byForn.get(forn)
      if (stat) {
        stat.qtdVendido += item.qtdSaida
        stat.qtdEstoque += item.qtdAtual
      }
    }

    return [...byForn.values()].sort((a, b) => b.qtdComprado - a.qtdComprado)
  }, [compras, estoqueItems])

  // ── 3. demandaData — Bordados Mais Desejados ───────────────────────────────
  const demandaData = useMemo(() => {
    const acc = new Map<string, { vendas: number; wishlist: number; historico: number }>()

    const get = (k: string) => {
      const n = norm(k)
      if (!acc.has(n)) acc.set(n, { vendas: 0, wishlist: 0, historico: 0 })
      return acc.get(n)!
    }

    // Vendas: quantidade vendida por bordado
    for (const v of vendas) {
      const key = v.codigoBordado || v.descricaoBordado
      if (key) get(key).vendas += v.quantidade
    }

    // Wishlist: itens desejados pelos clientes
    for (const w of wishlist) {
      if (w.bordado) get(w.bordado).wishlist += 1
    }

    // Histórico CRM: compras anteriores registradas manualmente
    for (const h of comprasHistorico) {
      if (h.descricaoBordado) get(h.descricaoBordado).historico += h.quantidade
    }

    // Usa o nome original (não normalizado) do bordado para exibição
    const labelMap = new Map<string, string>()
    for (const v of vendas) {
      const key = norm(v.codigoBordado || v.descricaoBordado)
      if (key && !labelMap.has(key)) labelMap.set(key, v.descricaoBordado || v.codigoBordado)
    }
    for (const w of wishlist) {
      const key = norm(w.bordado)
      if (key && !labelMap.has(key)) labelMap.set(key, w.bordado)
    }
    for (const h of comprasHistorico) {
      const key = norm(h.descricaoBordado)
      if (key && !labelMap.has(key)) labelMap.set(key, h.descricaoBordado)
    }

    return [...acc.entries()]
      .map(([k, v]) => {
        const fullName = labelMap.get(k) ?? k
        return {
          name: fullName.length > 20 ? fullName.slice(0, 19) + '…' : fullName,
          fullName,
          vendas: v.vendas,
          wishlist: v.wishlist,
          historico: v.historico,
          total: v.vendas + v.wishlist + v.historico,
        }
      })
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [vendas, wishlist, comprasHistorico])

  // ── 3b. rankingData — ABC Ranking ──────────────────────────────────────────
  const rankingData = useMemo(() => {
    // ── Bordados ────────────────────────────────────────────────────────────
    const bMap = new Map<string, { nome: string; desejo: number; fat: number; custo: number; lts: number[]; pv: number }>()
    const bGet = (raw: string) => {
      const k = norm(raw); if (!k) return null
      if (!bMap.has(k)) bMap.set(k, { nome: raw, desejo: 0, fat: 0, custo: 0, lts: [], pv: 0 })
      return bMap.get(k)!
    }
    for (const v of vendas) {
      const raw = v.descricaoBordado || v.codigoBordado; if (!raw) continue
      const b = bGet(raw)!
      b.desejo += v.quantidade * 5
      b.fat += v.precoUnitario * v.quantidade
      if (v.descricaoBordado) b.nome = v.descricaoBordado
    }
    for (const w of wishlist) { if (w.bordado) { const b = bGet(w.bordado); if (b) b.desejo += 3 } }
    for (const h of comprasHistorico) { if (h.descricaoBordado) { const b = bGet(h.descricaoBordado); if (b) b.desejo += h.quantidade } }
    for (const c of compras) {
      if (!c.bordado) continue
      const b = bGet(c.bordado); if (!b) continue
      const lt = (c.leadTimeProduto ?? 0) + (c.leadTimeBordado ?? 0)
      if (lt > 0) b.lts.push(lt)
      b.custo += (c.precoUnitario + (c.custoBordado ?? 0) + (c.frete ?? 0) / Math.max(1, c.qtdTotal)) * c.qtdTotal
    }
    for (const s of skus) { if (s.bordado && s.precoVenda) { const b = bGet(s.bordado); if (b && !b.pv) b.pv = s.precoVenda } }

    // ── Produtos ────────────────────────────────────────────────────────────
    const pMap = new Map<string, { nome: string; desejo: number; fat: number; custo: number; lts: number[]; pv: number }>()
    const pGet = (raw: string) => {
      const k = norm(raw); if (!k) return null
      if (!pMap.has(k)) pMap.set(k, { nome: raw, desejo: 0, fat: 0, custo: 0, lts: [], pv: 0 })
      return pMap.get(k)!
    }
    for (const v of vendas) {
      if (!v.produto) continue
      const p = pGet(v.produto)!
      p.desejo += v.quantidade * 5
      p.fat += v.precoUnitario * v.quantidade
    }
    for (const c of compras) {
      if (!c.produto) continue
      const p = pGet(c.produto)!
      const lt = c.leadTimeProduto ?? 0
      if (lt > 0) p.lts.push(lt)
      p.custo += c.precoUnitario * c.qtdTotal
    }
    for (const pr of produtos) {
      const p = pGet(pr.descricao)
      if (p && !p.pv && pr.precoVenda) p.pv = pr.precoVenda
    }

    // ── Build + sort + ABC ──────────────────────────────────────────────────
    const build = (map: typeof bMap): RankItem[] => {
      const items = [...map.values()].map(d => {
        const lt = d.lts.length ? Math.round(d.lts.reduce((s, l) => s + l, 0) / d.lts.length) : 0
        const qty = d.desejo / 5 || 1
        const custoUnit = qty > 0 ? d.custo / qty : 0
        const mc = Math.max(0, d.fat - d.custo)
        const mpct = d.pv > 0 ? Math.max(0, (d.pv - custoUnit) / d.pv * 100) : 0
        const score = rankCriteria === 'desejo' ? d.desejo
          : rankCriteria === 'faturamento' ? d.fat
          : rankCriteria === 'margem_contrib' ? mc
          : rankCriteria === 'margem_pct' ? mpct
          : lt > 0 ? 1000 / lt : 0
        return { nome: d.nome, desejo: d.desejo, faturamento: d.fat, margemContrib: mc, margemPct: mpct, leadTime: lt, score, curvaABC: 'C' as const }
      }).filter(i => i.score > 0 || i.desejo > 0)

      items.sort((a, b) => b.score - a.score)

      const total = items.reduce((s, i) => s + i.score, 0)
      let cum = 0
      return items.map(i => {
        cum += i.score
        const pct = total > 0 ? cum / total : 1
        return { ...i, curvaABC: (pct <= 0.8 ? 'A' : pct <= 0.95 ? 'B' : 'C') as 'A' | 'B' | 'C' }
      })
    }

    return { bordados: build(bMap), produtos: build(pMap) }
  }, [vendas, wishlist, comprasHistorico, compras, skus, produtos, rankCriteria])

  // ── 4. lotacaoData — Chart 2 ───────────────────────────────────────────────
  const lotacaoData = useMemo(() =>
    estoqueItems
      .filter(i => i.qtdEntrada > 0)
      .map(i => {
        const partes = [i.produto, i.bordado].filter(Boolean)
        const label = partes.join(' · ')
        return {
          name: label.length > 34 ? label.slice(0, 33) + '…' : label,
          fullLabel: label,
          atual: i.qtdAtual,
          restante: i.qtdEntrada - i.qtdAtual,
          pct: i.qtdEntrada > 0 ? (i.qtdAtual / i.qtdEntrada) * 100 : 0,
          status: i.status,
        }
      }),
  [estoqueItems])

  // ── 5. valorCustoData — Chart 3 ────────────────────────────────────────────
  const valorCustoData = useMemo(() =>
    estoqueItems
      .filter(i => i.qtdAtual > 0)
      .map(i => ({
        name: i.bordado.length > 14 ? i.bordado.slice(0, 13) + '…' : i.bordado,
        custo: parseFloat(i.valorCusto.toFixed(2)),
        venda: parseFloat(i.valorVenda.toFixed(2)),
      })),
  [estoqueItems])

  // ── 6. leadTimeFornData — Chart: Lead Time por Fornecedor ─────────────────
  const leadTimeFornData = useMemo(() =>
    fornecedorStats
      .filter(f => f.leadTimeDeclarado > 0 || f.leadTimeReal !== null)
      .map(f => ({
        name: f.fornecedor.length > 16 ? f.fornecedor.slice(0, 15) + '…' : f.fornecedor,
        declarado: f.leadTimeDeclarado,
        real: f.leadTimeReal,
      })),
  [fornecedorStats])

  // ── 7. sawData — Chart 4: Dente de Serra ──────────────────────────────────
  const selectedItem =
    estoqueItems.find(i => i.bordado === selectedBordado) ??
    estoqueItems.find(i => i.status === 'critico') ??
    estoqueItems.find(i => i.status === 'baixo') ??
    estoqueItems[0]

  const sawData = useMemo(() => {
    if (!selectedItem) return {
      data: [] as object[],
      todayFmt: null as string | null,
      zeroDate: null as string | null,
      restockDate: null as string | null,
    }

    const { taxaConsumoMensal, leadTimeMedio, dataEstimadaZero, dataEstimadaReposicao, qtdAtual, qtdEntrada } = selectedItem
    const taxaDiaria = taxaConsumoMensal / 30

    const startDate = selectedItem.ultimaEntrada ?? addDays(todayStr, -30)
    const vendasSel = vendas.filter(
      v => norm(v.codigoBordado) === norm(selectedItem.bordado) ||
           norm(v.descricaoBordado) === norm(selectedItem.bordado)
    )
    const vendasSorted = [...vendasSel].sort((a, b) => a.data.localeCompare(b.data))

    const points: { date: string; estoque: number }[] = []
    let running = qtdEntrada
    points.push({ date: startDate, estoque: running })

    for (const v of vendasSorted) {
      if (v.data < startDate) {
        running -= v.quantidade
        if (running < 0) running = 0
      } else {
        running -= v.quantidade
        if (running < 0) running = 0
        const existing = points.find(p => p.date === v.data)
        if (existing) {
          existing.estoque = running
        } else {
          points.push({ date: v.data, estoque: running })
        }
      }
    }
    points.push({ date: todayStr, estoque: qtdAtual })

    const uniqueDates = [...new Set(points.map(p => p.date))].sort()
    const histData = uniqueDates.map(date => {
      const matching = points.filter(x => x.date === date)
      return { date, estoque: matching[matching.length - 1].estoque }
    })

    const projPoints: { date: string; projetado: number }[] = []
    if (taxaDiaria > 0 && dataEstimadaZero) {
      const endDate = addDays(dataEstimadaReposicao, 7)
      let current = todayStr
      let stock = qtdAtual
      while (current <= endDate) {
        projPoints.push({ date: current, projetado: Math.max(0, stock) })
        current = addDays(current, 7)
        stock -= taxaDiaria * 7
      }
      projPoints.push({ date: dataEstimadaZero, projetado: 0 })
      projPoints.push({ date: dataEstimadaReposicao, projetado: qtdEntrada })
    }

    const allDates = [...new Set([
      ...histData.map(p => p.date),
      ...projPoints.map(p => p.date),
      todayStr,
      ...(dataEstimadaZero ? [dataEstimadaZero] : []),
      dataEstimadaReposicao,
    ])].sort()

    const merged = allDates.map(date => ({
      date: fmtDate(date),
      estoque: histData.find(p => p.date === date)?.estoque,
      projetado: projPoints.find(p => p.date === date)?.projetado,
    }))

    return {
      data: merged,
      todayFmt: fmtDate(todayStr),
      zeroDate: dataEstimadaZero ? fmtDate(dataEstimadaZero) : null,
      restockDate: fmtDate(dataEstimadaReposicao),
    }
  }, [selectedItem, vendas, todayStr])

  // ── 8. alertasReposicao — Alerta por variante + demanda + lead time ──────
  const alertasReposicao = useMemo(() => {
    const prodIds = [...new Set(variantes.map((v) => v.produtoId))]
    return prodIds.map((prodId) => {
      const prod    = produtos.find((p) => p.id === prodId)
      const vars    = variantes.filter((v) => v.produtoId === prodId)
      const totalEstoque = vars.reduce((s, v) => s + v.estoque, 0)
      const variantesZeradas = vars.filter((v) => v.estoque === 0)

      const prodDesc  = prod?.descricao ?? ''
      const vendasProd = vendas.filter((v) => norm(v.produto ?? '') === norm(prodDesc))
      const totalVendido = vendasProd.reduce((s, v) => s + v.quantidade, 0)
      const datasVendas  = vendasProd.map((v) => v.data).sort()
      const spanDias = datasVendas.length > 1
        ? Math.max(1, diffDays(datasVendas[0], todayStr))
        : datasVendas.length === 1 ? 30 : 0
      const velocidade = spanDias > 0 && totalVendido > 0 ? totalVendido / spanDias : 0

      const comprasProd = compras.filter((c) => norm(c.produto) === norm(prodDesc))
      const lts = comprasProd
        .map((c) => (c.leadTimeProduto ?? 0) + (c.leadTimeBordado ?? 0))
        .filter((lt) => lt > 0)
      const leadTime = lts.length > 0
        ? Math.round(lts.reduce((a, b) => a + b, 0) / lts.length)
        : 30

      const pontoReposicao = Math.ceil(velocidade * leadTime)
      const diasEstoque    = velocidade > 0 ? Math.floor(totalEstoque / velocidade) : 9999
      const dataReposicaoNecessaria = velocidade > 0 && diasEstoque < 9999
        ? addDays(todayStr, Math.max(0, diasEstoque - leadTime))
        : null

      let nivel: 'critico' | 'baixo' | 'ok'
      if (totalEstoque === 0 || (pontoReposicao > 0 && totalEstoque <= pontoReposicao)) {
        nivel = 'critico'
      } else if (variantesZeradas.length > 0 || (pontoReposicao > 0 && totalEstoque <= Math.ceil(pontoReposicao * 1.5))) {
        nivel = 'baixo'
      } else {
        nivel = 'ok'
      }

      return { prodId, descricao: prodDesc || '—', fornecedor: prod?.fornecedorNome ?? '—',
        totalEstoque, pontoReposicao, velocidade, leadTime, diasEstoque,
        dataReposicaoNecessaria, nivel, variantesZeradas, vars }
    }).sort((a, b) => ({ critico: 0, baixo: 1, ok: 2 }[a.nivel] - { critico: 0, baixo: 1, ok: 2 }[b.nivel]))
  }, [variantes, produtos, vendas, compras, todayStr])

  // ── KPIs — lidos direto das variantes (fonte de verdade) ──────────────────
  const totalItens = variantes.reduce((s, v) => s + v.estoque, 0)
  const totalValorCusto = variantes.reduce((s, v) => s + v.custoUnitario * v.estoque, 0)
  const totalValorVenda = variantes.reduce((s, v) => s + v.precoVenda * v.estoque, 0)
  const itensCriticos = alertasReposicao.filter(a => a.nivel === 'critico').length

  return (
    <div className="page-container">
      <h1 className="page-title">Estoque</h1>
      <p className="page-subtitle">
        Entradas via compras concluídas · Saídas via vendas registradas · Lead time por fornecedor
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <p className="kpi-label">Peças em Estoque</p>
          <p className="kpi-value">{totalItens.toLocaleString('pt-BR')}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Valor em Custo</p>
          <p className="kpi-value" style={{ fontSize: '1.1rem' }}>{fmtBRL(totalValorCusto)}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Valor a Venda</p>
          <p className="kpi-value" style={{ fontSize: '1.1rem' }}>{fmtBRL(totalValorVenda)}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Críticos / Zerados</p>
          <p className="kpi-value" style={{ color: itensCriticos > 0 ? RED : GREEN }}>
            {itensCriticos}
          </p>
        </div>
      </div>

      {/* ── Estoque por Variante ───────────────────────────────────────────── */}
      {variantes.length > 0 && (() => {
        const q = varSearch.toLowerCase()
        const filtered = variantes.filter(v => {
          const prod = produtos.find(p => p.id === v.produtoId)
          return !q
            || (prod?.descricao ?? '').toLowerCase().includes(q)
            || v.tamanho.toLowerCase().includes(q)
            || v.cor.toLowerCase().includes(q)
        })
        // Agrupa por produto
        const byProd = new Map<string, typeof variantes>()
        for (const v of filtered) {
          const key = v.produtoId
          if (!byProd.has(key)) byProd.set(key, [])
          byProd.get(key)!.push(v)
        }
        const totalEstoque = variantes.reduce((s, v) => s + v.estoque, 0)
        return (
          <div className="card mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="section-title">Estoque por Variante (Tamanho × Cor)</p>
                <p className="text-xs mt-0.5" style={{ color: COFFEE, opacity: 0.5 }}>
                  Controle unitário por combinação de tamanho e cor · ajuste manual com +/−
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: `${GOLD}20`, color: GOLD }}>
                  {totalEstoque} pçs totais
                </span>
                <input
                  className="sacra-input text-xs py-1.5 px-3"
                  style={{ width: 180 }}
                  placeholder="Filtrar produto / cor / tam."
                  value={varSearch}
                  onChange={e => setVarSearch(e.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: COFFEE, opacity: 0.4 }}>
                Nenhuma variante encontrada
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${SAND}` }}>
                      {['Produto', 'Tamanho', 'Cor', 'Estoque', 'Custo Unit.', 'Preço Venda', ''].map(h => (
                        <th key={h}
                          className="text-left py-2 pr-3 font-body font-semibold text-xs whitespace-nowrap"
                          style={{ color: COFFEE, opacity: 0.7 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...byProd.entries()].map(([prodId, vars]) => {
                      const prod = produtos.find(p => p.id === prodId)
                      return vars.map((v, vi) => (
                        <tr key={v.id} style={{
                          borderBottom: `1px solid ${SAND}40`,
                          background: vi % 2 === 1 ? `${SAND}20` : undefined,
                        }}>
                          <td className="py-2 pr-3 font-medium text-xs" style={{ color: COFFEE }}>
                            {vi === 0 ? (prod?.descricao ?? '—') : ''}
                          </td>
                          <td className="py-2 pr-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: `${GOLD}18`, color: GOLD }}>
                              {v.tamanho}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-xs" style={{ color: COFFEE }}>{v.cor}</td>
                          <td className="py-2 pr-3">
                            <span className="font-bold text-base tabular-nums"
                              style={{ color: v.estoque > 0 ? GREEN : '#9CA3AF' }}>
                              {v.estoque}
                            </span>
                            <span className="text-xs ml-1" style={{ color: COFFEE, opacity: 0.4 }}>pçs</span>
                          </td>
                          <td className="py-2 pr-3 text-xs tabular-nums" style={{ color: COFFEE, opacity: 0.75 }}>
                            {fmtBRL(v.custoUnitario)}
                          </td>
                          <td className="py-2 pr-3 text-xs font-semibold tabular-nums" style={{ color: GOLD }}>
                            {fmtBRL(v.precoVenda)}
                          </td>
                          <td className="py-2">
                            <div className="flex gap-1 items-center">
                              <button
                                onClick={() => ajustarEstoque(v.id, -1)}
                                disabled={v.estoque === 0}
                                className="w-6 h-6 rounded-md text-sm font-bold flex items-center justify-center transition-opacity"
                                style={{
                                  background: `${SAND}80`,
                                  color: COFFEE,
                                  border: `1px solid ${SAND}`,
                                  opacity: v.estoque === 0 ? 0.4 : 1,
                                  cursor: v.estoque === 0 ? 'default' : 'pointer',
                                }}>−</button>
                              <button
                                onClick={() => ajustarEstoque(v.id, +1)}
                                className="w-6 h-6 rounded-md text-sm font-bold flex items-center justify-center"
                                style={{
                                  background: `${GOLD}20`,
                                  color: GOLD,
                                  border: `1px solid ${GOLD}50`,
                                  cursor: 'pointer',
                                }}>+</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Alertas de Reposição ─────────────────────────────────────────── */}
      {alertasReposicao.some((a) => a.nivel !== 'ok') && (() => {
        const criticos = alertasReposicao.filter((a) => a.nivel === 'critico')
        const baixos   = alertasReposicao.filter((a) => a.nivel === 'baixo')
        const filtrados = alertasReposicao.filter((a) => a.nivel !== 'ok')
        return (
          <div className="card mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="section-title">Alertas de Reposição</p>
                <p className="text-xs mt-0.5" style={{ color: COFFEE, opacity: 0.5 }}>
                  Baseado na velocidade de venda × lead time de reposição
                </p>
              </div>
              <div className="flex gap-2">
                {criticos.length > 0 && (
                  <span className="px-3 py-1.5 rounded-full text-white text-xs font-bold"
                    style={{ background: RED }}>
                    {criticos.length} Crítico{criticos.length > 1 ? 's' : ''}
                  </span>
                )}
                {baixos.length > 0 && (
                  <span className="px-3 py-1.5 rounded-full text-white text-xs font-bold"
                    style={{ background: ORANGE }}>
                    {baixos.length} Baixo{baixos.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${SAND}` }}>
                    {['', 'Produto', 'Estoque', 'Ponto Reposição', 'Demanda/dia', 'Lead Time', 'Repor em', 'Variantes Zeradas'].map((h) => (
                      <th key={h} className="text-left py-2 pr-3 font-body font-semibold text-xs whitespace-nowrap"
                        style={{ color: COFFEE, opacity: 0.7 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((a) => (
                    <tr key={a.prodId} style={{ borderBottom: `1px solid ${SAND}40` }}>
                      <td className="py-2 pr-2 w-4">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ background: a.nivel === 'critico' ? RED : ORANGE }}>
                          {a.nivel === 'critico' ? 'Crítico' : 'Baixo'}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-medium text-sm" style={{ color: COFFEE }}>
                        {a.descricao}
                        <span className="ml-1 text-xs font-normal" style={{ color: COFFEE, opacity: 0.5 }}>
                          {a.fornecedor}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-bold tabular-nums"
                        style={{ color: a.totalEstoque === 0 ? RED : a.nivel === 'critico' ? ORANGE : COFFEE }}>
                        {a.totalEstoque} pçs
                      </td>
                      <td className="py-2 pr-3 text-xs tabular-nums" style={{ color: COFFEE, opacity: 0.75 }}>
                        {a.pontoReposicao > 0 ? `${a.pontoReposicao} pçs` : '—'}
                      </td>
                      <td className="py-2 pr-3 text-xs tabular-nums" style={{ color: COFFEE, opacity: 0.75 }}>
                        {a.velocidade > 0 ? `${a.velocidade.toFixed(2)}/dia` : '—'}
                      </td>
                      <td className="py-2 pr-3 text-xs" style={{ color: COFFEE, opacity: 0.75 }}>
                        {a.leadTime}d
                      </td>
                      <td className="py-2 pr-3 text-xs font-semibold"
                        style={{ color: a.dataReposicaoNecessaria ? RED : COFFEE, opacity: a.dataReposicaoNecessaria ? 1 : 0.4 }}>
                        {a.dataReposicaoNecessaria ? fmtDate(a.dataReposicaoNecessaria) : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        {a.variantesZeradas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {a.variantesZeradas.map((v) => (
                              <span key={v.id} className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: '#FEE2E2', color: RED, fontWeight: 600 }}>
                                {v.tamanho} {v.cor}
                              </span>
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {estoqueItems.length === 0 ? (
        <div className="card text-center py-16">
          <p className="section-title mb-2">Nenhum item no estoque</p>
          <p className="text-sm" style={{ color: 'var(--sacra-coffee)', opacity: 0.6 }}>
            Acesse <strong>Compras</strong>, conclua uma compra e clique em{' '}
            <strong>Adicionar ao Estoque</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* ── Posição de Estoque ─────────────────────────────────────────── */}
          <div className="card mb-6 overflow-x-auto">
            <p className="section-title mb-3">Posição de Estoque por Bordado</p>
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${SAND}` }}>
                  {['Bordado','Produto','Fornecedor','Entrada','Saída','Atual','Custo Médio','LT Decl.','LT Real','Dias Est.','Status'].map(h => (
                    <th
                      key={h}
                      className="text-left py-2 pr-3 font-body font-semibold text-xs whitespace-nowrap"
                      style={{ color: 'var(--sacra-coffee)', opacity: 0.7 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estoqueItems.map(item => (
                  <tr
                    key={item.bordado}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: `1px solid ${SAND}40`,
                      background: selectedBordado === item.bordado ? `${SAND}60` : undefined,
                    }}
                    onClick={() => {
                      setSelectedBordado(item.bordado === selectedBordado ? null : item.bordado)
                      setPopupItem(item)
                    }}
                  >
                    <td className="py-2 pr-3 font-semibold" style={{ color: 'var(--sacra-coffee)' }}>
                      {item.bordado}
                    </td>
                    <td className="py-2 pr-3 text-xs" style={{ color: 'var(--sacra-coffee)', opacity: 0.7 }}>
                      {item.produto}
                    </td>
                    <td className="py-2 pr-3 text-xs" style={{ color: 'var(--sacra-coffee)', opacity: 0.8 }}>
                      {item.fornecedor || '—'}
                    </td>
                    <td className="py-2 pr-3">{item.qtdEntrada}</td>
                    <td className="py-2 pr-3">{item.qtdSaida}</td>
                    <td className="py-2 pr-3 font-bold">{item.qtdAtual}</td>
                    <td className="py-2 pr-3">{fmtBRL(item.custoMedio)}</td>
                    <td className="py-2 pr-3 text-xs" style={{ color: COFFEE, opacity: 0.8 }}>
                      {item.leadTimeDeclarado > 0 ? `${item.leadTimeDeclarado}d` : '—'}
                    </td>
                    <td className="py-2 pr-3 text-xs font-semibold" style={{
                      color: item.leadTimeReal !== null
                        ? (item.leadTimeReal > item.leadTimeDeclarado ? RED : GREEN)
                        : COFFEE,
                      opacity: item.leadTimeReal !== null ? 1 : 0.4,
                    }}>
                      {item.leadTimeReal !== null ? `${item.leadTimeReal}d` : '—'}
                    </td>
                    <td className="py-2 pr-3">
                      {item.diasEstoque === 999 ? '—' : `${item.diasEstoque}d`}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                        style={{ background: statusColor(item.status) }}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs mt-2" style={{ color: COFFEE, opacity: 0.5 }}>
              LT Decl. = lead time declarado nos campos · LT Real = medido pelas datas (pedido→entrega) ·
              Vermelho = atraso · Verde = dentro do prazo · Clique em uma linha para dashboard da peça
            </p>
          </div>

          {/* ── Lead Time por Fornecedor ───────────────────────────────────── */}
          {fornecedorStats.length > 0 && (
            <div className="card mb-6">
              <p className="section-title mb-4">Lead Time por Fornecedor</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Tabela fornecedores */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[460px]">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${SAND}` }}>
                        {['Fornecedor','Ordens','Comprado','Vendido','Estoque','LT Decl.','LT Real','Produtos'].map(h => (
                          <th
                            key={h}
                            className="text-left py-2 pr-3 font-body font-semibold text-xs whitespace-nowrap"
                            style={{ color: COFFEE, opacity: 0.7 }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fornecedorStats.map(f => (
                        <tr
                          key={f.fornecedor}
                          style={{ borderBottom: `1px solid ${SAND}40` }}
                        >
                          <td className="py-2 pr-3 font-semibold" style={{ color: COFFEE }}>
                            {f.fornecedor}
                          </td>
                          <td className="py-2 pr-3">{f.nOrdens}</td>
                          <td className="py-2 pr-3">{f.qtdComprado}</td>
                          <td className="py-2 pr-3">{f.qtdVendido}</td>
                          <td className="py-2 pr-3 font-bold">{f.qtdEstoque}</td>
                          <td className="py-2 pr-3 text-xs" style={{ color: COFFEE, opacity: 0.8 }}>
                            {f.leadTimeDeclarado > 0 ? `${f.leadTimeDeclarado}d` : '—'}
                          </td>
                          <td className="py-2 pr-3 text-xs font-semibold" style={{
                            color: f.leadTimeReal !== null
                              ? (f.leadTimeReal > f.leadTimeDeclarado ? RED : GREEN)
                              : COFFEE,
                            opacity: f.leadTimeReal !== null ? 1 : 0.4,
                          }}>
                            {f.leadTimeReal !== null ? `${f.leadTimeReal}d` : '—'}
                          </td>
                          <td className="py-2 pr-3 text-xs" style={{ color: COFFEE, opacity: 0.7 }}>
                            {f.produtos.join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs mt-2" style={{ color: COFFEE, opacity: 0.5 }}>
                    LT Real vermelho = fornecedor entregou mais tarde que o declarado
                  </p>
                </div>

                {/* Chart: Lead time declarado vs real por fornecedor */}
                {leadTimeFornData.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: COFFEE, opacity: 0.7 }}>
                      Declarado vs Real (dias)
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={leadTimeFornData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: COFFEE }} />
                        <YAxis tick={{ fontSize: 11, fill: COFFEE }} unit="d" />
                        <Tooltip
                          contentStyle={tipStyle}
                          formatter={(v: number) => [`${v} dias`]}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="declarado" name="Declarado" fill={SAND} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="real"       name="Real"      fill={BLUE}  radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Bordados Mais Desejados ────────────────────────────────────── */}
          {demandaData.length > 0 && (
            <div className="card mb-6">
              <p className="section-title mb-1">Bordados Mais Desejados pelos Clientes</p>
              <p className="text-xs mb-4" style={{ color: COFFEE, opacity: 0.5 }}>
                Cruzamento de vendas realizadas · itens na wishlist · histórico de compras CRM
              </p>
              <ResponsiveContainer width="100%" height={Math.max(180, demandaData.length * 36)}>
                <BarChart
                  layout="vertical"
                  data={demandaData}
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={SAND} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: COFFEE }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: COFFEE }} width={130} />
                  <Tooltip
                    contentStyle={tipStyle}
                    labelFormatter={(label: string, payload: unknown[]) => (payload as { payload?: { fullName?: string } }[])?.[0]?.payload?.fullName ?? label}
                    formatter={(v: number) => [`${v} unid.`]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="vendas"    name="Vendas"           stackId="a" fill={GOLD}              />
                  <Bar dataKey="wishlist"  name="Wishlist"         stackId="a" fill={ORANGE}            />
                  <Bar dataKey="historico" name="Histórico CRM"    stackId="a" fill={COFFEE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Ranking ABC ────────────────────────────────────────────────── */}
          {(rankingData.bordados.length > 0 || rankingData.produtos.length > 0) && (
            <div className="card mb-6">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <p className="section-title mb-0.5">Ranking ABC</p>
                  <p className="text-xs" style={{ color: COFFEE, opacity: 0.5 }}>
                    Classificação pela Curva ABC · A = gera 80% do valor · B = 15% · C = 5%
                  </p>
                </div>
                <select
                  className="sacra-input text-xs py-1 px-2 flex-shrink-0"
                  value={rankCriteria}
                  onChange={e => setRankCriteria(e.target.value as RankingCriteria)}
                >
                  <option value="desejo">Desejo do Público</option>
                  <option value="faturamento">Faturamento</option>
                  <option value="margem_contrib">Margem de Contribuição</option>
                  <option value="margem_pct">Margem de Lucro (%)</option>
                  <option value="lead_time">Tempo de Reposição</option>
                </select>
              </div>

              {rankCriteria === 'lead_time' && (
                <div className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: `${SAND}60`, color: COFFEE }}>
                  <strong>Atenção:</strong> no critério de reposição, itens com <strong>menor lead time</strong> ocupam
                  posições mais altas (são repostos mais rapidamente = menor risco de ruptura). Itens sem lead time
                  registrado não aparecem no ranking.
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: COFFEE }}>Bordados</p>
                  {rankingData.bordados.length === 0
                    ? <p className="text-xs" style={{ color: COFFEE, opacity: 0.5 }}>Sem dados suficientes</p>
                    : <RankingTable items={rankingData.bordados} criteria={rankCriteria} />}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: COFFEE }}>Produtos</p>
                  {rankingData.produtos.length === 0
                    ? <p className="text-xs" style={{ color: COFFEE, opacity: 0.5 }}>Sem dados suficientes</p>
                    : <RankingTable items={rankingData.produtos} criteria={rankCriteria} />}
                </div>
              </div>
            </div>
          )}

          {/* ── Charts grid ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Chart 2: Lotação de Estoque */}
            <div className="card">
              <p className="section-title mb-4">Lotação de Estoque</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  layout="vertical"
                  data={lotacaoData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={SAND} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: COFFEE }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: COFFEE }} width={200} />
                  <Tooltip
                    contentStyle={tipStyle}
                    labelFormatter={(label: string, payload: unknown[]) => (payload as { payload?: { fullLabel?: string } }[])?.[0]?.payload?.fullLabel ?? label}
                    formatter={(v: number, name: string, props) => {
                      if (name === 'Em estoque') return [`${v} peças (${Math.round(props.payload.pct)}%)`, name]
                      return [`${v} peças`, name]
                    }}
                  />
                  <Bar dataKey="atual" name="Em estoque" stackId="a">
                    {lotacaoData.map((entry, i) => (
                      <Cell key={i} fill={statusColor(entry.status)} />
                    ))}
                  </Bar>
                  <Bar dataKey="restante" name="Consumido" stackId="a" fill={`${SAND}80`} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center flex-wrap">
                {([['ok', GREEN, 'OK'], ['baixo', ORANGE, 'Baixo'], ['critico', RED, 'Crítico'], ['zerado', '#6B7280', 'Zerado']] as const).map(([, color, label]) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: COFFEE }}>
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Valor vs Custo */}
            <div className="card">
              <p className="section-title mb-4">Valor Parado em Estoque vs Custo</p>
              {valorCustoData.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: COFFEE, opacity: 0.5 }}>
                  Sem dados para exibir
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={valorCustoData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: COFFEE }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: COFFEE }}
                      tickFormatter={v => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
                    />
                    <Tooltip contentStyle={tipStyle} formatter={(v: number) => [fmtBRL(v)]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="custo" name="Custo do Estoque" fill={COFFEE} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="venda" name="Valor a Venda"    fill={GOLD}   radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart 4: Dente de Serra / Reposição */}
            <div className="card">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <p className="section-title">Previsão de Reposição</p>
                {estoqueItems.length > 1 && (
                  <select
                    className="sacra-input text-xs py-1 px-2"
                    style={{ maxWidth: 180 }}
                    value={selectedItem?.bordado ?? ''}
                    onChange={e => setSelectedBordado(e.target.value || null)}
                  >
                    {estoqueItems.map(i => (
                      <option key={i.bordado} value={i.bordado}>{i.bordado}</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedItem && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div className="text-xs p-2 rounded-lg" style={{ background: `${SAND}60` }}>
                    <p style={{ color: COFFEE, opacity: 0.6 }}>Fornecedor</p>
                    <p className="font-bold truncate" style={{ color: COFFEE }}>
                      {selectedItem.fornecedor || '—'}
                    </p>
                  </div>
                  <div className="text-xs p-2 rounded-lg" style={{ background: `${SAND}60` }}>
                    <p style={{ color: COFFEE, opacity: 0.6 }}>Lead Time</p>
                    <p className="font-bold" style={{ color: COFFEE }}>
                      {selectedItem.leadTimeMedio}d
                      {selectedItem.leadTimeReal !== null && (
                        <span className="font-normal ml-1" style={{ color: selectedItem.leadTimeReal > selectedItem.leadTimeDeclarado ? RED : GREEN }}>
                          (real)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-xs p-2 rounded-lg" style={{ background: `${SAND}60` }}>
                    <p style={{ color: COFFEE, opacity: 0.6 }}>Consumo Mensal</p>
                    <p className="font-bold" style={{ color: COFFEE }}>
                      {selectedItem.taxaConsumoMensal.toFixed(1)} pçs/mês
                    </p>
                  </div>
                  <div className="text-xs p-2 rounded-lg" style={{ background: `${SAND}60` }}>
                    <p style={{ color: COFFEE, opacity: 0.6 }}>Recebimento Previsto</p>
                    <p className="font-bold" style={{ color: selectedItem.status === 'critico' ? RED : COFFEE }}>
                      {selectedItem.dataEstimadaZero
                        ? fmtDate(selectedItem.dataEstimadaReposicao)
                        : '—'}
                    </p>
                  </div>
                </div>
              )}

              {sawData.data.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: COFFEE, opacity: 0.5 }}>
                  Sem movimentações para projetar
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={sawData.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: COFFEE }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: COFFEE }} />
                    <Tooltip contentStyle={tipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="stepAfter"  dataKey="estoque"   name="Estoque Real" stroke={GOLD}   strokeWidth={2} dot={false} connectNulls={false} />
                    <Line type="monotone"   dataKey="projetado" name="Projetado"    stroke={ORANGE} strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
                    {sawData.todayFmt && (
                      <ReferenceLine x={sawData.todayFmt}    stroke={GOLD}  strokeDasharray="4 4" label={{ value: 'Hoje',   fontSize: 10, fill: GOLD,  position: 'top' }} />
                    )}
                    {sawData.zeroDate && (
                      <ReferenceLine x={sawData.zeroDate}    stroke={RED}   strokeDasharray="4 4" label={{ value: 'Zera',   fontSize: 10, fill: RED,   position: 'top' }} />
                    )}
                    {sawData.restockDate && (
                      <ReferenceLine x={sawData.restockDate} stroke={GREEN} strokeDasharray="4 4" label={{ value: 'Recebe', fontSize: 10, fill: GREEN, position: 'top' }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>
        </>
      )}

      {/* ── Mini Dashboard da Peça ──────────────────────────────────────────── */}
      {popupItem && (() => {
        const item = popupItem
        const margemUnit = item.precoVenda - item.custoMedio
        const margemPct = item.precoVenda > 0 ? (margemUnit / item.precoVenda) * 100 : 0
        const faturamentoTotal = item.qtdSaida * item.precoVenda
        const abcRank = rankingData.bordados.findIndex(r => norm(r.nome) === norm(item.bordado))
        const abcItem = abcRank >= 0 ? rankingData.bordados[abcRank] : null
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setPopupItem(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: 'var(--sacra-cream)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="px-5 py-4 flex items-start justify-between"
                style={{ background: 'linear-gradient(135deg, #3E2A1B 0%, #5A3D28 100%)' }}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD, opacity: 0.8 }}>
                    Dashboard da Peça
                  </p>
                  <h3 className="font-heading font-bold text-base" style={{ color: 'white' }}>
                    {item.bordado}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: '#D4AD72', opacity: 0.8 }}>
                    {item.produto} · {item.fornecedor || '—'}
                  </p>
                </div>
                <button
                  onClick={() => setPopupItem(null)}
                  className="ml-4 text-white opacity-60 hover:opacity-100 transition-opacity text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5">
                <div className="rounded-xl p-3" style={{ background: `${SAND}80` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: COFFEE, opacity: 0.6 }}>Custo Médio</p>
                  <p className="font-heading font-bold text-lg" style={{ color: COFFEE }}>{fmtBRL(item.custoMedio)}</p>
                </div>

                <div className="rounded-xl p-3" style={{ background: `${SAND}80` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: COFFEE, opacity: 0.6 }}>Preço de Venda</p>
                  <p className="font-heading font-bold text-lg" style={{ color: GOLD }}>{item.precoVenda > 0 ? fmtBRL(item.precoVenda) : '—'}</p>
                </div>

                <div className="rounded-xl p-3" style={{ background: margemUnit > 0 ? '#F0FDF4' : '#FEF2F2' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: COFFEE, opacity: 0.6 }}>Margem Unitária</p>
                  <p className="font-heading font-bold text-lg" style={{ color: margemUnit > 0 ? GREEN : RED }}>
                    {item.precoVenda > 0 ? fmtBRL(margemUnit) : '—'}
                  </p>
                  {item.precoVenda > 0 && (
                    <p className="text-xs font-semibold mt-0.5" style={{ color: margemPct >= 40 ? GREEN : margemPct >= 25 ? ORANGE : RED }}>
                      {margemPct.toFixed(1)}% de margem
                    </p>
                  )}
                </div>

                <div className="rounded-xl p-3" style={{ background: item.qtdAtual > 0 ? `${SAND}80` : '#FEF2F2' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: COFFEE, opacity: 0.6 }}>Estoque Atual</p>
                  <p className="font-heading font-bold text-lg" style={{ color: statusColor(item.status) }}>
                    {item.qtdAtual} peças
                  </p>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: statusColor(item.status) }}
                  >
                    {item.status === 'ok' ? 'OK' : item.status === 'baixo' ? 'Baixo' : item.status === 'critico' ? 'Crítico' : 'Zerado'}
                  </span>
                </div>

                <div className="rounded-xl p-3" style={{ background: `${SAND}80` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: COFFEE, opacity: 0.6 }}>Total Vendas</p>
                  <p className="font-heading font-bold text-base" style={{ color: COFFEE }}>
                    {item.qtdSaida} peças
                  </p>
                  {faturamentoTotal > 0 && (
                    <p className="text-xs font-semibold" style={{ color: GREEN }}>{fmtBRL(faturamentoTotal)}</p>
                  )}
                </div>

                <div className="rounded-xl p-3" style={{ background: `${SAND}80` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: COFFEE, opacity: 0.6 }}>Curva ABC</p>
                  {abcItem ? (
                    <>
                      <span
                        className="font-heading font-bold text-xl px-2.5 py-0.5 rounded-lg text-white"
                        style={{ background: abcColor(abcItem.curvaABC) }}
                      >
                        {abcItem.curvaABC}
                      </span>
                      <p className="text-xs mt-1" style={{ color: COFFEE, opacity: 0.6 }}>
                        #{abcRank + 1} no ranking
                      </p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: COFFEE, opacity: 0.4 }}>Sem dados</p>
                  )}
                </div>
              </div>

              {item.diasEstoque < 9999 && (
                <div
                  className="mx-5 mb-5 rounded-xl p-3 text-center"
                  style={{ background: item.diasEstoque < 30 ? '#FEF2F2' : '#F0FDF4' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: COFFEE, opacity: 0.6 }}>
                    Cobertura de Estoque
                  </p>
                  <p className="font-heading font-bold text-base" style={{ color: item.diasEstoque < 30 ? RED : GREEN }}>
                    {item.diasEstoque}d restantes
                  </p>
                  {item.dataEstimadaZero && (
                    <p className="text-xs" style={{ color: COFFEE, opacity: 0.5 }}>
                      Zeramento previsto: {fmtDate(item.dataEstimadaZero)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
