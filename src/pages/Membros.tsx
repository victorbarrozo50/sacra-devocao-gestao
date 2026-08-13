import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, QrCode, Printer, X, ChevronDown, ChevronUp, User, GripVertical, BookOpen } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { today } from '../utils/format'
import type { Funcionario, ProcessoManual, PassoManual } from '../types'

const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'
const GREEN  = '#16A34A'

const CARGO_OPTIONS = [
  'Gerente de Atendimento',
  'Bordadeira Principal',
  'Auxiliar de Estoque',
  'Vendedora',
  'Sócia / Proprietária',
  'Financeiro',
  'Outro',
]

const EMPTY_FORM: Omit<Funcionario, 'id' | 'criadoEm'> = {
  nome: '',
  cargo: CARGO_OPTIONS[0],
  responsabilidades: [],
  rotinas: [],
}

function qrUrl(id: string): string {
  return `${window.location.origin}/qr/funcionario/${id}`
}

function qrImageUrl(id: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl(id))}`
}

// ── List editor for responsibilities / routines ───────────────────────────────
function ListEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (v: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const t = draft.trim()
    if (!t) return
    onChange([...items, t])
    setDraft('')
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="space-y-1 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 text-sm px-2 py-1 rounded-lg" style={{ background: `${SAND}80`, color: COFFEE }}>
              {item}
            </span>
            <button type="button" className="text-red-400 hover:text-red-600"
              onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="sacra-input flex-1"
          placeholder={`Adicionar ${label.toLowerCase()}...`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button type="button" className="btn-secondary px-3" onClick={add}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Org chart node ────────────────────────────────────────────────────────────
function OrgNode({
  nome, cargo, isRoot, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  nome: string
  cargo: string
  isRoot?: boolean
  isDragOver?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="rounded-xl px-4 py-3 text-center shadow-sm select-none transition-all"
      style={{
        background: isRoot ? `linear-gradient(135deg, ${COFFEE} 0%, #5A3D28 100%)` : 'white',
        border: `2px solid ${isDragOver ? GOLD : isRoot ? GOLD : SAND}`,
        minWidth: 140,
        cursor: 'grab',
        boxShadow: isDragOver ? `0 0 0 3px ${GOLD}40` : undefined,
        transform: isDragOver ? 'scale(1.04)' : undefined,
      }}
    >
      <p className="font-heading font-bold text-sm" style={{ color: isRoot ? GOLD : COFFEE }}>{nome}</p>
      <p className="text-xs mt-0.5" style={{ color: isRoot ? '#D4AD72' : '#6B4C2A', opacity: 0.8 }}>{cargo}</p>
    </div>
  )
}

