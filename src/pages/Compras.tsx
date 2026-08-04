import { useState, useMemo } from 'react'
import { Plus, ChevronRight, Trash2, CheckCircle2, Package, AlertCircle, X } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { fmtBRL, fmtDate, today } from '../utils/format'
import Modal from '../components/ui/Modal'
import { StatusCompraBadge } from '../components/ui/Badge'
import type { Compra, StatusCompra } from '../types'

const GOLD = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND = '#E7DCC8'
const CREAM = '#F5EFE4'

const STATUS_FLOW: StatusCompra[] = [
  'aguardando', 'compra_solicitada', 'produto_recebido', 'bordado_em_andamento', 'concluido',
]

const EMPTY: Omit<Compra, 'id'> = {
  dataPedido: today(),
  fornecedor: '',
  produto: '',
  bordado: '',
  qtdPP: 0, qtdP: 0, qtdM: 0, qtdG: 0, qtdGG: 0, qtdTotal: 0,
  precoUnitario: 0,
  valorTotal: 0,
  frete: 0,
  status: 'aguardando',
  observacoes: '',
}

function custoRealTotal(c: Compra) {
  const pecas = c.precoUnitario * c.qtdTotal
  const bordado = (c.custoBordado ?? 0) * c.qtdTotal
  const frete = c.frete ?? 0
  return pecas + bordado + frete
}

function custoUnitarioReal(c: Compra) {
  const total = custoRealTotal(c)
  return c.qtdTotal > 0 ? total / c.qtdTotal : 0
}

