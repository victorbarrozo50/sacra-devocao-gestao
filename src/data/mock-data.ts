import type {
  Bordado,
  Fornecedor,
  Produto,
  ProdutoVariante,
  SKU,
  Venda,
  Compra,
  CustoFixo,
  Cliente,
  ItemWishlist,
  CompraHistorico,
  ParametrosFinanceiros,
  ItemMix,
  DREMes,
  Evento,
  MovimentacaoCaixa,
  Funcionario,
} from '../types'

// ─── Bordados (top designs from RESUMO POR BORDADO) ─────────────────────────
export const mockBordados: Bordado[] = [
  { codigo: '7119', descricao: 'BORDADO APARECIDA', precoMedio: 15.97, quantidadeTotal: 70, valorTotal: 1118, percentualTotal: 8.28, percentualAcumulado: 8.28, curvaABC: 'A' },
  { codigo: '0201', descricao: 'BORDADO NOSSA SENHORA GRAÇAS', precoMedio: 18.20, quantidadeTotal: 55, valorTotal: 1001, percentualTotal: 7.41, percentualAcumulado: 15.69, curvaABC: 'A' },
  { codigo: '2414', descricao: 'BORDADO GUADALUPE FLORAL', precoMedio: 35.00, quantidadeTotal: 28, valorTotal: 980, percentualTotal: 7.26, percentualAcumulado: 22.95, curvaABC: 'A' },
  { codigo: '2624', descricao: 'BORDADO GUADALUPE G', precoMedio: 31.20, quantidadeTotal: 25, valorTotal: 780, percentualTotal: 5.78, percentualAcumulado: 28.73, curvaABC: 'A' },
  { codigo: '888', descricao: 'BORDADO NOSSA SENHORA FATIMA', precoMedio: 17.20, quantidadeTotal: 45, valorTotal: 774, percentualTotal: 5.73, percentualAcumulado: 34.46, curvaABC: 'A' },
  { codigo: '1102', descricao: 'BORDADO SAGRADO CORAÇÃO JESUS', precoMedio: 22.50, quantidadeTotal: 30, valorTotal: 675, percentualTotal: 5.00, percentualAcumulado: 39.46, curvaABC: 'A' },
  { codigo: '0305', descricao: 'BORDADO MEDALHA MILAGROSA', precoMedio: 14.80, quantidadeTotal: 40, valorTotal: 592, percentualTotal: 4.38, percentualAcumulado: 43.84, curvaABC: 'A' },
  { codigo: '3301', descricao: 'BORDADO SÃO FRANCISCO ASSIS', precoMedio: 19.60, quantidadeTotal: 28, valorTotal: 549, percentualTotal: 4.07, percentualAcumulado: 47.91, curvaABC: 'A' },
  { codigo: '4412', descricao: 'BORDADO NOSSA SENHORA CONCEIÇÃO', precoMedio: 21.00, quantidadeTotal: 24, valorTotal: 504, percentualTotal: 3.73, percentualAcumulado: 51.64, curvaABC: 'A' },
  { codigo: '2201', descricao: 'BORDADO DIVINO ESPÍRITO SANTO', precoMedio: 18.80, quantidadeTotal: 25, valorTotal: 470, percentualTotal: 3.48, percentualAcumulado: 55.12, curvaABC: 'A' },
  { codigo: '5501', descricao: 'BORDADO SÃO BENTO', precoMedio: 17.50, quantidadeTotal: 26, valorTotal: 455, percentualTotal: 3.37, percentualAcumulado: 58.49, curvaABC: 'A' },
  { codigo: '0901', descricao: 'BORDADO SANTA TERESINHA', precoMedio: 16.20, quantidadeTotal: 27, valorTotal: 437, percentualTotal: 3.24, percentualAcumulado: 61.73, curvaABC: 'A' },
  { codigo: '6601', descricao: 'BORDADO NOSSA SENHORA ROSÁRIO', precoMedio: 20.30, quantidadeTotal: 20, valorTotal: 406, percentualTotal: 3.01, percentualAcumulado: 64.74, curvaABC: 'A' },
  { codigo: '7701', descricao: 'BORDADO JESUS MISERICORDIOSO', precoMedio: 23.80, quantidadeTotal: 16, valorTotal: 381, percentualTotal: 2.82, percentualAcumulado: 67.56, curvaABC: 'A' },
  { codigo: '8801', descricao: 'BORDADO SANTA RITA CASSIA', precoMedio: 15.90, quantidadeTotal: 23, valorTotal: 366, percentualTotal: 2.71, percentualAcumulado: 70.27, curvaABC: 'A' },
  { codigo: '1201', descricao: 'BORDADO SÃO JUDAS TADEU', precoMedio: 18.10, quantidadeTotal: 19, valorTotal: 344, percentualTotal: 2.55, percentualAcumulado: 72.82, curvaABC: 'A' },
  { codigo: '0401', descricao: 'BORDADO CRUZ FLORES', precoMedio: 14.50, quantidadeTotal: 22, valorTotal: 319, percentualTotal: 2.36, percentualAcumulado: 75.18, curvaABC: 'A' },
  { codigo: '3201', descricao: 'BORDADO NOSSA SENHORA AUXILIADORA', precoMedio: 19.20, quantidadeTotal: 16, valorTotal: 307, percentualTotal: 2.27, percentualAcumulado: 77.45, curvaABC: 'A' },
  { codigo: '9901', descricao: 'BORDADO ANJO DA GUARDA', precoMedio: 16.80, quantidadeTotal: 18, valorTotal: 302, percentualTotal: 2.24, percentualAcumulado: 79.69, curvaABC: 'A' },
  { codigo: '4501', descricao: 'BORDADO SANTA LUZIA', precoMedio: 14.20, quantidadeTotal: 20, valorTotal: 284, percentualTotal: 2.10, percentualAcumulado: 81.79, curvaABC: 'B' },
  { codigo: '2301', descricao: 'BORDADO SÃO MIGUEL ARCANJO', precoMedio: 21.50, quantidadeTotal: 12, valorTotal: 258, percentualTotal: 1.91, percentualAcumulado: 83.70, curvaABC: 'B' },
  { codigo: '6201', descricao: 'BORDADO NOSSA SENHORA NAVEGANTES', precoMedio: 17.30, quantidadeTotal: 14, valorTotal: 242, percentualTotal: 1.79, percentualAcumulado: 85.49, curvaABC: 'B' },
  { codigo: '1401', descricao: 'BORDADO SÃO SEBASTIÃO', precoMedio: 15.60, quantidadeTotal: 15, valorTotal: 234, percentualTotal: 1.73, percentualAcumulado: 87.22, curvaABC: 'B' },
  { codigo: '7201', descricao: 'BORDADO NOSSA SENHORA LOURDES', precoMedio: 18.50, quantidadeTotal: 12, valorTotal: 222, percentualTotal: 1.64, percentualAcumulado: 88.86, curvaABC: 'B' },
  { codigo: '3401', descricao: 'BORDADO SÃO JOÃO BATISTA', precoMedio: 16.40, quantidadeTotal: 13, valorTotal: 213, percentualTotal: 1.58, percentualAcumulado: 90.44, curvaABC: 'B' },
  { codigo: '8201', descricao: 'BORDADO SANTA FILOMENA', precoMedio: 15.00, quantidadeTotal: 14, valorTotal: 210, percentualTotal: 1.55, percentualAcumulado: 91.99, curvaABC: 'B' },
  { codigo: '5301', descricao: 'BORDADO CORAÇÃO IMACULADO MARIA', precoMedio: 20.00, quantidadeTotal: 10, valorTotal: 200, percentualTotal: 1.48, percentualAcumulado: 93.47, curvaABC: 'B' },
  { codigo: '1601', descricao: 'BORDADO SÃO PEDRO', precoMedio: 17.80, quantidadeTotal: 11, valorTotal: 196, percentualTotal: 1.45, percentualAcumulado: 94.92, curvaABC: 'B' },
  { codigo: '0601', descricao: 'BORDADO SÃO PAULO APÓSTOLO', precoMedio: 16.90, quantidadeTotal: 11, valorTotal: 186, percentualTotal: 1.38, percentualAcumulado: 96.30, curvaABC: 'C' },
  { codigo: '4201', descricao: 'BORDADO SANTA CLARA', precoMedio: 14.00, quantidadeTotal: 12, valorTotal: 168, percentualTotal: 1.24, percentualAcumulado: 97.54, curvaABC: 'C' },
  { codigo: '7401', descricao: 'BORDADO SÃO DOMINGOS', precoMedio: 15.50, quantidadeTotal: 10, valorTotal: 155, percentualTotal: 1.15, percentualAcumulado: 98.69, curvaABC: 'C' },
  { codigo: '2101', descricao: 'BORDADO NOSSA SENHORA CARMO', precoMedio: 16.00, quantidadeTotal: 8, valorTotal: 128, percentualTotal: 0.95, percentualAcumulado: 99.64, curvaABC: 'C' },
  { codigo: '5801', descricao: 'BORDADO SÃO TOMÉ', precoMedio: 13.50, quantidadeTotal: 7, valorTotal: 95, percentualTotal: 0.36, percentualAcumulado: 100.00, curvaABC: 'C' },
]

