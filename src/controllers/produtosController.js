const db = require('../database/db');

// Cadastrar produto
const cadastrarProduto = (req, res) => {
  const { nome, descricao, preco, quantidade_estoque, estoque_minimo, status } = req.body;

  if (!nome || preco === undefined) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome e preco.' });
  }

  if (preco < 0) {
    return res.status(400).json({ erro: 'O preço não pode ser negativo.' });
  }

  if (quantidade_estoque !== undefined && quantidade_estoque < 0) {
    return res.status(400).json({ erro: 'A quantidade em estoque não pode ser negativa.' });
  }

  const stmt = db.prepare(`
    INSERT INTO produtos (nome, descricao, preco, quantidade_estoque, estoque_minimo, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    nome,
    descricao || null,
    preco,
    quantidade_estoque ?? 0,
    estoque_minimo ?? 5,
    status || 'ativo'
  );

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid);

  return res.status(201).json({ mensagem: 'Produto cadastrado com sucesso!', produto });
};

// Listar todos os produtos
const listarProdutos = (req, res) => {
  const produtos = db.prepare('SELECT * FROM produtos ORDER BY nome').all();
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

  if (preco !== undefined && preco < 0) {
    return res.status(400).json({ erro: 'O preço não pode ser negativo.' });
  }

  if (status && !['ativo', 'inativo'].includes(status)) {
    return res.status(400).json({ erro: 'Status deve ser "ativo" ou "inativo".' });
  }

  const stmt = db.prepare(`
    UPDATE produtos SET
      nome = ?,
      descricao = ?,
      preco = ?,
      estoque_minimo = ?,
      status = ?,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    nome ?? produto.nome,
    descricao !== undefined ? descricao : produto.descricao,
    preco ?? produto.preco,
    estoque_minimo ?? produto.estoque_minimo,
    status ?? produto.status,
    id
  );

  const atualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  return res.json({ mensagem: 'Produto atualizado com sucesso!', produto: atualizado });
};

// Listar produtos com estoque baixo
const listarEstoqueBaixo = (req, res) => {
  const produtos = db.prepare(`
    SELECT * FROM produtos
    WHERE quantidade_estoque <= estoque_minimo
    ORDER BY quantidade_estoque ASC
  `).all();

  return res.json({
    mensagem: `${produtos.length} produto(s) com estoque baixo.`,
    total: produtos.length,
    produtos
  });
};

module.exports = {
  cadastrarProduto,
  listarProdutos,
  buscarProdutoPorId,
  atualizarProduto,
  listarEstoqueBaixo
};
