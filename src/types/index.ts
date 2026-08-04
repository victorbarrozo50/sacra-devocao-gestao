// ─── Bordado (Embroidery Design) ───────────────────────────────────────────
export interface Bordado {
  codigo: string
  descricao: string
  precoMedio: number
  quantidadeTotal: number
  valorTotal: number
  percentualTotal: number
  percentualAcumulado: number
  curvaABC: 'A' | 'B' | 'C'
  // Campos de cadastro manual
  foto?: string             // base64 data URL
  custoUnitario?: number    // custo do bordado
  fornecedor?: string       // nome do fornecedor de bordado
  dataUltimoPedido?: string // ISO date
}

// ─── Fornecedor ─────────────────────────────────────────────────────────────
export interface Fornecedor {
  id: string
  nome: string
  localizacao: string
  transportadora: string
  cidade: string
  estado: string
  segmento?: string
  telefone?: string
  email?: string
  observacoes?: string
}

// ─── Produto ────────────────────────────────────────────────────────────────
export interface Produto {
  id: string
  fornecedorId: string
  fornecedorNome: string
  descricao: string
  precoCompra: number
  precoVenda: number
  categoria: 'vestuario' | 'acessorio'
  subcategoria: string
}

// ─── SKU (Produto + Bordado) ─────────────────────────────────────────────────
export interface SKU {
  id: string
  fornecedor: string
  produto: string
  valorUnitario: number   // custo do produto
  origem: string
  transportadora: string
  bordado: string
  precoMedio: number      // custo do bordado
  precoVenda?: number
  margem?: number
  markup?: number         // multiplicador usado para sugerir preço
  produtoId?: string      // link para Produto
  bordadoCodigo?: string  // link para Bordado
}

// ─── Venda ────────────────────────────────────────────────────────────────────
export interface Venda {
  id: string
  data: string
  documento: string
  clienteId?: string
  codigoBordado: string
  descricaoBordado: string
  produto?: string
  quantidade: number
  precoUnitario: number
  total: number
  canal: 'varejo' | 'atacado'
  formaPagamento: 'cartao' | 'pix' | 'dinheiro'
}

// ─── Compra ───────────────────────────────────────────────────────────────────
export type StatusCompra =
  | 'aguardando'
  | 'compra_solicitada'
  | 'produto_recebido'
  | 'bordado_em_andamento'
  | 'concluido'
  | 'cancelado'

export interface Compra {
  id: string
  dataPedido: string
  fornecedor: string
  produto: string
  bordado: string
  qtdPP: number
  qtdP: number
  qtdM: number
  qtdG: number
  qtdGG: number
  qtdTotal: number
  precoUnitario: number
  valorTotal: number
  frete?: number          // freight cost for the order
  custoBordado?: number   // embroidery cost per unit (set when bordado confirmed)
  status: StatusCompra
  dataEntregaProduto?: string
  dataEntregaBordado?: string
  leadTimeProduto?: number
  leadTimeBordado?: number
  observacoes?: string
  adicionadoAoEstoque?: boolean
}

// ─── Custo Fixo ───────────────────────────────────────────────────────────────
export interface CustoFixo {
  id: string
  categoria: string
  descricao: string
  valor: number
}

// ─── Parâmetros Financeiros ───────────────────────────────────────────────────
export interface ParametrosFinanceiros {
  comissaoVarejo: number       // 3%
  comissaoAtacado: number      // 1.5%
  taxaCartao: number           // 5%
  percentualCartao: number     // 70%
  descontoAtacadoCartao: number // 30%
  descontoAtacadoVista: number  // 35%
  despesaVariavel: number       // 2%
  embalagem: {
    pequena: number
    media: number
    grande: number
  }
  etiquetas: number
  materiais: number
  metaMensal?: number          // meta de faturamento mensal
}

// ─── Movimentação de Caixa ───────────────────────────────────────────────────
export interface MovimentacaoCaixa {
  id: string
  data: string        // YYYY-MM-DD
  descricao: string
  valor: number       // sempre positivo
  categoria: string   // 'Aluguel' | 'Material' | 'Pessoal' | 'Outros' | custom
}

// ─── Item Mix de Produtos ────────────────────────────────────────────────────
export interface ItemMix {
  id: string
  produto: string
  fornecedor: string
  quantidade: number
  precoVenda: number
  custoCompra: number
  custoBordado: number
  custoEmbalagem: number
  margemContribuicao: number
  margemPercent: number
  faturamento: number
}

// ─── Ponto de Equilíbrio ─────────────────────────────────────────────────────
export interface PontoEquilibrio {
  custoFixoTotal: number
  despesaVariavelPercent: number
  margemContribuicaoMedia: number
  razioCM: number
  peMonetario: number
  peUnidades: number
  faturamentoAtual: number
  margemSeguranca: number
  margemSegurancaPercent: number
}

// ─── DRE ─────────────────────────────────────────────────────────────────────
export interface DREMes {
  mes: string
  receitaBruta: number
  deducoes: number
  receitaLiquida: number
  custoVariavel: number
  margemContribuicao: number
  custoFixo: number
  lucroOperacional: number
  margemPercent: number
}