// ─── Fornecedores ─────────────────────────────────────────────────────────────
export const mockFornecedores: Fornecedor[] = [
  { id: 'f1', nome: 'Bia Chacon', localizacao: 'Natal-RN', transportadora: 'Jadlog', cidade: 'Natal', estado: 'RN' },
  { id: 'f2', nome: 'Larissa / Modelar', localizacao: 'Natal-RN', transportadora: 'Jadlog', cidade: 'Natal', estado: 'RN' },
  { id: 'f3', nome: 'Lessi', localizacao: 'São Paulo-SP', transportadora: 'Correios PAC', cidade: 'São Paulo', estado: 'SP' },
  { id: 'f4', nome: 'RS Bags', localizacao: 'Natal-RN', transportadora: 'Motoboy', cidade: 'Natal', estado: 'RN' },
  { id: 'f5', nome: 'Lomani', localizacao: 'Pernambuco-PE', transportadora: 'Correios PAC', cidade: 'Recife', estado: 'PE' },
  { id: 'f6', nome: 'Audrey', localizacao: 'São Paulo-SP', transportadora: 'Jadlog', cidade: 'São Paulo', estado: 'SP' },
  { id: 'f7', nome: 'Vankoke', localizacao: 'Natal-RN', transportadora: 'Motoboy', cidade: 'Natal', estado: 'RN' },
  { id: 'f8', nome: 'PB Resinas', localizacao: 'Natal-RN', transportadora: 'Motoboy', cidade: 'Natal', estado: 'RN' },
]

// ─── Produtos ─────────────────────────────────────────────────────────────────
export const mockProdutos: Produto[] = [
  { id: 'p1', fornecedorId: 'f1', fornecedorNome: 'Bia Chacon', descricao: 'Tricoline manga curta', precoCompra: 60, precoVenda: 210, categoria: 'vestuario', subcategoria: 'Camisas' },
  { id: 'p2', fornecedorId: 'f1', fornecedorNome: 'Bia Chacon', descricao: 'Colete linho', precoCompra: 90, precoVenda: 370, categoria: 'vestuario', subcategoria: 'Coletes' },
  { id: 'p3', fornecedorId: 'f1', fornecedorNome: 'Bia Chacon', descricao: 'Camisa social linho', precoCompra: 75, precoVenda: 279, categoria: 'vestuario', subcategoria: 'Camisas' },
  { id: 'p4', fornecedorId: 'f2', fornecedorNome: 'Larissa / Modelar', descricao: 'T-shirt viscolycra', precoCompra: 31.90, precoVenda: 135, categoria: 'vestuario', subcategoria: 'T-shirts' },
  { id: 'p5', fornecedorId: 'f2', fornecedorNome: 'Larissa / Modelar', descricao: 'Camisa social masculina', precoCompra: 54, precoVenda: 190, categoria: 'vestuario', subcategoria: 'Camisas' },
  { id: 'p6', fornecedorId: 'f2', fornecedorNome: 'Larissa / Modelar', descricao: 'Regata feminina', precoCompra: 28, precoVenda: 90, categoria: 'vestuario', subcategoria: 'Regatas' },
  { id: 'p7', fornecedorId: 'f3', fornecedorNome: 'Lessi', descricao: 'Blusa de seda', precoCompra: 95, precoVenda: 280, categoria: 'vestuario', subcategoria: 'Blusas' },
  { id: 'p8', fornecedorId: 'f3', fornecedorNome: 'Lessi', descricao: 'Blazer linho feminino', precoCompra: 160, precoVenda: 360, categoria: 'vestuario', subcategoria: 'Blazers' },
  { id: 'p9', fornecedorId: 'f3', fornecedorNome: 'Lessi', descricao: 'Blusa tricoline', precoCompra: 80, precoVenda: 220, categoria: 'vestuario', subcategoria: 'Blusas' },
  { id: 'p10', fornecedorId: 'f4', fornecedorNome: 'RS Bags', descricao: 'Bolsa couro sintético', precoCompra: 55, precoVenda: 150, categoria: 'acessorio', subcategoria: 'Bolsas' },
  { id: 'p11', fornecedorId: 'f4', fornecedorNome: 'RS Bags', descricao: 'Necessaire bordada', precoCompra: 30, precoVenda: 85, categoria: 'acessorio', subcategoria: 'Necessaires' },
  { id: 'p12', fornecedorId: 'f4', fornecedorNome: 'RS Bags', descricao: 'Case porta óculos', precoCompra: 22, precoVenda: 65, categoria: 'acessorio', subcategoria: 'Acessórios' },
  { id: 'p13', fornecedorId: 'f5', fornecedorNome: 'Lomani', descricao: 'T-shirt algodão premium', precoCompra: 38, precoVenda: 115, categoria: 'vestuario', subcategoria: 'T-shirts' },
  { id: 'p14', fornecedorId: 'f5', fornecedorNome: 'Lomani', descricao: 'Regata algodão', precoCompra: 25, precoVenda: 80, categoria: 'vestuario', subcategoria: 'Regatas' },
]

