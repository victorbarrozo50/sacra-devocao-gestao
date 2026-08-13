import { Fragment, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  TrendingUp, ShoppingBag, Package, Calendar, Bell, X, Plus, ChevronDown, ChevronUp,
  Phone, Mail, MessageCircle,
} from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { fmtBRL } from '../utils/format'
import { CanalBadge, PgBadge } from '../components/ui/Badge'
import VendaModal from '../components/vendas/VendaModal'

const GOLD = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND = '#E7DCC8'

const PIPELINE = [
  { status: 'aguardando',           label: 'Aguardando',    color: '#9CA3AF' },
  { status: 'compra_solicitada',    label: 'Solicitada',    color: '#F59E0B' },
  { status: 'produto_recebido',     label: 'Produto OK',    color: '#3B82F6' },
  { status: 'bordado_em_andamento', label: 'Bordando',      color: '#8B5CF6' },
  { status: 'concluido',            label: 'Concluído',     color: '#10B981' },
] as const

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const CLASSIF_LABELS: Record<string, string> = {
  religioso: 'Religioso', feira: 'Feira', pop_up: 'Pop-up', bazar: 'Bazar',
  feriado: 'Feriado', sazonal: 'Sazonal', exposicao: 'Exposição',
}

const todayStr = new Date().toISOString().slice(0, 10)
const mesStr   = new Date().toISOString().slice(0, 7)

