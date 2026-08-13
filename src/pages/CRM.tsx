import { useState, useMemo } from 'react'
import {
  Search, Plus, Phone, MapPin, X, Bell, ShoppingBag, Trash2,
  UserCheck, Calendar, Star,
} from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { fmtBRL, fmtDate, today, nanoid } from '../utils/format'
import Modal from '../components/ui/Modal'
import { CanalBadge, PgBadge } from '../components/ui/Badge'
import type { Cliente, ItemWishlist, CompraHistorico } from '../types'

const GOLD = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND = '#E7DCC8'
const CREAM = '#F5EFE4'

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

function avatarColor(id: string) {
  const COLORS = [
    '#C0955A', '#5C3D28', '#9A7540', '#3E2A1B',
    '#8B6542', '#D4AD72', '#6B4C2A', '#A07830',
  ]
  let hash = 0
  for (const ch of id) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

// ── Canal Badge label ─────────────────────────────────────────────────────────
function CanalClienteBadge({ canal }: { canal: Cliente['canal'] }) {
  const map = {
    varejo:  { label: 'Varejo',  bg: '#F0E8D820', color: '#7A5828', border: '#C0955A40' },
    atacado: { label: 'Atacado', bg: '#3E2A1B15', color: '#3E2A1B', border: '#C0955A50' },
    ambos:   { label: 'Varejo + Atacado', bg: '#C0955A15', color: '#7A5828', border: '#C0955A60' },
  }
  const { label, bg, color, border } = map[canal]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  )
}

// ── Tipo de tab no modal ──────────────────────────────────────────────────────
type ModalTab = 'info' | 'historico' | 'wishlist'

// ── Formulário de novo cliente ────────────────────────────────────────────────
const EMPTY_CLI: Omit<Cliente, 'id'> = {
  nome: '', telefone: '', email: '', cidade: '', estado: 'RN',
  canal: 'varejo', segmento: '', observacoes: '', criadoEm: today(),
}

const EMPTY_WL: Omit<ItemWishlist, 'id' | 'clienteId'> = {
  bordado: '', produto: '', tamanho: '', notas: '', criadoEm: today(),
}

const EMPTY_HIST: Omit<CompraHistorico, 'id' | 'clienteId'> = {
  data: today(), descricaoBordado: '', produto: '', quantidade: 1,
  precoUnitario: 0, total: 0, canal: 'varejo', formaPagamento: 'pix',
}

