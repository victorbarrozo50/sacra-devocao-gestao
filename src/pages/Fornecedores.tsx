import { useState, useMemo } from 'react'
import {
  Plus, Edit2, Trash2, MapPin, Package, ShoppingBag,
  Clock, X, Search, Phone, Mail, ChevronRight,
} from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { fmtBRL, fmtDate, today, nanoid } from '../utils/format'
import Modal from '../components/ui/Modal'
import type { Fornecedor, Produto } from '../types'

const GOLD = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND = '#E7DCC8'
const CREAM = '#F5EFE4'

type ModalTab = 'produtos' | 'historico' | 'info'

const SEGMENTOS = [
  'Roupa / Vestuário',
  'Bordado',
  'Embalagem',
  'Material de Limpeza',
  'Acessório',
  'Papelaria',
  'Outro',
]

const SEG_COLORS: Record<string, { bg: string; color: string }> = {
  'Roupa / Vestuário': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Bordado':           { bg: '#F5F3FF', color: '#7C3AED' },
  'Embalagem':         { bg: '#FFF7ED', color: '#C2410C' },
  'Material de Limpeza': { bg: '#F0FDF4', color: '#166534' },
  'Acessório':         { bg: '#FFF1F2', color: '#BE123C' },
  'Papelaria':         { bg: '#FFFBEB', color: '#92400E' },
  'Outro':             { bg: '#F3F4F6', color: '#6B7280' },
}

function SegBadge({ seg }: { seg?: string }) {
  if (!seg) return null
  const c = SEG_COLORS[seg] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      {seg}
    </span>
  )
}

const EMPTY_FORN: Omit<Fornecedor, 'id' | 'localizacao'> = {
  nome: '', cidade: '', estado: '', transportadora: '',
  segmento: '', telefone: '', email: '', observacoes: '',
}

type FormProd = {
  descricao: string
  precoCompra: number
  precoVenda: number
  categoria: 'vestuario' | 'acessorio'
  subcategoria: string
}