export default function Dashboard() {
  const { vendas, compras, custosFixos, mixProdutos, parametros, wishlist, clientes, eventos } = useStore()
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const [vendaModalOpen, setVendaModalOpen] = useState(false)
  const [pipelinePopup, setPipelinePopup] = useState<string | null>(null)
  const [vendaExpandida, setVendaExpandida] = useState<string | null>(null)
  const [wishlistPopup, setWishlistPopup] = useState<string | null>(null) // design name

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const vendasHoje = useMemo(() => vendas.filter(v => v.data === todayStr), [vendas])
  const totalHoje  = vendasHoje.reduce((s, v) => s + v.total, 0)

  const vendasMes = useMemo(() => vendas.filter(v => v.data.startsWith(mesStr)), [vendas])
  const totalMes  = vendasMes.reduce((s, v) => s + v.total, 0)

  const comprasAtivas = useMemo(
    () => compras.filter(c => c.status !== 'concluido' && c.status !== 'cancelado'),
    [compras]
  )

  const proximoEvento = useMemo(
    () => eventos.filter(e => e.data >= todayStr).sort((a, b) => a.data.localeCompare(b.data))[0],
    [eventos]
  )

  // ── Meta ──────────────────────────────────────────────────────────────────
  const meta    = parametros.metaMensal ?? 0
  const metaPct = meta > 0 ? Math.min((totalMes / meta) * 100, 100) : 0

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const pipelineCounts = useMemo(() => {
    const map = new Map<string, number>()
    compras.forEach(c => {
      if (c.status !== 'cancelado') map.set(c.status, (map.get(c.status) ?? 0) + 1)
    })
    return map
  }, [compras])
  const totalAtivos = compras.filter(c => c.status !== 'cancelado').length

  // ── Próximos eventos ──────────────────────────────────────────────────────
  const proximosEventos = useMemo(
    () => eventos.filter(e => e.data >= todayStr).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 3),
    [eventos]
  )

  // ── Wishlist demand ───────────────────────────────────────────────────────
  const wishlistDemanda = useMemo(() => {
    const map = new Map<string, number>()
    wishlist.forEach(w => {
      const key = w.bordado.replace('BORDADO ', '')
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [wishlist])

  // ── Clientes por design (para o popup) ───────────────────────────────────
  const wishlistClientesPorDesign = useMemo(() => {
    const map = new Map<string, { nome: string; telefone: string; email?: string; produto?: string; tamanho?: string; notas?: string }[]>()
    wishlist.forEach(w => {
      const key = w.bordado.replace('BORDADO ', '')
      const cli = clientes.find(c => c.id === w.clienteId)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({
        nome:      cli?.nome ?? 'Cliente não encontrado',
        telefone:  cli?.telefone ?? '',
        email:     cli?.email,
        produto:   w.produto,
        tamanho:   w.tamanho,
        notas:     w.notas,
      })
    })
    return map
  }, [wishlist, clientes])

  // ── Alertas wishlist × estoque ────────────────────────────────────────────
  const alertasEstoque = useMemo(() => {
    const recebidas = compras.filter(c => c.status === 'produto_recebido' || c.status === 'concluido')
    return recebidas.flatMap(compra => {
      const matched = wishlist.filter(w => {
        const wB = w.bordado.toLowerCase().replace('bordado ', '')
        const cB = compra.bordado.toLowerCase()
        return cB.includes(wB) || wB.includes(cB)
      })
      if (matched.length === 0) return []
      const interessados = matched.map(w => {
        const cli = clientes.find(c => c.id === w.clienteId)
        return { nome: cli?.nome ?? 'Cliente', telefone: cli?.telefone ?? '' }
      })
      return [{ compra, interessados, alertId: `${compra.id}-wl` }]
    })
  }, [compras, wishlist, clientes])

  const alertasVisiveis = alertasEstoque.filter(a => !dismissedAlerts.includes(a.alertId))

  // ── Helpers ───────────────────────────────────────────────────────────────
  function diasAteEvento(data: string) {
    return Math.round((new Date(data + 'T12:00:00').getTime() - new Date(todayStr + 'T12:00:00').getTime()) / 86400000)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="page-subtitle">Central de operações · Sacra Igreja</p>
        <div className="gold-divider" style={{ maxWidth: 120 }} />
      </div>

      {/* ── Alertas wishlist × estoque ───────────────────────────────────── */}
      {alertasVisiveis.length > 0 && (
        <div className="space-y-2">
          {alertasVisiveis.map(({ compra, interessados, alertId }) => (
            <div key={alertId} className="flex items-start gap-3 px-4 py-3 rounded-xl border"
              style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
              <Bell size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                  Estoque chegou — clientes aguardando:{' '}
                  <span style={{ color: COFFEE }}>{compra.bordado}</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {interessados.map((i, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                      {i.nome}{i.telefone ? ` · ${i.telefone}` : ''}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => setDismissedAlerts(p => [...p, alertId])}
                className="p-1 rounded hover:bg-yellow-100 flex-shrink-0" style={{ color: '#D97706' }}>
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── KPIs operacionais ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="kpi-label">Vendas Hoje</p>
              <p className="kpi-value">{fmtBRL(totalHoje)}</p>
              <p className="kpi-sub">{vendasHoje.length} transaç{vendasHoje.length === 1 ? 'ão' : 'ões'}</p>
            </div>
            <div className="kpi-icon flex-shrink-0"><TrendingUp size={18} /></div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="kpi-label">Vendas do Mês</p>
              <p className="kpi-value">{fmtBRL(totalMes)}</p>
              <p className="kpi-sub">{vendasMes.length} transaç{vendasMes.length === 1 ? 'ão' : 'ões'}</p>
            </div>
            <div className="kpi-icon flex-shrink-0"><ShoppingBag size={18} /></div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="kpi-label">Compras Ativas</p>
              <p className="kpi-value">{comprasAtivas.length}</p>
              <p className="kpi-sub">pedidos em andamento</p>
            </div>
            <div className="kpi-icon flex-shrink-0"><Package size={18} /></div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="kpi-label">Próximo Evento</p>
              <p className="kpi-value text-sm font-semibold leading-snug" style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontFamily: 'inherit',
              }}>
                {proximoEvento ? proximoEvento.nome : '—'}
              </p>
              <p className="kpi-sub">
                {proximoEvento
                  ? (() => { const d = diasAteEvento(proximoEvento.data); return d === 0 ? 'Hoje!' : d === 1 ? 'Amanhã' : `Em ${d} dias` })()
                  : 'Nenhum agendado'}
              </p>
            </div>
            <div className="kpi-icon flex-shrink-0"><Calendar size={18} /></div>
          </div>
        </div>
      </div>

      {/* ── Meta de faturamento ───────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm" style={{ color: COFFEE }}>Meta de Faturamento — Mês</h3>
          <a href="/financeiro" className="text-xs" style={{ color: GOLD }}>Hub Financeiro →</a>
        </div>
        {meta > 0 ? (
          <>
            <div className="h-3 rounded-full overflow-hidden mb-1" style={{ background: SAND }}>
              <div className="h-3 rounded-full transition-all" style={{ width: `${metaPct}%`, background: GOLD }} />
            </div>
            <div className="flex justify-between text-xs" style={{ color: '#9A7540' }}>
              <span>{fmtBRL(totalMes)} realizados</span>
              <span>{metaPct.toFixed(1)}% de {fmtBRL(meta)}</span>
            </div>
          </>
        ) : (
          <p className="text-xs" style={{ color: '#9A7540' }}>
            Defina uma meta mensal no{' '}
            <a href="/financeiro" style={{ color: GOLD }}>Hub Financeiro → Dashboard</a>
          </p>
        )}
      </div>

      {/* ── Pipeline de compras + Próximos eventos ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-heading text-lg mb-4" style={{ color: COFFEE }}>Pipeline de Compras</h3>
          {compras.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#9A7540' }}>Nenhuma compra cadastrada</p>
          ) : (
            <div className="space-y-3">
              {PIPELINE.map(({ status, label, color }) => {
                const count = pipelineCounts.get(status) ?? 0
                const pct = totalAtivos > 0 ? (count / totalAtivos) * 100 : 0
                const isOpen = pipelinePopup === status
                const pedidosDoStatus = compras.filter(c => c.status === status)
                return (
                  <div key={status}>
                    <button
                      className="w-full text-left"
                      onClick={() => setPipelinePopup(isOpen ? null : status)}
                    >
                      <div className="flex justify-between text-sm mb-1 hover:opacity-80 transition-opacity">
                        <span className="font-medium" style={{ color: COFFEE }}>{label}</span>
                        <span className="font-semibold" style={{ color }}>
                          {count} pedido{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: SAND }}>
                        <div className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </button>
                    {isOpen && count > 0 && (
                      <div className="mt-2 mb-1 rounded-xl border overflow-hidden"
                        style={{ borderColor: `${color}40` }}>
                        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                          style={{ background: `${color}15`, color }}>
                          {label} — {count} pedido{count !== 1 ? 's' : ''}
                        </div>
                        {pedidosDoStatus.map(p => (
                          <div key={p.id} className="px-3 py-2.5 border-t flex items-start justify-between gap-2"
                            style={{ borderColor: `${color}20` }}>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: COFFEE }}>
                                {p.fornecedor} · {p.produto}
                              </p>
                              <p className="text-xs" style={{ color: '#9A7540' }}>
                                {p.bordado} · {p.qtdTotal} un · {new Date(p.dataPedido).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <span className="text-sm font-semibold flex-shrink-0" style={{ color: GOLD }}>
                              {fmtBRL(p.valorTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {compras.filter(c => c.status === 'cancelado').length > 0 && (
                <p className="text-xs pt-1" style={{ color: '#9A7540' }}>
                  + {compras.filter(c => c.status === 'cancelado').length} cancelado(s)
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg" style={{ color: COFFEE }}>Próximos Eventos</h3>
            <a href="/eventos" className="text-xs" style={{ color: GOLD }}>Ver todos →</a>
          </div>
          {proximosEventos.length > 0 ? (
            <div className="space-y-3">
              {proximosEventos.map(e => {
                const partes = e.data.split('-')
                const dia  = partes[2]
                const mes  = MESES[Number(partes[1]) - 1]
                const dias = diasAteEvento(e.data)
                return (
                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: 'var(--sacra-cream)' }}>
                    <div className="flex-shrink-0 text-center" style={{ minWidth: 40 }}>
                      <div className="text-xl font-bold leading-none" style={{ color: GOLD }}>{dia}</div>
                      <div className="text-xs" style={{ color: '#9A7540' }}>{mes}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: COFFEE }}>{e.nome}</p>
                      <p className="text-xs" style={{ color: '#9A7540' }}>
                        {CLASSIF_LABELS[e.classificacao] ?? e.classificacao}
                        {e.local ? ` · ${e.local}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{
                        background: dias <= 7 ? '#FEF3C7' : SAND,
                        color: dias <= 7 ? '#92400E' : '#6B4C2A',
                      }}>
                      {dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `${dias}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: '#9A7540' }}>
              Nenhum evento próximo.{' '}
              <a href="/eventos" style={{ color: GOLD }}>Cadastrar →</a>
            </p>
          )}
        </div>
      </div>

      {/* ── Wishlist Demand ──────────────────────────────────────────────── */}
      {wishlistDemanda.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} style={{ color: '#D97706' }} />
              <h3 className="font-heading text-lg" style={{ color: COFFEE }}>Designs Mais Desejados — Wishlist</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={wishlistDemanda} layout="vertical"
                margin={{ top: 0, right: 24, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SAND} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6B4C2A' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B4C2A' }} width={155} />
                <Tooltip
                  formatter={(v: number) => [`${v} cliente${v !== 1 ? 's' : ''}`, 'Aguardando']}
                  contentStyle={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8 }}
                  labelStyle={{ color: SAND, fontSize: 12 }}
                  itemStyle={{ color: '#D4AD72', fontSize: 12 }}
                />
                <Bar dataKey="count" name="Aguardando" fill="#D97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-heading text-lg mb-3" style={{ color: COFFEE }}>Resumo Wishlist</h3>
            <div className="space-y-2">
              {wishlistDemanda.slice(0, 6).map((item, i) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate font-medium" style={{ color: COFFEE, maxWidth: '65%' }}>
                      {item.name}
                    </span>
                    <button
                      className="font-semibold flex-shrink-0 underline underline-offset-2 hover:opacity-70 transition-opacity"
                      style={{ color: '#D97706' }}
                      onClick={() => setWishlistPopup(item.name)}
                    >
                      {item.count} cliente{item.count !== 1 ? 's' : ''}
                    </button>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: SAND }}>
                    <div className="h-1.5 rounded-full"
                      style={{
                        width: `${(item.count / wishlistDemanda[0].count) * 100}%`,
                        background: i === 0 ? '#D97706' : GOLD,
                      }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 mt-1 border-t flex justify-between text-sm font-semibold"
                style={{ borderColor: SAND }}>
                <span style={{ color: COFFEE }}>Total na wishlist</span>
                <span style={{ color: GOLD }}>{wishlist.length} itens</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Últimas vendas ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg" style={{ color: COFFEE }}>Últimas Vendas</h3>
          <div className="flex items-center gap-3">
            <a href="/vendas" style={{ color: GOLD, fontSize: 13, fontWeight: 500 }}>Ver todas →</a>
            <button className="btn-primary py-1.5 text-sm" onClick={() => setVendaModalOpen(true)}>
              <Plus size={14} /> Nova Venda
            </button>
          </div>
        </div>
        {vendas.length === 0 ? (
          <p className="text-center text-sm py-4" style={{ color: '#9A7540' }}>Nenhuma venda registrada.</p>
        ) : (() => {
          // Agrupar por documento (uma "venda" pode ter múltiplos itens)
          const grupos = new Map<string, typeof vendas>()
          ;[...vendas]
            .sort((a, b) => b.data.localeCompare(a.data))
            .forEach(v => {
              const key = v.documento
              if (!grupos.has(key)) grupos.set(key, [])
              grupos.get(key)!.push(v)
            })
          const linhas = Array.from(grupos.values()).slice(0, 8)

          return (
            <div className="overflow-x-auto">
              <table className="sacra-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Design</th>
                    <th>Qtd</th>
                    <th>Total</th>
                    <th>Canal</th>
                    <th>Pgto</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map(grupo => {
                    const v0 = grupo[0]
                    const cli = v0.clienteId ? clientes.find(c => c.id === v0.clienteId) : null
                    const totalGrupo = grupo.reduce((s, v) => s + v.total, 0)
                    const isExpanded = vendaExpandida === v0.documento
                    const multiItem = grupo.length > 1

                    return (
                      <Fragment key={v0.documento}>
                        <tr
                          className={multiItem ? 'cursor-pointer hover:bg-amber-50' : ''}
                          onClick={() => multiItem && setVendaExpandida(isExpanded ? null : v0.documento)}
                        >
                          <td className="whitespace-nowrap text-xs">{v0.data}</td>
                          <td className="text-xs max-w-[120px] truncate" style={{ color: COFFEE }}>
                            {cli ? cli.nome : <span style={{ color: '#9A7540' }}>—</span>}
                          </td>
                          <td className="max-w-[150px] truncate text-sm">
                            {multiItem
                              ? <span style={{ color: '#9A7540' }}>{grupo.length} itens</span>
                              : v0.descricaoBordado.replace('BORDADO ', '')}
                          </td>
                          <td className="text-center">
                            {grupo.reduce((s, v) => s + v.quantidade, 0)}
                          </td>
                          <td className="font-semibold">{fmtBRL(totalGrupo)}</td>
                          <td><CanalBadge canal={v0.canal} /></td>
                          <td><PgBadge forma={v0.formaPagamento} /></td>
                          <td className="w-6">
                            {multiItem && (
                              isExpanded
                                ? <ChevronUp size={14} style={{ color: '#9A7540' }} />
                                : <ChevronDown size={14} style={{ color: '#9A7540' }} />
                            )}
                          </td>
                        </tr>
                        {isExpanded && grupo.map(v => (
                          <tr key={v.id} style={{ background: '#FFFBEB' }}>
                            <td></td>
                            <td></td>
                            <td className="text-xs py-1.5" style={{ color: COFFEE }}>
                              ↳ {v.descricaoBordado.replace('BORDADO ', '')}
                              {v.produto ? <span style={{ color: '#9A7540' }}> · {v.produto}</span> : ''}
                            </td>
                            <td className="text-center text-xs">{v.quantidade}</td>
                            <td className="text-xs">{fmtBRL(v.total)}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        ))}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })()}
      </div>

      <VendaModal open={vendaModalOpen} onClose={() => setVendaModalOpen(false)} />

      {/* ── Popup clientes da wishlist ────────────────────────────────────── */}
      {wishlistPopup && (() => {
        const clientesList = wishlistClientesPorDesign.get(wishlistPopup) ?? []
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setWishlistPopup(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              style={{ border: `1px solid ${SAND}` }}
              onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between px-5 py-4 border-b" style={{ borderColor: SAND }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9A7540' }}>
                    Wishlist — clientes aguardando
                  </p>
                  <h2 className="font-heading text-lg leading-tight" style={{ color: COFFEE }}>
                    {wishlistPopup}
                  </h2>
                </div>
                <button onClick={() => setWishlistPopup(null)} className="p-1 mt-0.5">
                  <X size={18} style={{ color: '#9A7540' }} />
                </button>
              </div>

              {/* Lista de clientes */}
              <div className="p-4 space-y-3">
                {clientesList.map((c, idx) => (
                  <div key={idx} className="rounded-xl p-4 space-y-2"
                    style={{ background: '#FBF7F0', border: `1px solid ${SAND}` }}>
                    {/* Nome + produto desejado */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight" style={{ color: COFFEE }}>{c.nome}</p>
                      {c.produto && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: '#E7DCC8', color: '#6B4C2A' }}>
                          {c.produto}{c.tamanho ? ` · ${c.tamanho}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Contatos */}
                    <div className="flex flex-wrap gap-2">
                      {c.telefone && (
                        <a href={`tel:${c.telefone}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
                          style={{ background: '#D1FAE5', color: '#065F46' }}>
                          <Phone size={12} /> {c.telefone}
                        </a>
                      )}
                      {c.telefone && (
                        <a href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
                          style={{ background: '#D1FAE5', color: '#065F46' }}>
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
                          style={{ background: '#EDE9FE', color: '#6D28D9' }}>
                          <Mail size={12} /> {c.email}
                        </a>
                      )}
                    </div>

                    {/* Notas */}
                    {c.notas && (
                      <p className="text-xs italic" style={{ color: '#9A7540' }}>"{c.notas}"</p>
                    )}
                  </div>
                ))}

                {clientesList.length === 0 && (
                  <p className="text-center text-sm py-4" style={{ color: '#9A7540' }}>
                    Nenhum cliente encontrado para este design.
                  </p>
                )}
              </div>

              <div className="px-5 pb-4">
                <p className="text-xs text-center" style={{ color: '#9A7540' }}>
                  {clientesList.length} cliente{clientesList.length !== 1 ? 's' : ''} aguardando este design
                </p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
