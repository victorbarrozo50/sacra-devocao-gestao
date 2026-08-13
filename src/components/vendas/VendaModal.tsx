import { useState, useRef, useMemo } from 'react'
import { Plus, ShoppingCart, UserPlus, X, Search, ChevronRight } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { fmtBRL, today, nanoid } from '../../utils/format'
import Modal from '../ui/Modal'
import type { Cliente } from '../../types'

const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'
const CREAM  = '#F5EFE4'

type CartItem = {
  _key: string
  codigoBordado: string
  descricaoBordado: string
  produto: string
  tamanho: string
  cor: string
  quantidade: number
  precoUnitario: number
  total: number
}

type SharedFields = {
  data: string
  documento: string
  clienteId: string
  canal: 'varejo' | 'atacado'
  formaPagamento: 'cartao' | 'pix' | 'dinheiro'
}

const EMPTY_SHARED: SharedFields = {
  data: today(),
  documento: '',
  clienteId: '',
  canal: 'varejo',
  formaPagamento: 'cartao',
}

const CORES = ['Preto', 'Branco', 'Cinza', 'Azul Marinho', 'Azul', 'Vermelho', 'Rosa', 'Rosa Bebê', 'Lilás', 'Verde', 'Amarelo', 'Laranja', 'Bege', 'Vinho', 'Dourado']
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'GGG', 'Único']

const EMPTY_ITEM = {
  codigoBordado: '',
  descricaoBordado: '',
  produto: '',
  tamanho: '',
  cor: '',
  quantidade: 1,
  precoUnitario: 0,
}

const EMPTY_CLI = {
  nome: '', telefone: '', email: '', cidade: '', estado: 'RN',
  canal: 'varejo' as const, segmento: '', observacoes: '', criadoEm: today(),
}

interface VendaModalProps {
  open: boolean
  onClose: () => void
}

