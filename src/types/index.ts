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
  precoCompra: number   // preço base de compra (referência)
  precoVenda: number    // preço base de venda (referência)
  categoria: 'vestuario' | 'acessorio'
  subcategoria: string
}

// ─── Variante de Produto (Tamanho × Cor) ─────────────────────────────────────
export interface ProdutoVariante {
  id: string
  produtoId: string
  tamanho: string       // PP / P / M / G / GG / GGG / Único
  cor: string           // Preto, Azul Marinho, etc.
  custoUnitario: number
  precoVenda: number
  estoque: number       // unidades em estoque
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
  tamanho?: string        // ex: PP / P / M / G / GG
  cor?: string            // ex: Preto, Azul Marinho
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
  tamanho?: string   // PP / P / M / G / GG / GGG / Único
  cor?: string       // cor da peça
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
  produtoId?: string      // link para Produto
  varianteId?: string     // link para ProdutoVariante
  tamanho: string         // tamanho específico desta compra
  cor: string             // cor específica desta compra
  bordado: string
  codigoBordado?: string  // link to Bordado.codigo (set when bordado is confirmed)
  // Legacy fields (kept for old data in localStorage)
  qtdPP?: number
  qtdP?: number
  qtdM?: number
  qtdG?: number
  qtdGG?: number
  qtdTotal: number        // quantidade total desta linha
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

// ─── Funcionário ─────────────────────────────────────────────────────────────
export interface Funcionario {
  id: string
  nome: string
  cargo: string
  foto?: string
  responsabilidades: string[]
  rotinas: string[]
  criadoEm: string
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
  limitePresenteDoacao?: number // limite mensal de presentes e doações
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

// ─── Manual de Processos ─────────────────────────────────────────────────────
export interface PassoManual {
  descricao: string
  dica?: string       // optional tip / warning
}

export interface ProcessoManual {
  id: string
  titulo: string      // e.g. "Abertura da loja"
  categoria: string   // e.g. "Atendimento", "Estoque", "Bordado"
  passos: PassoManual[]
  criadoEm: string
}

// ─── Presentes e Doações ─────────────────────────────────────────────────────
export interface LancamentoPD {
  id: string
  data: string            // YYYY-MM-DD
  tipo: 'presente' | 'doacao'
  descricao: string
  valor: number
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
  tamanho?: string
  cor?: string
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
  variantes: ProdutoVariante[]
  skus: SKU[]
  custosFixos: CustoFixo[]
  parametros: ParametrosFinanceiros
  mixProdutos: ItemMix[]
  funcionarios: Funcionario[]
  lancamentosPD: LancamentoPD[]
  processos: ProcessoManual[]

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

  // Variantes
  addVariante: (v: Omit<ProdutoVariante, 'id'>) => void
  updateVariante: (id: string, v: Partial<ProdutoVariante>) => void
  deleteVariante: (id: string) => void
  ajustarEstoque: (id: string, delta: number) => void

  // Eventos
  eventos: Evento[]
  addEvento: (e: Omit<Evento, 'id'>) => void
  updateEvento: (id: string, e: Partial<Evento>) => void
  deleteEvento: (id: string) => void

  // Movimentações de Caixa
  movimentacoes: MovimentacaoCaixa[]
  addMovimentacao: (m: Omit<MovimentacaoCaixa, 'id'>) => void
  deleteMovimentacao: (id: string) => void

  // Funcionários
  addFuncionario: (f: Omit<Funcionario, 'id'>) => void
  updateFuncionario: (id: string, f: Partial<Funcionario>) => void
  deleteFuncionario: (id: string) => void
  reorderFuncionarios: (ids: string[]) => void

  // Presentes e Doações
  addLancamentoPD: (l: Omit<LancamentoPD, 'id'>) => void
  deleteLancamentoPD: (id: string) => void

  // Processos (Manual)
  addProcesso: (p: Omit<ProcessoManual, 'id'>) => void
  updateProcesso: (id: string, p: Partial<ProcessoManual>) => void
  deleteProcesso: (id: string) => void
}