export default function CRM() {
  const {
    clientes, wishlist, comprasHistorico, bordados, produtos,
    addCliente, updateCliente, deleteCliente,
    addItemWishlist, deleteItemWishlist,
    addCompraHistorico,
  } = useStore()

  const [search, setSearch] = useState('')
  const [canalFiltro, setCanalFiltro] = useState<'todos' | Cliente['canal']>('todos')
  const [segFiltro, setSegFiltro] = useState('')

  // Modal de detalhe do cliente
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null)
  const [modalTab, setModalTab] = useState<ModalTab>('info')

  // Modal novo cliente
  const [novoOpen, setNovoOpen] = useState(false)
  const [formCli, setFormCli] = useState<Omit<Cliente, 'id'>>(EMPTY_CLI)

  // Modal editar cliente
  const [editOpen, setEditOpen] = useState(false)
  const [formEdit, setFormEdit] = useState<Omit<Cliente, 'id'>>(EMPTY_CLI)

  // Wishlist form (dentro do modal do cliente)
  const [wlOpen, setWlOpen] = useState(false)
  const [formWL, setFormWL] = useState<Omit<ItemWishlist, 'id' | 'clienteId'>>(EMPTY_WL)

  // Histórico form (dentro do modal do cliente)
  const [histOpen, setHistOpen] = useState(false)
  const [formHist, setFormHist] = useState<Omit<CompraHistorico, 'id' | 'clienteId'>>(EMPTY_HIST)

  // ── Computed ────────────────────────────────────────────────────────────────
  const segmentos = useMemo(
    () => [...new Set(clientes.map((c) => c.segmento).filter(Boolean))] as string[],
    [clientes]
  )

  const clientesFiltrados = useMemo(() => {
    let list = [...clientes]
    if (canalFiltro !== 'todos') list = list.filter((c) => c.canal === canalFiltro)
    if (segFiltro) list = list.filter((c) => c.segmento === segFiltro)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.telefone.includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.cidade ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [clientes, canalFiltro, segFiltro, search])

  function ultimaCompra(clienteId: string) {
    const hist = comprasHistorico
      .filter((h) => h.clienteId === clienteId)
      .sort((a, b) => b.data.localeCompare(a.data))
    return hist[0]?.data ?? null
  }

  function totalGasto(clienteId: string) {
    return comprasHistorico
      .filter((h) => h.clienteId === clienteId)
      .reduce((s, h) => s + h.total, 0)
  }

  function qtdWishlist(clienteId: string) {
    return wishlist.filter((w) => w.clienteId === clienteId).length
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function openDetalhe(c: Cliente) {
    setClienteSel(c)
    setModalTab('info')
  }

  function handleSalvarCliente() {
    if (!formCli.nome || !formCli.telefone) return
    addCliente(formCli)
    setFormCli(EMPTY_CLI)
    setNovoOpen(false)
  }

  function handleSalvarEdit() {
    if (!clienteSel || !formEdit.nome || !formEdit.telefone) return
    updateCliente(clienteSel.id, formEdit)
    setClienteSel({ ...clienteSel, ...formEdit })
    setEditOpen(false)
  }

  function openEdit() {
    if (!clienteSel) return
    setFormEdit({
      nome: clienteSel.nome, telefone: clienteSel.telefone,
      email: clienteSel.email ?? '', cidade: clienteSel.cidade ?? '',
      estado: clienteSel.estado ?? 'RN', canal: clienteSel.canal,
      segmento: clienteSel.segmento ?? '', observacoes: clienteSel.observacoes ?? '',
      criadoEm: clienteSel.criadoEm,
    })
    setEditOpen(true)
  }

  function handleSalvarWL() {
    if (!clienteSel || !formWL.bordado) return
    addItemWishlist({ ...formWL, clienteId: clienteSel.id, criadoEm: today() })
    setFormWL(EMPTY_WL)
    setWlOpen(false)
  }

  function handleSalvarHist() {
    if (!clienteSel || !formHist.descricaoBordado) return
    const total = formHist.quantidade * formHist.precoUnitario
    addCompraHistorico({ ...formHist, total, clienteId: clienteSel.id })
    setFormHist(EMPTY_HIST)
    setHistOpen(false)
  }

  const histCliente = clienteSel
    ? comprasHistorico
        .filter((h) => h.clienteId === clienteSel.id)
        .sort((a, b) => b.data.localeCompare(a.data))
    : []

  const wlCliente = clienteSel
    ? wishlist.filter((w) => w.clienteId === clienteSel.id)
    : []

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="kpi-label">Total de Clientes</p>
          <p className="kpi-value">{clientes.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Atacado</p>
          <p className="kpi-value">{clientes.filter((c) => c.canal !== 'varejo').length}</p>
          <p className="kpi-sub">clientes B2B</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Na Wishlist</p>
          <p className="kpi-value">{wishlist.length}</p>
          <p className="kpi-sub">itens aguardando</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Histórico Total</p>
          <p className="kpi-value text-2xl">{fmtBRL(comprasHistorico.reduce((s, h) => s + h.total, 0))}</p>
        </div>
      </div>

      {/* Filtros + Novo */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative" style={{ flex: '3 1 200px', minWidth: 200 }}>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9A7540' }} />
          <input
            className="sacra-input pl-9"
            placeholder="Buscar por nome, telefone, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="sacra-select"
          style={{ flex: '1 1 155px', minWidth: 155, width: 'auto' }}
          value={canalFiltro}
          onChange={(e) => setCanalFiltro(e.target.value as any)}
        >
          <option value="todos">Todos os canais</option>
          <option value="varejo">Varejo</option>
          <option value="atacado">Atacado</option>
          <option value="ambos">Ambos</option>
        </select>
        <select
          className="sacra-select"
          style={{ flex: '1 1 155px', minWidth: 155, width: 'auto' }}
          value={segFiltro}
          onChange={(e) => setSegFiltro(e.target.value)}
        >
          <option value="">Todos segmentos</option>
          {segmentos.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn-primary flex-shrink-0" onClick={() => { setFormCli(EMPTY_CLI); setNovoOpen(true) }}>
          <Plus size={15} /> Novo Cliente
        </button>
      </div>

      {/* Grid de cards */}
      {clientesFiltrados.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed"
          style={{ borderColor: SAND, color: '#B09070' }}
        >
          <UserCheck size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientesFiltrados.map((cliente) => {
            const uc = ultimaCompra(cliente.id)
            const gasto = totalGasto(cliente.id)
            const wlQtd = qtdWishlist(cliente.id)

            return (
              <button
                key={cliente.id}
                onClick={() => openDetalhe(cliente)}
                className="card text-left w-full hover:shadow-lg transition-shadow group"
                style={{ cursor: 'pointer' }}
              >
                {/* Avatar + nome */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ background: avatarColor(cliente.id) }}
                  >
                    {initials(cliente.nome)}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="font-heading font-semibold text-base leading-tight truncate group-hover:text-sacra-gold-dark transition-colors"
                      style={{ color: COFFEE }}
                    >
                      {cliente.nome}
                    </p>
                    {cliente.segmento && (
                      <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>{cliente.segmento}</p>
                    )}
                  </div>
                </div>

                {/* Telefone */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Phone size={13} style={{ color: GOLD, flexShrink: 0 }} />
                  <span className="text-sm font-medium" style={{ color: COFFEE }}>{cliente.telefone}</span>
                </div>

                {/* Localização */}
                {cliente.cidade && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={13} style={{ color: GOLD, flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: '#9A7540' }}>
                      {cliente.cidade}{cliente.estado ? ` · ${cliente.estado}` : ''}
                    </span>
                  </div>
                )}

                <div className="gold-divider my-2" />

                {/* Última compra */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#9A7540' }}>
                    <Calendar size={12} />
                    <span>Última compra:</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: COFFEE }}>
                    {uc ? fmtDate(uc) : <span style={{ color: '#B09070' }}>—</span>}
                  </span>
                </div>

                {/* Gasto total */}
                {gasto > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-xs" style={{ color: '#9A7540' }}>
                      <ShoppingBag size={12} />
                      <span>Total gasto:</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: GOLD }}>{fmtBRL(gasto)}</span>
                  </div>
                )}

                {/* Footer: canal + wishlist badge */}
                <div className="flex items-center justify-between mt-2">
                  <CanalClienteBadge canal={cliente.canal} />
                  {wlQtd > 0 && (
                    <span
                      className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
                    >
                      <Bell size={10} />
                      {wlQtd} {wlQtd === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ─── MODAL: Detalhe do Cliente ─────────────────────────────────────────── */}
      {clienteSel && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setClienteSel(null)}>
          <div
            className="modal-box w-full"
            style={{ maxWidth: 680 }}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-base flex-shrink-0"
                  style={{ background: avatarColor(clienteSel.id) }}
                >
                  {initials(clienteSel.nome)}
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold" style={{ color: COFFEE }}>
                    {clienteSel.nome}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <CanalClienteBadge canal={clienteSel.canal} />
                    {clienteSel.segmento && (
                      <span className="text-xs" style={{ color: '#9A7540' }}>{clienteSel.segmento}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary text-xs px-3 py-1.5"
                  onClick={openEdit}
                >
                  Editar
                </button>
                <button
                  onClick={() => setClienteSel(null)}
                  className="p-1.5 rounded-lg hover:bg-sacra-cream transition-colors"
                  style={{ color: '#9A7540' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: SAND }}>
              {([
                ['info', 'Informações'],
                ['historico', `Histórico (${histCliente.length})`],
                ['wishlist', `Wishlist (${wlCliente.length})`],
              ] as const).map(([t, lbl]) => (
                <button
                  key={t}
                  onClick={() => setModalTab(t)}
                  className="px-5 py-2.5 text-sm font-medium -mb-px"
                  style={{
                    borderBottom: modalTab === t ? `2px solid ${GOLD}` : '2px solid transparent',
                    color: modalTab === t ? GOLD : '#9A7540',
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="modal-body">

              {/* ── TAB: INFO ── */}
              {modalTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow icon={<Phone size={14} />} label="Telefone" value={clienteSel.telefone} />
                    {clienteSel.email && (
                      <InfoRow icon={<Star size={14} />} label="E-mail" value={clienteSel.email} />
                    )}
                    {clienteSel.cidade && (
                      <InfoRow icon={<MapPin size={14} />} label="Cidade" value={`${clienteSel.cidade}${clienteSel.estado ? ` / ${clienteSel.estado}` : ''}`} />
                    )}
                    <InfoRow icon={<Calendar size={14} />} label="Cliente desde" value={fmtDate(clienteSel.criadoEm)} />
                  </div>

                  {/* Resumo financeiro */}
                  <div
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl"
                    style={{ background: CREAM, border: `1px solid ${SAND}` }}
                  >
                    <div className="text-center">
                      <p className="text-xs" style={{ color: '#9A7540' }}>Total gasto</p>
                      <p className="font-heading text-lg font-semibold" style={{ color: GOLD }}>
                        {fmtBRL(totalGasto(clienteSel.id))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs" style={{ color: '#9A7540' }}>Compras</p>
                      <p className="font-heading text-lg font-semibold" style={{ color: COFFEE }}>
                        {histCliente.length}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs" style={{ color: '#9A7540' }}>Última compra</p>
                      <p className="text-sm font-semibold" style={{ color: COFFEE }}>
                        {ultimaCompra(clienteSel.id) ? fmtDate(ultimaCompra(clienteSel.id)!) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Observações */}
                  {clienteSel.observacoes && (
                    <div
                      className="p-3 rounded-xl text-sm italic"
                      style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: '#6B4C2A' }}
                    >
                      <p className="text-xs font-semibold not-italic mb-1" style={{ color: '#9A7540' }}>
                        Observações
                      </p>
                      {clienteSel.observacoes}
                    </div>
                  )}

                  {/* Danger */}
                  <div className="pt-2 border-t" style={{ borderColor: SAND }}>
                    <button
                      className="btn-danger"
                      onClick={() => {
                        if (confirm(`Excluir ${clienteSel.nome}?`)) {
                          deleteCliente(clienteSel.id)
                          setClienteSel(null)
                        }
                      }}
                    >
                      <Trash2 size={13} /> Excluir cliente
                    </button>
                  </div>
                </div>
              )}

              {/* ── TAB: HISTÓRICO ── */}
              {modalTab === 'historico' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      className="btn-primary text-xs"
                      onClick={() => { setFormHist(EMPTY_HIST); setHistOpen(true) }}
                    >
                      <Plus size={13} /> Registrar compra
                    </button>
                  </div>

                  {histCliente.length === 0 ? (
                    <div className="text-center py-10" style={{ color: '#B09070' }}>
                      <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhuma compra registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {histCliente.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: CREAM, border: `1px solid ${SAND}` }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: COFFEE }}>
                              {h.descricaoBordado.replace('BORDADO ', '')}
                            </p>
                            {h.produto && (
                              <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>{h.produto}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs" style={{ color: '#9A7540' }}>{fmtDate(h.data)}</span>
                              <span className="text-xs" style={{ color: '#B09070' }}>·</span>
                              <span className="text-xs" style={{ color: '#9A7540' }}>{h.quantidade} un</span>
                              <PgBadge forma={h.formaPagamento} />
                            </div>
                          </div>
                          <p className="font-heading text-base font-semibold flex-shrink-0" style={{ color: GOLD }}>
                            {fmtBRL(h.total)}
                          </p>
                        </div>
                      ))}
                      <div
                        className="flex justify-between items-center px-3 py-2 rounded-xl font-semibold text-sm"
                        style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}40` }}
                      >
                        <span style={{ color: COFFEE }}>Total gasto</span>
                        <span className="font-heading text-lg" style={{ color: GOLD }}>
                          {fmtBRL(histCliente.reduce((s, h) => s + h.total, 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: WISHLIST ── */}
              {modalTab === 'wishlist' && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm" style={{ color: '#9A7540' }}>
                      Peças que o cliente deseja ser notificado quando chegar.
                    </p>
                    <button
                      className="btn-primary text-xs flex-shrink-0"
                      onClick={() => { setFormWL(EMPTY_WL); setWlOpen(true) }}
                    >
                      <Plus size={13} /> Adicionar
                    </button>
                  </div>

                  {wlCliente.length === 0 ? (
                    <div className="text-center py-10" style={{ color: '#B09070' }}>
                      <Bell size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum item na wishlist</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {wlCliente.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-start gap-3 p-3 rounded-xl"
                          style={{ background: '#FEF3C710', border: '1px solid #FDE68A60' }}
                        >
                          <Bell size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: COFFEE }}>
                              {w.bordado.replace('BORDADO ', '')}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {w.produto && (
                                <span className="text-xs" style={{ color: '#9A7540' }}>{w.produto}</span>
                              )}
                              {w.tamanho && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                  style={{ background: SAND, color: COFFEE }}
                                >
                                  {w.tamanho}
                                </span>
                              )}
                            </div>
                            {w.notas && (
                              <p className="text-xs mt-1 italic" style={{ color: '#9A7540' }}>{w.notas}</p>
                            )}
                            <p className="text-xs mt-1" style={{ color: '#B09070' }}>
                              Adicionado em {fmtDate(w.criadoEm)}
                            </p>
                          </div>
                          <button
                            className="btn-danger p-1.5 flex-shrink-0"
                            onClick={() => deleteItemWishlist(w.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Novo Cliente ─────────────────────────────────────────────── */}
      <Modal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        title="Novo Cliente"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setNovoOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSalvarCliente}>Salvar</button>
          </>
        }
      >
        <ClienteForm form={formCli} onChange={setFormCli} segmentos={segmentos} />
      </Modal>

      {/* ─── MODAL: Editar Cliente ────────────────────────────────────────────── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar Cliente"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSalvarEdit}>Salvar</button>
          </>
        }
      >
        <ClienteForm form={formEdit} onChange={setFormEdit} segmentos={segmentos} />
      </Modal>

      {/* ─── MODAL: Adicionar à Wishlist ─────────────────────────────────────── */}
      <Modal
        open={wlOpen}
        onClose={() => setWlOpen(false)}
        title="Adicionar à Wishlist"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setWlOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSalvarWL}>Salvar</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Design (Bordado)</label>
            <select
              className="sacra-select"
              value={formWL.bordado}
              onChange={(e) => setFormWL((p) => ({ ...p, bordado: e.target.value }))}
            >
              <option value="">Selecionar design...</option>
              {bordados.map((b) => (
                <option key={b.codigo} value={b.descricao}>
                  {b.descricao.replace('BORDADO ', '')}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de Peça</label>
            <select
              className="sacra-select"
              value={formWL.produto}
              onChange={(e) => setFormWL((p) => ({ ...p, produto: e.target.value }))}
            >
              <option value="">Qualquer peça...</option>
              {[...new Set(produtos.map((p) => p.descricao))].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tamanho</label>
            <select
              className="sacra-select"
              value={formWL.tamanho}
              onChange={(e) => setFormWL((p) => ({ ...p, tamanho: e.target.value }))}
            >
              <option value="">Sem preferência</option>
              {['PP', 'P', 'M', 'G', 'GG'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <input
              className="sacra-input"
              placeholder="Ex: Quer ser avisada via WhatsApp..."
              value={formWL.notas}
              onChange={(e) => setFormWL((p) => ({ ...p, notas: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* ─── MODAL: Registrar Compra ──────────────────────────────────────────── */}
      <Modal
        open={histOpen}
        onClose={() => setHistOpen(false)}
        title="Registrar Compra"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setHistOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSalvarHist}>Salvar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Data</label>
            <input type="date" className="sacra-input" value={formHist.data}
              onChange={(e) => setFormHist((p) => ({ ...p, data: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Canal</label>
            <select className="sacra-select" value={formHist.canal}
              onChange={(e) => setFormHist((p) => ({ ...p, canal: e.target.value as any }))}>
              <option value="varejo">Varejo</option>
              <option value="atacado">Atacado</option>
            </select>
          </div>
          <div className="form-group span-2">
            <label className="form-label">Design (Bordado)</label>
            <select className="sacra-select" value={formHist.descricaoBordado}
              onChange={(e) => setFormHist((p) => ({ ...p, descricaoBordado: e.target.value }))}>
              <option value="">Selecionar...</option>
              {bordados.map((b) => (
                <option key={b.codigo} value={b.descricao}>{b.descricao.replace('BORDADO ', '')}</option>
              ))}
            </select>
          </div>
          <div className="form-group span-2">
            <label className="form-label">Produto</label>
            <select className="sacra-select" value={formHist.produto ?? ''}
              onChange={(e) => setFormHist((p) => ({ ...p, produto: e.target.value }))}>
              <option value="">Selecionar...</option>
              {[...new Set(produtos.map((p) => p.descricao))].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantidade</label>
            <input type="number" min={1} className="sacra-input" value={formHist.quantidade}
              onChange={(e) => setFormHist((p) => ({ ...p, quantidade: Number(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Preço Unit. (R$)</label>
            <input type="number" step="0.01" min={0} className="sacra-input" value={formHist.precoUnitario}
              onChange={(e) => setFormHist((p) => ({ ...p, precoUnitario: Number(e.target.value) }))} />
          </div>
          <div className="form-group span-2">
            <label className="form-label">Forma de Pagamento</label>
            <select className="sacra-select" value={formHist.formaPagamento}
              onChange={(e) => setFormHist((p) => ({ ...p, formaPagamento: e.target.value as any }))}>
              <option value="pix">PIX</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>
          {formHist.quantidade > 0 && formHist.precoUnitario > 0 && (
            <div className="form-group span-2 p-3 rounded-xl" style={{ background: CREAM, border: `1px solid ${SAND}` }}>
              <p className="form-label">Total</p>
              <p className="font-heading text-2xl font-semibold" style={{ color: GOLD }}>
                {fmtBRL(formHist.quantidade * formHist.precoUnitario)}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

// ── Sub-component: linha de info ──────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: '#C0955A', marginTop: 1 }}>{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9A7540', opacity: 0.7 }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: '#3E2A1B' }}>{value}</p>
      </div>
    </div>
  )
}

// ── Sub-component: formulário de cliente ──────────────────────────────────────
function ClienteForm({
  form,
  onChange,
  segmentos,
}: {
  form: Omit<Cliente, 'id'>
  onChange: (f: Omit<Cliente, 'id'>) => void
  segmentos: string[]
}) {
  const set = (k: keyof Omit<Cliente, 'id'>, v: string) =>
    onChange({ ...form, [k]: v })

  return (
    <div className="form-grid">
      <div className="form-group span-2">
        <label className="form-label">Nome completo *</label>
        <input className="sacra-input" placeholder="Nome do cliente ou empresa" value={form.nome}
          onChange={(e) => set('nome', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Telefone *</label>
        <input className="sacra-input" placeholder="(84) 99999-9999" value={form.telefone}
          onChange={(e) => set('telefone', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">E-mail</label>
        <input className="sacra-input" type="email" placeholder="email@exemplo.com" value={form.email ?? ''}
          onChange={(e) => set('email', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Cidade</label>
        <input className="sacra-input" placeholder="Ex: Natal" value={form.cidade ?? ''}
          onChange={(e) => set('cidade', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Estado</label>
        <input className="sacra-input" placeholder="Ex: RN" maxLength={2} value={form.estado ?? ''}
          onChange={(e) => set('estado', e.target.value.toUpperCase())} />
      </div>
      <div className="form-group">
        <label className="form-label">Canal</label>
        <select className="sacra-select" value={form.canal}
          onChange={(e) => onChange({ ...form, canal: e.target.value as any })}>
          <option value="varejo">Varejo</option>
          <option value="atacado">Atacado</option>
          <option value="ambos">Ambos</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Segmento</label>
        <input className="sacra-input" placeholder="Ex: Igreja, Loja, Presente..."
          list="seg-list" value={form.segmento ?? ''}
          onChange={(e) => set('segmento', e.target.value)} />
        <datalist id="seg-list">
          {segmentos.map((s) => <option key={s} value={s} />)}
        </datalist>
      </div>
      <div className="form-group span-2">
        <label className="form-label">Observações</label>
        <textarea className="sacra-input" rows={3} placeholder="Preferências, histórico, anotações..."
          value={form.observacoes ?? ''}
          onChange={(e) => set('observacoes', e.target.value)} />
      </div>
    </div>
  )
}