export default function VendaModal({ open, onClose }: VendaModalProps) {
  const { bordados, produtos, clientes, addVenda, addCliente, addCompraHistorico } = useStore()

  const [shared, setShared]         = useState<SharedFields>(EMPTY_SHARED)
  const [item, setItem]             = useState(EMPTY_ITEM)
  const [cart, setCart]             = useState<CartItem[]>([])
  const [clienteSearch, setClienteSearch] = useState('')
  const [clienteDropOpen, setClienteDropOpen] = useState(false)
  const [novoCliOpen, setNovoCliOpen] = useState(false)
  const [formCli, setFormCli]       = useState(EMPTY_CLI)
  const clienteRef = useRef<HTMLDivElement>(null)

  const clientesFiltrados = useMemo(() => {
    if (!clienteSearch) return clientes.slice(0, 6)
    const q = clienteSearch.toLowerCase()
    return clientes.filter(
      (c) => c.nome.toLowerCase().includes(q) || c.telefone.includes(q)
    ).slice(0, 6)
  }, [clientes, clienteSearch])

  const clienteSelecionado = shared.clienteId
    ? clientes.find((c) => c.id === shared.clienteId) ?? null
    : null

  const itemTotal = item.quantidade * item.precoUnitario
  const cartTotal = cart.reduce((s, i) => s + i.total, 0)

  function setItemBordado(codigo: string) {
    const b = bordados.find((b) => b.codigo === codigo)
    setItem((prev) => ({
      ...prev,
      codigoBordado: codigo,
      descricaoBordado: b?.descricao ?? '',
      precoUnitario: b?.precoMedio ?? prev.precoUnitario,
    }))
  }

  function setItemProduto(descricao: string) {
    const p = produtos.find((p) => p.descricao === descricao)
    setItem((prev) => ({
      ...prev,
      produto: descricao,
      precoUnitario: p?.precoVenda ?? prev.precoUnitario,
    }))
  }

  function adicionarAoCarrinho() {
    if (!item.codigoBordado || item.quantidade < 1 || item.precoUnitario <= 0) return
    setCart((prev) => [
      ...prev,
      { ...item, total: item.quantidade * item.precoUnitario, _key: nanoid() },
    ])
    setItem(EMPTY_ITEM)
  }

  function removerDoCarrinho(key: string) {
    setCart((prev) => prev.filter((i) => i._key !== key))
  }

  function handleFinalizar() {
    if (cart.length === 0) return
    const docId = shared.documento || `V${nanoid().slice(0, 6).toUpperCase()}`
    cart.forEach((ci) => {
      addVenda({
        data: shared.data,
        documento: docId,
        clienteId: shared.clienteId || undefined,
        codigoBordado: ci.codigoBordado,
        descricaoBordado: ci.descricaoBordado,
        produto: ci.produto || undefined,
        tamanho: ci.tamanho || undefined,
        cor: ci.cor || undefined,
        quantidade: ci.quantidade,
        precoUnitario: ci.precoUnitario,
        total: ci.total,
        canal: shared.canal,
        formaPagamento: shared.formaPagamento,
      })
    })
    if (shared.clienteId) {
      cart.forEach((ci) => {
        addCompraHistorico({
          clienteId: shared.clienteId,
          data: shared.data,
          descricaoBordado: ci.descricaoBordado,
          produto: ci.produto || undefined,
          tamanho: ci.tamanho || undefined,
          cor: ci.cor || undefined,
          quantidade: ci.quantidade,
          precoUnitario: ci.precoUnitario,
          total: ci.total,
          canal: shared.canal,
          formaPagamento: shared.formaPagamento,
        })
      })
    }
    resetAndClose()
  }

  function handleSalvarNovoCliente() {
    if (!formCli.nome || !formCli.telefone) return
    addCliente(formCli)
    setFormCli(EMPTY_CLI)
    setNovoCliOpen(false)
  }

  function selecionarCliente(c: Cliente) {
    setShared((prev) => ({ ...prev, clienteId: c.id }))
    setClienteSearch(c.nome)
    setClienteDropOpen(false)
  }

  function limparCliente() {
    setShared((prev) => ({ ...prev, clienteId: '' }))
    setClienteSearch('')
  }

  function resetAndClose() {
    setShared(EMPTY_SHARED)
    setItem(EMPTY_ITEM)
    setCart([])
    setClienteSearch('')
    onClose()
  }

  return (
    <>
      <Modal
        open={open}
        onClose={resetAndClose}
        title="Registrar Venda"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={resetAndClose}>Cancelar</button>
            <button
              className="btn-primary"
              onClick={handleFinalizar}
              disabled={cart.length === 0}
              style={{ opacity: cart.length === 0 ? 0.5 : 1 }}
            >
              <ShoppingCart size={15} />
              Finalizar ({cart.length} {cart.length === 1 ? 'item' : 'itens'}) · {fmtBRL(cartTotal)}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Dados gerais */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9A7540' }}>
              Dados da Venda
            </p>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Data</label>
                <input type="date" className="sacra-input" value={shared.data}
                  onChange={(e) => setShared((p) => ({ ...p, data: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Nº Documento</label>
                <input className="sacra-input" placeholder="Auto se vazio" value={shared.documento}
                  onChange={(e) => setShared((p) => ({ ...p, documento: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Canal</label>
                <select className="sacra-select" value={shared.canal}
                  onChange={(e) => setShared((p) => ({ ...p, canal: e.target.value as any }))}>
                  <option value="varejo">Varejo</option>
                  <option value="atacado">Atacado</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Forma de Pagamento</label>
                <select className="sacra-select" value={shared.formaPagamento}
                  onChange={(e) => setShared((p) => ({ ...p, formaPagamento: e.target.value as any }))}>
                  <option value="cartao">Cartão</option>
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              {/* Cliente */}
              <div className="form-group span-2">
                <label className="form-label">Cliente (opcional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1" ref={clienteRef}>
                    {clienteSelecionado ? (
                      <div className="sacra-input flex items-center justify-between"
                        style={{ background: `${GOLD}10`, borderColor: GOLD }}>
                        <span className="text-sm font-medium" style={{ color: COFFEE }}>
                          {clienteSelecionado.nome} · {clienteSelecionado.telefone}
                        </span>
                        <button onClick={limparCliente} style={{ color: '#9A7540' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9A7540' }} />
                        <input
                          className="sacra-input pl-9"
                          placeholder="Buscar cliente por nome..."
                          value={clienteSearch}
                          onChange={(e) => { setClienteSearch(e.target.value); setClienteDropOpen(true) }}
                          onFocus={() => setClienteDropOpen(true)}
                          onBlur={() => setTimeout(() => setClienteDropOpen(false), 150)}
                        />
                        {clienteDropOpen && clientesFiltrados.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border shadow-lg overflow-hidden"
                            style={{ background: 'white', borderColor: SAND }}>
                            {clientesFiltrados.map((c) => (
                              <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-sacra-cream text-sm flex items-center justify-between"
                                onMouseDown={() => selecionarCliente(c)} style={{ color: COFFEE }}>
                                <span className="font-medium">{c.nome}</span>
                                <span className="text-xs" style={{ color: '#9A7540' }}>{c.telefone}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <button className="btn-secondary flex-shrink-0 gap-1"
                    onClick={() => { setFormCli(EMPTY_CLI); setNovoCliOpen(true) }}
                    title="Cadastrar novo cliente">
                    <UserPlus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Adicionar item */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: CREAM, border: `1px solid ${SAND}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9A7540' }}>
              Adicionar Item ao Carrinho
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Design (Bordado)</label>
                <select className="sacra-select" value={item.codigoBordado}
                  onChange={(e) => setItemBordado(e.target.value)}>
                  <option value="">Selecionar design...</option>
                  {bordados.map((b) => (
                    <option key={b.codigo} value={b.codigo}>
                      {b.codigo} · {b.descricao.replace('BORDADO ', '')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Produto</label>
                <select className="sacra-select" value={item.produto}
                  onChange={(e) => setItemProduto(e.target.value)}>
                  <option value="">Selecionar produto...</option>
                  {[...new Set(produtos.map((p) => p.descricao))].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tamanho</label>
                <select className="sacra-select" value={item.tamanho}
                  onChange={(e) => setItem((p) => ({ ...p, tamanho: e.target.value }))}>
                  <option value="">—</option>
                  {TAMANHOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cor</label>
                <input className="sacra-input" list="venda-cores" placeholder="Ex: Azul Marinho"
                  value={item.cor}
                  onChange={(e) => setItem((p) => ({ ...p, cor: e.target.value }))} />
                <datalist id="venda-cores">
                  {CORES.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label className="form-label">Quantidade</label>
                <input type="number" min={1} className="sacra-input" value={item.quantidade}
                  onChange={(e) => setItem((p) => ({ ...p, quantidade: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Preço Unitário (R$)
                  {item.codigoBordado && (
                    <span className="ml-1 text-xs font-normal" style={{ color: '#9A7540' }}>
                      · preenchido automaticamente
                    </span>
                  )}
                </label>
                <input type="number" step="0.01" className="sacra-input" value={item.precoUnitario}
                  onChange={(e) => setItem((p) => ({ ...p, precoUnitario: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold" style={{ color: COFFEE }}>
                Subtotal: <span style={{ color: GOLD }}>{fmtBRL(itemTotal)}</span>
              </div>
              <button className="btn-primary" onClick={adicionarAoCarrinho}
                disabled={!item.codigoBordado || item.precoUnitario <= 0}
                style={{ opacity: !item.codigoBordado || item.precoUnitario <= 0 ? 0.5 : 1 }}>
                <Plus size={14} /> Adicionar ao Carrinho
              </button>
            </div>
          </div>

          {/* Carrinho */}
          {cart.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9A7540' }}>
                Carrinho · {cart.length} {cart.length === 1 ? 'item' : 'itens'}
              </p>
              <div className="space-y-2">
                {cart.map((ci) => (
                  <div key={ci._key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'white', border: `1px solid ${SAND}` }}>
                    <ChevronRight size={14} style={{ color: GOLD, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: COFFEE }}>
                        {ci.descricaoBordado.replace('BORDADO ', '')}
                      </p>
                      <p className="text-xs" style={{ color: '#9A7540' }}>
                        {[ci.produto, ci.tamanho, ci.cor].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-xs text-right flex-shrink-0" style={{ color: '#9A7540' }}>
                      <p>{ci.quantidade} un × {fmtBRL(ci.precoUnitario)}</p>
                    </div>
                    <p className="font-semibold text-sm flex-shrink-0 w-20 text-right" style={{ color: GOLD }}>
                      {fmtBRL(ci.total)}
                    </p>
                    <button className="p-1 rounded hover:bg-red-50 flex-shrink-0"
                      onClick={() => removerDoCarrinho(ci._key)} style={{ color: '#DC2626' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between items-center px-3 py-2 rounded-xl font-semibold"
                  style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}40` }}>
                  <span style={{ color: COFFEE }}>Total da Venda</span>
                  <span className="font-heading text-xl" style={{ color: GOLD }}>{fmtBRL(cartTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal novo cliente */}
      <Modal open={novoCliOpen} onClose={() => setNovoCliOpen(false)} title="Novo Cliente" size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setNovoCliOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSalvarNovoCliente}>Salvar</button>
          </>
        }>
        <div className="form-grid">
          <div className="form-group span-2">
            <label className="form-label">Nome completo *</label>
            <input className="sacra-input" placeholder="Nome do cliente" value={formCli.nome}
              onChange={(e) => setFormCli((p) => ({ ...p, nome: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone *</label>
            <input className="sacra-input" placeholder="(84) 99999-9999" value={formCli.telefone}
              onChange={(e) => setFormCli((p) => ({ ...p, telefone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Cidade</label>
            <input className="sacra-input" placeholder="Ex: Natal" value={formCli.cidade ?? ''}
              onChange={(e) => setFormCli((p) => ({ ...p, cidade: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Canal</label>
            <select className="sacra-select" value={formCli.canal}
              onChange={(e) => setFormCli((p) => ({ ...p, canal: e.target.value as any }))}>
              <option value="varejo">Varejo</option>
              <option value="atacado">Atacado</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Segmento</label>
            <input className="sacra-input" placeholder="Ex: Igreja, Loja..." value={formCli.segmento ?? ''}
              onChange={(e) => setFormCli((p) => ({ ...p, segmento: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </>
  )
}