// ─── Variantes (Tamanho × Cor) ───────────────────────────────────────────────
export const mockVariantes: ProdutoVariante[] = [
  // T-shirt viscolycra (p4)
  { id: 'var1',  produtoId: 'p4', tamanho: 'PP', cor: 'Preto',       custoUnitario: 31.90, precoVenda: 135, estoque: 8 },
  { id: 'var2',  produtoId: 'p4', tamanho: 'PP', cor: 'Branco',      custoUnitario: 31.90, precoVenda: 135, estoque: 5 },
  { id: 'var3',  produtoId: 'p4', tamanho: 'P',  cor: 'Preto',       custoUnitario: 31.90, precoVenda: 135, estoque: 12 },
  { id: 'var4',  produtoId: 'p4', tamanho: 'P',  cor: 'Branco',      custoUnitario: 31.90, precoVenda: 135, estoque: 9 },
  { id: 'var5',  produtoId: 'p4', tamanho: 'M',  cor: 'Preto',       custoUnitario: 31.90, precoVenda: 135, estoque: 15 },
  { id: 'var6',  produtoId: 'p4', tamanho: 'M',  cor: 'Branco',      custoUnitario: 31.90, precoVenda: 135, estoque: 11 },
  { id: 'var7',  produtoId: 'p4', tamanho: 'G',  cor: 'Preto',       custoUnitario: 31.90, precoVenda: 135, estoque: 7 },
  { id: 'var8',  produtoId: 'p4', tamanho: 'G',  cor: 'Azul Marinho', custoUnitario: 31.90, precoVenda: 135, estoque: 4 },
  { id: 'var9',  produtoId: 'p4', tamanho: 'GG', cor: 'Preto',       custoUnitario: 31.90, precoVenda: 135, estoque: 0 },
  // Blusa de seda (p7)
  { id: 'var10', produtoId: 'p7', tamanho: 'P',  cor: 'Rosa',        custoUnitario: 95, precoVenda: 280, estoque: 3 },
  { id: 'var11', produtoId: 'p7', tamanho: 'M',  cor: 'Rosa',        custoUnitario: 95, precoVenda: 280, estoque: 6 },
  { id: 'var12', produtoId: 'p7', tamanho: 'M',  cor: 'Vinho',       custoUnitario: 95, precoVenda: 280, estoque: 4 },
  { id: 'var13', produtoId: 'p7', tamanho: 'G',  cor: 'Vinho',       custoUnitario: 95, precoVenda: 280, estoque: 2 },
  // Regata feminina (p6)
  { id: 'var14', produtoId: 'p6', tamanho: 'PP', cor: 'Branco',      custoUnitario: 28, precoVenda: 90, estoque: 10 },
  { id: 'var15', produtoId: 'p6', tamanho: 'P',  cor: 'Branco',      custoUnitario: 28, precoVenda: 90, estoque: 8 },
  { id: 'var16', produtoId: 'p6', tamanho: 'M',  cor: 'Bege',        custoUnitario: 28, precoVenda: 90, estoque: 5 },
  { id: 'var17', produtoId: 'p6', tamanho: 'G',  cor: 'Bege',        custoUnitario: 28, precoVenda: 90, estoque: 0 },
]

// ─── SKUs (Base de Dados) ────────────────────────────────────────────────────
export const mockSKUs: SKU[] = [
  { id: 's1', fornecedor: 'Bia Chacon', produto: 'Tricoline manga curta', valorUnitario: 60, origem: 'Natal-RN', transportadora: 'Jadlog', bordado: 'BORDADO APARECIDA', precoMedio: 15.97, precoVenda: 210, margem: 55 },
  { id: 's2', fornecedor: 'Bia Chacon', produto: 'Tricoline manga curta', valorUnitario: 60, origem: 'Natal-RN', transportadora: 'Jadlog', bordado: 'BORDADO NOSSA SENHORA GRAÇAS', precoMedio: 18.20, precoVenda: 210, margem: 52 },
  { id: 's3', fornecedor: 'Larissa / Modelar', produto: 'T-shirt viscolycra', valorUnitario: 31.90, origem: 'Natal-RN', transportadora: 'Jadlog', bordado: 'BORDADO GUADALUPE FLORAL', precoMedio: 35.00, precoVenda: 135, margem: 52 },
  { id: 's4', fornecedor: 'Lomani', produto: 'T-shirt algodão premium', valorUnitario: 38, origem: 'Pernambuco-PE', transportadora: 'Correios PAC', bordado: 'BORDADO APARECIDA', precoMedio: 15.97, precoVenda: 115, margem: 52 },
  { id: 's5', fornecedor: 'Lessi', produto: 'Blusa tricoline', valorUnitario: 80, origem: 'São Paulo-SP', transportadora: 'Correios PAC', bordado: 'BORDADO GUADALUPE G', precoMedio: 31.20, precoVenda: 220, margem: 41 },
  { id: 's6', fornecedor: 'Lessi', produto: 'Blazer linho feminino', valorUnitario: 160, origem: 'São Paulo-SP', transportadora: 'Correios PAC', bordado: 'BORDADO NOSSA SENHORA FATIMA', precoMedio: 17.20, precoVenda: 360, margem: 44 },
  { id: 's7', fornecedor: 'RS Bags', produto: 'Bolsa couro sintético', valorUnitario: 55, origem: 'Natal-RN', transportadora: 'Motoboy', bordado: 'BORDADO APARECIDA', precoMedio: 15.97, precoVenda: 150, margem: 52 },
  { id: 's8', fornecedor: 'RS Bags', produto: 'Necessaire bordada', valorUnitario: 30, origem: 'Natal-RN', transportadora: 'Motoboy', bordado: 'BORDADO MEDALHA MILAGROSA', precoMedio: 14.80, precoVenda: 85, margem: 54 },
]

// ─── Vendas (histórico) ──────────────────────────────────────────────────────
export const mockVendas: Venda[] = [
  { id: 'v1', data: '2026-06-01', documento: '45.863', codigoBordado: '7119', descricaoBordado: 'BORDADO APARECIDA', produto: 'Tricoline manga curta', quantidade: 29, precoUnitario: 210, total: 6090, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'v2', data: '2026-06-02', documento: '45.864', codigoBordado: '0201', descricaoBordado: 'BORDADO NOSSA SENHORA GRAÇAS', produto: 'T-shirt viscolycra', quantidade: 15, precoUnitario: 135, total: 2025, canal: 'atacado', formaPagamento: 'pix' },
  { id: 'v3', data: '2026-06-03', documento: '45.865', codigoBordado: '2414', descricaoBordado: 'BORDADO GUADALUPE FLORAL', produto: 'Blusa tricoline', quantidade: 8, precoUnitario: 220, total: 1760, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'v4', data: '2026-06-05', documento: '45.866', codigoBordado: '888', descricaoBordado: 'BORDADO NOSSA SENHORA FATIMA', produto: 'Blazer linho feminino', quantidade: 5, precoUnitario: 360, total: 1800, canal: 'varejo', formaPagamento: 'dinheiro' },
  { id: 'v5', data: '2026-06-08', documento: '45.867', codigoBordado: '2624', descricaoBordado: 'BORDADO GUADALUPE G', produto: 'Bolsa couro sintético', quantidade: 12, precoUnitario: 150, total: 1800, canal: 'atacado', formaPagamento: 'pix' },
  { id: 'v6', data: '2026-06-10', documento: '45.868', codigoBordado: '1102', descricaoBordado: 'BORDADO SAGRADO CORAÇÃO JESUS', produto: 'Tricoline manga curta', quantidade: 20, precoUnitario: 210, total: 4200, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'v7', data: '2026-06-12', documento: '45.869', codigoBordado: '0305', descricaoBordado: 'BORDADO MEDALHA MILAGROSA', produto: 'Necessaire bordada', quantidade: 25, precoUnitario: 85, total: 2125, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'v8', data: '2026-06-15', documento: '45.870', codigoBordado: '7119', descricaoBordado: 'BORDADO APARECIDA', produto: 'T-shirt algodão premium', quantidade: 18, precoUnitario: 115, total: 2070, canal: 'varejo', formaPagamento: 'pix' },
  { id: 'v9', data: '2026-06-18', documento: '45.871', codigoBordado: '4412', descricaoBordado: 'BORDADO NOSSA SENHORA CONCEIÇÃO', produto: 'Regata feminina', quantidade: 22, precoUnitario: 90, total: 1980, canal: 'atacado', formaPagamento: 'pix' },
  { id: 'v10', data: '2026-06-20', documento: '45.872', codigoBordado: '5501', descricaoBordado: 'BORDADO SÃO BENTO', produto: 'T-shirt viscolycra', quantidade: 10, precoUnitario: 135, total: 1350, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'v11', data: '2026-06-22', documento: '45.873', codigoBordado: '3301', descricaoBordado: 'BORDADO SÃO FRANCISCO ASSIS', produto: 'Blusa de seda', quantidade: 6, precoUnitario: 280, total: 1680, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'v12', data: '2026-06-25', documento: '45.874', codigoBordado: '2201', descricaoBordado: 'BORDADO DIVINO ESPÍRITO SANTO', produto: 'Tricoline manga curta', quantidade: 14, precoUnitario: 210, total: 2940, canal: 'varejo', formaPagamento: 'dinheiro' },
  { id: 'v13', data: '2026-06-28', documento: '45.875', codigoBordado: '7701', descricaoBordado: 'BORDADO JESUS MISERICORDIOSO', produto: 'Blusa tricoline', quantidade: 7, precoUnitario: 220, total: 1540, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'v14', data: '2026-07-02', documento: '45.876', codigoBordado: '7119', descricaoBordado: 'BORDADO APARECIDA', produto: 'Bolsa couro sintético', quantidade: 20, precoUnitario: 150, total: 3000, canal: 'atacado', formaPagamento: 'pix' },
  { id: 'v15', data: '2026-07-05', documento: '45.877', codigoBordado: '0901', descricaoBordado: 'BORDADO SANTA TERESINHA', produto: 'T-shirt algodão premium', quantidade: 15, precoUnitario: 115, total: 1725, canal: 'varejo', formaPagamento: 'cartao' },
]

