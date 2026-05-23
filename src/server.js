const express = require('express');
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📦 Sistema de Controle de Estoque v2.0.0\n`);
});
