const express = require('express');
const router = express.Router();
const {
  registrarEntrada,
  registrarSaida,
  listarMovimentacoes
} = require('../controllers/movimentacoesController');

// GET /movimentacoes
router.get('/', listarMovimentacoes);

// POST /movimentacoes/entrada
router.post('/entrada', registrarEntrada);

// POST /movimentacoes/saida
router.post('/saida', registrarSaida);

module.exports = router;
