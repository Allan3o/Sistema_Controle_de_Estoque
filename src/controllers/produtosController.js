const db = require('../database/db');

// Cadastrar produto
const cadastrarProduto = (req, res) => {
  const { nome, descricao, preco, quantidade_estoque, estoque_minimo, status } = req.body;

  // Validações
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ erro: 'O campo "nome" é obrigatório e não pode ser vazio.' });
  }
  if (preco === undefined || preco === null) {
    return res.status(400).json({ erro: 'O campo "preco" é obrigatório.' });
  }
  if (typeof preco !== 'number' || preco <= 0) {
    return res.status(400).json({ erro: 'O preço deve ser um número maior que zero.' });
  }
  if (quantidade_estoque !== undefined && (!Number.isInteger(quantidade_estoque) || quantidade_estoque < 0)) {
    return res.status(400).json({ erro: 'A quantidade em estoque deve ser um número inteiro não negativo.' });
  }
  if (estoque_minimo !== undefined && (!Number.isInteger(estoque_minimo) || estoque_minimo < 0)) {
    return res.status(400).json({ erro: 'O estoque mínimo deve ser um número inteiro não negativo.' });
  }
  if (status && !['ativo', 'inativo'].includes(status)) {
    return res.status(400).json({ erro: 'Status deve ser "ativo" ou "inativo".' });
  }

  const stmt = db.prepare(`
    INSERT INTO produtos (nome, descricao, preco, quantidade_estoque, estoque_minimo, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    nome.trim(),
    descricao?.trim() || null,
    preco,
    quantidade_estoque ?? 0,
    estoque_minimo ?? 5,
    status || 'ativo'
  );

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ mensagem: 'Produto cadastrado com sucesso!', produto });
};

// Listar todos os produtos (com filtros opcionais)
const listarProdutos = (req, res) => {
  const { status, nome } = req.query;

  let query = 'SELECT * FROM produtos WHERE 1=1';
  const params = [];

  if (status) {
    if (!['ativo', 'inativo'].includes(status)) {
      return res.status(400).json({ erro: 'Status deve ser "ativo" ou "inativo".' });
    }
    query += ' AND status = ?';
    params.push(status);
  }

  if (nome) {
    query += ' AND nome LIKE ?';
    params.push(`%${nome}%`);
  }

  query += ' ORDER BY nome';

  const produtos = db.prepare(query).all(...params);
  return res.json({ total: produtos.length, produtos });
};

// Buscar produto por ID
const buscarProdutoPorId = (req, res) => {
  const { id } = req.params;
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);

  if (!produto) {
    return res.status(404).json({ erro: `Produto com ID ${id} não encontrado.` });
  }

  return res.json(produto);
};

// Atualizar produto
const atualizarProduto = (req, res) => {
  const { id } = req.params;
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);

  if (!produto) {
    return res.status(404).json({ erro: `Produto com ID ${id} não encontrado.` });
  }

  const { nome, descricao, preco, estoque_minimo, status } = req.body;

  if (nome !== undefined && (typeof nome !== 'string' || nome.trim() === '')) {
    return res.status(400).json({ erro: 'O nome não pode ser vazio.' });
  }
  if (preco !== undefined && (typeof preco !== 'number' || preco <= 0)) {
    return res.status(400).json({ erro: 'O preço deve ser um número maior que zero.' });
  }
  if (estoque_minimo !== undefined && (!Number.isInteger(estoque_minimo) || estoque_minimo < 0)) {
    return res.status(400).json({ erro: 'O estoque mínimo deve ser um número inteiro não negativo.' });
  }
  if (status && !['ativo', 'inativo'].includes(status)) {
    return res.status(400).json({ erro: 'Status deve ser "ativo" ou "inativo".' });
  }

  db.prepare(`
    UPDATE produtos SET
      nome = ?,
      descricao = ?,
      preco = ?,
      estoque_minimo = ?,
      status = ?,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    nome ? nome.trim() : produto.nome,
    descricao !== undefined ? descricao?.trim() || null : produto.descricao,
    preco ?? produto.preco,
    estoque_minimo ?? produto.estoque_minimo,
    status ?? produto.status,
    id
  );

  const atualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  return res.json({ mensagem: 'Produto atualizado com sucesso!', produto: atualizado });
};

// Inativar produto (soft delete)
const inativarProduto = (req, res) => {
  const { id } = req.params;
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);

  if (!produto) {
    return res.status(404).json({ erro: `Produto com ID ${id} não encontrado.` });
  }

  if (produto.status === 'inativo') {
    return res.status(400).json({ erro: 'Produto já está inativo.' });
  }

  db.prepare(`
    UPDATE produtos SET status = 'inativo', atualizado_em = CURRENT_TIMESTAMP WHERE id = ?
  `).run(id);

  return res.json({ mensagem: `Produto "${produto.nome}" inativado com sucesso.` });
};

// Listar produtos com estoque baixo
const listarEstoqueBaixo = (req, res) => {
  const produtos = db.prepare(`
    SELECT * FROM produtos
    WHERE quantidade_estoque <= estoque_minimo AND status = 'ativo'
    ORDER BY quantidade_estoque ASC
  `).all();

  return res.json({
    mensagem: `${produtos.length} produto(s) com estoque baixo.`,
    total: produtos.length,
    produtos
  });
};

// Resumo / Dashboard
const resumo = (req, res) => {
  const totalProdutos = db.prepare("SELECT COUNT(*) as total FROM produtos").get().total;
  const totalAtivos = db.prepare("SELECT COUNT(*) as total FROM produtos WHERE status = 'ativo'").get().total;
  const totalInativos = db.prepare("SELECT COUNT(*) as total FROM produtos WHERE status = 'inativo'").get().total;
  const estoqueBaixo = db.prepare("SELECT COUNT(*) as total FROM produtos WHERE quantidade_estoque <= estoque_minimo AND status = 'ativo'").get().total;
  const totalMovimentacoes = db.prepare("SELECT COUNT(*) as total FROM movimentacoes").get().total;
  const totalEntradas = db.prepare("SELECT COUNT(*) as total FROM movimentacoes WHERE tipo = 'entrada'").get().total;
  const totalSaidas = db.prepare("SELECT COUNT(*) as total FROM movimentacoes WHERE tipo = 'saida'").get().total;
  const valorTotalEstoque = db.prepare("SELECT ROUND(SUM(preco * quantidade_estoque), 2) as valor FROM produtos WHERE status = 'ativo'").get().valor || 0;

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
