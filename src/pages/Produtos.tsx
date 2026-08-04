import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useStore } from '../hooks/useStore'
import { fmtBRL } from '../utils/format'
import type { SKU, Produto } from '../types'

const GOLD   = '#C0955A'
const COFFEE = '#3E2A1B'
const SAND   = '#E7DCC8'

// ─── tipos locais de formulário ──────────────────────────────────────────────
type SKUForm = {
  produtoId: string
  bordadoCodigo: string
  precoVenda: string
  markup: string
  origem: string
  transportadora: string
}
type ProdutoForm = {
  fornecedorId: string
  descricao: string
  precoCompra: string
  precoVenda: string
  categoria: 'vestuario' | 'acessorio'
  subcategoria: string
}

const emptySkuForm: SKUForm = {
  produtoId: '', bordadoCodigo: '', precoVenda: '', markup: '2',
  origem: '', transportadora: '',
}
const emptyProdForm: ProdutoForm = {
  fornecedorId: '', descricao: '', precoCompra: '', precoVenda: '',
  categoria: 'vestuario', subcategoria: '',
}

// ─── Markup chart data ────────────────────────────────────────────────────────
function buildMarkupChart(totalCusto: number, markupAtual: number) {
  const steps = [1.3, 1.5, 1.8, 2.0, 2.5, 3.0, 3.5, 4.0]
  return steps.map((m) => ({
    markup: `${m}×`,
    custo: totalCusto,
    ganho: +(totalCusto * m - totalCusto).toFixed(2),
    precoVenda: +(totalCusto * m).toFixed(2),
    atual: Math.abs(m - markupAtual) < 0.05,
  }))
}

