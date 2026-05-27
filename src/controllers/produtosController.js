const { getDb, salvarBanco } = require('../database/db');

// Helper para buscar um único registro
function queryOne(db, sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length || !result[0].values.length) return null;
  const columns = result[0].columns;
  const values = result[0].values[0];
  return Object.fromEntries(columns.map((col, i) => [col, values[i]]));
}

// Helper para buscar múltiplos registros
function queryAll(db, sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

// Cadastrar produto
const cadastrarProduto = (req, res) => {
  const { nome, descricao, preco, quantidade_estoque, estoque_minimo, status } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim() === '')
    return res.status(400).json({ erro: 'O campo "nome" é obrigatório e não pode ser vazio.' });
  if (preco === undefined || preco === null)
    return res.status(400).json({ erro: 'O campo "preco" é obrigatório.' });
  if (typeof preco !== 'number' || preco <= 0)
    return res.status(400).json({ erro: 'O preço deve ser um número maior que zero.' });
  if (quantidade_estoque !== undefined && (!Number.isInteger(quantidade_estoque) || quantidade_estoque < 0))
    return res.status(400).json({ erro: 'A quantidade em estoque deve ser um número inteiro não negativo.' });
  if (estoque_minimo !== undefined && (!Number.isInteger(estoque_minimo) || estoque_minimo < 0))
    return res.status(400).json({ erro: 'O estoque mínimo deve ser um número inteiro não negativo.' });
  if (status && !['ativo', 'inativo'].includes(status))
    return res.status(400).json({ erro: 'Status deve ser "ativo" ou "inativo".' });

  const db = getDb();

  db.run(`
    INSERT INTO produtos (nome, descricao, preco, quantidade_estoque, estoque_minimo, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    nome.trim(),
    descricao?.trim() || null,
    preco,
    quantidade_estoque ?? 0,
    estoque_minimo ?? 5,
    status || 'ativo'
  ]);

  const lastId = db.exec(`SELECT last_insert_rowid()`)[0].values[0][0];
  salvarBanco(db);

  const produto = queryOne(db, `SELECT * FROM produtos WHERE id = ?`, [lastId]);
  return res.status(201).json({ mensagem: 'Produto cadastrado com sucesso!', produto });
};

// Listar todos os produtos (com filtros opcionais)
const listarProdutos = (req, res) => {
  const { status, nome } = req.query;

  let query = 'SELECT * FROM produtos WHERE 1=1';
  const params = [];

  if (status) {
    if (!['ativo', 'inativo'].includes(status))
      return res.status(400).json({ erro: 'Status deve ser "ativo" ou "inativo".' });
    query += ' AND status = ?';
    params.push(status);
  }
  if (nome) {
    query += ' AND nome LIKE ?';
    params.push(`%${nome}%`);
  }

  query += ' ORDER BY nome';

  const db = getDb();
  const produtos = queryAll(db, query, params);
  return res.json({ total: produtos.length, produtos });
};

// Buscar produto por ID
const buscarProdutoPorId = (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const produto = queryOne(db, `SELECT * FROM produtos WHERE id = ?`, [id]);

  if (!produto)
    return res.status(404).json({ erro: `Produto com ID ${id} não encontrado.` });

  return res.json(produto);
};

// Atualizar produto
const atualizarProduto = (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const produto = queryOne(db, `SELECT * FROM produtos WHERE id = ?`, [id]);

  if (!produto)
    return res.status(404).json({ erro: `Produto com ID ${id} não encontrado.` });

  const { nome, descricao, preco, estoque_minimo, status } = req.body;

  if (nome !== undefined && (typeof nome !== 'string' || nome.trim() === ''))
    return res.status(400).json({ erro: 'O nome não pode ser vazio.' });
  if (preco !== undefined && (typeof preco !== 'number' || preco <= 0))
    return res.status(400).json({ erro: 'O preço deve ser um número maior que zero.' });
  if (estoque_minimo !== undefined && (!Number.isInteger(estoque_minimo) || estoque_minimo < 0))
    return res.status(400).json({ erro: 'O estoque mínimo deve ser um número inteiro não negativo.' });
  if (status && !['ativo', 'inativo'].includes(status))
    return res.status(400).json({ erro: 'Status deve ser "ativo" ou "inativo".' });

  db.run(`
    UPDATE produtos SET
      nome = ?,
      descricao = ?,
      preco = ?,
      estoque_minimo = ?,
      status = ?,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    nome ? nome.trim() : produto.nome,
    descricao !== undefined ? descricao?.trim() || null : produto.descricao,
    preco ?? produto.preco,
    estoque_minimo ?? produto.estoque_minimo,
    status ?? produto.status,
    id
  ]);

  salvarBanco(db);

  const atualizado = queryOne(db, `SELECT * FROM produtos WHERE id = ?`, [id]);
  return res.json({ mensagem: 'Produto atualizado com sucesso!', produto: atualizado });
};

