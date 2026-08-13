import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppStore,
  Venda,
  Compra,
  CustoFixo,
  ItemMix,
  StatusCompra,
  ParametrosFinanceiros,
  DREMes,
  LancamentoPD,
  ProcessoManual,
  ProdutoVariante,
} from '../types'
import {
  mockBordados,
  mockFornecedores,
  mockProdutos,
  mockVariantes,
  mockSKUs,
  mockVendas,
  mockCompras,
  mockCustosFixos,
  mockParametros,
  mockMixProdutos,
  mockClientes,
  mockWishlist,
  mockComprasHistorico,
  mockEventos,
  mockMovimentacoes,
  mockFuncionarios,
} from '../data/mock-data'
import { nanoid } from '../utils/format'

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // ── Initial data ──────────────────────────────────────────────────────
      bordados: mockBordados,
      fornecedores: mockFornecedores,
      produtos: mockProdutos,
      variantes: mockVariantes,
      skus: mockSKUs,
      vendas: mockVendas,
      compras: mockCompras,
      custosFixos: mockCustosFixos,
      parametros: mockParametros,
      mixProdutos: mockMixProdutos,
      clientes: mockClientes,
      wishlist: mockWishlist,
      comprasHistorico: mockComprasHistorico,
      eventos: mockEventos,
      movimentacoes: mockMovimentacoes,
      funcionarios: mockFuncionarios,
      lancamentosPD: [] as LancamentoPD[],
      processos: [] as ProcessoManual[],

      // ── Vendas ────────────────────────────────────────────────────────────
      addVenda: (v) =>
        set((s) => ({ vendas: [{ ...v, id: `v${nanoid()}` }, ...s.vendas] })),
      updateVenda: (id, v) =>
        set((s) => ({ vendas: s.vendas.map((x) => (x.id === id ? { ...x, ...v } : x)) })),
      deleteVenda: (id) =>
        set((s) => ({ vendas: s.vendas.filter((x) => x.id !== id) })),

      // ── Compras ───────────────────────────────────────────────────────────
      addCompra: (c) =>
        set((s) => ({ compras: [{ ...c, id: `c${nanoid()}` }, ...s.compras] })),
      updateCompra: (id, c) =>
        set((s) => ({ compras: s.compras.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteCompra: (id) =>
        set((s) => ({ compras: s.compras.filter((x) => x.id !== id) })),
      updateStatusCompra: (id: string, status: StatusCompra) =>
        set((s) => ({ compras: s.compras.map((x) => (x.id === id ? { ...x, status } : x)) })),

      // ── Custos Fixos ──────────────────────────────────────────────────────
      addCustoFixo: (c) =>
        set((s) => ({ custosFixos: [...s.custosFixos, { ...c, id: `cf${nanoid()}` }] })),
      updateCustoFixo: (id, c) =>
        set((s) => ({ custosFixos: s.custosFixos.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteCustoFixo: (id) =>
        set((s) => ({ custosFixos: s.custosFixos.filter((x) => x.id !== id) })),

      // ── Mix Produtos ──────────────────────────────────────────────────────
      addItemMix: (item) =>
        set((s) => ({ mixProdutos: [...s.mixProdutos, { ...item, id: `m${nanoid()}` }] })),
      updateItemMix: (id, item) =>
        set((s) => ({ mixProdutos: s.mixProdutos.map((x) => (x.id === id ? { ...x, ...item } : x)) })),
      deleteItemMix: (id) =>
        set((s) => ({ mixProdutos: s.mixProdutos.filter((x) => x.id !== id) })),

      // ── Parâmetros ────────────────────────────────────────────────────────
      updateParametros: (p: Partial<ParametrosFinanceiros>) =>
        set((s) => ({ parametros: { ...s.parametros, ...p } })),

      // ── CRM — Clientes ────────────────────────────────────────────────────
      addCliente: (c) =>
        set((s) => ({ clientes: [{ ...c, id: `cli${nanoid()}` }, ...s.clientes] })),
      updateCliente: (id, c) =>
        set((s) => ({ clientes: s.clientes.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteCliente: (id) =>
        set((s) => ({ clientes: s.clientes.filter((x) => x.id !== id) })),

      // ── CRM — Wishlist ────────────────────────────────────────────────────
      addItemWishlist: (item) =>
        set((s) => ({ wishlist: [...s.wishlist, { ...item, id: `w${nanoid()}` }] })),
      deleteItemWishlist: (id) =>
        set((s) => ({ wishlist: s.wishlist.filter((x) => x.id !== id) })),

      // ── CRM — Histórico ───────────────────────────────────────────────────
      addCompraHistorico: (c) =>
        set((s) => ({ comprasHistorico: [{ ...c, id: `ch${nanoid()}` }, ...s.comprasHistorico] })),
      deleteCompraHistorico: (id) =>
        set((s) => ({ comprasHistorico: s.comprasHistorico.filter((x) => x.id !== id) })),

      // ── Fornecedores ──────────────────────────────────────────────────────
      addFornecedor: (f) =>
        set((s) => ({
          fornecedores: [
            ...s.fornecedores,
            { ...f, id: `f${nanoid()}`, localizacao: `${f.cidade}-${f.estado}` },
          ],
        })),
      updateFornecedor: (id, f) =>
        set((s) => ({
          fornecedores: s.fornecedores.map((x) =>
            x.id === id
              ? { ...x, ...f, localizacao: `${f.cidade ?? x.cidade}-${f.estado ?? x.estado}` }
              : x
          ),
        })),
      deleteFornecedor: (id) =>
        set((s) => ({ fornecedores: s.fornecedores.filter((x) => x.id !== id) })),

      // ── Produtos ──────────────────────────────────────────────────────────
      addProduto: (p) =>
        set((s) => ({ produtos: [...s.produtos, { ...p, id: `p${nanoid()}` }] })),
      updateProduto: (id, p) =>
        set((s) => ({ produtos: s.produtos.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteProduto: (id) =>
        set((s) => ({
          produtos: s.produtos.filter((x) => x.id !== id),
          variantes: s.variantes.filter((v) => v.produtoId !== id),
        })),

      // ── Variantes ─────────────────────────────────────────────────────────
      addVariante: (v) =>
        set((s) => ({ variantes: [...s.variantes, { ...v, id: `var${nanoid()}` }] })),
      updateVariante: (id, v) =>
        set((s) => ({ variantes: s.variantes.map((x) => (x.id === id ? { ...x, ...v } : x)) })),
      deleteVariante: (id) =>
        set((s) => ({ variantes: s.variantes.filter((x) => x.id !== id) })),
      ajustarEstoque: (id, delta) =>
        set((s) => ({
          variantes: s.variantes.map((x) =>
            x.id === id ? { ...x, estoque: Math.max(0, x.estoque + delta) } : x
          ),
        })),

      // ── Eventos ───────────────────────────────────────────────────────────
      addEvento: (e) =>
        set((s) => ({ eventos: [...s.eventos, { ...e, id: `ev${nanoid()}` }] })),
      updateEvento: (id, e) =>
        set((s) => ({ eventos: s.eventos.map((x) => (x.id === id ? { ...x, ...e } : x)) })),
      deleteEvento: (id) =>
        set((s) => ({ eventos: s.eventos.filter((x) => x.id !== id) })),

      // ── Movimentações de Caixa ────────────────────────────────────────────
      addMovimentacao: (m) =>
        set((s) => ({ movimentacoes: [{ ...m, id: `mc${nanoid()}` }, ...s.movimentacoes] })),
      deleteMovimentacao: (id) =>
        set((s) => ({ movimentacoes: s.movimentacoes.filter((x) => x.id !== id) })),

      // ── SKUs ──────────────────────────────────────────────────────────────
      addSKU: (s) =>
        set((st) => ({ skus: [...st.skus, { ...s, id: `sk${nanoid()}` }] })),
      updateSKU: (id, s) =>
        set((st) => ({ skus: st.skus.map((x) => (x.id === id ? { ...x, ...s } : x)) })),
      deleteSKU: (id) =>
        set((st) => ({ skus: st.skus.filter((x) => x.id !== id) })),

      // ── Bordados ──────────────────────────────────────────────────────────
      addBordado: (b) =>
        set((s) => ({
          bordados: [
            ...s.bordados,
            {
              ...b,
              quantidadeTotal: 0,
              valorTotal: 0,
              percentualTotal: 0,
              percentualAcumulado: 0,
              curvaABC: 'C' as const,
            },
          ],
        })),
      updateBordado: (codigo, b) =>
        set((s) => ({ bordados: s.bordados.map((x) => (x.codigo === codigo ? { ...x, ...b } : x)) })),
      deleteBordado: (codigo) =>
        set((s) => ({ bordados: s.bordados.filter((x) => x.codigo !== codigo) })),

      // ── Funcionários ──────────────────────────────────────────────────────
      addFuncionario: (f) =>
        set((s) => ({ funcionarios: [...s.funcionarios, { ...f, id: `fn${nanoid()}` }] })),
      updateFuncionario: (id, f) =>
        set((s) => ({ funcionarios: s.funcionarios.map((x) => (x.id === id ? { ...x, ...f } : x)) })),
      deleteFuncionario: (id) =>
        set((s) => ({ funcionarios: s.funcionarios.filter((x) => x.id !== id) })),
      reorderFuncionarios: (ids) =>
        set((s) => {
          const map = new Map(s.funcionarios.map((f) => [f.id, f]))
          return { funcionarios: ids.map((id) => map.get(id)!).filter(Boolean) }
        }),

      // ── Presentes e Doações ───────────────────────────────────────────────
      addLancamentoPD: (l) =>
        set((s) => ({ lancamentosPD: [...s.lancamentosPD, { ...l, id: nanoid() }] })),
      deleteLancamentoPD: (id) =>
        set((s) => ({ lancamentosPD: s.lancamentosPD.filter((x) => x.id !== id) })),

      // ── Processos (Manual) ────────────────────────────────────────────────
      addProcesso: (p) =>
        set((s) => ({ processos: [...s.processos, { ...p, id: nanoid() }] })),
      updateProcesso: (id, p) =>
        set((s) => ({ processos: s.processos.map((x) => x.id === id ? { ...x, ...p } : x) })),
      deleteProcesso: (id) =>
        set((s) => ({ processos: s.processos.filter((x) => x.id !== id) })),
    }),
    {
      name: 'sacra-devocao-gestao-v5',
      partialize: (s) => ({
        vendas: s.vendas,
        compras: s.compras,
        custosFixos: s.custosFixos,
        mixProdutos: s.mixProdutos,
        parametros: s.parametros,
        clientes: s.clientes,
        wishlist: s.wishlist,
        comprasHistorico: s.comprasHistorico,
        bordados: s.bordados,
        fornecedores: s.fornecedores,
        produtos: s.produtos,
        variantes: s.variantes,
        skus: s.skus,
        eventos: s.eventos,
        movimentacoes: s.movimentacoes,
        funcionarios: s.funcionarios,
        lancamentosPD: s.lancamentosPD,
        processos: s.processos,
      }),
    }
  )
)

// ── Computed selectors ────────────────────────────────────────────────────────
export function calcDREMeses(
  vendas: Venda[],
  compras: Compra[],
  custosFixos: CustoFixo[],
  parametros: ParametrosFinanceiros
): DREMes[] {
  const mesesSet = new Set<string>()
  vendas.forEach((v) => mesesSet.add(v.data.slice(0, 7)))
  if (mesesSet.size === 0) return []

  const custoFixoMensal = custosFixos.reduce((s, c) => s + c.valor, 0)
  const mesesNomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const fmtMes = (ym: string) => {
    const [y, m] = ym.split('-')
    return `${mesesNomes[Number(m) - 1]}/${y.slice(2)}`
  }

  return Array.from(mesesSet).sort().map((mes) => {
    const vendasMes = vendas.filter((v) => v.data.startsWith(mes))
    const receitaBruta = vendasMes.reduce((s, v) => s + v.total, 0)
    const taxaMedia = parametros.taxaCartao * parametros.percentualCartao + parametros.comissaoVarejo + parametros.despesaVariavel
    const deducoes = receitaBruta * taxaMedia
    const receitaLiquida = receitaBruta - deducoes

    const comprasMes = compras.filter((c) => {
      const d = c.dataEntregaBordado ?? c.dataEntregaProduto ?? c.dataPedido
      return d.startsWith(mes) && c.adicionadoAoEstoque
    })
    const custoVariavel = comprasMes.reduce((s, c) =>
      s + c.precoUnitario * c.qtdTotal + (c.custoBordado ?? 0) * c.qtdTotal + (c.frete ?? 0), 0)

    const margemContribuicao = receitaLiquida - custoVariavel
    const lucroOperacional = margemContribuicao - custoFixoMensal
    const margemPercent = receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : 0

    return {
      mes: fmtMes(mes),
      receitaBruta,
      deducoes,
      receitaLiquida,
      custoVariavel,
      margemContribuicao,
      custoFixo: custoFixoMensal,
      lucroOperacional,
      margemPercent,
    }
  })
}

export function calcPontoEquilibrio(custosFixos: CustoFixo[], mixProdutos: ItemMix[], parametros: ParametrosFinanceiros) {
  const custoFixoTotal = custosFixos.reduce((s, c) => s + c.valor, 0)
  const faturamento = mixProdutos.reduce((s, i) => s + i.faturamento, 0)
  const mc = mixProdutos.reduce((s, i) => s + i.margemContribuicao * i.quantidade, 0)
  const margemMedia = faturamento > 0 ? (mc / faturamento) * 100 : 0
  const despesaVariavelPercent = parametros.despesaVariavel * 100
  const razioCM = (margemMedia - despesaVariavelPercent) / 100
  const peMonetario = razioCM > 0 ? custoFixoTotal / razioCM : 0
  const peUnidades = mixProdutos.length > 0
    ? Math.ceil(peMonetario / (faturamento / Math.max(1, mixProdutos.reduce((s, i) => s + i.quantidade, 0))))
    : 0
  const margemSeguranca = faturamento - peMonetario
  return {
    custoFixoTotal,
    despesaVariavelPercent,
    margemContribuicaoMedia: margemMedia,
    razioCM: razioCM * 100,
    peMonetario,
    peUnidades,
    faturamentoAtual: faturamento,
    margemSeguranca,
    margemSegurancaPercent: faturamento > 0 ? (margemSeguranca / faturamento) * 100 : 0,
  }
}