const EMPTY_PROD: FormProd = {
  descricao: '', precoCompra: 0, precoVenda: 0,
  categoria: 'vestuario', subcategoria: '',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    aguardando:          { label: 'Aguardando',       bg: '#F3F4F6', color: '#6B7280' },
    compra_solicitada:   { label: 'Solicitada',       bg: '#EFF6FF', color: '#1D4ED8' },
    produto_recebido:    { label: 'Recebido',         bg: '#F0FDF4', color: '#166534' },
    bordado_em_andamento:{ label: 'Bordando',         bg: '#FFFBEB', color: '#92400E' },
    concluido:           { label: 'Concluído',        bg: '#F0FDF4', color: '#166534' },
    cancelado:           { label: 'Cancelado',        bg: '#FEF2F2', color: '#991B1B' },
  }
  const s = map[status] ?? { label: status, bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

export default function Fornecedores() {
  const {
    fornecedores, produtos, compras,
    addFornecedor, updateFornecedor, deleteFornecedor,
    addProduto, updateProduto, deleteProduto,
  } = useStore()

  const [search, setSearch] = useState('')
  const [segFilter, setSegFilter] = useState('')
  const [fornSel, setFornSel] = useState<Fornecedor | null>(null)
  const [modalTab, setModalTab] = useState<ModalTab>('produtos')

  // Modal novo/editar fornecedor
  const [fornModalOpen, setFornModalOpen] = useState(false)
  const [editFornId, setEditFornId] = useState<string | null>(null)
  const [formForn, setFormForn] = useState<Omit<Fornecedor, 'id' | 'localizacao'>>(EMPTY_FORN)

  // Modal produto
  const [prodModalOpen, setProdModalOpen] = useState(false)
  const [editProdId, setEditProdId] = useState<string | null>(null)
  const [formProd, setFormProd] = useState<FormProd>(EMPTY_PROD)

  // ── Computed ───────────────────────────────────────────────────────────────
  const fornFiltrados = useMemo(() => {
    let list = fornecedores
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((f) => f.nome.toLowerCase().includes(q) || f.cidade.toLowerCase().includes(q))
    }
    if (segFilter) {
      list = list.filter((f) => f.segmento === segFilter)
    }
    return list
  }, [fornecedores, search, segFilter])

  const segmentosUsados = useMemo(() => {
    const set = new Set(fornecedores.map((f) => f.segmento).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [fornecedores])

  function prodsForn(fId: string) {
    return produtos.filter((p) => p.fornecedorId === fId)
  }

  function comprasForn(nome: string) {
    return compras
      .filter((c) => c.fornecedor.toLowerCase() === nome.toLowerCase())
      .sort((a, b) => b.dataPedido.localeCompare(a.dataPedido))
  }

  function leadTimeMedio(nome: string): number | null {
    const cs = comprasForn(nome).filter((c) => c.leadTimeProduto != null)
    if (cs.length === 0) return null
    return Math.round(cs.reduce((s, c) => s + (c.leadTimeProduto ?? 0), 0) / cs.length)
  }

  function leadTimeBordadoMedio(nome: string): number | null {
    const cs = comprasForn(nome).filter((c) => c.leadTimeBordado != null)
    if (cs.length === 0) return null
    return Math.round(cs.reduce((s, c) => s + (c.leadTimeBordado ?? 0), 0) / cs.length)
  }

  function totalComprado(nome: string) {
    return comprasForn(nome).reduce((s, c) => s + c.valorTotal, 0)
  }

  // KPIs globais — avg of all leadTimeProduto values across all compras
  const kpis = useMemo(() => {
    const ltProdArr = compras.filter(c => c.leadTimeProduto != null).map(c => c.leadTimeProduto!)
    const ltGlobal = ltProdArr.length > 0 ? Math.round(ltProdArr.reduce((a, b) => a + b, 0) / ltProdArr.length) : null
    return {
      totalForn: fornecedores.length,
      totalProds: produtos.length,
      ltGlobal,
      totalComprado: compras.reduce((s, c) => s + c.valorTotal, 0),
    }
  }, [fornecedores, produtos, compras])

  // ── Handlers: fornecedor ───────────────────────────────────────────────────
  function openNovoForn() {
    setEditFornId(null)
    setFormForn(EMPTY_FORN)
    setFornModalOpen(true)
  }

  function openEditForn(f: Fornecedor) {
    setEditFornId(f.id)
    setFormForn({
      nome: f.nome, cidade: f.cidade, estado: f.estado,
      transportadora: f.transportadora, segmento: f.segmento ?? '',
      telefone: f.telefone ?? '', email: f.email ?? '', observacoes: f.observacoes ?? '',
    })
    setFornModalOpen(true)
  }

  function handleSalvarForn() {
    if (!formForn.nome) return
    if (editFornId) {
      updateFornecedor(editFornId, formForn)
      if (fornSel?.id === editFornId) {
        setFornSel((prev) => prev ? { ...prev, ...formForn } : null)
      }
    } else {
      addFornecedor(formForn)
    }
    setFornModalOpen(false)
    setEditFornId(null)
  }

  function handleDeleteForn(id: string, nome: string) {
    if (confirm(`Excluir fornecedor "${nome}"? Os produtos vinculados também serão removidos.`)) {
      deleteFornecedor(id)
      produtos.filter((p) => p.fornecedorId === id).forEach((p) => deleteProduto(p.id))
      if (fornSel?.id === id) setFornSel(null)
    }
  }

  // ── Handlers: produto ──────────────────────────────────────────────────────
  function openNovoProd() {
    setEditProdId(null)
    setFormProd(EMPTY_PROD)
    setProdModalOpen(true)
  }

  function openEditProd(p: Produto) {
    setEditProdId(p.id)
    setFormProd({
      descricao: p.descricao, precoCompra: p.precoCompra,
      precoVenda: p.precoVenda, categoria: p.categoria, subcategoria: p.subcategoria,
    })
    setProdModalOpen(true)
  }

  function handleSalvarProd() {
    if (!fornSel || !formProd.descricao || formProd.precoCompra <= 0) return
    if (editProdId) {
      updateProduto(editProdId, formProd)
    } else {
      addProduto({
        ...formProd,
        fornecedorId: fornSel.id,
        fornecedorNome: fornSel.nome,
      })
    }
    setProdModalOpen(false)
    setEditProdId(null)
  }

  const prodsDoForn = fornSel ? prodsForn(fornSel.id) : []
  const comprasDoForn = fornSel ? comprasForn(fornSel.nome) : []
  const ltDoForn = fornSel ? leadTimeMedio(fornSel.nome) : null
  const ltBordadoDoForn = fornSel ? leadTimeBordadoMedio(fornSel.nome) : null
  const totalDoForn = fornSel ? totalComprado(fornSel.nome) : 0

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <p className="page-subtitle">Diretório de fornecedores, produtos e histórico de compras</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="kpi-label">Fornecedores</p>
          <p className="kpi-value">{kpis.totalForn}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Produtos Cadastrados</p>
          <p className="kpi-value">{kpis.totalProds}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Lead Time Médio</p>
          <p className="kpi-value">{kpis.ltGlobal != null ? `${kpis.ltGlobal} dias` : '—'}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total em Compras</p>
          <p className="kpi-value text-2xl">{fmtBRL(kpis.totalComprado)}</p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9A7540' }} />
          <input
            className="sacra-input pl-9"
            placeholder="Buscar fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-primary flex-shrink-0" onClick={openNovoForn}>
          <Plus size={15} /> Novo Fornecedor
        </button>
      </div>

      {/* Segment filter chips */}
      {segmentosUsados.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: !segFilter ? GOLD : SAND,
              color: !segFilter ? '#fff' : '#6B4C2A',
            }}
            onClick={() => setSegFilter('')}
          >
            Todos
          </button>
          {segmentosUsados.map((s) => {
            const c = SEG_COLORS[s] ?? { bg: '#F3F4F6', color: '#6B7280' }
            const active = segFilter === s
            return (
              <button
                key={s}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={{
                  background: active ? c.color : c.bg,
                  color: active ? '#fff' : c.color,
                  outline: active ? `2px solid ${c.color}` : 'none',
                }}
                onClick={() => setSegFilter(active ? '' : s)}
              >
                {s}
              </button>
            )
          })}
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fornFiltrados.map((f) => {
          const prods = prodsForn(f.id)
          const nCompras = comprasForn(f.nome).length
          const lt = leadTimeMedio(f.nome)
          const ltBordado = leadTimeBordadoMedio(f.nome)
          const total = totalComprado(f.nome)

          return (
            <div
              key={f.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setFornSel(f); setModalTab('produtos') }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-lg font-semibold leading-tight" style={{ color: COFFEE }}>
                    {f.nome}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} style={{ color: '#9A7540', flexShrink: 0 }} />
                      <span className="text-xs" style={{ color: '#9A7540' }}>
                        {f.cidade}{f.estado ? ` · ${f.estado}` : ''}
                      </span>
                    </span>
                    {f.segmento && <SegBadge seg={f.segmento} />}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-secondary p-1.5"
                    onClick={() => openEditForn(f)}
                    title="Editar"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="btn-danger p-1.5"
                    onClick={() => handleDeleteForn(f.id, f.nome)}
                    title="Excluir"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="gold-divider mb-3" />

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs" style={{ color: '#9A7540' }}>Produtos</p>
                  <p className="font-semibold text-sm" style={{ color: COFFEE }}>{prods.length}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#9A7540' }}>Compras</p>
                  <p className="font-semibold text-sm" style={{ color: COFFEE }}>{nCompras}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#9A7540' }}>Lead Time</p>
                  <p className="font-semibold text-sm" style={{ color: lt != null ? '#D97706' : '#B09070' }}>
                    {lt != null ? `${lt}d` : '—'}
                    {ltBordado != null && (
                      <span className="ml-1 text-xs font-normal" style={{ color: '#16A34A' }}>+{ltBordado}d</span>
                    )}
                  </p>
                  {lt != null && (
                    <p className="text-xs" style={{ color: '#9A7540', opacity: 0.6 }}>
                      {ltBordado != null ? 'prod · bord' : 'produto'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#9A7540' }}>Total</p>
                  <p className="font-semibold text-sm" style={{ color: GOLD }}>
                    {total > 0 ? fmtBRL(total) : '—'}
                  </p>
                </div>
              </div>

              {/* Product list preview */}
              {prods.length > 0 && (
                <div className="mt-3 space-y-1">
                  {prods.slice(0, 3).map((p) => {
                    const mb = p.precoVenda > 0 ? ((p.precoVenda - p.precoCompra) / p.precoVenda) * 100 : 0
                    return (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="truncate" style={{ color: COFFEE, maxWidth: '55%' }}>{p.descricao}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span style={{ color: '#9A7540' }}>Custo: {fmtBRL(p.precoCompra)}</span>
                          <span className="font-semibold" style={{ color: mb >= 50 ? '#166534' : '#92400E' }}>
                            {mb.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {prods.length > 3 && (
                    <p className="text-xs" style={{ color: '#B09070' }}>
                      + {prods.length - 3} produto{prods.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end mt-3 pt-2 border-t" style={{ borderColor: SAND }}>
                <span className="text-xs flex items-center gap-1" style={{ color: '#9A7540' }}>
                  Ver detalhes <ChevronRight size={12} />
                </span>
              </div>
            </div>
          )
        })}

        {fornFiltrados.length === 0 && (
          <div
            className="lg:col-span-2 flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed"
            style={{ borderColor: SAND, color: '#B09070' }}
          >
            <Package size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Nenhum fornecedor encontrado</p>
          </div>
        )}
      </div>

      {/* ── MODAL: Detalhe do Fornecedor ────────────────────────────────────── */}
      {fornSel && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setFornSel(null)}>
          <div className="modal-box w-full" style={{ maxWidth: 760 }}>
            {/* Header */}
            <div className="modal-header">
              <div>
                <h3 className="font-heading text-xl font-semibold" style={{ color: COFFEE }}>
                  {fornSel.nome}
                </h3>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs" style={{ color: '#9A7540' }}>
                    <MapPin size={11} /> {fornSel.cidade}{fornSel.estado ? ` · ${fornSel.estado}` : ''}
                  </span>
                  {fornSel.segmento && <SegBadge seg={fornSel.segmento} />}
                  {fornSel.telefone && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#9A7540' }}>
                      <Phone size={11} /> {fornSel.telefone}
                    </span>
                  )}
                  {fornSel.email && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#9A7540' }}>
                      <Mail size={11} /> {fornSel.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => { openEditForn(fornSel); setFornSel(null) }}>
                  Editar
                </button>
                <button onClick={() => setFornSel(null)} className="p-1.5 rounded-lg" style={{ color: '#9A7540' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3"
              style={{ background: CREAM, borderBottom: `1px solid ${SAND}` }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Package size={13} style={{ color: GOLD }} />
                  <p className="text-xs" style={{ color: '#9A7540' }}>Produtos</p>
                </div>
                <p className="font-heading text-lg font-semibold" style={{ color: COFFEE }}>{prodsDoForn.length}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <ShoppingBag size={13} style={{ color: GOLD }} />
                  <p className="text-xs" style={{ color: '#9A7540' }}>Pedidos</p>
                </div>
                <p className="font-heading text-lg font-semibold" style={{ color: COFFEE }}>{comprasDoForn.length}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock size={13} style={{ color: '#D97706' }} />
                  <p className="text-xs" style={{ color: '#9A7540' }}>Lead Time</p>
                </div>
                <p className="font-heading text-lg font-semibold" style={{ color: ltDoForn != null ? '#D97706' : '#B09070' }}>
                  {ltDoForn != null ? `${ltDoForn}d` : '—'}
                  {ltBordadoDoForn != null && (
                    <span className="ml-1 text-base font-normal" style={{ color: '#16A34A' }}>+{ltBordadoDoForn}d</span>
                  )}
                </p>
                {ltDoForn != null && (
                  <p className="text-xs mt-0.5" style={{ color: '#9A7540', opacity: 0.6 }}>
                    {ltBordadoDoForn != null ? 'prod · bord' : 'produto'}
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs mb-0.5" style={{ color: '#9A7540' }}>Total Comprado</p>
                <p className="font-heading text-lg font-semibold" style={{ color: GOLD }}>{fmtBRL(totalDoForn)}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: SAND }}>
              {([
                ['produtos', `Produtos (${prodsDoForn.length})`],
                ['historico', `Histórico (${comprasDoForn.length})`],
                ['info', 'Informações'],
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

              {/* ── PRODUTOS ── */}
              {modalTab === 'produtos' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className="btn-primary text-xs" onClick={openNovoProd}>
                      <Plus size={13} /> Adicionar Produto
                    </button>
                  </div>

                  {prodsDoForn.length === 0 ? (
                    <div className="text-center py-10" style={{ color: '#B09070' }}>
                      <Package size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum produto cadastrado</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="sacra-table">
                        <thead>
                          <tr>
                            <th>Produto</th>
                            <th>Categoria</th>
                            <th>Custo</th>
                            <th>Venda</th>
                            <th>Margem</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {prodsDoForn.map((p) => {
                            const mb = p.precoVenda > 0 ? ((p.precoVenda - p.precoCompra) / p.precoVenda) * 100 : 0
                            return (
                              <tr key={p.id}>
                                <td className="font-medium text-sm">{p.descricao}</td>
                                <td className="text-xs capitalize" style={{ color: '#9A7540' }}>
                                  {p.categoria}{p.subcategoria ? ` · ${p.subcategoria}` : ''}
                                </td>
                                <td className="font-semibold">{fmtBRL(p.precoCompra)}</td>
                                <td>{fmtBRL(p.precoVenda)}</td>
                                <td>
                                  <span className="text-sm font-semibold" style={{
                                    color: mb >= 50 ? '#166534' : mb >= 35 ? '#92400E' : '#991B1B',
                                  }}>
                                    {mb.toFixed(1)}%
                                  </span>
                                </td>
                                <td>
                                  <div className="flex gap-1 justify-end">
                                    <button className="btn-secondary p-1.5" onClick={() => openEditProd(p)}>
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      className="btn-danger p-1.5"
                                      onClick={() => {
                                        if (confirm(`Excluir "${p.descricao}"?`)) deleteProduto(p.id)
                                      }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── HISTÓRICO ── */}
              {modalTab === 'historico' && (
                <div className="space-y-3">
                  {comprasDoForn.length === 0 ? (
                    <div className="text-center py-10" style={{ color: '#B09070' }}>
                      <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhuma compra registrada</p>
                    </div>
                  ) : (
                    <>
                      {/* Lead time summary */}
                      {ltDoForn != null && (
                        <div
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                          style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
                        >
                          <Clock size={16} style={{ color: '#D97706' }} />
                          <p className="text-sm" style={{ color: '#92400E' }}>
                            Lead time médio de entrega: <strong>{ltDoForn} dias</strong>
                            {' '}(baseado em {comprasDoForn.filter(c => c.leadTimeProduto != null).length} pedidos com dados)
                          </p>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="sacra-table">
                          <thead>
                            <tr>
                              <th>Data Pedido</th>
                              <th>Produto</th>
                              <th>Bordado</th>
                              <th className="text-center">Qtd</th>
                              <th>Valor</th>
                              <th className="text-center">Lead</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comprasDoForn.map((c) => (
                              <tr key={c.id}>
                                <td className="text-xs whitespace-nowrap">{fmtDate(c.dataPedido)}</td>
                                <td className="text-sm max-w-[120px] truncate">{c.produto}</td>
                                <td className="text-xs max-w-[120px] truncate" style={{ color: '#9A7540' }}>{c.bordado}</td>
                                <td className="text-center">{c.qtdTotal}</td>
                                <td className="font-semibold">{fmtBRL(c.valorTotal)}</td>
                                <td className="text-center">
                                  {c.leadTimeProduto != null ? (
                                    <span className="text-xs font-semibold" style={{ color: '#D97706' }}>
                                      {c.leadTimeProduto}d
                                    </span>
                                  ) : '—'}
                                </td>
                                <td><StatusBadge status={c.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: CREAM, fontWeight: 600 }}>
                              <td colSpan={3} className="px-4 py-2 text-sm">
                                Total ({comprasDoForn.length} pedidos)
                              </td>
                              <td className="text-center px-4 py-2">
                                {comprasDoForn.reduce((s, c) => s + c.qtdTotal, 0)}
                              </td>
                              <td className="px-4 py-2" style={{ color: GOLD }}>
                                {fmtBRL(comprasDoForn.reduce((s, c) => s + c.valorTotal, 0))}
                              </td>
                              <td colSpan={2}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── INFORMAÇÕES ── */}
              {modalTab === 'info' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Segmento', value: fornSel.segmento || '—' },
                      { label: 'Transportadora', value: fornSel.transportadora || '—' },
                      { label: 'Telefone', value: fornSel.telefone || '—' },
                      { label: 'E-mail', value: fornSel.email || '—' },
                      { label: 'Cidade / Estado', value: `${fornSel.cidade} / ${fornSel.estado}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-xl" style={{ background: CREAM, border: `1px solid ${SAND}` }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: '#9A7540' }}>{label}</p>
                        <p style={{ color: COFFEE }}>{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {fornSel.observacoes && (
                    <div className="p-3 rounded-xl text-sm italic" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: '#6B4C2A' }}>
                      <p className="text-xs font-semibold not-italic mb-1" style={{ color: '#9A7540' }}>Observações</p>
                      {fornSel.observacoes}
                    </div>
                  )}
                  <div className="pt-2 border-t" style={{ borderColor: SAND }}>
                    <button
                      className="btn-danger"
                      onClick={() => { handleDeleteForn(fornSel.id, fornSel.nome); setFornSel(null) }}
                    >
                      <Trash2 size={13} /> Excluir fornecedor
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Novo / Editar Fornecedor ─────────────────────────────────── */}
      <Modal
        open={fornModalOpen}
        onClose={() => { setFornModalOpen(false); setEditFornId(null) }}
        title={editFornId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setFornModalOpen(false); setEditFornId(null) }}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSalvarForn}>Salvar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group span-2">
            <label className="form-label">Nome do Fornecedor *</label>
            <input
              className="sacra-input"
              placeholder="Ex: Bia Chacon"
              value={formForn.nome}
              onChange={(e) => setFormForn((p) => ({ ...p, nome: e.target.value }))}
            />
          </div>
          <div className="form-group span-2">
            <label className="form-label">Segmento</label>
            <select
              className="sacra-select"
              value={formForn.segmento ?? ''}
              onChange={(e) => setFormForn((p) => ({ ...p, segmento: e.target.value }))}
            >
              <option value="">Selecionar segmento...</option>
              {SEGMENTOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cidade</label>
            <input
              className="sacra-input"
              placeholder="Ex: Natal"
              value={formForn.cidade}
              onChange={(e) => setFormForn((p) => ({ ...p, cidade: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <input
              className="sacra-input"
              placeholder="Ex: RN"
              maxLength={2}
              value={formForn.estado}
              onChange={(e) => setFormForn((p) => ({ ...p, estado: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input
              className="sacra-input"
              placeholder="(84) 99999-9999"
              value={formForn.telefone ?? ''}
              onChange={(e) => setFormForn((p) => ({ ...p, telefone: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              className="sacra-input"
              type="email"
              placeholder="contato@exemplo.com"
              value={formForn.email ?? ''}
              onChange={(e) => setFormForn((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="form-group span-2">
            <label className="form-label">Transportadora</label>
            <input
              className="sacra-input"
              placeholder="Ex: Jadlog, Correios PAC..."
              value={formForn.transportadora}
              onChange={(e) => setFormForn((p) => ({ ...p, transportadora: e.target.value }))}
            />
          </div>
          <div className="form-group span-2">
            <label className="form-label">Observações</label>
            <textarea
              className="sacra-input"
              rows={3}
              placeholder="Prazo de pagamento, condições especiais..."
              value={formForn.observacoes ?? ''}
              onChange={(e) => setFormForn((p) => ({ ...p, observacoes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* ── MODAL: Novo / Editar Produto ────────────────────────────────────── */}
      <Modal
        open={prodModalOpen}
        onClose={() => { setProdModalOpen(false); setEditProdId(null) }}
        title={editProdId ? 'Editar Produto' : `Novo Produto · ${fornSel?.nome ?? ''}`}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setProdModalOpen(false); setEditProdId(null) }}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSalvarProd}>Salvar</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Descrição do Produto *</label>
            <input
              className="sacra-input"
              placeholder="Ex: Tricoline manga curta"
              value={formProd.descricao}
              onChange={(e) => setFormProd((p) => ({ ...p, descricao: e.target.value }))}
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Preço de Custo (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="sacra-input"
                value={formProd.precoCompra}
                onChange={(e) => setFormProd((p) => ({ ...p, precoCompra: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preço de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="sacra-input"
                value={formProd.precoVenda}
                onChange={(e) => setFormProd((p) => ({ ...p, precoVenda: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select
              className="sacra-select"
              value={formProd.categoria}
              onChange={(e) => setFormProd((p) => ({ ...p, categoria: e.target.value as any }))}
            >
              <option value="vestuario">Vestuário</option>
              <option value="acessorio">Acessório</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subcategoria</label>
            <input
              className="sacra-input"
              placeholder="Ex: Manga curta, Bolsa..."
              value={formProd.subcategoria}
              onChange={(e) => setFormProd((p) => ({ ...p, subcategoria: e.target.value }))}
            />
          </div>
          {formProd.precoCompra > 0 && formProd.precoVenda > 0 && (
            <div
              className="flex justify-between items-center px-3 py-2.5 rounded-xl"
              style={{ background: CREAM, border: `1px solid ${SAND}` }}
            >
              <span className="text-xs" style={{ color: '#9A7540' }}>Margem estimada</span>
              <span className="font-semibold" style={{
                color: (formProd.precoVenda > 0 ? ((formProd.precoVenda - formProd.precoCompra) / formProd.precoVenda) * 100 : 0) >= 50 ? '#166534' : '#92400E',
              }}>
                {(formProd.precoVenda > 0 ? ((formProd.precoVenda - formProd.precoCompra) / formProd.precoVenda) * 100 : 0).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
