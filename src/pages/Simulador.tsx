import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { fmtBRL, fmtPct } from '../utils/format'

type Canal = 'varejo' | 'atacado_cartao' | 'atacado_vista'

export default function Simulador() {
  const { fornecedores, produtos, bordados, parametros } = useStore()

  const [fornecedor, setFornecedor] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [bordadoCodigo, setBordadoCodigo] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [canal, setCanal] = useState<Canal>('varejo')
  const [freteKg, setFreteKg] = useState(0)

  const produtosFiltrados = produtos.filter(
    (p) => !fornecedor || p.fornecedorNome === fornecedor
  )
  const produto = produtos.find((p) => p.id === produtoId)
  const bordado = bordados.find((b) => b.codigo === bordadoCodigo)

  const bordadoMaisCaro = useMemo(
    () => bordados.reduce((max, b) => (b.precoMedio > (max?.precoMedio ?? 0) ? b : max), bordados[0]),
    [bordados]
  )

  const sacraFormula = useMemo(() => {
    if (!produto) return null
    const custoPeca = produto.precoCompra
    const custoBordadoSacra = bordadoMaisCaro?.precoMedio ?? 35
    const markup = 2.3
    const precoSacra = (custoPeca + custoBordadoSacra) * markup
    return { custoPeca, custoBordadoSacra, markup, precoSacra }
  }, [produto, bordadoMaisCaro])

  const resultado = useMemo(() => {
    if (!produto || !bordado) return null

    const custoBase = produto.precoCompra
    const custoBordado = bordado.precoMedio
    const custoEmb = 4
    const custoEtiq = parametros.etiquetas
    const custoMat = parametros.materiais
    const custoFrete = freteKg / Math.max(1, quantidade)

    const custoTotal = custoBase + custoBordado + custoEmb + custoEtiq + custoMat + custoFrete

    // Preço de referência do produto
    let precoBase = produto.precoVenda

    // Aplicar desconto atacado
    if (canal === 'atacado_cartao') precoBase *= (1 - parametros.descontoAtacadoCartao)
    if (canal === 'atacado_vista') precoBase *= (1 - parametros.descontoAtacadoVista)

    // Comissão
    const comissao = canal === 'varejo'
      ? precoBase * parametros.comissaoVarejo
      : precoBase * parametros.comissaoAtacado

    // Taxa cartão (70% das vendas no cartão)
    const taxaCartao = canal !== 'atacado_vista'
      ? precoBase * parametros.taxaCartao * parametros.percentualCartao
      : 0

    const despesaVar = precoBase * parametros.despesaVariavel
    const totalDespesas = comissao + taxaCartao + despesaVar
    const mc = precoBase - custoTotal - totalDespesas
    const mcPercent = (mc / precoBase) * 100

    return {
      custoBase,
      custoBordado,
      custoEmb,
      custoEtiq,
      custoMat,
      custoFrete,
      custoTotal,
      precoBase,
      comissao,
      taxaCartao,
      despesaVar,
      totalDespesas,
      mc,
      mcPercent,
      totalVenda: precoBase * quantidade,
      totalMC: mc * quantidade,
    }
  }, [produto, bordado, canal, freteKg, quantidade, parametros])

  return (
    <div className="space-y-6">
      <p className="page-subtitle">Calcule o preço e a margem de contribuição de qualquer combinação</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={18} style={{ color: 'var(--sacra-gold)' }} />
            <h3 className="font-heading text-lg" style={{ color: 'var(--sacra-coffee)' }}>Parâmetros</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Fornecedor</label>
            <select className="sacra-select" value={fornecedor} onChange={(e) => { setFornecedor(e.target.value); setProdutoId('') }}>
              <option value="">Todos os fornecedores</option>
              {fornecedores.map((f) => <option key={f.id} value={f.nome}>{f.nome}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Produto</label>
            <select className="sacra-select" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
              <option value="">Selecionar produto...</option>
              {produtosFiltrados.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.descricao} — custo {fmtBRL(p.precoCompra)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Design (Bordado)</label>
            <select className="sacra-select" value={bordadoCodigo} onChange={(e) => setBordadoCodigo(e.target.value)}>
              <option value="">Selecionar design...</option>
              {bordados.map((b) => (
                <option key={b.codigo} value={b.codigo}>
                  {b.descricao.replace('BORDADO ', '')} — {fmtBRL(b.precoMedio)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Quantidade</label>
              <input
                type="number" min={1} className="sacra-input"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Frete total (R$)</label>
              <input
                type="number" min={0} step="0.01" className="sacra-input"
                value={freteKg}
                onChange={(e) => setFreteKg(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Canal de Venda</label>
            <div className="flex gap-2">
              {([
                ['varejo', 'Varejo'],
                ['atacado_cartao', 'Atacado (30% desc.)'],
                ['atacado_vista', 'Atacado à vista (35% desc.)'],
              ] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setCanal(val)}
                  className="flex-1 py-2 text-xs font-medium rounded-lg transition-colors"
                  style={{
                    background: canal === val ? 'var(--sacra-gold)' : 'var(--sacra-cream)',
                    color: canal === val ? 'white' : 'var(--sacra-coffee)',
                    border: `1px solid ${canal === val ? 'var(--sacra-gold)' : 'var(--sacra-sand)'}`,
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          {/* Fórmula Sacra Devoção — sempre visível quando produto selecionado */}
          {sacraFormula && (
            <div
              className="card"
              style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1px solid #FDE68A' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 18 }}>✦</span>
                <h4 className="font-heading font-semibold text-sm" style={{ color: '#92400E' }}>
                  Fórmula de Precificação Sacra Devoção
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#92400E' }}>Custo da peça</span>
                  <span className="font-medium">{fmtBRL(sacraFormula.custoPeca)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#92400E' }}>Bordado mais caro ({bordadoMaisCaro?.descricao?.replace('BORDADO ', '')})</span>
                  <span className="font-medium">+ {fmtBRL(sacraFormula.custoBordadoSacra)}</span>
                </div>
                <div className="flex justify-between text-xs italic" style={{ color: '#A16207' }}>
                  <span>Subtotal × markup {sacraFormula.markup}×</span>
                  <span>({fmtBRL(sacraFormula.custoPeca + sacraFormula.custoBordadoSacra)}) × {sacraFormula.markup}</span>
                </div>
                <div
                  className="flex justify-between pt-2 border-t font-heading font-bold text-base"
                  style={{ borderColor: '#FDE68A', color: '#92400E' }}
                >
                  <span>Preço sugerido Sacra</span>
                  <span style={{ color: '#C0955A', fontSize: 20 }}>{fmtBRL(sacraFormula.precoSacra)}</span>
                </div>
              </div>
              <p className="text-xs mt-2 italic" style={{ color: '#A16207', opacity: 0.8 }}>
                Fórmula: (custo peça + bordado mais caro) × {sacraFormula.markup}
              </p>
            </div>
          )}

          {!resultado ? (
            <div className="card flex items-center justify-center h-48" style={{ border: '2px dashed var(--sacra-sand)' }}>
              <div className="text-center" style={{ color: '#B09070' }}>
                <Calculator size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Selecione um produto e um design para calcular a margem</p>
              </div>
            </div>
          ) : (
            <>
              {/* Preço e Margem */}
              <div
                className="card text-center py-6"
                style={{
                  background: 'linear-gradient(135deg, var(--sacra-coffee-dark) 0%, var(--sacra-coffee-light) 100%)',
                  border: 'none',
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--sacra-sand)', opacity: 0.7 }}>
                  Preço Sugerido
                </p>
                <p className="font-heading text-4xl font-semibold mb-2" style={{ color: 'var(--sacra-gold-light)' }}>
                  {fmtBRL(resultado.precoBase)}
                </p>
                <div className="flex justify-center gap-6 mt-3">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--sacra-sand)', opacity: 0.6 }}>MC Unitária</p>
                    <p className="font-semibold" style={{ color: resultado.mcPercent >= 40 ? '#86EFAC' : '#FCA5A5' }}>
                      {fmtBRL(resultado.mc)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--sacra-sand)', opacity: 0.6 }}>Margem %</p>
                    <p className="font-semibold text-lg" style={{ color: resultado.mcPercent >= 40 ? '#86EFAC' : '#FCA5A5' }}>
                      {fmtPct(resultado.mcPercent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--sacra-sand)', opacity: 0.6 }}>MC Total ({quantidade}un)</p>
                    <p className="font-semibold" style={{ color: '#D4AD72' }}>
                      {fmtBRL(resultado.totalMC)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalhamento */}
              <div className="card">
                <h4 className="font-heading text-base mb-3" style={{ color: 'var(--sacra-coffee)' }}>Composição de Custos</h4>
                <div className="space-y-2 text-sm">
                  {([
                    ['Custo do produto', resultado.custoBase],
                    ['Custo do bordado', resultado.custoBordado],
                    ['Embalagem', resultado.custoEmb],
                    ['Etiquetas', resultado.custoEtiq],
                    ['Materiais', resultado.custoMat],
                    ...(resultado.custoFrete > 0 ? [['Frete (por unidade)', resultado.custoFrete]] : []),
                  ] as [string, number][]).map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: '#6B4C2A' }}>{label}</span>
                      <span className="font-medium">{fmtBRL(val)}</span>
                    </div>
                  ))}
                  <div className="h-px my-1" style={{ background: 'var(--sacra-sand)' }} />
                  <div className="flex justify-between font-semibold">
                    <span style={{ color: 'var(--sacra-coffee)' }}>Custo Total</span>
                    <span>{fmtBRL(resultado.custoTotal)}</span>
                  </div>
                </div>

                <h4 className="font-heading text-base mt-4 mb-3" style={{ color: 'var(--sacra-coffee)' }}>Despesas Variáveis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#6B4C2A' }}>Comissão ({canal === 'varejo' ? '3%' : '1,5%'})</span>
                    <span className="font-medium">{fmtBRL(resultado.comissao)}</span>
                  </div>
                  {resultado.taxaCartao > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: '#6B4C2A' }}>Taxa cartão (5% × 70%)</span>
                      <span className="font-medium">{fmtBRL(resultado.taxaCartao)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span style={{ color: '#6B4C2A' }}>Despesa variável (2%)</span>
                    <span className="font-medium">{fmtBRL(resultado.despesaVar)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