// ─── Compras ──────────────────────────────────────────────────────────────────
export const mockCompras: Compra[] = [
  {
    id: 'c1', dataPedido: '2026-06-01', fornecedor: 'Bia Chacon', produto: 'Tricoline manga curta',
    tamanho: 'M', cor: 'Branco',
    bordado: 'BORDADO APARECIDA', qtdTotal: 45,
    precoUnitario: 60, valorTotal: 2700, custoBordado: 15.97, frete: 180, status: 'concluido',
    dataEntregaProduto: '2026-06-14', dataEntregaBordado: '2026-06-20',
    leadTimeProduto: 13, leadTimeBordado: 6, observacoes: '', adicionadoAoEstoque: true,
  },
  {
    id: 'c2', dataPedido: '2026-06-10', fornecedor: 'Lomani', produto: 'T-shirt algodão premium',
    tamanho: 'G', cor: 'Preto',
    bordado: 'BORDADO NOSSA SENHORA GRAÇAS', qtdTotal: 60,
    precoUnitario: 38, valorTotal: 2280, custoBordado: 18.20, frete: 120, status: 'concluido',
    dataEntregaProduto: '2026-06-20', dataEntregaBordado: '2026-06-28',
    leadTimeProduto: 10, leadTimeBordado: 8, observacoes: '', adicionadoAoEstoque: true,
  },
  {
    id: 'c7', dataPedido: '2026-05-10', fornecedor: 'Lessi', produto: 'Blusa de seda',
    tamanho: 'M', cor: 'Rosa',
    bordado: 'BORDADO JESUS MISERICORDIOSO', qtdTotal: 20,
    precoUnitario: 95, valorTotal: 1900, custoBordado: 22.00, frete: 90, status: 'concluido',
    dataEntregaProduto: '2026-05-22', dataEntregaBordado: '2026-05-30',
    leadTimeProduto: 12, leadTimeBordado: 8, observacoes: '', adicionadoAoEstoque: true,
  },
  {
    id: 'c8', dataPedido: '2026-05-20', fornecedor: 'Larissa / Modelar', produto: 'Regata feminina',
    tamanho: 'P', cor: 'Branco',
    bordado: 'BORDADO SANTA TERESINHA', qtdTotal: 30,
    precoUnitario: 28, valorTotal: 840, custoBordado: 12.50, frete: 60, status: 'concluido',
    dataEntregaProduto: '2026-05-30', dataEntregaBordado: '2026-06-05',
    leadTimeProduto: 10, leadTimeBordado: 6, observacoes: '', adicionadoAoEstoque: true,
  },
  {
    id: 'c9', dataPedido: '2026-04-15', fornecedor: 'Larissa / Modelar', produto: 'T-shirt viscolycra',
    tamanho: 'M', cor: 'Preto',
    bordado: 'BORDADO APARECIDA', qtdTotal: 50,
    precoUnitario: 31.90, valorTotal: 1595, custoBordado: 15.97, frete: 100, status: 'concluido',
    dataEntregaProduto: '2026-04-25', dataEntregaBordado: '2026-05-02',
    leadTimeProduto: 10, leadTimeBordado: 7, observacoes: '', adicionadoAoEstoque: true,
  },
  {
    id: 'c3', dataPedido: '2026-06-20', fornecedor: 'Lessi', produto: 'Blazer linho feminino',
    tamanho: 'P', cor: 'Bege',
    bordado: 'BORDADO GUADALUPE FLORAL', qtdTotal: 18,
    precoUnitario: 160, valorTotal: 2880, status: 'produto_recebido',
    dataEntregaProduto: '2026-07-02', leadTimeProduto: 12, observacoes: 'Bordado agendado para 10/07',
  },
  {
    id: 'c4', dataPedido: '2026-07-01', fornecedor: 'RS Bags', produto: 'Bolsa couro sintético',
    tamanho: 'Único', cor: 'Preto',
    bordado: 'BORDADO APARECIDA', qtdTotal: 25,
    precoUnitario: 55, valorTotal: 1375, status: 'bordado_em_andamento',
    dataEntregaProduto: '2026-07-07', leadTimeProduto: 6, observacoes: '',
  },
  {
    id: 'c5', dataPedido: '2026-07-05', fornecedor: 'Larissa / Modelar', produto: 'T-shirt viscolycra',
    tamanho: 'M', cor: 'Azul Marinho',
    bordado: 'BORDADO SAGRADO CORAÇÃO JESUS', qtdTotal: 70,
    precoUnitario: 31.90, valorTotal: 2233, status: 'compra_solicitada',
    observacoes: 'Aguardando confirmação do fornecedor',
  },
  {
    id: 'c6', dataPedido: '2026-07-10', fornecedor: 'Bia Chacon', produto: 'Tricoline manga curta',
    tamanho: 'PP', cor: 'Rosa',
    bordado: 'BORDADO NOSSA SENHORA FATIMA', qtdTotal: 45,
    precoUnitario: 60, valorTotal: 2700, status: 'aguardando',
    observacoes: '',
  },
]

// ─── Custos Fixos ─────────────────────────────────────────────────────────────
export const mockCustosFixos: CustoFixo[] = [
  { id: 'cf1', categoria: 'Aluguel', descricao: 'Sala 1 + Sala 2', valor: 1800.00 },
  { id: 'cf2', categoria: 'Aluguel', descricao: 'Água / IPTU', valor: 515.90 },
  { id: 'cf3', categoria: 'Energia', descricao: 'Energia elétrica', valor: 439.80 },
  { id: 'cf4', categoria: 'Pessoal', descricao: 'Salário Marília', valor: 1621.00 },
  { id: 'cf5', categoria: 'Pessoal', descricao: 'Salário Lis', valor: 1621.00 },
  { id: 'cf6', categoria: 'Pessoal', descricao: 'Salário Rana', valor: 810.50 },
  { id: 'cf7', categoria: 'Encargos', descricao: 'INSS + FGTS + benefícios', valor: 500.80 },
  { id: 'cf8', categoria: 'Operacional', descricao: 'MEI / DAS', valor: 75.90 },
  { id: 'cf9', categoria: 'Operacional', descricao: 'Telefone + Internet', valor: 189.90 },
  { id: 'cf10', categoria: 'Operacional', descricao: 'Material de escritório', valor: 120.00 },
  { id: 'cf11', categoria: 'Operacional', descricao: 'Sistema / Software', valor: 89.90 },
  { id: 'cf12', categoria: 'Marketing', descricao: 'Redes sociais + impulsionamento', valor: 300.00 },
]

