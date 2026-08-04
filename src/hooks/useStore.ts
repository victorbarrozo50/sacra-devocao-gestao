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
} from '../types'
import {
  mockBordados,
  mockFornecedores,
  mockProdutos,
  mockSKUs,
  mockVendas,
  mockCompras,
  mockCustosFixos,
  mockParametros,
  mockMixProdutos,
  mockDREMeses,
  mockClientes,
  mockWishlist,
  mockComprasHistorico,
  mockEventos,
  mockMovimentacoes,
} from '../data/mock-data'
import { nanoid } from '../utils/format'

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // ── Initial data ──────────────────────────────────────────────────────
      bordados: mockBordados,
      fornecedores: mockFornecedores,
      produtos: mockProdutos,
      skus: mockSKUs,
      vendas: mockVendas,
      compras: mockCompras,
      custosFixos: mockCustosFixos,
      parametros: mockParametros,
      mixProdutos: mockMixProdutos,
      dreMeses: mockDREMeses,
      clientes: mockClientes,
      wishlist: mockWishlist,
      comprasHistorico: mockComprasHistorico,
      eventos: mockEventos,
      movimentacoes: mockMovimentacoes,

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
        set((s) => ({ produtos: s.produtos.filter((x) => x.id !== id) })),

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
    }),
    {
      name: 'sacra-devocao-gestao-v3',
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
        skus: s.skus,
        eventos: s.eventos,
        movimentacoes: s.movimentacoes,
      }),
    }
  )
)

// ── Computed selectors ────────────────────────────────────────────────────────
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
