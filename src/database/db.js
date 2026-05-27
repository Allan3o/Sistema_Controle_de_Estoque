const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../estoque.db');

let dbInstance = null;

async function inicializar() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Criar tabelas
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      preco REAL NOT NULL,
      quantidade_estoque INTEGER NOT NULL DEFAULT 0,
      estoque_minimo INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida')),
      quantidade INTEGER NOT NULL,
      observacao TEXT,
      data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )
  `);

  // Ativar foreign keys
  dbInstance.run(`PRAGMA foreign_keys = ON`);

  salvarBanco(dbInstance);
  console.log('✅ Banco de dados inicializado com sucesso!');
}

function getDb() {
  if (!dbInstance) throw new Error('Banco não inicializado. Chame inicializar() primeiro.');
  return dbInstance;
}

function salvarBanco(db) {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { inicializar, getDb, salvarBanco };