// ─── Parâmetros Financeiros ───────────────────────────────────────────────────
export const mockParametros: ParametrosFinanceiros = {
  comissaoVarejo: 0.03,
  comissaoAtacado: 0.015,
  taxaCartao: 0.05,
  percentualCartao: 0.70,
  descontoAtacadoCartao: 0.30,
  descontoAtacadoVista: 0.35,
  despesaVariavel: 0.02,
  embalagem: {
    pequena: 4.00,
    media: 4.00,
    grande: 4.00,
  },
  etiquetas: 0.225,
  materiais: 0.125,
}

// ─── Mix de Produtos ─────────────────────────────────────────────────────────
export const mockMixProdutos: ItemMix[] = [
  { id: 'm1', produto: 'T-shirt algodão', fornecedor: 'Lomani', quantidade: 40, precoVenda: 115, custoCompra: 38, custoBordado: 16, custoEmbalagem: 3.20, margemContribuicao: 57.80, margemPercent: 50.3, faturamento: 4600 },
  { id: 'm2', produto: 'Regata', fornecedor: 'Lomani', quantidade: 25, precoVenda: 90, custoCompra: 25, custoBordado: 14.5, custoEmbalagem: 2.70, margemContribuicao: 47.80, margemPercent: 53.1, faturamento: 2250 },
  { id: 'm3', produto: 'T-shirt viscolycra', fornecedor: 'Larissa', quantidade: 30, precoVenda: 135, custoCompra: 31.90, custoBordado: 18, custoEmbalagem: 3.20, margemContribuicao: 81.90, margemPercent: 60.7, faturamento: 4050 },
  { id: 'm4', produto: 'Blusa tricoline', fornecedor: 'Lessi', quantidade: 15, precoVenda: 220, custoCompra: 80, custoBordado: 20, custoEmbalagem: 3.20, margemContribuicao: 116.80, margemPercent: 53.1, faturamento: 3300 },
  { id: 'm5', produto: 'Blazer linho', fornecedor: 'Lessi', quantidade: 8, precoVenda: 360, custoCompra: 160, custoBordado: 17.50, custoEmbalagem: 4.00, margemContribuicao: 178.50, margemPercent: 49.6, faturamento: 2880 },
  { id: 'm6', produto: 'Tricoline manga curta', fornecedor: 'Bia Chacon', quantidade: 12, precoVenda: 210, custoCompra: 60, custoBordado: 16, custoEmbalagem: 3.20, margemContribuicao: 130.80, margemPercent: 62.3, faturamento: 2520 },
  { id: 'm7', produto: 'Bolsa couro', fornecedor: 'RS Bags', quantidade: 20, precoVenda: 150, custoCompra: 55, custoBordado: 16, custoEmbalagem: 3.20, margemContribuicao: 75.80, margemPercent: 50.5, faturamento: 3000 },
  { id: 'm8', produto: 'Necessaire', fornecedor: 'RS Bags', quantidade: 15, precoVenda: 85, custoCompra: 30, custoBordado: 14.80, custoEmbalagem: 2.70, margemContribuicao: 37.50, margemPercent: 44.1, faturamento: 1275 },
]

// ─── DRE Meses ────────────────────────────────────────────────────────────────
export const mockDREMeses: DREMes[] = [
  { mes: 'Jan/26', receitaBruta: 18500, deducoes: 1480, receitaLiquida: 17020, custoVariavel: 8750, margemContribuicao: 8270, custoFixo: 9085, lucroOperacional: -815, margemPercent: -4.8 },
  { mes: 'Fev/26', receitaBruta: 19200, deducoes: 1536, receitaLiquida: 17664, custoVariavel: 9050, margemContribuicao: 8614, custoFixo: 9085, lucroOperacional: -471, margemPercent: -2.7 },
  { mes: 'Mar/26', receitaBruta: 21500, deducoes: 1720, receitaLiquida: 19780, custoVariavel: 10100, margemContribuicao: 9680, custoFixo: 9085, lucroOperacional: 595, margemPercent: 3.0 },
  { mes: 'Abr/26', receitaBruta: 22800, deducoes: 1824, receitaLiquida: 20976, custoVariavel: 10700, margemContribuicao: 10276, custoFixo: 9085, lucroOperacional: 1191, margemPercent: 5.7 },
  { mes: 'Mai/26', receitaBruta: 26500, deducoes: 2120, receitaLiquida: 24380, custoVariavel: 12400, margemContribuicao: 11980, custoFixo: 9085, lucroOperacional: 2895, margemPercent: 11.9 },
  { mes: 'Jun/26', receitaBruta: 23875, deducoes: 1910, receitaLiquida: 21965, custoVariavel: 11200, margemContribuicao: 10765, custoFixo: 9085, lucroOperacional: 1680, margemPercent: 7.6 },
]

