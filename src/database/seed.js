/**
 * SEED - Dados iniciais para teste
 * Execute: node src/database/seed.js
 */

const { inicializar, getDb, salvarBanco } = require('./db');

async function seed() {
  await inicializar();
  const db = getDb();

  console.log('🌱 Populando banco de dados com dados de exemplo...\n');

  // Limpar dados existentes
  db.run('DELETE FROM movimentacoes');
  db.run('DELETE FROM produtos');
  db.run("DELETE FROM sqlite_sequence WHERE name='produtos'");
  db.run("DELETE FROM sqlite_sequence WHERE name='movimentacoes'");

  // Inserir produtos
  const produtos = [
    ['Caneta Azul BIC',       'Caneta esferográfica azul 1.0mm',      2.50,  150, 20, 'ativo'],
    ['Caderno Universitário', 'Caderno 10 matérias 200 folhas',       25.90,  40, 10, 'ativo'],
    ['Borracha Branca',       'Borracha macia para lápis',             1.20,   8, 10, 'ativo'],
    ['Lápis HB Faber',        'Lápis grafite HB caixa com 12',         8.90,   5, 10, 'ativo'],
    ['Régua 30cm',            'Régua plástica transparente 30cm',      3.50,   3,  5, 'ativo'],
    ['Corretivo Líquido',     'Corretivo branco de secagem rápida',    6.00,  60, 15, 'ativo'],
    ['Tesoura Escolar',       'Tesoura ponta arredondada 13cm',       12.00,  25,  8, 'ativo'],
    ['Cola Bastão',           'Cola em bastão 21g',                    5.50,   2, 10, 'ativo'],
    ['Post-it Amarelo',       'Bloco de notas adesivas 76x76mm',      14.90,  30, 10, 'ativo'],
    ['Marca Texto Verde',     'Marca texto fluorescente verde',         4.00,   0, 10, 'inativo'],
  ];

  const ids = [];
  for (const p of produtos) {
    db.run(`
      INSERT INTO produtos (nome, descricao, preco, quantidade_estoque, estoque_minimo, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, p);
    const lastId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    ids.push(lastId);
    console.log(`  ✅ Produto inserido: ${p[0]}`);
  }

  // Inserir movimentações
  const movimentacoes = [
    [ids[0], 'entrada', 200, 'Compra inicial do fornecedor',      '2025-01-10 08:00:00'],
    [ids[0], 'saida',    50, 'Venda em lote para escola',         '2025-01-15 10:30:00'],
    [ids[1], 'entrada',  50, 'Compra inicial do fornecedor',      '2025-01-10 08:00:00'],
    [ids[1], 'saida',    10, 'Venda balcão',                      '2025-01-20 14:00:00'],
    [ids[2], 'entrada',  20, 'Reposição de estoque',              '2025-01-12 09:00:00'],
    [ids[2], 'saida',    12, 'Venda avulsa',                      '2025-02-01 11:00:00'],
    [ids[3], 'entrada',  15, 'Compra fornecedor Faber-Castell',   '2025-01-08 07:30:00'],
    [ids[3], 'saida',    10, 'Venda para cliente corporativo',    '2025-02-05 16:00:00'],
    [ids[4], 'entrada',  10, 'Compra inicial',                    '2025-01-10 08:00:00'],
    [ids[4], 'saida',     7, 'Venda balcão',                      '2025-01-28 13:00:00'],
    [ids[5], 'entrada',  80, 'Compra em atacado',                 '2025-01-05 08:00:00'],
    [ids[5], 'saida',    20, 'Venda para papelaria parceira',     '2025-02-10 10:00:00'],
    [ids[7], 'entrada',  15, 'Compra inicial',                    '2025-01-10 08:00:00'],
    [ids[7], 'saida',    13, 'Venda avulsa',                      '2025-02-15 15:00:00'],
  ];

  for (const m of movimentacoes) {
    db.run(`
      INSERT INTO movimentacoes (produto_id, tipo, quantidade, observacao, data_movimentacao)
      VALUES (?, ?, ?, ?, ?)
    `, m);
  }

  salvarBanco(db);

  console.log(`\n  ✅ ${movimentacoes.length} movimentações inseridas`);
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('   Agora inicie o servidor: npm start\n');
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});