// Inativar produto (soft delete)
const inativarProduto = (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const produto = queryOne(db, `SELECT * FROM produtos WHERE id = ?`, [id]);

  if (!produto)
    return res.status(404).json({ erro: `Produto com ID ${id} não encontrado.` });
  if (produto.status === 'inativo')
    return res.status(400).json({ erro: 'Produto já está inativo.' });

  db.run(`
    UPDATE produtos SET status = 'inativo', atualizado_em = CURRENT_TIMESTAMP WHERE id = ?
  `, [id]);

  salvarBanco(db);

  return res.json({ mensagem: `Produto "${produto.nome}" inativado com sucesso.` });
};

// Listar produtos com estoque baixo
const listarEstoqueBaixo = (req, res) => {
  const db = getDb();

  const produtos = queryAll(db, `
    SELECT * FROM produtos
    WHERE quantidade_estoque <= estoque_minimo AND status = 'ativo'
    ORDER BY quantidade_estoque ASC
  `);

  return res.json({
    mensagem: `${produtos.length} produto(s) com estoque baixo.`,
    total: produtos.length,
    produtos
  });
};

// Resumo / Dashboard
const resumo = (req, res) => {
  const db = getDb();

  const totalProdutos    = queryOne(db, `SELECT COUNT(*) as total FROM produtos`).total;
  const totalAtivos      = queryOne(db, `SELECT COUNT(*) as total FROM produtos WHERE status = 'ativo'`).total;
  const totalInativos    = queryOne(db, `SELECT COUNT(*) as total FROM produtos WHERE status = 'inativo'`).total;
  const estoqueBaixo     = queryOne(db, `SELECT COUNT(*) as total FROM produtos WHERE quantidade_estoque <= estoque_minimo AND status = 'ativo'`).total;
  const totalMovimentacoes = queryOne(db, `SELECT COUNT(*) as total FROM movimentacoes`).total;
  const totalEntradas    = queryOne(db, `SELECT COUNT(*) as total FROM movimentacoes WHERE tipo = 'entrada'`).total;
  const totalSaidas      = queryOne(db, `SELECT COUNT(*) as total FROM movimentacoes WHERE tipo = 'saida'`).total;
  const valorTotalEstoque = queryOne(db, `SELECT ROUND(SUM(preco * quantidade_estoque), 2) as valor FROM produtos WHERE status = 'ativo'`).valor || 0;

  return res.json({
    produtos: {
      total: totalProdutos,
      ativos: totalAtivos,
      inativos: totalInativos,
      com_estoque_baixo: estoqueBaixo
    },
    movimentacoes: {
      total: totalMovimentacoes,
      entradas: totalEntradas,
      saidas: totalSaidas
    },
    valor_total_em_estoque: `R$ ${valorTotalEstoque.toFixed(2)}`
  });
};

module.exports = {
  cadastrarProduto,
  listarProdutos,
  buscarProdutoPorId,
  atualizarProduto,
  inativarProduto,
  listarEstoqueBaixo,
  resumo
};