// ─── Clientes (CRM) ──────────────────────────────────────────────────────────
export const mockClientes: Cliente[] = [
  { id: 'cli1', nome: 'Maria das Graças Oliveira', telefone: '(84) 98877-6655', email: 'maria.gracas@gmail.com', cidade: 'Natal', estado: 'RN', canal: 'varejo', segmento: 'Devoção pessoal', observacoes: 'Cliente fiel desde 2024. Prefere peças com Nossa Senhora.', criadoEm: '2024-03-10' },
  { id: 'cli2', nome: 'Igreja Nossa Senhora Aparecida', telefone: '(84) 3211-5544', email: 'secretaria@nsa-natal.com.br', cidade: 'Natal', estado: 'RN', canal: 'atacado', segmento: 'Igreja', observacoes: 'Compra lotes para festas e eventos litúrgicos. Pagamento via PIX.', criadoEm: '2024-01-15' },
  { id: 'cli3', nome: 'Ana Paula Ferreira', telefone: '(84) 99111-2233', email: 'anapaula.f@hotmail.com', cidade: 'Parnamirim', estado: 'RN', canal: 'varejo', segmento: 'Presente', observacoes: 'Compra geralmente para presentear família.', criadoEm: '2024-06-22' },
  { id: 'cli4', nome: 'Loja Artigos Católicos São Bento', telefone: '(84) 3322-1100', email: 'contato@saobento-natal.com.br', cidade: 'Natal', estado: 'RN', canal: 'atacado', segmento: 'Loja', observacoes: 'Revende para clientes da loja. Desconto atacado à vista.', criadoEm: '2024-05-08' },
  { id: 'cli5', nome: 'Josiane Cavalcanti', telefone: '(84) 98555-7788', email: undefined, cidade: 'Mossoró', estado: 'RN', canal: 'varejo', segmento: 'Devoção pessoal', observacoes: 'Pedidos por WhatsApp. Gosta de receber novidades de bordados novos.', criadoEm: '2025-01-30' },
  { id: 'cli6', nome: 'Comunidade Santa Teresinha', telefone: '(84) 98200-3344', email: 'comunidade@stteresinha.org', cidade: 'São Gonçalo do Amarante', estado: 'RN', canal: 'atacado', segmento: 'Igreja', observacoes: 'Compras para grupo de jovens da paróquia.', criadoEm: '2025-03-12' },
  { id: 'cli7', nome: 'Fernanda Souza Lima', telefone: '(84) 99966-1122', email: 'fernanda.lima@yahoo.com', cidade: 'Natal', estado: 'RN', canal: 'varejo', segmento: 'Presente', observacoes: 'Compra camisas para os filhos. Tamanho preferido: P e M.', criadoEm: '2025-05-18' },
  { id: 'cli8', nome: 'Grupo de Oração Divino Amor', telefone: '(84) 98433-9900', email: undefined, cidade: 'Ceará-Mirim', estado: 'RN', canal: 'ambos', segmento: 'Igreja', observacoes: 'Misto de compras pessoais e em grupo. Líderes compram atacado.', criadoEm: '2025-07-05' },
  { id: 'cli9', nome: 'Renata Cristina Barros', telefone: '(84) 99700-4455', email: 'renata.barros@gmail.com', cidade: 'Natal', estado: 'RN', canal: 'varejo', segmento: 'Devoção pessoal', observacoes: 'Muito ativa nas redes. Indica a loja para amigas.', criadoEm: '2025-08-20' },
  { id: 'cli10', nome: 'Paróquia São Francisco de Assis', telefone: '(84) 3213-8877', email: 'paroquia.sfrancisco@diocese.org.br', cidade: 'Natal', estado: 'RN', canal: 'atacado', segmento: 'Igreja', observacoes: 'Pedidos mensais. Paga com NF. Prefere entrega pessoal.', criadoEm: '2024-09-01' },
]

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const mockWishlist: ItemWishlist[] = [
  { id: 'w1', clienteId: 'cli1', bordado: 'BORDADO NOSSA SENHORA GRAÇAS', produto: 'Blusa tricoline', tamanho: 'M', notas: 'Quer ser avisada assim que chegar nova remessa', criadoEm: '2026-06-15' },
  { id: 'w2', clienteId: 'cli1', bordado: 'BORDADO NOSSA SENHORA FATIMA', produto: 'Blazer linho feminino', tamanho: 'P', notas: 'Aguarda preço especial', criadoEm: '2026-07-01' },
  { id: 'w3', clienteId: 'cli2', bordado: 'BORDADO APARECIDA', produto: 'T-shirt algodão', tamanho: 'G', notas: 'Precisa de 20 unidades para festa de outubro', criadoEm: '2026-06-20' },
  { id: 'w4', clienteId: 'cli3', bordado: 'BORDADO MEDALHA MILAGROSA', produto: 'Necessaire bordada', tamanho: undefined, notas: 'Para dar de presente para a mãe no Natal', criadoEm: '2026-07-10' },
  { id: 'w5', clienteId: 'cli5', bordado: 'BORDADO SAGRADO CORAÇÃO JESUS', produto: 'T-shirt viscolycra', tamanho: 'M', notas: 'Quer receber foto quando chegar', criadoEm: '2026-07-15' },
  { id: 'w6', clienteId: 'cli7', bordado: 'BORDADO SÃO BENTO', produto: 'Tricoline manga curta', tamanho: 'P', notas: 'Para o filho adolescente', criadoEm: '2026-07-20' },
  { id: 'w7', clienteId: 'cli7', bordado: 'BORDADO ANJO DA GUARDA', produto: 'T-shirt algodão', tamanho: 'M', notas: 'Para o filho mais novo', criadoEm: '2026-07-20' },
  { id: 'w8', clienteId: 'cli9', bordado: 'BORDADO GUADALUPE FLORAL', produto: 'Blusa tricoline', tamanho: 'P', notas: 'Esperando estampa nova da Guadalupe', criadoEm: '2026-08-01' },
  { id: 'w9', clienteId: 'cli6', bordado: 'BORDADO JESUS MISERICORDIOSO', produto: 'T-shirt algodão', tamanho: undefined, notas: 'Precisa de 30 unidades para retiro de jovens', criadoEm: '2026-07-28' },
  { id: 'w10', clienteId: 'cli4', bordado: 'BORDADO SÃO FRANCISCO ASSIS', produto: 'Bolsa couro sintético', tamanho: undefined, notas: 'Repor estoque da loja — pelo menos 10 unidades', criadoEm: '2026-07-25' },
]

// ─── Histórico de Compras por Cliente ────────────────────────────────────────
export const mockComprasHistorico: CompraHistorico[] = [
  { id: 'ch1', clienteId: 'cli1', data: '2026-06-01', descricaoBordado: 'BORDADO APARECIDA', produto: 'Tricoline manga curta', quantidade: 2, precoUnitario: 210, total: 420, canal: 'varejo', formaPagamento: 'pix' },
  { id: 'ch2', clienteId: 'cli1', data: '2026-03-15', descricaoBordado: 'BORDADO NOSSA SENHORA GRAÇAS', produto: 'T-shirt viscolycra', quantidade: 1, precoUnitario: 135, total: 135, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'ch3', clienteId: 'cli1', data: '2025-12-10', descricaoBordado: 'BORDADO MEDALHA MILAGROSA', produto: 'Necessaire bordada', quantidade: 3, precoUnitario: 85, total: 255, canal: 'varejo', formaPagamento: 'dinheiro' },
  { id: 'ch4', clienteId: 'cli2', data: '2026-06-02', descricaoBordado: 'BORDADO NOSSA SENHORA GRAÇAS', produto: 'T-shirt viscolycra', quantidade: 15, precoUnitario: 94.50, total: 1417.50, canal: 'atacado', formaPagamento: 'pix' },
  { id: 'ch5', clienteId: 'cli2', data: '2026-04-10', descricaoBordado: 'BORDADO APARECIDA', produto: 'Tricoline manga curta', quantidade: 20, precoUnitario: 147, total: 2940, canal: 'atacado', formaPagamento: 'pix' },
  { id: 'ch6', clienteId: 'cli3', data: '2026-06-03', descricaoBordado: 'BORDADO GUADALUPE FLORAL', produto: 'Blusa tricoline', quantidade: 1, precoUnitario: 220, total: 220, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'ch7', clienteId: 'cli4', data: '2026-06-08', descricaoBordado: 'BORDADO GUADALUPE G', produto: 'Bolsa couro sintético', quantidade: 12, precoUnitario: 105, total: 1260, canal: 'atacado', formaPagamento: 'pix' },
  { id: 'ch8', clienteId: 'cli4', data: '2026-05-20', descricaoBordado: 'BORDADO NOSSA SENHORA FATIMA', produto: 'Blazer linho feminino', quantidade: 5, precoUnitario: 252, total: 1260, canal: 'atacado', formaPagamento: 'cartao' },
  { id: 'ch9', clienteId: 'cli5', data: '2026-07-02', descricaoBordado: 'BORDADO APARECIDA', produto: 'Bolsa couro sintético', quantidade: 1, precoUnitario: 150, total: 150, canal: 'varejo', formaPagamento: 'pix' },
  { id: 'ch10', clienteId: 'cli6', data: '2026-07-05', descricaoBordado: 'BORDADO SANTA TERESINHA', produto: 'T-shirt algodão premium', quantidade: 10, precoUnitario: 80.50, total: 805, canal: 'atacado', formaPagamento: 'pix' },
  { id: 'ch11', clienteId: 'cli7', data: '2026-06-12', descricaoBordado: 'BORDADO MEDALHA MILAGROSA', produto: 'Necessaire bordada', quantidade: 2, precoUnitario: 85, total: 170, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'ch12', clienteId: 'cli8', data: '2026-06-20', descricaoBordado: 'BORDADO DIVINO ESPÍRITO SANTO', produto: 'T-shirt viscolycra', quantidade: 8, precoUnitario: 135, total: 1080, canal: 'ambos' as any, formaPagamento: 'pix' },
  { id: 'ch13', clienteId: 'cli9', data: '2026-07-15', descricaoBordado: 'BORDADO NOSSA SENHORA CONCEIÇÃO', produto: 'Regata feminina', quantidade: 1, precoUnitario: 90, total: 90, canal: 'varejo', formaPagamento: 'cartao' },
  { id: 'ch14', clienteId: 'cli10', data: '2026-06-25', descricaoBordado: 'BORDADO SÃO FRANCISCO ASSIS', produto: 'Tricoline manga curta', quantidade: 18, precoUnitario: 147, total: 2646, canal: 'atacado', formaPagamento: 'pix' },
  { id: 'ch15', clienteId: 'cli10', data: '2026-05-01', descricaoBordado: 'BORDADO SAGRADO CORAÇÃO JESUS', produto: 'Tricoline manga curta', quantidade: 12, precoUnitario: 147, total: 1764, canal: 'atacado', formaPagamento: 'pix' },
]

