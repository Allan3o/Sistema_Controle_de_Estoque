const express = require('express');
const router = express.Router();
const {
  cadastrarProduto,
  listarProdutos,
  buscarProdutoPorId,
  atualizarProduto,
  listarEstoqueBaixo
} = require('../controllers/produtosController');

// GET /produtos/estoque-baixo - deve vir antes de /:id
router.get('/estoque-baixo', listarEstoqueBaixo);

// POST /produtos
router.post('/', cadastrarProduto);

// GET /produtos
router.get('/', listarProdutos);

// GET /produtos/:id
router.get('/:id', buscarProdutoPorId);

// PUT /produtos/:id
router.put('/:id', atualizarProduto);

module.exports = router;
