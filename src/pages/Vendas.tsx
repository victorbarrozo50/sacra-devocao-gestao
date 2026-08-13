import { useState, useMemo } from 'react'
import { Plus, Trash2, Search, Pencil } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../hooks/useStore'
import { fmtBRL, fmtDate } from '../utils/format'
import { CanalBadge, PgBadge } from '../components/ui/Badge'
import VendaModal from '../components/vendas/VendaModal'
import type { Venda } from '../types'

const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'

const CORES = ['Preto', 'Branco', 'Cinza', 'Azul Marinho', 'Azul', 'Vermelho', 'Rosa', 'Rosa Bebê', 'Lilás', 'Verde', 'Amarelo', 'Laranja', 'Bege', 'Vinho', 'Dourado']
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'GGG', 'Único']

export default function Vendas() {
  const { vendas, clientes, deleteVenda, updateVenda } = useStore()

  const [search, setSearch] = useState('')
  const [canal, setCanal]   = useState<'todos' | 'varejo' | 'atacado'>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editVenda, setEditVenda] = useState<Venda | null>(null)

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editVenda) return
    const qty = editVenda.quantidade
    const unit = editVenda.precoUnitario
    updateVenda(editVenda.id, { ...editVenda, total: qty * unit })
    setEditVenda(null)
  }

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
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 4, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B4C2A' }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 9, fill: '#6B4C2A' }} tickFormatter={(v) => fmtBRL(v)} width={80} />
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
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative" style={{ flex: '3 1 200px', minWidth: 200 }}>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9A7540' }} />
          <input className="sacra-input pl-9" placeholder="Buscar por design, doc..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="sacra-select" style={{ flex: '1 1 145px', minWidth: 145, width: 'auto' }} value={canal} onChange={(e) => setCanal(e.target.value as any)}>
          <option value="todos">Todos os canais</option>
          <option value="varejo">Varejo</option>
          <option value="atacado">Atacado</option>
        </select>
        <button className="btn-primary flex-shrink-0" onClick={() => setModalOpen(true)}>
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
                <th className="text-center">Tam.</th>
                <th>Cor</th>
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
                  <td colSpan={13} className="text-center py-8" style={{ color: '#9A7540' }}>
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
                    <td className="text-center text-xs font-semibold" style={{ color: GOLD }}>{v.tamanho || '—'}</td>
                    <td className="text-xs" style={{ color: '#6B4C2A' }}>{v.cor || '—'}</td>
                    <td className="text-center font-medium">{v.quantidade}</td>
                    <td>{fmtBRL(v.precoUnitario)}</td>
                    <td className="font-semibold">{fmtBRL(v.total)}</td>
                    <td><CanalBadge canal={v.canal} /></td>
                    <td><PgBadge forma={v.formaPagamento} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg transition-colors"
                          style={{ color: GOLD, border: `1px solid ${GOLD}30`, background: 'transparent' }}
                          onClick={() => setEditVenda({ ...v })}
                        >
                          <Pencil size={13} />
                        </button>
                        <button className="btn-danger p-1.5" onClick={() => deleteVenda(v.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <VendaModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editVenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setEditVenda(null)}>
          <form
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--sacra-cream)' }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveEdit}
          >
            <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #3E2A1B 0%, #5A3D28 100%)' }}>
              <p className="font-heading font-bold text-base" style={{ color: 'white' }}>Editar Venda</p>
              <p className="text-xs mt-0.5" style={{ color: '#D4AD72', opacity: 0.8 }}>{editVenda.documento}</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input type="date" className="sacra-input" value={editVenda.data}
                    onChange={(e) => setEditVenda({ ...editVenda, data: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Documento</label>
                  <input className="sacra-input" value={editVenda.documento}
                    onChange={(e) => setEditVenda({ ...editVenda, documento: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Design (Bordado)</label>
                <input className="sacra-input" value={editVenda.descricaoBordado}
                  onChange={(e) => setEditVenda({ ...editVenda, descricaoBordado: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Produto</label>
                <input className="sacra-input" value={editVenda.produto ?? ''}
                  onChange={(e) => setEditVenda({ ...editVenda, produto: e.target.value })} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tamanho</label>
                  <select className="sacra-select" value={editVenda.tamanho ?? ''}
                    onChange={(e) => setEditVenda({ ...editVenda, tamanho: e.target.value || undefined })}>
                    <option value="">—</option>
                    {TAMANHOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cor</label>
                  <input className="sacra-input" list="edit-venda-cores" placeholder="Ex: Azul Marinho"
                    value={editVenda.cor ?? ''}
                    onChange={(e) => setEditVenda({ ...editVenda, cor: e.target.value || undefined })} />
                  <datalist id="edit-venda-cores">
                    {CORES.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Quantidade</label>
                  <input type="number" min={1} className="sacra-input" value={editVenda.quantidade}
                    onChange={(e) => setEditVenda({ ...editVenda, quantidade: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Preço Unitário (R$)</label>
                  <input type="number" step="0.01" min={0} className="sacra-input" value={editVenda.precoUnitario}
                    onChange={(e) => setEditVenda({ ...editVenda, precoUnitario: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Canal</label>
                  <select className="sacra-select" value={editVenda.canal}
                    onChange={(e) => setEditVenda({ ...editVenda, canal: e.target.value as 'varejo' | 'atacado' })}>
                    <option value="varejo">Varejo</option>
                    <option value="atacado">Atacado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pagamento</label>
                  <select className="sacra-select" value={editVenda.formaPagamento}
                    onChange={(e) => setEditVenda({ ...editVenda, formaPagamento: e.target.value as 'cartao' | 'pix' | 'dinheiro' })}>
                    <option value="cartao">Cartão</option>
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>
              <div className="p-3 rounded-xl text-sm font-semibold text-center" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                Total: {fmtBRL(editVenda.quantidade * editVenda.precoUnitario)}
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button type="button" className="btn-secondary flex-1" onClick={() => setEditVenda(null)}>Cancelar</button>
              <button type="submit" className="btn-primary flex-1">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
