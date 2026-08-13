import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle2, Package, Scissors, Box, Truck, ArrowLeft,
  User, ChevronRight, BookOpen, ClipboardList, X,
} from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { fmtBRL, fmtDate } from '../utils/format'
import type { StatusCompra, ProcessoManual } from '../types'

const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'
const GREEN  = '#16A34A'

// ── Status pipeline ───────────────────────────────────────────────────────────
const PIPELINE: { status: StatusCompra; label: string; icon: React.ReactNode }[] = [
  { status: 'aguardando',           label: 'Aguardando',          icon: <Package size={18} /> },
  { status: 'compra_solicitada',    label: 'Compra Solicitada',   icon: <Truck size={18} /> },
  { status: 'produto_recebido',     label: 'Produto Recebido',    icon: <CheckCircle2 size={18} /> },
  { status: 'bordado_em_andamento', label: 'Bordado em Andamento',icon: <Scissors size={18} /> },
  { status: 'concluido',            label: 'Concluído',           icon: <Box size={18} /> },
]

function statusIndex(s: StatusCompra) {
  return PIPELINE.findIndex(p => p.status === s)
}

function diffDays(a: string, b: string): number {
  return Math.round(Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000)
}

// ── Individual compra view ────────────────────────────────────────────────────
function CompraView({ compraId }: { compraId: string }) {
  const { compras, bordados, updateStatusCompra, updateCompra } = useStore()
  const compra = compras.find(c => c.id === compraId)
  const [bordadoSel, setBordadoSel] = useState(compra?.bordado ?? '')

  if (!compra) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: 'var(--sacra-cream)' }}>
        <Package size={48} style={{ color: GOLD, opacity: 0.4 }} className="mb-4" />
        <h2 className="font-heading font-bold text-xl mb-2" style={{ color: COFFEE }}>Compra não encontrada</h2>
        <p className="text-sm" style={{ color: COFFEE, opacity: 0.6 }}>Verifique se o QR code é válido.</p>
        <Link to="/" className="mt-6 btn-primary no-underline">← Voltar ao sistema</Link>
      </div>
    )
  }

  const currentIdx = statusIndex(compra.status)

  const isProdutoRecebido = compra.status === 'produto_recebido'
  const bordadoObj = bordados.find(b => b.descricao === bordadoSel)

  function advance() {
    if (!compra || currentIdx < 0 || currentIdx >= PIPELINE.length - 1) return
    const next = PIPELINE[currentIdx + 1].status
    const now = new Date().toISOString().slice(0, 10)
    if (next === 'produto_recebido') {
      updateCompra(compra.id, {
        status: next,
        dataEntregaProduto: now,
        leadTimeProduto: diffDays(now, compra.dataPedido),
      })
    } else if (next === 'bordado_em_andamento') {
      updateCompra(compra.id, {
        status: next,
        bordado: bordadoSel || compra.bordado,
        codigoBordado: bordadoObj?.codigo ?? compra.codigoBordado,
        custoBordado: bordadoObj?.custoUnitario ?? compra.custoBordado,
      })
    } else if (next === 'concluido') {
      const ref = compra.dataEntregaProduto ?? compra.dataPedido
      updateCompra(compra.id, {
        status: next,
        dataEntregaBordado: now,
        leadTimeBordado: diffDays(now, ref),
        adicionadoAoEstoque: true,
      })
    } else {
      updateStatusCompra(compra.id, next)
    }
  }

  const nextStep = currentIdx < PIPELINE.length - 1 ? PIPELINE[currentIdx + 1] : null
  const isConcluido = compra.status === 'concluido'

  return (
    <div className="min-h-screen" style={{ background: 'var(--sacra-cream)' }}>
      <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg, #3E2A1B 0%, #5A3D28 100%)' }}>
        <Link to="/qr/compras" className="flex items-center gap-1.5 text-xs mb-4 no-underline" style={{ color: '#D4AD72', opacity: 0.8 }}>
          <ArrowLeft size={14} /> Ver todas as compras
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD, opacity: 0.8 }}>
          QR Operação
        </p>
        <h1 className="font-heading font-bold text-xl" style={{ color: 'white' }}>
          {compra.bordado || compra.produto}
        </h1>
        {compra.produto && compra.bordado && (
          <p className="text-xs mt-0.5" style={{ color: '#D4AD72', opacity: 0.7 }}>{compra.produto}</p>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Pipeline */}
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: COFFEE, opacity: 0.5 }}>
            Progresso
          </p>
          <div className="space-y-2">
            {PIPELINE.map((step, i) => {
              const done = i < currentIdx
              const active = i === currentIdx
              return (
                <div key={step.status} className="flex items-center gap-3 py-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: done ? GREEN : active ? GOLD : `${SAND}80`,
                      color: done || active ? 'white' : `${COFFEE}60`,
                    }}
                  >
                    {done ? <CheckCircle2 size={16} /> : step.icon}
                  </div>
                  <span className="text-sm font-medium" style={{ color: active ? COFFEE : done ? GREEN : `${COFFEE}60` }}>
                    {step.label}
                  </span>
                  {active && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${GOLD}20`, color: GOLD }}>
                      Atual
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Details */}
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: COFFEE, opacity: 0.5 }}>
            Detalhes da Compra
          </p>
          <div className="space-y-2 text-sm">
            {([
              ['Fornecedor', compra.fornecedor],
              ['Quantidade', `${compra.qtdTotal} un`],
              ['Preço unit.', fmtBRL(compra.precoUnitario)],
              ['Data do pedido', fmtDate(compra.dataPedido)],
              ...(compra.dataEntregaProduto ? [['Entrega produto', fmtDate(compra.dataEntregaProduto)]] : []),
              ...(compra.leadTimeProduto ? [['Lead time produto', `${compra.leadTimeProduto} dias`]] : []),
              ...(compra.dataEntregaBordado ? [['Entrega bordado', fmtDate(compra.dataEntregaBordado)]] : []),
              ...(compra.leadTimeBordado ? [['Lead time bordado', `${compra.leadTimeBordado} dias`]] : []),
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span style={{ color: COFFEE, opacity: 0.6 }}>{label}</span>
                <span className="font-medium" style={{ color: COFFEE }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seletor de bordado (apenas em produto_recebido) */}
        {isProdutoRecebido && (
          <div className="card space-y-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#92400E' }}>
              Selecionar Design para Bordado
            </p>
            <select
              className="w-full rounded-xl px-3 py-3 text-sm font-medium border"
              style={{ background: 'white', color: COFFEE, borderColor: '#FDE68A' }}
              value={bordadoSel}
              onChange={e => setBordadoSel(e.target.value)}
            >
              <option value="">— Nenhum design selecionado —</option>
              {bordados.map(b => (
                <option key={b.codigo} value={b.descricao}>
                  {b.descricao.replace('BORDADO ', '')}
                </option>
              ))}
            </select>
            {bordadoObj?.custoUnitario != null && bordadoObj.custoUnitario > 0 && (
              <div className="flex justify-between text-xs" style={{ color: '#92400E' }}>
                <span>Custo do bordado</span>
                <span className="font-semibold">{fmtBRL(bordadoObj.custoUnitario)}/un · Total: {fmtBRL(bordadoObj.custoUnitario * compra.qtdTotal)}</span>
              </div>
            )}
            {!bordadoSel && (
              <p className="text-xs" style={{ color: '#92400E', opacity: 0.7 }}>
                Selecione o design antes de enviar para bordado. Você pode avançar sem selecionar.
              </p>
            )}
          </div>
        )}

        {/* Action */}
        {isConcluido ? (
          <div className="card text-center py-6" style={{ background: '#F0FDF4', border: `1px solid ${GREEN}30` }}>
            <CheckCircle2 size={36} className="mx-auto mb-2" style={{ color: GREEN }} />
            <p className="font-heading font-bold text-base" style={{ color: GREEN }}>Concluído!</p>
            <p className="text-xs mt-1" style={{ color: GREEN, opacity: 0.7 }}>
              Peça adicionada ao estoque automaticamente.
            </p>
          </div>
        ) : nextStep ? (
          <button
            className="w-full py-4 rounded-2xl font-heading font-bold text-lg text-white shadow-lg active:scale-95 transition-transform"
            style={{ background: `linear-gradient(135deg, ${COFFEE} 0%, ${GOLD} 100%)` }}
            onClick={advance}
          >
            <div className="flex items-center justify-center gap-2">
              {nextStep.icon}
              <span>Marcar como: {nextStep.label}</span>
              <ChevronRight size={20} />
            </div>
          </button>
        ) : null}
      </div>
    </div>
  )
}

// ── Compras geral (mobile list) ───────────────────────────────────────────────
function ComprasGeralView() {
  const { compras, updateStatusCompra, updateCompra } = useStore()

  const ativas = useMemo(() =>
    compras
      .filter(c => c.status !== 'concluido' && c.status !== 'cancelado')
      .sort((a, b) => b.dataPedido.localeCompare(a.dataPedido)),
    [compras]
  )

  function advance(c: typeof compras[0]) {
    const idx = PIPELINE.findIndex(p => p.status === c.status)
    if (idx < 0 || idx >= PIPELINE.length - 1) return
    const next = PIPELINE[idx + 1].status
    const now = new Date().toISOString().slice(0, 10)
    if (next === 'produto_recebido') {
      updateCompra(c.id, { status: next, dataEntregaProduto: now, leadTimeProduto: diffDays(now, c.dataPedido) })
    } else if (next === 'concluido') {
      const ref = c.dataEntregaProduto ?? c.dataPedido
      updateCompra(c.id, { status: next, dataEntregaBordado: now, leadTimeBordado: diffDays(now, ref), adicionadoAoEstoque: true })
    } else {
      updateStatusCompra(c.id, next)
    }
  }

  const statusLabel: Record<StatusCompra, string> = {
    aguardando: 'Aguardando',
    compra_solicitada: 'Compra Solicitada',
    produto_recebido: 'Produto Recebido',
    bordado_em_andamento: 'Bordando',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--sacra-cream)' }}>
      <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg, #3E2A1B 0%, #5A3D28 100%)' }}>
        <Link to="/" className="flex items-center gap-1.5 text-xs mb-4 no-underline" style={{ color: '#D4AD72', opacity: 0.8 }}>
          <ArrowLeft size={14} /> Voltar ao sistema
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD, opacity: 0.8 }}>
          Sacra Devoção
        </p>
        <h1 className="font-heading font-bold text-xl" style={{ color: 'white' }}>
          Compras em Andamento
        </h1>
        <p className="text-xs mt-1" style={{ color: '#D4AD72' }}>
          {ativas.length} pedido{ativas.length !== 1 ? 's' : ''} ativo{ativas.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {ativas.length === 0 && (
          <div className="card text-center py-12">
            <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: GREEN, opacity: 0.5 }} />
            <p className="font-medium" style={{ color: COFFEE }}>Nenhuma compra em aberto</p>
            <p className="text-sm mt-1" style={{ color: COFFEE, opacity: 0.5 }}>Todos os pedidos estão concluídos!</p>
          </div>
        )}

        {ativas.map((c) => {
          const idx = PIPELINE.findIndex(p => p.status === c.status)
          const nextStep = idx >= 0 && idx < PIPELINE.length - 1 ? PIPELINE[idx + 1] : null
          return (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: COFFEE }}>
                    {c.bordado || c.produto}
                  </p>
                  {c.bordado && c.produto && (
                    <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>{c.produto}</p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>
                    {c.fornecedor} · {c.qtdTotal} un · {fmtDate(c.dataPedido)}
                  </p>
                </div>
                <span
                  className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                  style={{ background: `${GOLD}20`, color: GOLD }}
                >
                  {statusLabel[c.status]}
                </span>
              </div>
              <div className="flex gap-2">
                {nextStep && (
                  <button
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
                    style={{ background: GOLD }}
                    onClick={() => advance(c)}
                  >
                    → {nextStep.label}
                  </button>
                )}
                <Link
                  to={`/qr/compra/${c.id}`}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium no-underline text-center"
                  style={{ background: `${COFFEE}12`, color: COFFEE }}
                >
                  Detalhes
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Funcionário view (with tabs) ──────────────────────────────────────────────
function FuncionarioView({ funcId }: { funcId: string }) {
  const { funcionarios, processos } = useStore()
  const func = funcionarios.find(f => f.id === funcId)
  const [tab, setTab] = useState<'rotinas' | 'manual'>('rotinas')
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoManual | null>(null)

  if (!func) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: 'var(--sacra-cream)' }}>
        <User size={48} style={{ color: GOLD, opacity: 0.4 }} className="mb-4" />
        <h2 className="font-heading font-bold text-xl mb-2" style={{ color: COFFEE }}>Funcionário não encontrado</h2>
        <Link to="/" className="mt-6 btn-primary no-underline">← Voltar ao sistema</Link>
      </div>
    )
  }

  const categorias = [...new Set(processos.map(p => p.categoria))].sort()

  return (
    <div className="min-h-screen" style={{ background: 'var(--sacra-cream)' }}>
      <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg, #3E2A1B 0%, #5A3D28 100%)' }}>
        <Link to="/membros" className="flex items-center gap-1.5 text-xs mb-4 no-underline" style={{ color: '#D4AD72', opacity: 0.8 }}>
          <ArrowLeft size={14} /> Voltar
        </Link>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-heading font-bold text-2xl text-white flex-shrink-0"
            style={{ background: `${GOLD}40`, border: `2px solid ${GOLD}` }}
          >
            {func.nome.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: GOLD, opacity: 0.8 }}>
              Sacra Devoção
            </p>
            <h1 className="font-heading font-bold text-xl" style={{ color: 'white' }}>{func.nome}</h1>
            <p className="text-xs" style={{ color: '#D4AD72' }}>{func.cargo}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5 mt-4">
          {([
            { key: 'rotinas', label: 'Rotinas', icon: <ClipboardList size={13} /> },
            { key: 'manual',  label: 'Manual',  icon: <BookOpen size={13} /> },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t.key ? GOLD : 'rgba(255,255,255,0.1)',
                color: tab === t.key ? 'white' : '#D4AD72',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* ── Rotinas tab ── */}
        {tab === 'rotinas' && (
          <>
            {func.responsabilidades.length > 0 && (
              <div className="card">
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: COFFEE, opacity: 0.5 }}>
                  Responsabilidades
                </p>
                <ul className="space-y-2">
                  {func.responsabilidades.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: COFFEE }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: GOLD }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {func.rotinas.length > 0 && (
              <div className="card">
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: COFFEE, opacity: 0.5 }}>
                  Rotinas Diárias
                </p>
                <ol className="space-y-2">
                  {func.rotinas.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: COFFEE }}>
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: GREEN }}
                      >
                        {i + 1}
                      </span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {func.responsabilidades.length === 0 && func.rotinas.length === 0 && (
              <div className="card text-center py-8">
                <p style={{ color: COFFEE, opacity: 0.5 }}>Nenhuma atribuição cadastrada.</p>
              </div>
            )}
          </>
        )}

        {/* ── Manual tab ── */}
        {tab === 'manual' && (
          <>
            {processos.length === 0 ? (
              <div className="card text-center py-10">
                <BookOpen size={36} className="mx-auto mb-3" style={{ color: GOLD, opacity: 0.35 }} />
                <p className="font-medium" style={{ color: COFFEE }}>Nenhum manual cadastrado</p>
                <p className="text-xs mt-1" style={{ color: COFFEE, opacity: 0.5 }}>
                  Peça para um gestor cadastrar os processos em Membros &amp; Equipe.
                </p>
              </div>
            ) : (
              categorias.map(cat => {
                const catProcessos = processos.filter(p => p.categoria === cat)
                return (
                  <div key={cat} className="card">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: COFFEE, opacity: 0.5 }}>
                      {cat}
                    </p>
                    <div className="space-y-2">
                      {catProcessos.map(proc => (
                        <button
                          key={proc.id}
                          className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors"
                          style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}25` }}
                          onClick={() => setSelectedProcesso(proc)}
                        >
                          <div>
                            <p className="font-medium text-sm" style={{ color: COFFEE }}>{proc.titulo}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>
                              {proc.passos.length} passo{proc.passos.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <ChevronRight size={16} style={{ color: GOLD, flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>

      {/* ── Process steps popup ── */}
      {selectedProcesso && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelectedProcesso(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--sacra-cream)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GOLD }}>
                  {selectedProcesso.categoria}
                </p>
                <h2 className="font-heading font-bold text-lg" style={{ color: COFFEE }}>
                  {selectedProcesso.titulo}
                </h2>
              </div>
              <button
                className="p-1.5 rounded-lg flex-shrink-0"
                style={{ background: `${COFFEE}10` }}
                onClick={() => setSelectedProcesso(null)}
              >
                <X size={18} style={{ color: COFFEE }} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedProcesso.passos.map((passo, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                    style={{ background: GOLD }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium" style={{ color: COFFEE }}>{passo.descricao}</p>
                    {passo.dica && (
                      <div
                        className="mt-2 p-2 rounded-lg text-xs"
                        style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
                      >
                        💡 {passo.dica}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="w-full mt-6 py-3 rounded-xl font-semibold text-white"
              style={{ background: COFFEE }}
              onClick={() => setSelectedProcesso(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function QROperacao() {
  const { type, id } = useParams<{ type?: string; id?: string }>()

  if (!type) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--sacra-cream)' }}>
        <p style={{ color: COFFEE }}>QR Code inválido.</p>
      </div>
    )
  }

  if (type === 'compras') return <ComprasGeralView />
  if (type === 'compra' && id) return <CompraView compraId={id} />
  if (type === 'funcionario' && id) return <FuncionarioView funcId={id} />

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--sacra-cream)' }}>
      <p style={{ color: COFFEE }}>Tipo de QR não reconhecido.</p>
    </div>
  )
}
