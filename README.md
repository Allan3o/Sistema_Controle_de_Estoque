# 📦 Sistema de Controle de Estoque

API REST para controle básico de estoque de uma pequena loja.

---

## 🚀 Como executar

### Pré-requisitos
- Node.js instalado (versão 16 ou superior)

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor
npm start
```

O servidor estará disponível em: **http://localhost:3000**

---

## 📋 Endpoints da API

### 🛍️ Produtos

#### Cadastrar produto
```
POST /produtos
Content-Type: application/json

{
  "nome": "Caneta Azul",
  "descricao": "Caneta esferográfica azul",
  "preco": 2.50,
  "quantidade_estoque": 100,
  "estoque_minimo": 10,
  "status": "ativo"
}
```

#### Listar todos os produtos
```
GET /produtos
```

#### Buscar produto por ID
```
GET /produtos/:id
```

#### Atualizar produto
```
PUT /produtos/:id
Content-Type: application/json

{
  "nome": "Caneta Azul BIC",
  "preco": 3.00,
  "status": "inativo"
}
```

#### Listar produtos com estoque baixo
```
GET /produtos/estoque-baixo
```
> Retorna produtos cuja `quantidade_estoque <= estoque_minimo`

---

### 📊 Movimentações

#### Registrar entrada de estoque
```
POST /movimentacoes/entrada
Content-Type: application/json

{
  "produto_id": 1,
  "quantidade": 50,
  "observacao": "Compra do fornecedor X"
}
```

#### Registrar saída de estoque
```
POST /movimentacoes/saida
Content-Type: application/json

{
  "produto_id": 1,
  "quantidade": 10,
  "observacao": "Venda para cliente"
}
```

#### Consultar histórico de movimentações
```
GET /movimentacoes
GET /movimentacoes?produto_id=1
GET /movimentacoes?tipo=entrada
GET /movimentacoes?produto_id=1&tipo=saida
```

---

## ⚙️ Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| ❌ Saída > estoque | Não permite saída maior que a quantidade disponível |
| ✅ Entrada | Aumenta o estoque do produto |
| ✅ Saída | Diminui o estoque do produto |
| ⚠️ Estoque baixo | Produto aparece na consulta quando `quantidade <= estoque_mínimo` |
| 🚫 Produto inativo | Não permite movimentação de produto inativo |

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `produtos`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | Chave primária |
| nome | TEXT | Nome do produto |
| descricao | TEXT | Descrição |
| preco | REAL | Preço |
| quantidade_estoque | INTEGER | Quantidade atual |
| estoque_minimo | INTEGER | Mínimo antes de alertar |
| status | TEXT | `ativo` ou `inativo` |
| criado_em | DATETIME | Data de criação |
| atualizado_em | DATETIME | Última atualização |

### Tabela: `movimentacoes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | Chave primária |
| produto_id | INTEGER | FK para produtos |
| tipo | TEXT | `entrada` ou `saida` |
| quantidade | INTEGER | Quantidade movimentada |
| observacao | TEXT | Observação opcional |
| data_movimentacao | DATETIME | Data/hora da movimentação |

---

## 🗂️ Estrutura do Projeto

```
estoque/
├── package.json
├── README.md
└── src/
    ├── server.js              # Ponto de entrada da aplicação
    ├── database/
    │   └── db.js              # Configuração do banco SQLite
    ├── controllers/
    │   ├── produtosController.js
    │   └── movimentacoesController.js
    └── routes/
        ├── produtos.js
        └── movimentacoes.js
```