// ─── CRM ─────────────────────────────────────────────────────────────────────
export interface Cliente {
  id: string
  nome: string
  telefone: string
  email?: string
  cidade?: string
  estado?: string
  canal: 'varejo' | 'atacado' | 'ambos'
  segmento?: string          // ex: "Igreja", "Loja", "Presente"
  observacoes?: string
  criadoEm: string
}

export interface ItemWishlist {
  id: string
  clienteId: string
  bordado: string            // design desejado
  produto?: string           // tipo de peça (ex: "T-shirt", "Bolsa")
  tamanho?: string           // PP / P / M / G / GG
  notas?: string
  criadoEm: string
}

export interface CompraHistorico {
  id: string
  clienteId: string
  data: string
  descricaoBordado: string
  produto?: string
  quantidade: number
  precoUnitario: number
  total: number
  canal: 'varejo' | 'atacado'
  formaPagamento: 'cartao' | 'pix' | 'dinheiro'
}

// ─── Eventos ─────────────────────────────────────────────────────────────────
export type ClassificacaoEvento =
  | 'religioso' | 'feira' | 'pop_up' | 'bazar'
  | 'feriado'   | 'sazonal' | 'exposicao'

export interface PecaEvento {
  bordadoCodigo: string
  bordadoNome: string
  quantidade: number
}

export interface Evento {
  id: string
  nome: string
  data: string        // YYYY-MM-DD
  dataFim?: string
  custo?: number
  emailContato?: string
  telefoneContato?: string
  local?: string
  classificacao: ClassificacaoEvento
  descricao?: string
  pecasRecomendadas?: PecaEvento[]
}

// ─── Store ───────────────────────────────────────────────────────────────────
export interface AppStore {
  clientes: Cliente[]
  wishlist: ItemWishlist[]
  comprasHistorico: CompraHistorico[]
  vendas: Venda[]
  compras: Compra[]
  bordados: Bordado[]
  fornecedores: Fornecedor[]
  produtos: Produto[]
  skus: SKU[]
  custosFixos: CustoFixo[]
  parametros: ParametrosFinanceiros
  mixProdutos: ItemMix[]
  dreMeses: DREMes[]

  // Vendas
  addVenda: (v: Omit<Venda, 'id'>) => void
  updateVenda: (id: string, v: Partial<Venda>) => void
  deleteVenda: (id: string) => void

  // Compras
  addCompra: (c: Omit<Compra, 'id'>) => void
  updateCompra: (id: string, c: Partial<Compra>) => void
  deleteCompra: (id: string) => void
  updateStatusCompra: (id: string, status: StatusCompra) => void

  // Custos Fixos
  addCustoFixo: (c: Omit<CustoFixo, 'id'>) => void
  updateCustoFixo: (id: string, c: Partial<CustoFixo>) => void
  deleteCustoFixo: (id: string) => void

  // Mix
  addItemMix: (item: Omit<ItemMix, 'id'>) => void
  updateItemMix: (id: string, item: Partial<ItemMix>) => void
  deleteItemMix: (id: string) => void

  // Parâmetros
  updateParametros: (p: Partial<ParametrosFinanceiros>) => void

  // CRM — Clientes
  addCliente: (c: Omit<Cliente, 'id'>) => void
  updateCliente: (id: string, c: Partial<Cliente>) => void
  deleteCliente: (id: string) => void

  // CRM — Wishlist
  addItemWishlist: (item: Omit<ItemWishlist, 'id'>) => void
  deleteItemWishlist: (id: string) => void

  // CRM — Histórico de compras
  addCompraHistorico: (c: Omit<CompraHistorico, 'id'>) => void
  deleteCompraHistorico: (id: string) => void

  // SKUs
  addSKU: (s: Omit<SKU, 'id'>) => void
  updateSKU: (id: string, s: Partial<SKU>) => void
  deleteSKU: (id: string) => void

  // Bordados
  addBordado: (b: Pick<Bordado, 'codigo' | 'descricao' | 'precoMedio'> & { foto?: string; custoUnitario?: number; fornecedor?: string; dataUltimoPedido?: string }) => void
  updateBordado: (codigo: string, b: Partial<Bordado>) => void
  deleteBordado: (codigo: string) => void

  // Fornecedores
  addFornecedor: (f: Omit<Fornecedor, 'id' | 'localizacao'>) => void
  updateFornecedor: (id: string, f: Partial<Fornecedor>) => void
  deleteFornecedor: (id: string) => void

  // Produtos
  addProduto: (p: Omit<Produto, 'id'>) => void
  updateProduto: (id: string, p: Partial<Produto>) => void
  deleteProduto: (id: string) => void

  // Eventos
  eventos: Evento[]
  addEvento: (e: Omit<Evento, 'id'>) => void
  updateEvento: (id: string, e: Partial<Evento>) => void
  deleteEvento: (id: string) => void

  // Movimentações de Caixa
  movimentacoes: MovimentacaoCaixa[]
  addMovimentacao: (m: Omit<MovimentacaoCaixa, 'id'>) => void
  deleteMovimentacao: (id: string) => void
}