// ─── Modal SKU ────────────────────────────────────────────────────────────────
function ModalSKU({ editId, onClose }: { editId: string | null; onClose: () => void }) {
  const { skus, produtos, bordados, fornecedores, addSKU, updateSKU } = useStore()

  const initial = useMemo<SKUForm>(() => {
    if (!editId) return emptySkuForm
    const s = skus.find((x) => x.id === editId)
    if (!s) return emptySkuForm
    return {
      produtoId:      s.produtoId ?? '',
      bordadoCodigo:  s.bordadoCodigo ?? '',
      precoVenda:     s.precoVenda?.toString() ?? '',
      markup:         s.markup?.toString() ?? '2',
      origem:         s.origem ?? '',
      transportadora: s.transportadora ?? '',
    }
  }, [editId, skus])

  const [form, setForm] = useState<SKUForm>(initial)
  const set = (k: keyof SKUForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  // ── produtos selecionado e bordado selecionado ───────────────────────────
  const produtoSel = produtos.find((p) => p.id === form.produtoId) ?? null
  const bordadoSel = bordados.find((b) => b.codigo === form.bordadoCodigo) ?? null
  const fornSel    = produtoSel ? fornecedores.find((f) => f.id === produtoSel.fornecedorId) : null

  const custoProd   = produtoSel?.precoCompra ?? 0
  const custoBord   = bordadoSel?.custoUnitario ?? bordadoSel?.precoMedio ?? 0
  const totalCusto  = custoProd + custoBord
  const markupNum   = parseFloat(form.markup) || 0
  const precoSuger  = totalCusto > 0 && markupNum > 0 ? totalCusto * markupNum : 0
  const precoFinal  = parseFloat(form.precoVenda) || precoSuger
  const margem      = precoFinal > 0 ? ((precoFinal - totalCusto) / precoFinal) * 100 : 0

  const chartData = totalCusto > 0 ? buildMarkupChart(totalCusto, markupNum) : []

  // quando produto muda, pre-preenche origem/transportadora
  const handleProduto = (prodId: string) => {
    const p = produtos.find((x) => x.id === prodId)
    const f = p ? fornecedores.find((x) => x.id === p.fornecedorId) : null
    setForm((prev) => ({
      ...prev,
      produtoId: prodId,
      origem: f ? `${f.cidade}-${f.estado}` : prev.origem,
      transportadora: f?.transportadora ?? prev.transportadora,
    }))
  }

  // quando markup muda, atualiza sugestão de preço (limpa override manual)
  const handleMarkup = (v: string) => {
    const m = parseFloat(v) || 0
    const sug = totalCusto > 0 && m > 0 ? (totalCusto * m).toFixed(2) : ''
    setForm((f) => ({ ...f, markup: v, precoVenda: sug }))
  }

  const handleSave = () => {
    if (!produtoSel || !bordadoSel) return
    const sku: Omit<SKU, 'id'> = {
      fornecedor:     produtoSel.fornecedorNome,
      produto:        produtoSel.descricao,
      valorUnitario:  custoProd,
      origem:         form.origem || (fornSel ? `${fornSel.cidade}-${fornSel.estado}` : ''),
      transportadora: form.transportadora || fornSel?.transportadora || '',
      bordado:        bordadoSel.descricao,
      precoMedio:     custoBord,
      precoVenda:     precoFinal || undefined,
      margem:         precoFinal > 0 ? +margem.toFixed(1) : undefined,
      markup:         markupNum || undefined,
      produtoId:      produtoSel.id,
      bordadoCodigo:  bordadoSel.codigo,
    }
    if (editId) updateSKU(editId, sku)
    else addSKU(sku)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ border: `1px solid ${SAND}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: SAND }}>
          <h2 className="font-heading text-xl" style={{ color: COFFEE }}>
            {editId ? 'Editar SKU' : 'Novo SKU (Produto + Bordado)'}
          </h2>
          <button onClick={onClose}><X size={20} style={{ color: '#9A7540' }} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Produto */}
          <div>
            <label className="sacra-label">Produto (Catálogo)</label>
            <select className="sacra-select w-full" value={form.produtoId}
              onChange={(e) => handleProduto(e.target.value)}>
              <option value="">Selecionar produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.descricao} — {p.fornecedorNome}</option>
              ))}
            </select>
          </div>

          {/* Bordado */}
          <div>
            <label className="sacra-label">Bordado</label>
            <select className="sacra-select w-full" value={form.bordadoCodigo}
              onChange={(e) => set('bordadoCodigo', e.target.value)}>
              <option value="">Selecionar bordado...</option>
              {bordados.map((b) => (
                <option key={b.codigo} value={b.codigo}>
                  {b.descricao.replace('BORDADO ', '')}
                  {(b.custoUnitario ?? b.precoMedio) > 0
                    ? ` — ${fmtBRL(b.custoUnitario ?? b.precoMedio)}`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Detalhamento de custos */}
          {(produtoSel || bordadoSel) && (
            <div className="rounded-xl p-4 space-y-2" style={{ background: '#FBF7F0', border: `1px solid ${SAND}` }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9A7540' }}>
                Detalhamento de Custos
              </p>
              <div className="flex justify-between text-sm">
                <span style={{ color: COFFEE }}>Custo do produto</span>
                <span className="font-medium" style={{ color: COFFEE }}>
                  {produtoSel ? fmtBRL(custoProd) : <span style={{ color: '#9A7540' }}>—</span>}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: COFFEE }}>Custo do bordado</span>
                <span className="font-medium" style={{ color: COFFEE }}>
                  {bordadoSel ? fmtBRL(custoBord) : <span style={{ color: '#9A7540' }}>—</span>}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t" style={{ borderColor: SAND }}>
                <span style={{ color: COFFEE }}>Total custo</span>
                <span style={{ color: GOLD }}>{fmtBRL(totalCusto)}</span>
              </div>
            </div>
          )}

          {/* Markup + preço sugerido */}
          {totalCusto > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="sacra-label">Markup multiplicador</label>
                  <input className="sacra-input w-full" type="number" step="0.1" min="1"
                    placeholder="Ex: 2.5" value={form.markup}
                    onChange={(e) => handleMarkup(e.target.value)} />
                </div>
                <div>
                  <label className="sacra-label">Preço de Venda (R$)</label>
                  <input className="sacra-input w-full" type="number" step="0.01" min="0"
                    placeholder={precoSuger > 0 ? fmtBRL(precoSuger) : 'Preço...'}
                    value={form.precoVenda}
                    onChange={(e) => set('precoVenda', e.target.value)} />
                </div>
              </div>

              {/* Sugestão + margem */}
              {precoSuger > 0 && (
                <div className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div>
                    <p className="text-xs" style={{ color: '#166534' }}>
                      Preço sugerido ({markupNum}× custo)
                    </p>
                    <p className="text-xl font-bold" style={{ color: '#166534' }}>{fmtBRL(precoSuger)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: '#166534' }}>Margem</p>
                    <p className="text-2xl font-bold" style={{
                      color: margem >= 50 ? '#166534' : margem >= 35 ? '#92400E' : '#991B1B',
                    }}>
                      {margem.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Chart: custo × markup = preço */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#9A7540' }}>
                  Preço de venda por markup (custo base: {fmtBRL(totalCusto)})
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={SAND} />
                    <XAxis dataKey="markup" tick={{ fontSize: 11, fill: '#6B4C2A' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B4C2A' }}
                      tickFormatter={(v) => `R$${v}`} width={60} />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        fmtBRL(v),
                        name === 'custo' ? 'Custo' : name === 'ganho' ? 'Ganho' : name,
                      ]}
                      contentStyle={{ background: COFFEE, border: `1px solid ${GOLD}`, borderRadius: 8 }}
                      labelStyle={{ color: SAND, fontSize: 11 }}
                      itemStyle={{ color: '#D4AD72', fontSize: 11 }}
                    />
                    <ReferenceLine
                      x={`${markupNum}×`}
                      stroke={GOLD} strokeWidth={2} strokeDasharray="4 2"
                    />
                    <Bar dataKey="custo" stackId="a" fill="#D6B896" radius={[0,0,0,0]} name="custo" />
                    <Bar dataKey="ganho" stackId="a" fill={GOLD} radius={[4,4,0,0]} name="ganho" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Origem + transportadora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="sacra-label">Origem</label>
              <input className="sacra-input w-full" placeholder="Ex: Natal-RN"
                value={form.origem} onChange={(e) => set('origem', e.target.value)} />
            </div>
            <div>
              <label className="sacra-label">Transportadora</label>
              <input className="sacra-input w-full" placeholder="Ex: Jadlog"
                value={form.transportadora} onChange={(e) => set('transportadora', e.target.value)} />
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}
              disabled={!form.produtoId || !form.bordadoCodigo}>
              {editId ? 'Salvar alterações' : 'Adicionar SKU'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Produto ────────────────────────────────────────────────────────────
function ModalProduto({ editId, onClose }: { editId: string | null; onClose: () => void }) {
  const { produtos, fornecedores, addProduto, updateProduto } = useStore()

  const initial = useMemo<ProdutoForm>(() => {
    if (!editId) return emptyProdForm
    const p = produtos.find((x) => x.id === editId)
    if (!p) return emptyProdForm
    return {
      fornecedorId: p.fornecedorId,
      descricao:    p.descricao,
      precoCompra:  p.precoCompra.toString(),
      precoVenda:   p.precoVenda.toString(),
      categoria:    p.categoria,
      subcategoria: p.subcategoria,
    }
  }, [editId, produtos])

  const [form, setForm] = useState<ProdutoForm>(initial)
  const set = (k: keyof ProdutoForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const custo    = parseFloat(form.precoCompra) || 0
  const venda    = parseFloat(form.precoVenda) || 0
  const margem   = venda > 0 ? ((venda - custo) / venda) * 100 : 0

  const handleSave = () => {
    const forn = fornecedores.find((f) => f.id === form.fornecedorId)
    const p: Omit<Produto, 'id'> = {
      fornecedorId:   form.fornecedorId,
      fornecedorNome: forn?.nome ?? '',
      descricao:      form.descricao,
      precoCompra:    custo,
      precoVenda:     venda,
      categoria:      form.categoria,
      subcategoria:   form.subcategoria,
    }
    if (editId) updateProduto(editId, p)
    else addProduto(p)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        style={{ border: `1px solid ${SAND}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: SAND }}>
          <h2 className="font-heading text-xl" style={{ color: COFFEE }}>
            {editId ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose}><X size={20} style={{ color: '#9A7540' }} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="sacra-label">Fornecedor</label>
            <select className="sacra-select w-full" value={form.fornecedorId}
              onChange={(e) => set('fornecedorId', e.target.value)}>
              <option value="">Selecionar fornecedor...</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="sacra-label">Descrição do produto</label>
            <input className="sacra-input w-full" placeholder="Ex: T-shirt viscolycra"
              value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="sacra-label">Categoria</label>
              <select className="sacra-select w-full" value={form.categoria}
                onChange={(e) => set('categoria', e.target.value as 'vestuario' | 'acessorio')}>
                <option value="vestuario">Vestuário</option>
                <option value="acessorio">Acessório</option>
              </select>
            </div>
            <div>
              <label className="sacra-label">Subcategoria</label>
              <input className="sacra-input w-full" placeholder="Ex: T-shirt"
                value={form.subcategoria} onChange={(e) => set('subcategoria', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="sacra-label">Preço de Compra (R$)</label>
              <input className="sacra-input w-full" type="number" step="0.01" min="0"
                value={form.precoCompra} onChange={(e) => set('precoCompra', e.target.value)} />
            </div>
            <div>
              <label className="sacra-label">Preço de Venda (R$)</label>
              <input className="sacra-input w-full" type="number" step="0.01" min="0"
                value={form.precoVenda} onChange={(e) => set('precoVenda', e.target.value)} />
            </div>
          </div>
          {venda > 0 && custo > 0 && (
            <div className="rounded-xl p-3 flex justify-between items-center"
              style={{ background: '#FBF7F0', border: `1px solid ${SAND}` }}>
              <span className="text-sm" style={{ color: COFFEE }}>Margem bruta</span>
              <span className="font-bold text-lg" style={{
                color: margem >= 50 ? '#166534' : margem >= 35 ? '#92400E' : '#991B1B',
              }}>
                {margem.toFixed(1)}%
              </span>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}
              disabled={!form.fornecedorId || !form.descricao}>
              {editId ? 'Salvar alterações' : 'Adicionar Produto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Produtos() {
  const { skus, produtos, deleteSKU, deleteProduto } = useStore()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'sku' | 'produto'>('sku')
  const [skuModal,  setSkuModal]  = useState<'new' | string | null>(null) // 'new' | id | null
  const [prodModal, setProdModal] = useState<'new' | string | null>(null)

  const filteredSKU = useMemo(() => {
    const q = search.toLowerCase()
    return !q ? skus : skus.filter(
      (s) => s.produto.toLowerCase().includes(q)
        || s.bordado.toLowerCase().includes(q)
        || s.fornecedor.toLowerCase().includes(q)
    )
  }, [skus, search])

  const filteredProd = useMemo(() => {
    const q = search.toLowerCase()
    return !q ? produtos : produtos.filter(
      (p) => p.descricao.toLowerCase().includes(q)
        || p.fornecedorNome.toLowerCase().includes(q)
    )
  }, [produtos, search])

  return (
    <div className="space-y-5">
      <p className="page-subtitle">Base de dados de produtos, SKUs e combinações</p>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-0" style={{ borderColor: 'var(--sacra-sand)' }}>
        {(['sku', 'produto'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium transition-colors -mb-px"
            style={{
              borderBottom: tab === t ? '2px solid var(--sacra-gold)' : '2px solid transparent',
              color: tab === t ? 'var(--sacra-gold)' : 'var(--sacra-brown)',
            }}>
            {t === 'sku' ? 'SKUs (Produto + Bordado)' : 'Catálogo de Produtos'}
          </button>
        ))}
      </div>

      {/* Busca + botão */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9A7540' }} />
          <input className="sacra-input pl-9" placeholder="Buscar..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {tab === 'sku'
          ? <button className="btn-primary ml-auto" onClick={() => setSkuModal('new')}>
              <Plus size={16} /> Novo SKU
            </button>
          : <button className="btn-primary ml-auto" onClick={() => setProdModal('new')}>
              <Plus size={16} /> Novo Produto
            </button>
        }
      </div>

      {/* Tabela SKUs */}
      {tab === 'sku' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="sacra-table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Produto</th>
                  <th>Bordado</th>
                  <th>Origem</th>
                  <th>Transp.</th>
                  <th>C. Produto</th>
                  <th>C. Bordado</th>
                  <th>C. Total</th>
                  <th>Markup</th>
                  <th>Preço Venda</th>
                  <th>Margem</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredSKU.length === 0 ? (
                  <tr><td colSpan={12} className="text-center py-8" style={{ color: '#9A7540' }}>
                    Nenhum SKU encontrado
                  </td></tr>
                ) : filteredSKU.map((s) => {
                  const custoTotal = s.valorUnitario + s.precoMedio
                  return (
                    <tr key={s.id}>
                      <td className="text-sm font-medium">{s.fornecedor}</td>
                      <td className="text-sm">{s.produto}</td>
                      <td className="text-xs max-w-[130px] truncate" style={{ color: '#6B4C2A' }}>
                        {s.bordado.replace('BORDADO ', '')}
                      </td>
                      <td className="text-xs">{s.origem}</td>
                      <td className="text-xs" style={{ color: '#9A7540' }}>{s.transportadora}</td>
                      <td className="text-xs">{fmtBRL(s.valorUnitario)}</td>
                      <td className="text-xs">{fmtBRL(s.precoMedio)}</td>
                      <td className="font-medium text-xs" style={{ color: GOLD }}>{fmtBRL(custoTotal)}</td>
                      <td className="text-xs text-center">
                        {s.markup ? `${s.markup}×` : '—'}
                      </td>
                      <td className="font-semibold">{s.precoVenda ? fmtBRL(s.precoVenda) : '—'}</td>
                      <td>
                        {s.margem != null ? (
                          <span className="text-sm font-semibold"
                            style={{ color: s.margem >= 50 ? '#166534' : '#92400E' }}>
                            {s.margem}%
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-secondary p-1.5" onClick={() => setSkuModal(s.id)}>
                            <Pencil size={13} />
                          </button>
                          <button className="btn-danger p-1.5" onClick={() => deleteSKU(s.id)}>
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
      )}

      {/* Tabela Catálogo */}
      {tab === 'produto' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="sacra-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Fornecedor</th>
                  <th>Categoria</th>
                  <th>Custo Compra</th>
                  <th>Preço Venda</th>
                  <th>Margem Bruta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProd.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8" style={{ color: '#9A7540' }}>
                    Nenhum produto encontrado
                  </td></tr>
                ) : filteredProd.map((p) => {
                  const mb = p.precoVenda > 0 ? ((p.precoVenda - p.precoCompra) / p.precoVenda) * 100 : 0
                  return (
                    <tr key={p.id}>
                      <td className="font-medium text-sm">{p.descricao}</td>
                      <td className="text-sm">{p.fornecedorNome}</td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: p.categoria === 'vestuario' ? '#F0E8D820' : '#3E2A1B10',
                            color: p.categoria === 'vestuario' ? '#7A5828' : '#3E2A1B',
                            border: '1px solid var(--sacra-sand)',
                          }}>
                          {p.subcategoria}
                        </span>
                      </td>
                      <td>{fmtBRL(p.precoCompra)}</td>
                      <td className="font-semibold">{fmtBRL(p.precoVenda)}</td>
                      <td>
                        <span className="text-sm font-semibold"
                          style={{ color: mb >= 50 ? '#166534' : mb >= 35 ? '#92400E' : '#991B1B' }}>
                          {mb.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-secondary p-1.5" onClick={() => setProdModal(p.id)}>
                            <Pencil size={13} />
                          </button>
                          <button className="btn-danger p-1.5" onClick={() => deleteProduto(p.id)}>
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
      )}

      {/* Modais */}
      {skuModal !== null && (
        <ModalSKU
          editId={skuModal === 'new' ? null : skuModal}
          onClose={() => setSkuModal(null)}
        />
      )}
      {prodModal !== null && (
        <ModalProduto
          editId={prodModal === 'new' ? null : prodModal}
          onClose={() => setProdModal(null)}
        />
      )}
    </div>
  )
}