// ── Passos editor ────────────────────────────────────────────────────────────
function PassosEditor({ passos, onChange }: { passos: PassoManual[]; onChange: (v: PassoManual[]) => void }) {
  const [draftDesc, setDraftDesc] = useState('')
  const [draftDica, setDraftDica] = useState('')

  function addPasso() {
    const t = draftDesc.trim()
    if (!t) return
    onChange([...passos, { descricao: t, dica: draftDica.trim() || undefined }])
    setDraftDesc('')
    setDraftDica('')
  }

  return (
    <div className="form-group">
      <label className="form-label">Passos do Processo</label>
      <div className="space-y-2 mb-3">
        {passos.map((p, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs mt-0.5"
              style={{ background: GOLD }}
            >
              {i + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm px-2 py-1 rounded-lg" style={{ background: `${SAND}80`, color: COFFEE }}>{p.descricao}</p>
              {p.dica && (
                <p className="text-xs mt-0.5 px-2" style={{ color: '#92400E' }}>💡 {p.dica}</p>
              )}
            </div>
            <button type="button" className="text-red-400 hover:text-red-600 mt-1" onClick={() => onChange(passos.filter((_, j) => j !== i))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-2 p-3 rounded-xl" style={{ background: `${SAND}40`, border: `1px solid ${SAND}` }}>
        <input
          className="sacra-input"
          placeholder="Descrição do passo..."
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPasso() } }}
        />
        <input
          className="sacra-input text-xs"
          placeholder="Dica opcional (ex: atenção ao detalhe X)..."
          value={draftDica}
          onChange={(e) => setDraftDica(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPasso() } }}
        />
        <button type="button" className="btn-secondary text-xs px-3 py-1.5 w-full" onClick={addPasso}>
          <Plus size={13} /> Adicionar Passo
        </button>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Membros() {
  const { funcionarios, addFuncionario, updateFuncionario, deleteFuncionario, reorderFuncionarios, processos, addProcesso, updateProcesso, deleteProcesso } = useStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Funcionario, 'id' | 'criadoEm'>>(EMPTY_FORM)
  const [qrTarget, setQrTarget] = useState<Funcionario | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Processo state
  const [processoModalOpen, setProcessoModalOpen] = useState(false)
  const [processoEditId, setProcessoEditId] = useState<string | null>(null)
  const [processoForm, setProcessoForm] = useState<{ titulo: string; categoria: string; passos: PassoManual[] }>({
    titulo: '', categoria: '', passos: [],
  })

  function openAddProcesso() {
    setProcessoEditId(null)
    setProcessoForm({ titulo: '', categoria: '', passos: [] })
    setProcessoModalOpen(true)
  }

  function openEditProcesso(p: ProcessoManual) {
    setProcessoEditId(p.id)
    setProcessoForm({ titulo: p.titulo, categoria: p.categoria, passos: [...p.passos] })
    setProcessoModalOpen(true)
  }

  function handleSaveProcesso(e: React.FormEvent) {
    e.preventDefault()
    if (!processoForm.titulo.trim() || processoForm.passos.length === 0) return
    if (processoEditId) {
      updateProcesso(processoEditId, processoForm)
    } else {
      addProcesso({ ...processoForm, criadoEm: today() })
    }
    setProcessoModalOpen(false)
  }

  // Drag-and-drop state
  const dragId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)

  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(f: Funcionario) {
    setEditId(f.id)
    setForm({ nome: f.nome, cargo: f.cargo, responsabilidades: [...f.responsabilidades], rotinas: [...f.rotinas] })
    setModalOpen(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    if (editId) {
      updateFuncionario(editId, form)
    } else {
      addFuncionario({ ...form, criadoEm: today() })
    }
    setModalOpen(false)
  }

  function handlePrintQR(f: Funcionario) {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!doctype html><html><head>
        <title>QR Code — ${f.nome}</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 32px; }
          h2 { margin: 0 0 4px; color: #3E2A1B; font-size: 18px; }
          p { color: #6B4C2A; font-size: 13px; margin: 0 0 16px; }
          img { width: 200px; height: 200px; }
          .resp { margin-top: 20px; text-align: left; font-size: 12px; color: #3E2A1B; }
          .resp ul { margin: 4px 0 0; padding-left: 18px; }
          @media print { button { display: none; } }
        </style>
      </head><body>
        <h2>${f.nome}</h2>
        <p>${f.cargo}</p>
        <img src="${qrImageUrl(f.id)}" alt="QR Code" />
        <p style="font-size:11px;color:#9A7540;margin-top:8px;">Escaneie para ver atribuições</p>
        <div class="resp">
          <strong>Responsabilidades:</strong>
          <ul>${f.responsabilidades.map(r => `<li>${r}</li>`).join('')}</ul>
          <strong style="margin-top:12px;display:block">Rotinas Diárias:</strong>
          <ul>${f.rotinas.map(r => `<li>${r}</li>`).join('')}</ul>
        </div>
        <button onclick="window.print()" style="margin-top:24px;padding:8px 20px;background:#C0955A;color:white;border:none;border-radius:8px;cursor:pointer;">
          Imprimir
        </button>
      </body></html>
    `)
    win.document.close()
  }

  function handleDragStart(id: string) {
    dragId.current = id
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (dragId.current && dragId.current !== id) setDragOverId(id)
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    const fromId = dragId.current
    if (!fromId || fromId === targetId) { setDragOverId(null); return }
    const ids = funcionarios.map(f => f.id)
    const fromIdx = ids.indexOf(fromId)
    const toIdx = ids.indexOf(targetId)
    const newIds = [...ids]
    newIds.splice(fromIdx, 1)
    newIds.splice(toIdx, 0, fromId)
    setPendingOrder(newIds)
    setDragOverId(null)
    dragId.current = null
  }

  function confirmReorder() {
    if (pendingOrder) reorderFuncionarios(pendingOrder)
    setPendingOrder(null)
  }

  // Separate owners/managers from regular staff for org chart
  const gestores = funcionarios.filter(f =>
    f.cargo.toLowerCase().includes('gerente') || f.cargo.toLowerCase().includes('sócia') || f.cargo.toLowerCase().includes('proprietária')
  )
  const equipe = funcionarios.filter(f => !gestores.find(g => g.id === f.id))

  return (
    <div className="space-y-6">
      <p className="page-subtitle">Gestão de equipe, atribuições e organograma</p>

      {/* ── Organograma ───────────────────────────────────────────────────────── */}
      {funcionarios.length > 0 && (
        <div className="card">
          <p className="section-title mb-5">Organograma</p>
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs mb-2" style={{ color: COFFEE, opacity: 0.4 }}>Arraste os nós para reordenar</p>
            {/* Gestores */}
            {gestores.length > 0 && (
              <div className="flex gap-4 flex-wrap justify-center">
                {gestores.map(f => (
                  <OrgNode
                    key={f.id}
                    nome={f.nome}
                    cargo={f.cargo}
                    isRoot
                    isDragOver={dragOverId === f.id}
                    onDragStart={() => handleDragStart(f.id)}
                    onDragOver={(e) => handleDragOver(e, f.id)}
                    onDrop={(e) => handleDrop(e, f.id)}
                    onDragEnd={() => setDragOverId(null)}
                  />
                ))}
              </div>
            )}
            {gestores.length > 0 && equipe.length > 0 && (
              <div className="w-px h-8" style={{ background: GOLD }} />
            )}
            {/* Equipe */}
            {equipe.length > 0 && (
              <div className="flex gap-4 flex-wrap justify-center">
                {equipe.map(f => (
                  <OrgNode
                    key={f.id}
                    nome={f.nome}
                    cargo={f.cargo}
                    isDragOver={dragOverId === f.id}
                    onDragStart={() => handleDragStart(f.id)}
                    onDragOver={(e) => handleDragOver(e, f.id)}
                    onDrop={(e) => handleDrop(e, f.id)}
                    onDragEnd={() => setDragOverId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="section-title">Quadro de Funcionários ({funcionarios.length})</p>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> Adicionar Membro
        </button>
      </div>

      {funcionarios.length === 0 ? (
        <div className="card text-center py-16">
          <User size={40} className="mx-auto mb-3 opacity-30" style={{ color: COFFEE }} />
          <p className="section-title mb-1">Nenhum membro cadastrado</p>
          <p className="text-sm" style={{ color: COFFEE, opacity: 0.5 }}>Clique em "Adicionar Membro" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {funcionarios.map((f) => (
            <div
              key={f.id}
              className="card space-y-3"
            >
              {/* Card header */}
              <div className="flex items-start gap-4">
                {/* Grip + Avatar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <GripVertical size={14} style={{ color: COFFEE, opacity: 0.3 }} />
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-heading font-bold text-lg text-white"
                    style={{ background: `linear-gradient(135deg, ${COFFEE} 0%, ${GOLD} 100%)` }}
                  >
                    {f.nome.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-base" style={{ color: COFFEE }}>{f.nome}</h3>
                  <p className="text-xs mt-0.5" style={{ color: GOLD }}>{f.cargo}</p>
                </div>
                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: COFFEE, border: `1px solid ${SAND}`, background: 'transparent' }}
                    title="Ver QR Code"
                    onClick={() => setQrTarget(f)}
                  >
                    <QrCode size={14} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: COFFEE, border: `1px solid ${SAND}`, background: 'transparent' }}
                    title="Imprimir QR Code"
                    onClick={() => handlePrintQR(f)}
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: GOLD, border: `1px solid ${GOLD}40`, background: 'transparent' }}
                    onClick={() => openEdit(f)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn-danger p-1.5"
                    onClick={() => {
                      if (confirm(`Remover ${f.nome} da equipe?`)) deleteFuncionario(f.id)
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expandable details */}
              <button
                className="flex items-center gap-2 text-xs font-semibold w-full text-left"
                style={{ color: COFFEE, opacity: 0.6 }}
                onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
              >
                {expandedId === f.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {expandedId === f.id ? 'Ocultar detalhes' : 'Ver atribuições e rotinas'}
              </button>

              {expandedId === f.id && (
                <div className="space-y-3 pt-1">
                  {f.responsabilidades.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: COFFEE, opacity: 0.5 }}>
                        Responsabilidades
                      </p>
                      <ul className="space-y-1">
                        {f.responsabilidades.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: COFFEE }}>
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: GOLD }} />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {f.rotinas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: COFFEE, opacity: 0.5 }}>
                        Rotinas Diárias
                      </p>
                      <ul className="space-y-1">
                        {f.rotinas.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: COFFEE }}>
                            <span
                              className="flex-shrink-0 text-xs font-mono w-5 h-5 rounded-full flex items-center justify-center text-white mt-0.5"
                              style={{ background: GREEN, fontSize: 9 }}
                            >
                              {i + 1}
                            </span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Reorder Confirmation ──────────────────────────────────────────── */}
      {pendingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPendingOrder(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center"
            style={{ background: 'var(--sacra-cream)', border: `1px solid ${SAND}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={32} className="mx-auto mb-3" style={{ color: GOLD }} />
            <p className="font-heading font-bold text-base mb-1" style={{ color: COFFEE }}>
              Confirmar nova ordem?
            </p>
            <p className="text-sm mb-5" style={{ color: COFFEE, opacity: 0.6 }}>
              Os cards serão reorganizados na posição arrastada.
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setPendingOrder(null)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={confirmReorder}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Code Popup ──────────────────────────────────────────────────── */}
      {qrTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setQrTarget(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden text-center"
            style={{ background: 'var(--sacra-cream)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #3E2A1B 0%, #5A3D28 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-sm" style={{ color: 'white' }}>{qrTarget.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#D4AD72' }}>{qrTarget.cargo}</p>
                </div>
                <button onClick={() => setQrTarget(null)} className="text-white opacity-60 hover:opacity-100 text-xl leading-none">×</button>
              </div>
            </div>
            <div className="p-6">
              <img
                src={qrImageUrl(qrTarget.id)}
                alt={`QR Code ${qrTarget.nome}`}
                className="mx-auto rounded-xl"
                style={{ width: 200, height: 200 }}
              />
              <p className="text-xs mt-3" style={{ color: COFFEE, opacity: 0.5 }}>
                Escaneie para acessar o perfil e atribuições
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  className="btn-secondary flex-1"
                  onClick={() => { setQrTarget(null); handlePrintQR(qrTarget) }}
                >
                  <Printer size={14} /> Imprimir
                </button>
                <a
                  href={qrUrl(qrTarget.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 flex items-center justify-center gap-2 no-underline"
                >
                  <QrCode size={14} /> Abrir
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual de Processos ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-title">Manual de Processos</p>
            <p className="text-xs mt-0.5" style={{ color: COFFEE, opacity: 0.5 }}>
              Disponível na aba "Manual" do QR Code de cada funcionário
            </p>
          </div>
          <button className="btn-primary" onClick={openAddProcesso}>
            <Plus size={16} /> Novo Processo
          </button>
        </div>

        {processos.length === 0 ? (
          <div className="card text-center py-10">
            <BookOpen size={36} className="mx-auto mb-3 opacity-30" style={{ color: COFFEE }} />
            <p className="section-title mb-1">Nenhum processo cadastrado</p>
            <p className="text-sm" style={{ color: COFFEE, opacity: 0.5 }}>
              Adicione processos com passo a passo para sua equipe consultar via QR Code.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...new Set(processos.map(p => p.categoria))].sort().map(cat => (
              <div key={cat} className="card">
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: COFFEE, opacity: 0.5 }}>
                  {cat}
                </p>
                <div className="space-y-2">
                  {processos.filter(p => p.categoria === cat).map(proc => (
                    <div
                      key={proc.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: `${SAND}50`, border: `1px solid ${SAND}` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm" style={{ color: COFFEE }}>{proc.titulo}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9A7540' }}>
                          {proc.passos.length} passo{proc.passos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          className="p-1.5 rounded-lg"
                          style={{ color: GOLD, border: `1px solid ${GOLD}40`, background: 'transparent' }}
                          onClick={() => openEditProcesso(proc)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn-danger p-1.5"
                          onClick={() => { if (confirm(`Excluir "${proc.titulo}"?`)) deleteProcesso(proc.id) }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Processo Modal ────────────────────────────────────────────────── */}
      {processoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setProcessoModalOpen(false)}
        >
          <form
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ background: 'var(--sacra-cream)' }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveProcesso}
          >
            <div className="px-5 py-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3E2A1B 0%, #5A3D28 100%)' }}>
              <p className="font-heading font-bold text-base" style={{ color: 'white' }}>
                {processoEditId ? 'Editar Processo' : 'Novo Processo'}
              </p>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    className="sacra-input"
                    placeholder="Ex: Abertura da loja"
                    value={processoForm.titulo}
                    onChange={(e) => setProcessoForm(p => ({ ...p, titulo: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <input
                    className="sacra-input"
                    placeholder="Ex: Atendimento, Bordado..."
                    value={processoForm.categoria}
                    onChange={(e) => setProcessoForm(p => ({ ...p, categoria: e.target.value }))}
                    list="categorias-processos"
                    required
                  />
                  <datalist id="categorias-processos">
                    {[...new Set(processos.map(p => p.categoria))].map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>
              <PassosEditor
                passos={processoForm.passos}
                onChange={(passos) => setProcessoForm(p => ({ ...p, passos }))}
              />
              {processoForm.passos.length === 0 && (
                <p className="text-xs" style={{ color: '#B45309' }}>* Adicione pelo menos um passo para salvar.</p>
              )}
            </div>
            <div className="flex gap-3 px-5 pb-5 flex-shrink-0">
              <button type="button" className="btn-secondary flex-1" onClick={() => setProcessoModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary flex-1" disabled={processoForm.passos.length === 0}>Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setModalOpen(false)}
        >
          <form
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ background: 'var(--sacra-cream)' }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <div className="px-5 py-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3E2A1B 0%, #5A3D28 100%)' }}>
              <p className="font-heading font-bold text-base" style={{ color: 'white' }}>
                {editId ? 'Editar Membro' : 'Novo Membro'}
              </p>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input
                    className="sacra-input"
                    placeholder="Nome completo"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo *</label>
                  <input
                    className="sacra-input"
                    list="sacra-cargos"
                    placeholder="Ex: Vendedora/Mídia"
                    value={form.cargo}
                    onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    required
                  />
                  <datalist id="sacra-cargos">
                    {CARGO_OPTIONS.filter(c => c !== 'Outro').map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <ListEditor
                label="Responsabilidades"
                items={form.responsabilidades}
                onChange={(v) => setForm({ ...form, responsabilidades: v })}
              />

              <ListEditor
                label="Rotinas Diárias"
                items={form.rotinas}
                onChange={(v) => setForm({ ...form, rotinas: v })}
              />
            </div>
            <div className="flex gap-3 px-5 pb-5 flex-shrink-0">
              <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary flex-1">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
