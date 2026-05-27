const express = require('express');
const router = express.Router();
const {
  cadastrarProduto,
  listarProdutos,
  buscarProdutoPorId,
  atualizarProduto,
  inativarProduto,
  listarEstoqueBaixo,
  resumo
} = require('../controllers/produtosController');

// Rotas específicas antes de /:id
router.get('/estoque-baixo', listarEstoqueBaixo);
router.get('/resumo', resumo);

router.post('/', cadastrarProduto);
router.get('/', listarProdutos);
router.get('/:id', buscarProdutoPorId);
router.put('/:id', atualizarProduto);
router.delete('/:id', inativarProduto);

module.exports = router;
