const express = require('express');
const { inicializar } = require('./database/db');
const app = express();

app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString('pt-BR')}] ${req.method} ${req.url}`);
  next();
});

// Rotas
app.use('/produtos', require('./routes/produtos'));
app.use('/movimentacoes', require('./routes/movimentacoes'));

// Rota raiz com documentação
app.get('/', (req, res) => {
  res.json({
    sistema: 'Controle de Estoque',
    versao: '2.0.0',
    rotas: {
      produtos: {
        'POST   /produtos':               'Cadastrar produto',
        'GET    /produtos':               'Listar produtos (?status=ativo|inativo&nome=...)',
        'GET    /produtos/resumo':        'Resumo geral / dashboard',
        'GET    /produtos/estoque-baixo': 'Listar produtos com estoque baixo',
        'GET    /produtos/:id':           'Buscar produto por ID',
        'PUT    /produtos/:id':           'Atualizar produto',
        'DELETE /produtos/:id':           'Inativar produto (soft delete)'
      },
      movimentacoes: {
        'POST /movimentacoes/entrada': 'Registrar entrada de estoque',
        'POST /movimentacoes/saida':   'Registrar saída de estoque',
        'GET  /movimentacoes':         'Histórico (?produto_id=&tipo=entrada|saida)'
      }
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Erro genérico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// ✅ Inicializa o banco antes de subir o servidor
const PORT = parseInt(process.env.PORT, 10) || 3000;
const FALLBACK_PORT = PORT === 3000 ? 3001 : PORT + 1;

function startServer(port) {
  app.listen(port)
    .on('listening', () => {
      console.log(`\n🚀 Servidor rodando em http://localhost:${port}`);
      console.log(`📦 Sistema de Controle de Estoque v2.0.0\n`);
    })
    .on('error', err => {
      if (err.code === 'EADDRINUSE') {
        if (port === FALLBACK_PORT) {
          console.error(`❌ A porta ${port} também está em uso. Escolha outra porta ou libere a porta antes de reiniciar.`);
          process.exit(1);
        }
        console.warn(`⚠️ Porta ${port} em uso. Tentando porta ${FALLBACK_PORT}...`);
        startServer(FALLBACK_PORT);
      } else {
        console.error('❌ Erro ao iniciar o servidor:', err);
        process.exit(1);
      }
    });
}

inicializar().then(() => {
  startServer(PORT);
}).catch(err => {
  console.error('❌ Erro ao inicializar banco de dados:', err);
  process.exit(1);
});