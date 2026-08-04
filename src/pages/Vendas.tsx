import { useState, useMemo } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../hooks/useStore'
import { fmtBRL, fmtDate } from '../utils/format'
import { CanalBadge, PgBadge } from '../components/ui/Badge'
import VendaModal from '../components/vendas/VendaModal'

const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'

export default function Vendas() {
  const { vendas, clientes, deleteVenda } = useStore()

  const [search, setSearch] = useState('')
  const [canal, setCanal]   = useState<'todos' | 'varejo' | 'atacado'>('todos')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = [...vendas].sort((a, b) => b.data.localeCompare(a.data))
    if (canal !== 'todos') list = list.filter((v) => v.canal === canal)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (v) =>
          v.descricaoBordado.toLowerCase().includes(q) ||
          v.documento.toLowerCase().includes(q) ||
          (v.produto ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [vendas, search, canal])

  const totais = useMemo(() => ({
    faturamento: filtered.reduce((s, v) => s + v.total, 0),
    unidades:    filtered.reduce((s, v) => s + v.quantidade, 0),
  }), [filtered])

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    vendas.forEach((v) => {
      const key = v.descricaoBordado.replace('BORDADO ', '').slice(0, 20)
      map.set(key, (map.get(key) ?? 0) + v.total)
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [vendas])

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="kpi-label">Faturamento</p>
          <p className="kpi-value text-2xl">{fmtBRL(totais.faturamento)}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Unidades</p>
          <p className="kpi-value text-2xl">{totais.unidades}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Transações</p>
          <p className="kpi-value text-2xl">{filtered.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Ticket Médio</p>
          <p className="kpi-value text-2xl">
            {totais.unidades > 0 ? fmtBRL(totais.faturamento / totais.unidades) : '—'}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-heading text-base mb-3" style={{ color: COFFEE }}>Faturamento por Design</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B4C2A' }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: '#6B4C2A' }} tickFormatter={(v) => fmtBRL(v)} width={72} />
              <Tooltip
                formatter={(v: number) => [fmtBRL(v), 'Faturamento']}
                contentStyle={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8 }}
                labelStyle={{ color: SAND, fontSize: 12 }}
                itemStyle={{ color: '#D4AD72', fontSize: 12 }}
              />
              <Bar dataKey="value" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtros + botão */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9A7540' }} />
          <input className="sacra-input pl-9" placeholder="Buscar por design, doc..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="sacra-select w-40" value={canal} onChange={(e) => setCanal(e.target.value as any)}>
          <option value="todos">Todos os canais</option>
          <option value="varejo">Varejo</option>
          <option value="atacado">Atacado</option>
        </select>
        <button className="btn-primary ml-auto" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nova Venda
        </button>
      </div>

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="sacra-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Doc</th>
                <th>Cliente</th>
                <th>Design</th>
                <th>Produto</th>
                <th className="text-center">Qtd</th>
                <th>Unit.</th>
                <th>Total</th>
                <th>Canal</th>
                <th>Pgto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-8" style={{ color: '#9A7540' }}>
                    Nenhuma venda encontrada
                  </td>
                </tr>
              )}
              {filtered.map((v) => {
                const cli = v.clienteId ? clientes.find((c) => c.id === v.clienteId) : null
                return (
                  <tr key={v.id}>
                    <td className="whitespace-nowrap text-xs">{fmtDate(v.data)}</td>
                    <td className="text-xs text-gray-500">{v.documento}</td>
                    <td className="text-xs max-w-[120px] truncate" style={{ color: COFFEE }}>
                      {cli ? cli.nome : <span style={{ color: '#9A7540' }}>—</span>}
                    </td>
                    <td className="max-w-[140px] truncate text-sm font-medium">
                      {v.descricaoBordado.replace('BORDADO ', '')}
                    </td>
                    <td className="text-xs max-w-[100px] truncate" style={{ color: '#6B4C2A' }}>{v.produto}</td>
                    <td className="text-center font-medium">{v.quantidade}</td>
                    <td>{fmtBRL(v.precoUnitario)}</td>
                    <td className="font-semibold">{fmtBRL(v.total)}</td>
                    <td><CanalBadge canal={v.canal} /></td>
                    <td><PgBadge forma={v.formaPagamento} /></td>
                    <td>
                      <button className="btn-danger p-1.5" onClick={() => deleteVenda(v.id)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <VendaModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
