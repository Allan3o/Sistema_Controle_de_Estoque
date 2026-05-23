const express = require('express');
const app = express();

// Middleware para JSON
app.use(express.json());

// Middleware de log básico
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString('pt-BR')}] ${req.method} ${req.url}`);
  next();
});

// Rotas
app.use('/produtos', require('./routes/produtos'));
app.use('/movimentacoes', require('./routes/movimentacoes'));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    sistema: 'Controle de Estoque',
    versao: '1.0.0',
    rotas: {
      produtos: {
        'POST /produtos': 'Cadastrar produto',
        'GET /produtos': 'Listar todos os produtos',
        'GET /produtos/:id': 'Buscar produto por ID',
        'PUT /produtos/:id': 'Atualizar produto',
        'GET /produtos/estoque-baixo': 'Listar produtos com estoque baixo'
      },
      movimentacoes: {
        'POST /movimentacoes/entrada': 'Registrar entrada de estoque',
        'POST /movimentacoes/saida': 'Registrar saída de estoque',
        'GET /movimentacoes': 'Listar histórico de movimentações'
      }
    }
  });
});

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📦 Sistema de Controle de Estoque - API REST\n`);
});
