import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { FileSpreadsheet, FileText, List, LayoutDashboard, Download, Printer } from 'lucide-react'
import { useStore, calcDREMeses } from '../hooks/useStore'
import { fmtBRL, fmtDate } from '../utils/format'

const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'
const PALETTE = ['#C0955A', '#3E2A1B', '#9A7540', '#D4AD72', '#5C3D28', '#6B4C2A']

type View = 'dashboard' | 'lista' | 'excel' | 'pdf'

function fmtMes(ym: string) {
  const [y, m] = ym.split('-')
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${meses[Number(m) - 1]}/${y}`
}

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  return [headers.map(escape), ...rows.map(r => r.map(escape))].map(r => r.join(',')).join('\n')
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const blob = new Blob(['﻿' + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

type RelType = 'vendas' | 'compras' | 'clientes' | 'bordados' | 'dre'

export default function Relatorios() {
  const { vendas, compras, clientes, bordados, custosFixos, parametros, mixProdutos } = useStore()
  const [view, setView] = useState<View>('dashboard')
  const [relType, setRelType] = useState<RelType>('vendas')
  const [mesInicio, setMesInicio] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 5)
    return d.toISOString().slice(0, 7)
  })
  const [mesFim, setMesFim] = useState(() => new Date().toISOString().slice(0, 7))

  const dreMeses = useMemo(
    () => calcDREMeses(vendas, compras, custosFixos, parametros),
    [vendas, compras, custosFixos, parametros]
  )

  // ── Filtered data ────────────────────────────────────────────────────────────
  const vendasFiltradas = useMemo(
    () => vendas.filter(v => v.data >= mesInicio + '-01' && v.data <= mesFim + '-31')
      .sort((a, b) => b.data.localeCompare(a.data)),
    [vendas, mesInicio, mesFim]
  )

  const comprasFiltradas = useMemo(
    () => compras.filter(c => c.dataPedido >= mesInicio + '-01' && c.dataPedido <= mesFim + '-31')
      .sort((a, b) => b.dataPedido.localeCompare(a.dataPedido)),
    [compras, mesInicio, mesFim]
  )

  const dreFiltrada = useMemo(
    () => dreMeses.filter(m => m.mes >= mesInicio && m.mes <= mesFim),
    [dreMeses, mesInicio, mesFim]
  )

  // ── Dashboard aggregates ─────────────────────────────────────────────────────
  const faturamento = vendasFiltradas.reduce((s, v) => s + v.total, 0)
  const totalCompras = comprasFiltradas.reduce((s, c) => s + c.valorTotal, 0)
  const lucroEstimado = dreFiltrada.reduce((s, m) => s + m.lucroOperacional, 0)

  const vendaChart = useMemo(() => {
    const map = new Map<string, number>()
    vendasFiltradas.forEach(v => {
      const k = v.data.slice(0, 7)
      map.set(k, (map.get(k) ?? 0) + v.total)
    })
    return [...map.entries()].sort().map(([mes, valor]) => ({ mes: fmtMes(mes), valor }))
  }, [vendasFiltradas])

  const bordadoChart = useMemo(() => {
    const map = new Map<string, number>()
    vendasFiltradas.forEach(v => {
      const k = v.descricaoBordado.replace('BORDADO ', '').slice(0, 22)
      map.set(k, (map.get(k) ?? 0) + v.total)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, value]) => ({ name, value }))
  }, [vendasFiltradas])

  const canalData = useMemo(() => {
    const map: Record<string, number> = {}
    vendasFiltradas.forEach(v => { map[v.canal] = (map[v.canal] ?? 0) + v.total })
    const labels: Record<string, string> = { varejo: 'Varejo', atacado: 'Atacado' }
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] ?? k, value: v }))
  }, [vendasFiltradas])

  // ── Export CSV handlers ──────────────────────────────────────────────────────
  function exportVendas() {
    downloadCsv('vendas.csv',
      ['Data', 'Documento', 'Design', 'Produto', 'Quantidade', 'Preço Unit.', 'Total', 'Canal', 'Pagamento'],
      vendasFiltradas.map(v => [v.data, v.documento, v.descricaoBordado, v.produto ?? '', String(v.quantidade), v.precoUnitario.toFixed(2), v.total.toFixed(2), v.canal, v.formaPagamento])
    )
  }

  function exportCompras() {
    downloadCsv('compras.csv',
      ['Data Pedido', 'Fornecedor', 'Produto', 'Bordado', 'Qtd Total', 'Preço Unit.', 'Valor Total', 'Status'],
      comprasFiltradas.map(c => [c.dataPedido, c.fornecedor, c.produto, c.bordado, String(c.qtdTotal), c.precoUnitario.toFixed(2), c.valorTotal.toFixed(2), c.status])
    )
  }

  function exportClientes() {
    downloadCsv('clientes.csv',
      ['Nome', 'Telefone', 'E-mail', 'Cidade', 'Estado', 'Canal', 'Segmento'],
      clientes.map(c => [c.nome, c.telefone, c.email ?? '', c.cidade ?? '', c.estado ?? '', c.canal, c.segmento ?? ''])
    )
  }

  function exportBordados() {
    downloadCsv('bordados.csv',
      ['Código', 'Descrição', 'Preço Médio', 'Qtd Total', 'Valor Total', 'Curva ABC'],
      bordados.map(b => [b.codigo, b.descricao, b.precoMedio.toFixed(2), String(b.quantidadeTotal), b.valorTotal.toFixed(2), b.curvaABC])
    )
  }

  function exportDRE() {
    downloadCsv('dre.csv',
      ['Mês', 'Receita Bruta', 'Deduções', 'Receita Líquida', 'CMV', 'Margem Contrib.', 'Custo Fixo', 'Lucro Oper.', 'Margem %'],
      dreFiltrada.map(m => [m.mes, m.receitaBruta.toFixed(2), m.deducoes.toFixed(2), m.receitaLiquida.toFixed(2), m.custoVariavel.toFixed(2), m.margemContribuicao.toFixed(2), m.custoFixo.toFixed(2), m.lucroOperacional.toFixed(2), m.margemPercent.toFixed(1)])
    )
  }

  const VIEWS: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'lista',     label: 'Lista',     icon: <List size={15} /> },
    { id: 'excel',     label: 'Excel/CSV', icon: <FileSpreadsheet size={15} /> },
    { id: 'pdf',       label: 'PDF',       icon: <FileText size={15} /> },
  ]

  const REL_TYPES: { id: RelType; label: string }[] = [
    { id: 'vendas',   label: 'Vendas' },
    { id: 'compras',  label: 'Compras' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'bordados', label: 'Bordados' },
    { id: 'dre',      label: 'DRE' },
  ]

  return (
    <div className="space-y-5">
      {/* View selector */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: view === v.id ? COFFEE : 'white',
                color: view === v.id ? 'white' : COFFEE,
                border: `1px solid ${view === v.id ? COFFEE : SAND}`,
              }}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* Period filters */}
        <div className="flex items-center gap-2 text-xs">
          <label style={{ color: '#9A7540' }}>De</label>
          <input type="month" className="sacra-input text-xs w-36" value={mesInicio} onChange={e => setMesInicio(e.target.value)} />
          <label style={{ color: '#9A7540' }}>até</label>
          <input type="month" className="sacra-input text-xs w-36" value={mesFim} onChange={e => setMesFim(e.target.value)} />
        </div>
      </div>

      {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
      {view === 'dashboard' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kpi-card">
              <p className="kpi-label">Faturamento</p>
              <p className="kpi-value text-2xl">{fmtBRL(faturamento)}</p>
              <p className="kpi-sub">{vendasFiltradas.length} vendas</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Investimento</p>
              <p className="kpi-value text-2xl">{fmtBRL(totalCompras)}</p>
              <p className="kpi-sub">{comprasFiltradas.length} compras</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Lucro Estimado</p>
              <p className="kpi-value text-2xl" style={{ color: lucroEstimado >= 0 ? '#16A34A' : '#991B1B' }}>
                {fmtBRL(lucroEstimado)}
              </p>
              <p className="kpi-sub">DRE acumulada</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Clientes</p>
              <p className="kpi-value text-2xl">{clientes.length}</p>
              <p className="kpi-sub">cadastrados</p>
            </div>
          </div>

          {/* Faturamento mensal */}
          {vendaChart.length > 0 && (
            <div className="card">
              <h3 className="font-heading text-sm font-semibold mb-3" style={{ color: COFFEE }}>Faturamento Mensal</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={vendaChart} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#6B4C2A' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#6B4C2A' }} tickFormatter={v => fmtBRL(v)} width={80} />
                  <Tooltip
                    formatter={(v: number) => [fmtBRL(v), 'Faturamento']}
                    contentStyle={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8 }}
                    labelStyle={{ color: SAND, fontSize: 12 }}
                    itemStyle={{ color: '#D4AD72', fontSize: 12 }}
                  />
                  <Bar dataKey="valor" fill={GOLD} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top bordados */}
            {bordadoChart.length > 0 && (
              <div className="card">
                <h3 className="font-heading text-sm font-semibold mb-3" style={{ color: COFFEE }}>Top Designs</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bordadoChart} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#6B4C2A' }} tickFormatter={v => fmtBRL(v)} tickCount={4} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#6B4C2A' }} width={135} />
                    <Tooltip formatter={(v: number) => [fmtBRL(v), 'Faturamento']} contentStyle={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8 }} labelStyle={{ color: SAND, fontSize: 11 }} itemStyle={{ color: '#D4AD72', fontSize: 11 }} />
                    <Bar dataKey="value" fill={COFFEE} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Canal */}
            {canalData.length > 0 && (
              <div className="card">
                <h3 className="font-heading text-sm font-semibold mb-3" style={{ color: COFFEE }}>Vendas por Canal</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={canalData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {canalData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8 }} itemStyle={{ color: '#D4AD72', fontSize: 11 }} />
                    <Legend formatter={v => <span style={{ color: COFFEE, fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* DRE trend */}
          {dreFiltrada.length > 0 && (
            <div className="card">
              <h3 className="font-heading text-sm font-semibold mb-3" style={{ color: COFFEE }}>DRE — Evolução</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={dreFiltrada} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                  <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#6B4C2A' }} tickFormatter={(v) => { const [y,m]=v.split('-'); const meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; return `${meses[+m-1]}/${y.slice(2)}` }} />
                  <YAxis tick={{ fontSize: 9, fill: '#6B4C2A' }} tickFormatter={v => fmtBRL(v)} width={82} />
                  <Tooltip contentStyle={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8 }} labelStyle={{ color: SAND, fontSize: 11 }} itemStyle={{ color: '#D4AD72', fontSize: 11 }} />
                  <Line type="monotone" dataKey="receitaBruta" name="Receita" stroke={GOLD} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lucroOperacional" name="Lucro" stroke={COFFEE} strokeWidth={2} dot={false} />
                  <Legend formatter={v => <span style={{ color: COFFEE, fontSize: 11 }}>{v}</span>} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── LISTA ─────────────────────────────────────────────────────────── */}
      {view === 'lista' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {REL_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setRelType(t.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: relType === t.id ? GOLD : 'white',
                  color: relType === t.id ? 'white' : COFFEE,
                  border: `1px solid ${relType === t.id ? GOLD : SAND}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {relType === 'vendas' && (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="sacra-table">
                  <thead>
                    <tr><th>Data</th><th>Doc</th><th>Design</th><th>Produto</th><th>Qtd</th><th>Preço</th><th>Total</th><th>Canal</th></tr>
                  </thead>
                  <tbody>
                    {vendasFiltradas.length === 0 && <tr><td colSpan={8} className="text-center py-6" style={{ color: '#9A7540' }}>Nenhuma venda no período</td></tr>}
                    {vendasFiltradas.map(v => (
                      <tr key={v.id}>
                        <td className="text-xs">{fmtDate(v.data)}</td>
                        <td className="text-xs text-gray-500">{v.documento}</td>
                        <td className="text-sm font-medium">{v.descricaoBordado.replace('BORDADO ', '')}</td>
                        <td className="text-xs">{v.produto}</td>
                        <td className="text-center">{v.quantidade}</td>
                        <td>{fmtBRL(v.precoUnitario)}</td>
                        <td className="font-semibold">{fmtBRL(v.total)}</td>
                        <td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: v.canal === 'varejo' ? `${GOLD}20` : `${COFFEE}15`, color: v.canal === 'varejo' ? GOLD : COFFEE }}>{v.canal}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {relType === 'compras' && (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="sacra-table">
                  <thead>
                    <tr><th>Data</th><th>Fornecedor</th><th>Produto</th><th>Bordado</th><th>Qtd</th><th>Total</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {comprasFiltradas.length === 0 && <tr><td colSpan={7} className="text-center py-6" style={{ color: '#9A7540' }}>Nenhuma compra no período</td></tr>}
                    {comprasFiltradas.map(c => (
                      <tr key={c.id}>
                        <td className="text-xs">{fmtDate(c.dataPedido)}</td>
                        <td className="text-xs">{c.fornecedor}</td>
                        <td className="text-sm">{c.produto}</td>
                        <td className="text-xs">{c.bordado.replace('BORDADO ', '')}</td>
                        <td className="text-center">{c.qtdTotal}</td>
                        <td className="font-semibold">{fmtBRL(c.valorTotal)}</td>
                        <td><span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${SAND}80`, color: COFFEE }}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {relType === 'clientes' && (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="sacra-table">
                  <thead>
                    <tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Cidade</th><th>Canal</th><th>Segmento</th></tr>
                  </thead>
                  <tbody>
                    {clientes.length === 0 && <tr><td colSpan={6} className="text-center py-6" style={{ color: '#9A7540' }}>Nenhum cliente cadastrado</td></tr>}
                    {clientes.map(c => (
                      <tr key={c.id}>
                        <td className="font-medium text-sm">{c.nome}</td>
                        <td className="text-xs">{c.telefone}</td>
                        <td className="text-xs">{c.email ?? '—'}</td>
                        <td className="text-xs">{c.cidade ?? '—'}</td>
                        <td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${GOLD}20`, color: GOLD }}>{c.canal}</span></td>
                        <td className="text-xs">{c.segmento ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {relType === 'bordados' && (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="sacra-table">
                  <thead>
                    <tr><th>Código</th><th>Design</th><th>Preço Médio</th><th>Qtd Total</th><th>Valor Total</th><th>Curva ABC</th></tr>
                  </thead>
                  <tbody>
                    {bordados.map(b => (
                      <tr key={b.codigo}>
                        <td className="text-xs font-mono">{b.codigo}</td>
                        <td className="font-medium text-sm">{b.descricao.replace('BORDADO ', '')}</td>
                        <td>{fmtBRL(b.precoMedio)}</td>
                        <td className="text-center">{b.quantidadeTotal}</td>
                        <td className="font-semibold">{fmtBRL(b.valorTotal)}</td>
                        <td>
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                            background: b.curvaABC === 'A' ? '#FEF9C3' : b.curvaABC === 'B' ? '#E0F2FE' : `${SAND}80`,
                            color: b.curvaABC === 'A' ? '#92400E' : b.curvaABC === 'B' ? '#075985' : '#6B4C2A',
                          }}>{b.curvaABC}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {relType === 'dre' && (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="sacra-table">
                  <thead>
                    <tr><th>Mês</th><th>Receita Bruta</th><th>Deduções</th><th>Rec. Líquida</th><th>CMV</th><th>Margem Contrib.</th><th>Custo Fixo</th><th>Lucro Oper.</th><th>Margem %</th></tr>
                  </thead>
                  <tbody>
                    {dreFiltrada.length === 0 && <tr><td colSpan={9} className="text-center py-6" style={{ color: '#9A7540' }}>Nenhum dado no período</td></tr>}
                    {dreFiltrada.map(m => (
                      <tr key={m.mes}>
                        <td className="font-medium text-xs">{m.mes}</td>
                        <td className="text-xs">{fmtBRL(m.receitaBruta)}</td>
                        <td className="text-xs" style={{ color: '#991B1B' }}>({fmtBRL(m.deducoes)})</td>
                        <td className="text-xs">{fmtBRL(m.receitaLiquida)}</td>
                        <td className="text-xs" style={{ color: '#991B1B' }}>({fmtBRL(m.custoVariavel)})</td>
                        <td className="text-xs font-semibold">{fmtBRL(m.margemContribuicao)}</td>
                        <td className="text-xs" style={{ color: '#991B1B' }}>({fmtBRL(m.custoFixo)})</td>
                        <td className="text-xs font-semibold" style={{ color: m.lucroOperacional >= 0 ? '#16A34A' : '#991B1B' }}>{fmtBRL(m.lucroOperacional)}</td>
                        <td className="text-center text-xs font-semibold" style={{ color: m.margemPercent >= 0 ? '#16A34A' : '#991B1B' }}>{m.margemPercent.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EXCEL / CSV ───────────────────────────────────────────────────── */}
      {view === 'excel' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Vendas', sublabel: `${vendasFiltradas.length} registros`, fn: exportVendas, color: '#16A34A' },
            { label: 'Compras', sublabel: `${comprasFiltradas.length} registros`, fn: exportCompras, color: '#0369A1' },
            { label: 'Clientes', sublabel: `${clientes.length} registros`, fn: exportClientes, color: '#7C3AED' },
            { label: 'Bordados & Designs', sublabel: `${bordados.length} registros`, fn: exportBordados, color: GOLD },
            { label: 'DRE Simplificada', sublabel: `${dreFiltrada.length} meses`, fn: exportDRE, color: COFFEE },
          ].map(item => (
            <div key={item.label} className="card flex flex-col items-center gap-4 py-8">
              <FileSpreadsheet size={36} style={{ color: item.color }} />
              <div className="text-center">
                <p className="font-heading font-bold" style={{ color: COFFEE }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>{item.sublabel}</p>
              </div>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: item.color }}
                onClick={item.fn}
              >
                <Download size={14} /> Baixar CSV
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── PDF ───────────────────────────────────────────────────────────── */}
      {view === 'pdf' && (
        <div className="space-y-4">
          <div className="card flex items-center justify-between">
            <div>
              <p className="font-heading font-semibold" style={{ color: COFFEE }}>Relatório Completo</p>
              <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>
                Período: {fmtMes(mesInicio)} — {fmtMes(mesFim)} · {vendasFiltradas.length} vendas · {comprasFiltradas.length} compras
              </p>
            </div>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => window.print()}
            >
              <Printer size={15} /> Imprimir / Salvar PDF
            </button>
          </div>

          {/* Print content */}
          <div className="card space-y-6 print:shadow-none print:border-none" id="relatorio-pdf">
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: SAND }}>
              <div>
                <p className="font-heading text-xl font-bold" style={{ color: COFFEE }}>Sacra Devoção</p>
                <p className="text-xs" style={{ color: '#9A7540' }}>Relatório Gerencial · {fmtMes(mesInicio)} — {fmtMes(mesFim)}</p>
              </div>
              <p className="text-xs" style={{ color: '#9A7540' }}>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            {/* Resumo */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: COFFEE, opacity: 0.5 }}>Resumo Executivo</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Faturamento', value: fmtBRL(faturamento) },
                  { label: 'Investimento', value: fmtBRL(totalCompras) },
                  { label: 'Lucro Estim.', value: fmtBRL(lucroEstimado) },
                  { label: 'Clientes', value: String(clientes.length) },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-xl p-3 text-center" style={{ background: `${SAND}50` }}>
                    <p className="text-xs" style={{ color: '#9A7540' }}>{kpi.label}</p>
                    <p className="font-heading font-bold text-base" style={{ color: COFFEE }}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendas */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: COFFEE, opacity: 0.5 }}>
                Vendas ({vendasFiltradas.length})
              </p>
              <div className="overflow-x-auto">
                <table className="sacra-table text-xs">
                  <thead><tr><th>Data</th><th>Design</th><th>Qtd</th><th>Total</th><th>Canal</th></tr></thead>
                  <tbody>
                    {vendasFiltradas.slice(0, 20).map(v => (
                      <tr key={v.id}>
                        <td>{fmtDate(v.data)}</td>
                        <td>{v.descricaoBordado.replace('BORDADO ', '')}</td>
                        <td className="text-center">{v.quantidade}</td>
                        <td className="font-semibold">{fmtBRL(v.total)}</td>
                        <td>{v.canal}</td>
                      </tr>
                    ))}
                    {vendasFiltradas.length > 20 && (
                      <tr><td colSpan={5} className="text-center py-2" style={{ color: '#9A7540' }}>+ {vendasFiltradas.length - 20} registros (imprima CSV para lista completa)</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DRE */}
            {dreFiltrada.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: COFFEE, opacity: 0.5 }}>DRE Simplificada</p>
                <div className="overflow-x-auto">
                  <table className="sacra-table text-xs">
                    <thead><tr><th>Mês</th><th>Receita</th><th>CMV</th><th>Margem Contrib.</th><th>Custo Fixo</th><th>Lucro</th><th>%</th></tr></thead>
                    <tbody>
                      {dreFiltrada.map(m => (
                        <tr key={m.mes}>
                          <td className="font-medium">{m.mes}</td>
                          <td>{fmtBRL(m.receitaBruta)}</td>
                          <td style={{ color: '#991B1B' }}>({fmtBRL(m.custoVariavel)})</td>
                          <td className="font-semibold">{fmtBRL(m.margemContribuicao)}</td>
                          <td style={{ color: '#991B1B' }}>({fmtBRL(m.custoFixo)})</td>
                          <td className="font-semibold" style={{ color: m.lucroOperacional >= 0 ? '#16A34A' : '#991B1B' }}>{fmtBRL(m.lucroOperacional)}</td>
                          <td style={{ color: m.margemPercent >= 0 ? '#16A34A' : '#991B1B' }}>{m.margemPercent.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