// ─── Eventos 2026 ─────────────────────────────────────────────────────────────
export const mockEventos: Evento[] = [
  // Passados
  { id: 'ev01', nome: 'Ano Novo', data: '2026-01-01', classificacao: 'feriado', local: 'Nacional', descricao: 'Início do ano.' },
  { id: 'ev02', nome: 'Carnaval', data: '2026-02-13', dataFim: '2026-02-17', classificacao: 'feriado', local: 'Nacional', descricao: 'Período de carnaval — volume de vendas reduzido.' },
  { id: 'ev03', nome: 'Sexta-Feira Santa', data: '2026-04-03', classificacao: 'feriado', local: 'Nacional', pecasRecomendadas: [
    { bordadoCodigo: '7701', bordadoNome: 'BORDADO JESUS MISERICORDIOSO', quantidade: 10 },
    { bordadoCodigo: '1102', bordadoNome: 'BORDADO SAGRADO CORAÇÃO JESUS', quantidade: 8 },
  ] },
  { id: 'ev04', nome: 'Páscoa', data: '2026-04-05', classificacao: 'religioso', local: 'Nacional', descricao: 'Grande oportunidade de vendas em eventos religiosos.', pecasRecomendadas: [
    { bordadoCodigo: '7701', bordadoNome: 'BORDADO JESUS MISERICORDIOSO', quantidade: 15 },
    { bordadoCodigo: '1102', bordadoNome: 'BORDADO SAGRADO CORAÇÃO JESUS', quantidade: 12 },
    { bordadoCodigo: '0201', bordadoNome: 'BORDADO NOSSA SENHORA GRAÇAS', quantidade: 10 },
  ] },
  { id: 'ev05', nome: 'Tiradentes', data: '2026-04-21', classificacao: 'feriado', local: 'Nacional' },
  { id: 'ev06', nome: 'Dia do Trabalho', data: '2026-05-01', classificacao: 'feriado', local: 'Nacional' },
  { id: 'ev07', nome: 'Dia das Mães', data: '2026-05-10', classificacao: 'sazonal', local: 'Nacional', descricao: 'Alta demanda de presentes religiosos. Ótima oportunidade de vendas.', pecasRecomendadas: [
    { bordadoCodigo: '7119', bordadoNome: 'BORDADO APARECIDA', quantidade: 20 },
    { bordadoCodigo: '0201', bordadoNome: 'BORDADO NOSSA SENHORA GRAÇAS', quantidade: 15 },
    { bordadoCodigo: '6601', bordadoNome: 'BORDADO NOSSA SENHORA ROSÁRIO', quantidade: 12 },
    { bordadoCodigo: '0305', bordadoNome: 'BORDADO MEDALHA MILAGROSA', quantidade: 10 },
  ] },
  { id: 'ev08', nome: 'Corpus Christi', data: '2026-06-04', classificacao: 'feriado', local: 'Nacional', pecasRecomendadas: [
    { bordadoCodigo: '2201', bordadoNome: 'BORDADO DIVINO ESPÍRITO SANTO', quantidade: 10 },
    { bordadoCodigo: '7701', bordadoNome: 'BORDADO JESUS MISERICORDIOSO', quantidade: 8 },
  ] },
  { id: 'ev09', nome: 'Dia dos Namorados', data: '2026-06-12', classificacao: 'sazonal', local: 'Nacional', descricao: 'Boa oportunidade para peças delicadas e personalizadas.' },
  { id: 'ev10', nome: 'Festa de Santo Antônio', data: '2026-06-13', classificacao: 'religioso', local: 'Fortaleza, CE', pecasRecomendadas: [
    { bordadoCodigo: '3301', bordadoNome: 'BORDADO SÃO FRANCISCO ASSIS', quantidade: 15 },
  ] },
  { id: 'ev11', nome: 'Arraial / Festa Junina', data: '2026-06-20', dataFim: '2026-06-28', classificacao: 'sazonal', local: 'Nacional', descricao: 'Período de festas juninas. Ótimo para feiras e bazares.', custo: 300 },
  { id: 'ev12', nome: 'São Pedro e São Paulo', data: '2026-06-29', classificacao: 'feriado', local: 'Nacional', pecasRecomendadas: [
    { bordadoCodigo: '1601', bordadoNome: 'BORDADO SÃO PEDRO', quantidade: 12 },
    { bordadoCodigo: '0601', bordadoNome: 'BORDADO SÃO PAULO APÓSTOLO', quantidade: 10 },
  ] },
  // Futuros
  { id: 'ev13', nome: 'Dia dos Pais', data: '2026-08-09', classificacao: 'sazonal', local: 'Nacional', descricao: 'Boa oportunidade para peças masculinas religiosas.', pecasRecomendadas: [
    { bordadoCodigo: '1102', bordadoNome: 'BORDADO SAGRADO CORAÇÃO JESUS', quantidade: 12 },
    { bordadoCodigo: '3301', bordadoNome: 'BORDADO SÃO FRANCISCO ASSIS', quantidade: 10 },
    { bordadoCodigo: '5501', bordadoNome: 'BORDADO SÃO BENTO', quantidade: 8 },
  ] },
  { id: 'ev14', nome: 'Bazar Paroquial São José', data: '2026-08-22', classificacao: 'bazar', local: 'Paróquia São José, Natal RN', custo: 150, emailContato: 'paroquia@saojose.com', telefoneContato: '(84) 99999-0000', descricao: 'Bazar anual da paróquia com expositores locais.', pecasRecomendadas: [
    { bordadoCodigo: '7119', bordadoNome: 'BORDADO APARECIDA', quantidade: 15 },
    { bordadoCodigo: '888', bordadoNome: 'BORDADO NOSSA SENHORA FATIMA', quantidade: 12 },
    { bordadoCodigo: '5501', bordadoNome: 'BORDADO SÃO BENTO', quantidade: 8 },
  ] },
  { id: 'ev15', nome: 'Assunção de Nossa Senhora', data: '2026-08-15', classificacao: 'religioso', local: 'Nacional', descricao: 'Importante data mariana.', pecasRecomendadas: [
    { bordadoCodigo: '7119', bordadoNome: 'BORDADO APARECIDA', quantidade: 15 },
    { bordadoCodigo: '0201', bordadoNome: 'BORDADO NOSSA SENHORA GRAÇAS', quantidade: 12 },
    { bordadoCodigo: '6601', bordadoNome: 'BORDADO NOSSA SENHORA ROSÁRIO', quantidade: 10 },
  ] },
  { id: 'ev16', nome: 'Independência do Brasil', data: '2026-09-07', classificacao: 'feriado', local: 'Nacional' },
  { id: 'ev17', nome: 'Feira de Artesanato Natal Shopping', data: '2026-09-19', dataFim: '2026-09-21', classificacao: 'feira', local: 'Natal Shopping, Natal RN', custo: 300, emailContato: 'eventos@natalshoping.com', telefoneContato: '(84) 98888-1111', descricao: 'Feira de artesanato com curadoria de produtos regionais.', pecasRecomendadas: [
    { bordadoCodigo: '7119', bordadoNome: 'BORDADO APARECIDA', quantidade: 20 },
    { bordadoCodigo: '2414', bordadoNome: 'BORDADO GUADALUPE FLORAL', quantidade: 15 },
    { bordadoCodigo: '0201', bordadoNome: 'BORDADO NOSSA SENHORA GRAÇAS', quantidade: 10 },
    { bordadoCodigo: '1102', bordadoNome: 'BORDADO SAGRADO CORAÇÃO JESUS', quantidade: 10 },
  ] },
  { id: 'ev18', nome: 'São Francisco de Assis', data: '2026-10-04', classificacao: 'religioso', local: 'Nacional', pecasRecomendadas: [
    { bordadoCodigo: '3301', bordadoNome: 'BORDADO SÃO FRANCISCO ASSIS', quantidade: 20 },
  ] },
  { id: 'ev19', nome: 'N. Sra. Aparecida · Dia das Crianças', data: '2026-10-12', classificacao: 'religioso', local: 'Nacional', descricao: 'Maior festa mariana do Brasil. Oportunidade especial de vendas.', pecasRecomendadas: [
    { bordadoCodigo: '7119', bordadoNome: 'BORDADO APARECIDA', quantidade: 30 },
    { bordadoCodigo: '2414', bordadoNome: 'BORDADO GUADALUPE FLORAL', quantidade: 15 },
    { bordadoCodigo: '0201', bordadoNome: 'BORDADO NOSSA SENHORA GRAÇAS', quantidade: 12 },
    { bordadoCodigo: '888', bordadoNome: 'BORDADO NOSSA SENHORA FATIMA', quantidade: 10 },
  ] },
  { id: 'ev20', nome: 'Finados', data: '2026-11-02', classificacao: 'feriado', local: 'Nacional', pecasRecomendadas: [
    { bordadoCodigo: '0901', bordadoNome: 'BORDADO SANTA TERESINHA', quantidade: 10 },
    { bordadoCodigo: '8801', bordadoNome: 'BORDADO SANTA RITA CASSIA', quantidade: 8 },
  ] },
  { id: 'ev21', nome: 'Proclamação da República', data: '2026-11-15', classificacao: 'feriado', local: 'Nacional' },
  { id: 'ev22', nome: 'Consciência Negra', data: '2026-11-20', classificacao: 'feriado', local: 'Nacional' },
  { id: 'ev23', nome: 'Black Friday', data: '2026-11-27', classificacao: 'sazonal', local: 'Nacional', descricao: 'Grande oportunidade de liquidação e vendas online.', custo: 150 },
  { id: 'ev24', nome: 'Imaculada Conceição', data: '2026-12-08', classificacao: 'religioso', local: 'Nacional', pecasRecomendadas: [
    { bordadoCodigo: '4412', bordadoNome: 'BORDADO NOSSA SENHORA CONCEIÇÃO', quantidade: 20 },
    { bordadoCodigo: '0305', bordadoNome: 'BORDADO MEDALHA MILAGROSA', quantidade: 12 },
  ] },
  { id: 'ev25', nome: 'Pop-Up Natal Ponta Negra', data: '2026-12-13', dataFim: '2026-12-20', classificacao: 'pop_up', local: 'Ponta Negra, Natal RN', custo: 800, descricao: 'Pop-up de Natal com moda cristã. Alta demanda.', pecasRecomendadas: [
    { bordadoCodigo: '9901', bordadoNome: 'BORDADO ANJO DA GUARDA', quantidade: 30 },
    { bordadoCodigo: '7119', bordadoNome: 'BORDADO APARECIDA', quantidade: 25 },
    { bordadoCodigo: '1102', bordadoNome: 'BORDADO SAGRADO CORAÇÃO JESUS', quantidade: 20 },
  ] },
  { id: 'ev26', nome: 'Natal', data: '2026-12-25', classificacao: 'sazonal', local: 'Nacional', descricao: 'Maior oportunidade de vendas do ano.', custo: 500, pecasRecomendadas: [
    { bordadoCodigo: '9901', bordadoNome: 'BORDADO ANJO DA GUARDA', quantidade: 25 },
    { bordadoCodigo: '1102', bordadoNome: 'BORDADO SAGRADO CORAÇÃO JESUS', quantidade: 20 },
    { bordadoCodigo: '0201', bordadoNome: 'BORDADO NOSSA SENHORA GRAÇAS', quantidade: 18 },
    { bordadoCodigo: '7701', bordadoNome: 'BORDADO JESUS MISERICORDIOSO', quantidade: 15 },
  ] },
]

