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

// Registrar entrada de estoque
const registrarEntrada = (req, res) => {
  const { produto_id, quantidade, observacao } = req.body;

  if (!produto_id)
    return res.status(400).json({ erro: 'O campo "produto_id" é obrigatório.' });
  if (!quantidade)
    return res.status(400).json({ erro: 'O campo "quantidade" é obrigatório.' });
  if (!Number.isInteger(quantidade) || quantidade <= 0)
    return res.status(400).json({ erro: 'A quantidade deve ser um número inteiro maior que zero.' });

  const db = getDb();

  const produto = queryOne(db, `SELECT * FROM produtos WHERE id = ?`, [produto_id]);

  if (!produto)
    return res.status(404).json({ erro: `Produto com ID ${produto_id} não encontrado.` });
  if (produto.status === 'inativo')
    return res.status(400).json({ erro: 'Não é permitido movimentar produto inativo.' });

  db.run(`
    INSERT INTO movimentacoes (produto_id, tipo, quantidade, observacao)
    VALUES (?, 'entrada', ?, ?)
  `, [produto_id, quantidade, observacao?.trim() || null]);

  const lastId = db.exec(`SELECT last_insert_rowid()`)[0].values[0][0];

  db.run(`
    UPDATE produtos SET quantidade_estoque = quantidade_estoque + ?, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [quantidade, produto_id]);

  salvarBanco(db);

  const movimentacao = queryOne(db, `SELECT * FROM movimentacoes WHERE id = ?`, [lastId]);
  const produtoAtualizado = queryOne(db, `SELECT * FROM produtos WHERE id = ?`, [produto_id]);

  return res.status(201).json({
    mensagem: `Entrada de ${quantidade} unidade(s) registrada com sucesso!`,
    movimentacao,
    estoque_atual: produtoAtualizado.quantidade_estoque
  });
};

// Registrar saída de estoque
const registrarSaida = (req, res) => {
  const { produto_id, quantidade, observacao } = req.body;

  if (!produto_id)
    return res.status(400).json({ erro: 'O campo "produto_id" é obrigatório.' });
  if (!quantidade)
    return res.status(400).json({ erro: 'O campo "quantidade" é obrigatório.' });
  if (!Number.isInteger(quantidade) || quantidade <= 0)
    return res.status(400).json({ erro: 'A quantidade deve ser um número inteiro maior que zero.' });

  const db = getDb();

  const produto = queryOne(db, `SELECT * FROM produtos WHERE id = ?`, [produto_id]);

  if (!produto)
    return res.status(404).json({ erro: `Produto com ID ${produto_id} não encontrado.` });
  if (produto.status === 'inativo')
    return res.status(400).json({ erro: 'Não é permitido movimentar produto inativo.' });
  if (quantidade > produto.quantidade_estoque)
    return res.status(400).json({
      erro: `Estoque insuficiente. Disponível: ${produto.quantidade_estoque} unidade(s).`,
      estoque_disponivel: produto.quantidade_estoque
    });

  db.run(`
    INSERT INTO movimentacoes (produto_id, tipo, quantidade, observacao)
    VALUES (?, 'saida', ?, ?)
  `, [produto_id, quantidade, observacao?.trim() || null]);

  const lastId = db.exec(`SELECT last_insert_rowid()`)[0].values[0][0];

  db.run(`
    UPDATE produtos SET quantidade_estoque = quantidade_estoque - ?, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [quantidade, produto_id]);

  salvarBanco(db);

  const movimentacao = queryOne(db, `SELECT * FROM movimentacoes WHERE id = ?`, [lastId]);
  const produtoAtualizado = queryOne(db, `SELECT * FROM produtos WHERE id = ?`, [produto_id]);

  return res.status(201).json({
    mensagem: `Saída de ${quantidade} unidade(s) registrada com sucesso!`,
    movimentacao,
    estoque_atual: produtoAtualizado.quantidade_estoque
  });
};

// Consultar histórico de movimentações
const listarMovimentacoes = (req, res) => {
  const { produto_id, tipo } = req.query;

  if (tipo && !['entrada', 'saida'].includes(tipo))
    return res.status(400).json({ erro: 'O tipo deve ser "entrada" ou "saida".' });

  const db = getDb();

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
  if (tipo) {
    query += ' AND m.tipo = ?';
    params.push(tipo);
  }

  query += ' ORDER BY m.data_movimentacao DESC';

  const movimentacoes = queryAll(db, query, params);
  return res.json({ total: movimentacoes.length, movimentacoes });
};

module.exports = {
  registrarEntrada,
  registrarSaida,
  listarMovimentacoes
};