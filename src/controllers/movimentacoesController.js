const db = require('../database/db');

// Registrar entrada de estoque
const registrarEntrada = (req, res) => {
  const { produto_id, quantidade, observacao } = req.body;

  if (!produto_id || !quantidade) {
    return res.status(400).json({ erro: 'Campos obrigatórios: produto_id e quantidade.' });
  }

  if (quantidade <= 0) {
    return res.status(400).json({ erro: 'A quantidade deve ser maior que zero.' });
  }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto_id);

  if (!produto) {
    return res.status(404).json({ erro: `Produto com ID ${produto_id} não encontrado.` });
  }

  if (produto.status === 'inativo') {
    return res.status(400).json({ erro: 'Não é permitido movimentar produto inativo.' });
  }

  // Registrar movimentação
  const stmtMov = db.prepare(`
    INSERT INTO movimentacoes (produto_id, tipo, quantidade, observacao)
    VALUES (?, 'entrada', ?, ?)
  `);
  const result = stmtMov.run(produto_id, quantidade, observacao || null);

  // Atualizar estoque
  db.prepare(`
    UPDATE produtos SET quantidade_estoque = quantidade_estoque + ?, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(quantidade, produto_id);

  const movimentacao = db.prepare('SELECT * FROM movimentacoes WHERE id = ?').get(result.lastInsertRowid);
  const produtoAtualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto_id);

  return res.status(201).json({
    mensagem: `Entrada de ${quantidade} unidade(s) registrada com sucesso!`,
    movimentacao,
    estoque_atual: produtoAtualizado.quantidade_estoque
  });
};

// Registrar saída de estoque
const registrarSaida = (req, res) => {
  const { produto_id, quantidade, observacao } = req.body;

  if (!produto_id || !quantidade) {
    return res.status(400).json({ erro: 'Campos obrigatórios: produto_id e quantidade.' });
  }

  if (quantidade <= 0) {
    return res.status(400).json({ erro: 'A quantidade deve ser maior que zero.' });
  }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto_id);

  if (!produto) {
    return res.status(404).json({ erro: `Produto com ID ${produto_id} não encontrado.` });
  }

  if (produto.status === 'inativo') {
    return res.status(400).json({ erro: 'Não é permitido movimentar produto inativo.' });
  }

  // Regra: não permitir saída maior que o estoque disponível
  if (quantidade > produto.quantidade_estoque) {
    return res.status(400).json({
      erro: `Estoque insuficiente. Disponível: ${produto.quantidade_estoque} unidade(s).`,
      estoque_disponivel: produto.quantidade_estoque
    });
  }

  // Registrar movimentação
  const stmtMov = db.prepare(`
    INSERT INTO movimentacoes (produto_id, tipo, quantidade, observacao)
    VALUES (?, 'saida', ?, ?)
  `);
  const result = stmtMov.run(produto_id, quantidade, observacao || null);

  // Atualizar estoque
  db.prepare(`
    UPDATE produtos SET quantidade_estoque = quantidade_estoque - ?, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(quantidade, produto_id);

  const movimentacao = db.prepare('SELECT * FROM movimentacoes WHERE id = ?').get(result.lastInsertRowid);
  const produtoAtualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto_id);

  return res.status(201).json({
    mensagem: `Saída de ${quantidade} unidade(s) registrada com sucesso!`,
    movimentacao,
    estoque_atual: produtoAtualizado.quantidade_estoque
  });
};

// Consultar histórico de movimentações
const listarMovimentacoes = (req, res) => {
  const { produto_id, tipo } = req.query;

  let query = `
    SELECT m.*, p.nome as produto_nome
    FROM movimentacoes m
    JOIN produtos p ON m.produto_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (produto_id) {
    query += ' AND m.produto_id = ?';
    params.push(produto_id);
  }

  if (tipo && ['entrada', 'saida'].includes(tipo)) {
    query += ' AND m.tipo = ?';
    params.push(tipo);
  }

  query += ' ORDER BY m.data_movimentacao DESC';

  const movimentacoes = db.prepare(query).all(...params);

  return res.json({
    total: movimentacoes.length,
    movimentacoes
  });
};

module.exports = {
  registrarEntrada,
  registrarSaida,
  listarMovimentacoes
};