// ─── Funcionários ─────────────────────────────────────────────────────────────
export const mockFuncionarios: Funcionario[] = [
  {
    id: 'fn1',
    nome: 'Marília Andrade',
    cargo: 'Gerente de Atendimento',
    responsabilidades: ['Atender clientes presencialmente e pelo WhatsApp', 'Registrar vendas no sistema', 'Gerenciar wishlist de clientes', 'Emitir notas e documentos fiscais'],
    rotinas: ['Abertura da loja às 9h', 'Conferir pedidos pendentes', 'Atualizar status de compras', 'Fechamento do caixa às 18h'],
    criadoEm: '2024-01-01',
  },
  {
    id: 'fn2',
    nome: 'Lis Cavalcanti',
    cargo: 'Bordadeira Principal',
    responsabilidades: ['Executar todos os bordados das peças', 'Controlar qualidade do bordado', 'Informar conclusão de bordados no sistema', 'Manter o estoque de linhas e insumos'],
    rotinas: ['Verificar fila de bordados ao iniciar', 'Escanear QR ao concluir cada peça', 'Separar peças por prioridade', 'Registrar bordados concluídos diariamente'],
    criadoEm: '2024-01-01',
  },
  {
    id: 'fn3',
    nome: 'Rana Oliveira',
    cargo: 'Auxiliar de Estoque',
    responsabilidades: ['Receber mercadorias dos fornecedores', 'Organizar estoque por categoria', 'Escanear QR ao adicionar peças ao estoque', 'Embalar produtos vendidos'],
    rotinas: ['Conferir entregas ao chegar', 'Atualizar entradas no sistema', 'Organizar prateleiras por design', 'Separar pedidos para entrega'],
    criadoEm: '2024-06-01',
  },
]

// ─── Movimentações de Caixa (saídas manuais) ──────────────────────────────────
export const mockMovimentacoes: MovimentacaoCaixa[] = [
  { id: 'mc01', data: '2026-08-02', descricao: 'Aluguel ponto comercial', valor: 1200, categoria: 'Aluguel' },
  { id: 'mc02', data: '2026-08-02', descricao: 'Pacotes de embalagem', valor: 180, categoria: 'Material' },
  { id: 'mc03', data: '2026-08-03', descricao: 'Etiquetas personalizadas', valor: 95, categoria: 'Material' },
  { id: 'mc04', data: '2026-08-04', descricao: 'Energia elétrica', valor: 220, categoria: 'Contas' },
  { id: 'mc05', data: '2026-07-31', descricao: 'Aluguel ponto comercial', valor: 1200, categoria: 'Aluguel' },
  { id: 'mc06', data: '2026-07-28', descricao: 'Material de limpeza', valor: 65, categoria: 'Material' },
  { id: 'mc07', data: '2026-07-25', descricao: 'Internet e telefone', valor: 130, categoria: 'Contas' },
  { id: 'mc08', data: '2026-07-20', descricao: 'Embalagens premium', valor: 240, categoria: 'Material' },
]