export default function Compras() {
  const {
    compras, fornecedores, produtos, bordados,
    addCompra, deleteCompra, updateStatusCompra, updateCompra,
  } = useStore()

  const [statusFiltro, setStatusFiltro] = useState<StatusCompra | 'todos'>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<Omit<Compra, 'id'>>(EMPTY)

  // Search / filter states
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroPeca, setFiltroPeca] = useState('')
  const [filtroFornecedor, setFiltroFornecedor] = useState('')
  const [filtroBordado, setFiltroBordado] = useState('')

  // Bordado inline edit (produto_recebido step)
  const [bordadoEdit, setBordadoEdit] = useState<Record<string, string>>({})

  // Stock feedback
  const [estoqueAviso, setEstoqueAviso] = useState<string | null>(null)

  const hasFilters = !!(filtroDataInicio || filtroDataFim || filtroPeca || filtroFornecedor || filtroBordado)

  function clearFilters() {
    setFiltroDataInicio('')
    setFiltroDataFim('')
    setFiltroPeca('')
    setFiltroFornecedor('')
    setFiltroBordado('')
  }

  const filtered = useMemo(() => {
    let list = [...compras].sort((a, b) => b.dataPedido.localeCompare(a.dataPedido))
    if (statusFiltro !== 'todos') list = list.filter((c) => c.status === statusFiltro)
    if (filtroDataInicio) list = list.filter((c) => c.dataPedido >= filtroDataInicio)
    if (filtroDataFim) list = list.filter((c) => c.dataPedido <= filtroDataFim)
    if (filtroPeca) list = list.filter((c) => c.produto.toLowerCase().includes(filtroPeca.toLowerCase()))
    if (filtroFornecedor) list = list.filter((c) => c.fornecedor === filtroFornecedor)
    if (filtroBordado) list = list.filter((c) => c.bordado.toLowerCase().includes(filtroBordado.toLowerCase()))
    return list
  }, [compras, statusFiltro, filtroDataInicio, filtroDataFim, filtroPeca, filtroFornecedor, filtroBordado])

  const emAberto = compras.filter((c) => c.status !== 'concluido' && c.status !== 'cancelado')
  const totalInvestido = compras.reduce((s, c) => s + c.valorTotal, 0)

  // Form computed values
  const formFreteRateado = form.qtdTotal > 0 ? (form.frete ?? 0) / form.qtdTotal : 0
  const formCustoUnitarioFinal = form.precoUnitario + formFreteRateado
  const formTotalFinal = form.valorTotal + (form.frete ?? 0)

  const setField = (k: keyof Omit<Compra, 'id'>, val: any) => {
    setForm((prev) => {
      const next = { ...prev, [k]: val }
      const total = Number(next.qtdPP) + Number(next.qtdP) + Number(next.qtdM) + Number(next.qtdG) + Number(next.qtdGG)
      next.qtdTotal = total
      next.valorTotal = total * Number(next.precoUnitario)
      return next
    })
  }

  const handleSubmit = () => {
    if (!form.fornecedor || !form.produto) return
    addCompra(form)
    setForm(EMPTY)
    setModalOpen(false)
  }

  const nextStatus = (current: StatusCompra): StatusCompra | null => {
    const idx = STATUS_FLOW.indexOf(current)
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  function handleConfirmarBordado(c: Compra) {
    const novoDesc = bordadoEdit[c.id]
    if (!novoDesc) return
    const bordadoObj = bordados.find((b) => b.descricao === novoDesc)
    updateCompra(c.id, { bordado: novoDesc, custoBordado: bordadoObj?.custoUnitario ?? 0 })
    setBordadoEdit((prev) => {
      const next = { ...prev }
      delete next[c.id]
      return next
    })
  }

  function handleAdicionarEstoque(c: Compra) {
    if (c.adicionadoAoEstoque) {
      setEstoqueAviso(c.id)
      setTimeout(() => setEstoqueAviso(null), 3000)
      return
    }
    updateCompra(c.id, { adicionadoAoEstoque: true })
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="kpi-label">Em Aberto</p>
          <p className="kpi-value">{emAberto.length}</p>
          <p className="kpi-sub">pedidos ativos</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total Investido</p>
          <p className="kpi-value text-2xl">{fmtBRL(totalInvestido)}</p>
          <p className="kpi-sub">{compras.length} pedidos</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Concluídos</p>
          <p className="kpi-value">{compras.filter((c) => c.status === 'concluido').length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">No Estoque</p>
          <p className="kpi-value">{compras.filter((c) => c.adicionadoAoEstoque).length}</p>
          <p className="kpi-sub">pedidos adicionados</p>
        </div>
      </div>

      {/* Status filter + Add button */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(['todos', 'aguardando', 'compra_solicitada', 'produto_recebido', 'bordado_em_andamento', 'concluido'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFiltro(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: statusFiltro === s ? 'var(--sacra-gold)' : 'white',
                color: statusFiltro === s ? 'white' : 'var(--sacra-coffee)',
                border: `1px solid ${statusFiltro === s ? 'var(--sacra-gold)' : 'var(--sacra-sand)'}`,
              }}
            >
              {s === 'todos' ? 'Todos'
                : s === 'aguardando' ? 'Aguardando'
                : s === 'compra_solicitada' ? 'Compra Solicitada'
                : s === 'produto_recebido' ? 'Produto Recebido'
                : s === 'bordado_em_andamento' ? 'Bordando'
                : 'Concluídos'}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Nova Compra
        </button>
      </div>

      {/* Search filters */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: '#9A7540' }}>Filtros de busca</p>
          {hasFilters && (
            <button
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
              style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
              onClick={clearFilters}
            >
              <X size={11} /> Limpar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="form-group">
            <label className="form-label text-xs">Data inicial</label>
            <input
              type="date"
              className="sacra-input text-xs"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label text-xs">Data final</label>
            <input
              type="date"
              className="sacra-input text-xs"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label text-xs">Peça</label>
            <input
              className="sacra-input text-xs"
              placeholder="Buscar peça..."
              value={filtroPeca}
              onChange={(e) => setFiltroPeca(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label text-xs">Fornecedor</label>
            <select
              className="sacra-select text-xs"
              value={filtroFornecedor}
              onChange={(e) => setFiltroFornecedor(e.target.value)}
            >
              <option value="">Todos</option>
              {[...new Set(compras.map((c) => c.fornecedor))].sort().map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label text-xs">Bordado</label>
            <input
              className="sacra-input text-xs"
              placeholder="Buscar bordado..."
              value={filtroBordado}
              onChange={(e) => setFiltroBordado(e.target.value)}
            />
          </div>
        </div>
        {hasFilters && (
          <p className="text-xs" style={{ color: '#9A7540' }}>
            Mostrando {filtered.length} de {compras.length} pedido{compras.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Lista de compras */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center py-10" style={{ color: '#B09070' }}>
            Nenhuma compra encontrada
          </div>
        )}
        {filtered.map((c) => {
          const ns = nextStatus(c.status)
          const isProdutoRecebido = c.status === 'produto_recebido'
          const isConcluido = c.status === 'concluido'
          const bordadoSelecionado = bordadoEdit[c.id] ?? c.bordado

          // For produto_recebido: preview bordado cost
          const bordadoEditObj = bordados.find((b) => b.descricao === bordadoSelecionado)
          const custoBordadoPreview = bordadoEditObj?.custoUnitario ?? 0

          // For concluido: full cost breakdown
          const totalPecas = c.precoUnitario * c.qtdTotal
          const totalBordado = (c.custoBordado ?? 0) * c.qtdTotal
          const frete = c.frete ?? 0
          const totalPedido = totalPecas + totalBordado + frete
          const custoUnitFinal = c.qtdTotal > 0 ? totalPedido / c.qtdTotal : 0

          return (
            <div key={c.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusCompraBadge status={c.status} />
                    <span className="text-xs" style={{ color: '#9A7540' }}>{fmtDate(c.dataPedido)}</span>
                    {c.adicionadoAoEstoque && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: '#F0FDF4', color: '#166534' }}
                      >
                        <CheckCircle2 size={11} /> No estoque
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm" style={{ color: COFFEE }}>
                    {c.produto} · <span style={{ color: '#9A7540' }}>{c.fornecedor}</span>
                  </p>
                  {!isProdutoRecebido && (
                    <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>
                      Design: {c.bordado ? c.bordado.replace('BORDADO ', '') : <em>não selecionado</em>}
                    </p>
                  )}
                </div>

                {/* Sizes */}
                <div className="flex gap-1 text-xs">
                  {[['PP', c.qtdPP], ['P', c.qtdP], ['M', c.qtdM], ['G', c.qtdG], ['GG', c.qtdGG]].map(([sz, q]) => (
                    <div key={sz as string} className="flex flex-col items-center">
                      <span style={{ color: '#9A7540' }}>{sz}</span>
                      <span className="font-semibold" style={{ color: COFFEE }}>{q}</span>
                    </div>
                  ))}
                  <div className="w-px mx-1" style={{ background: SAND }} />
                  <div className="flex flex-col items-center">
                    <span style={{ color: '#9A7540' }}>Total</span>
                    <span className="font-bold" style={{ color: GOLD }}>{c.qtdTotal}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-heading text-lg font-semibold" style={{ color: COFFEE }}>
                    {fmtBRL(isConcluido ? totalPedido : c.valorTotal)}
                  </p>
                  <p className="text-xs" style={{ color: '#9A7540' }}>
                    {isConcluido
                      ? `${fmtBRL(custoUnitFinal)}/un (real)`
                      : `${fmtBRL(c.precoUnitario)}/un`}
                  </p>
                </div>
              </div>

              {/* ── PRODUTO RECEBIDO: seletor de bordado + preview de custo ── */}
              {isProdutoRecebido && (
                <div
                  className="mt-3 p-3 rounded-xl space-y-2"
                  style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
                >
                  <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
                    Selecionar design para bordado
                  </p>
                  <div className="flex gap-2">
                    <select
                      className="sacra-select flex-1 text-sm"
                      value={bordadoSelecionado}
                      onChange={(e) => setBordadoEdit((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    >
                      <option value="">— Nenhum design —</option>
                      {bordados.map((b) => (
                        <option key={b.codigo} value={b.descricao}>
                          {b.descricao.replace('BORDADO ', '')}
                        </option>
                      ))}
                    </select>
                    {bordadoEdit[c.id] && bordadoEdit[c.id] !== c.bordado && (
                      <button
                        className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                        onClick={() => handleConfirmarBordado(c)}
                      >
                        Confirmar
                      </button>
                    )}
                  </div>

                  {/* Bordado cost preview */}
                  {bordadoSelecionado && custoBordadoPreview > 0 && (
                    <div
                      className="rounded-lg p-2 space-y-1 text-xs"
                      style={{ background: 'white', border: '1px solid #FDE68A' }}
                    >
                      <div className="flex justify-between">
                        <span style={{ color: '#92400E' }}>Custo do bordado</span>
                        <span style={{ color: '#92400E' }}>{fmtBRL(custoBordadoPreview)}/un</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span style={{ color: '#92400E' }}>Total bordado ({c.qtdTotal} un)</span>
                        <span style={{ color: GOLD }}>{fmtBRL(custoBordadoPreview * c.qtdTotal)}</span>
                      </div>
                    </div>
                  )}
                  {bordadoSelecionado && custoBordadoPreview === 0 && bordadoSelecionado && (
                    <p className="text-xs italic" style={{ color: '#92400E' }}>
                      Custo do bordado não cadastrado — configure em Bordados &amp; Designs.
                    </p>
                  )}
                  {c.bordado && !bordadoEdit[c.id] && (
                    <p className="text-xs" style={{ color: '#92400E' }}>
                      Atual: <strong>{c.bordado.replace('BORDADO ', '')}</strong>
                      {c.custoBordado ? ` · ${fmtBRL(c.custoBordado)}/un` : ''}
                    </p>
                  )}
                </div>
              )}

              {/* ── CONCLUÍDO: resumo completo de custo + estoque ── */}
              {isConcluido && (
                <div
                  className="mt-3 p-3 rounded-xl space-y-3"
                  style={{ background: CREAM, border: `1px solid ${SAND}` }}
                >
                  <p className="text-xs font-semibold" style={{ color: '#9A7540' }}>
                    Resumo do pedido
                  </p>

                  {/* Quantities per size */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                    {([['PP', c.qtdPP], ['P', c.qtdP], ['M', c.qtdM], ['G', c.qtdG], ['GG', c.qtdGG]] as [string, number][])
                      .filter(([, q]) => q > 0)
                      .map(([sz, q]) => (
                        <div key={sz} className="rounded-lg p-2" style={{ background: 'white', border: `1px solid ${SAND}` }}>
                          <p className="text-xs font-semibold" style={{ color: '#9A7540' }}>{sz}</p>
                          <p className="font-bold text-sm" style={{ color: COFFEE }}>{q} un</p>
                        </div>
                      ))
                    }
                  </div>

                  {/* Full cost breakdown */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: '#9A7540' }}>
                        Peças ({c.qtdTotal} un × {fmtBRL(c.precoUnitario)})
                      </span>
                      <span style={{ color: COFFEE }}>{fmtBRL(totalPecas)}</span>
                    </div>
                    {totalBordado > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: '#9A7540' }}>
                          Bordado ({c.qtdTotal} un × {fmtBRL(c.custoBordado ?? 0)})
                        </span>
                        <span style={{ color: COFFEE }}>{fmtBRL(totalBordado)}</span>
                      </div>
                    )}
                    {frete > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: '#9A7540' }}>
                          Frete (rateado: {fmtBRL(c.qtdTotal > 0 ? frete / c.qtdTotal : 0)}/un)
                        </span>
                        <span style={{ color: COFFEE }}>{fmtBRL(frete)}</span>
                      </div>
                    )}
                    <div
                      className="flex justify-between pt-1.5 mt-1 border-t font-semibold"
                      style={{ borderColor: SAND }}
                    >
                      <span style={{ color: '#9A7540' }}>Total do pedido</span>
                      <span className="font-heading text-base" style={{ color: GOLD }}>
                        {fmtBRL(totalPedido)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: '#9A7540' }}>Custo unitário real</span>
                      <span style={{ color: COFFEE }}>{fmtBRL(custoUnitFinal)}/un</span>
                    </div>
                  </div>

                  {/* Stock button */}
                  <div className="pt-1">
                    {c.adicionadoAoEstoque ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}
                      >
                        <CheckCircle2 size={13} /> Adicionado ao estoque
                      </span>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: GOLD, color: 'white' }}
                          onClick={() => handleAdicionarEstoque(c)}
                        >
                          <Package size={13} /> Adicionar ao Estoque
                        </button>
                        {estoqueAviso === c.id && (
                          <p className="flex items-center gap-1 text-xs" style={{ color: '#991B1B' }}>
                            <AlertCircle size={12} /> Este pedido já foi adicionado ao estoque.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {c.observacoes && (
                <p className="text-xs mt-2 italic" style={{ color: '#9A7540' }}>
                  Obs: {c.observacoes}
                </p>
              )}

              {/* Lead times */}
              {(c.dataEntregaProduto || c.dataEntregaBordado) && (
                <div className="flex gap-4 mt-2 pt-2 border-t text-xs" style={{ borderColor: SAND, color: '#9A7540' }}>
                  {c.dataEntregaProduto && (
                    <span>Produto: {fmtDate(c.dataEntregaProduto)} ({c.leadTimeProduto}d)</span>
                  )}
                  {c.dataEntregaBordado && (
                    <span>Bordado: {fmtDate(c.dataEntregaBordado)} ({c.leadTimeBordado}d)</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                {ns && (
                  <button
                    className="btn-secondary text-xs px-3 py-1.5"
                    onClick={() => updateStatusCompra(c.id, ns)}
                  >
                    <ChevronRight size={13} />
                    Avançar para: {ns === 'compra_solicitada' ? 'Compra Solicitada'
                      : ns === 'produto_recebido' ? 'Produto Recebido'
                      : ns === 'bordado_em_andamento' ? 'Bordando'
                      : 'Concluído'}
                  </button>
                )}
                <button className="btn-danger" onClick={() => deleteCompra(c.id)}>
                  <Trash2 size={13} /> Excluir
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal — Novo Pedido */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(EMPTY) }}
        title="Novo Pedido de Compra"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalOpen(false); setForm(EMPTY) }}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit}>Salvar Pedido</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Data do Pedido</label>
              <input
                type="date"
                className="sacra-input"
                value={form.dataPedido}
                onChange={(e) => setField('dataPedido', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fornecedor</label>
              <select
                className="sacra-select"
                value={form.fornecedor}
                onChange={(e) => setField('fornecedor', e.target.value)}
              >
                <option value="">Selecionar...</option>
                {fornecedores.map((f) => <option key={f.id} value={f.nome}>{f.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Frete — aparece quando fornecedor selecionado */}
          {form.fornecedor && (
            <div className="form-group">
              <label className="form-label">Frete (R$)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="sacra-input"
                placeholder="0,00"
                value={form.frete ?? 0}
                onChange={(e) => setField('frete', Number(e.target.value))}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Produto</label>
            <select
              className="sacra-select"
              value={form.produto}
              onChange={(e) => setField('produto', e.target.value)}
            >
              <option value="">Selecionar...</option>
              {produtos
                .filter((p) => !form.fornecedor || p.fornecedorNome === form.fornecedor)
                .map((p) => (
                  <option key={p.id} value={p.descricao}>{p.descricao}</option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <input
              className="sacra-input"
              placeholder="Opcional..."
              value={form.observacoes}
              onChange={(e) => setField('observacoes', e.target.value)}
            />
          </div>

          {/* Tamanhos */}
          <div>
            <p className="form-label mb-2">Quantidades por Tamanho</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(['PP', 'P', 'M', 'G', 'GG'] as const).map((sz) => {
                const key = `qtd${sz}` as 'qtdPP' | 'qtdP' | 'qtdM' | 'qtdG' | 'qtdGG'
                return (
                  <div key={sz} className="form-group">
                    <label className="form-label text-center">{sz}</label>
                    <input
                      type="number" min={0} className="sacra-input text-center"
                      value={form[key]}
                      onChange={(e) => setField(key, Number(e.target.value))}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Preço Unitário da Peça (R$)</label>
            <input
              type="number" step="0.01" className="sacra-input"
              value={form.precoUnitario}
              onChange={(e) => setField('precoUnitario', Number(e.target.value))}
            />
          </div>

          {/* Summary box */}
          <div className="p-3 rounded-xl space-y-1.5" style={{ background: CREAM, border: `1px solid ${SAND}` }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#9A7540' }}>Total de peças</span>
              <span className="font-semibold">{form.qtdTotal} un</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#9A7540' }}>
                Valor das peças ({form.qtdTotal} × {fmtBRL(form.precoUnitario)})
              </span>
              <span style={{ color: COFFEE }}>{fmtBRL(form.valorTotal)}</span>
            </div>
            {(form.frete ?? 0) > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9A7540' }}>Frete</span>
                  <span style={{ color: COFFEE }}>{fmtBRL(form.frete ?? 0)}</span>
                </div>
                <div
                  className="flex justify-between text-sm pt-1.5 border-t font-semibold"
                  style={{ borderColor: SAND }}
                >
                  <span style={{ color: '#9A7540' }}>Total do pedido</span>
                  <span className="font-heading text-base" style={{ color: GOLD }}>{fmtBRL(formTotalFinal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#9A7540' }}>Custo unitário (com frete rateado)</span>
                  <span style={{ color: COFFEE }}>{fmtBRL(formCustoUnitarioFinal)}/un</span>
                </div>
              </>
            )}
            {!(form.frete ?? 0) && (
              <div className="flex justify-between text-sm font-semibold pt-1 border-t" style={{ borderColor: SAND }}>
                <span style={{ color: '#9A7540' }}>Valor total</span>
                <span className="font-heading text-lg" style={{ color: GOLD }}>{fmtBRL(form.valorTotal)}</span>
              </div>
            )}
          </div>

          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
          >
            <span className="mt-0.5">💡</span>
            <span>O design (bordado) será selecionado quando o produto for recebido.</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
