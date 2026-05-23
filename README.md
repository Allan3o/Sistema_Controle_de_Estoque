# 📦 Sistema de Controle de Estoque — v2.0

API REST para controle básico de estoque de uma pequena loja.

---

## 🚀 Como executar

### Pré-requisitos
- Node.js (versão 16 ou superior)

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. (Opcional) Popular banco com dados de exemplo
node src/database/seed.js

# 3. Iniciar o servidor
npm start
```

Acesse: **http://localhost:3000**

---

## 📋 Endpoints

### 🛍️ Produtos

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/produtos` | Cadastrar produto |
| `GET` | `/produtos` | Listar produtos (com filtros) |
| `GET` | `/produtos/resumo` | Resumo geral / dashboard |
| `GET` | `/produtos/estoque-baixo` | Produtos com estoque baixo |
| `GET` | `/produtos/:id` | Buscar produto por ID |
| `PUT` | `/produtos/:id` | Atualizar produto |
| `DELETE` | `/produtos/:id` | Inativar produto (soft delete) |

### 📊 Movimentações

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/movimentacoes/entrada` | Registrar entrada |
| `POST` | `/movimentacoes/saida` | Registrar saída |
| `GET` | `/movimentacoes` | Histórico (com filtros) |

---

## 📝 Exemplos de uso

### Cadastrar produto
```
POST /produtos
{
  "nome": "Caneta Azul",
  "descricao": "Caneta esferográfica 1.0mm",
  "preco": 2.50,
  "quantidade_estoque": 100,
  "estoque_minimo": 10,
  "status": "ativo"
}
```

### Listar produtos com filtros
```
GET /produtos                    → todos
GET /produtos?status=ativo       → só ativos
GET /produtos?nome=caneta        → busca por nome
GET /produtos?status=ativo&nome=bic
```

### Registrar entrada
```
POST /movimentacoes/entrada
{
  "produto_id": 1,
  "quantidade": 50,
  "observacao": "Compra do fornecedor X"
}
```

### Registrar saída
```
POST /movimentacoes/saida
{
  "produto_id": 1,
  "quantidade": 10,
  "observacao": "Venda balcão"
}
```

### Histórico com filtros
```
GET /movimentacoes
GET /movimentacoes?produto_id=1
GET /movimentacoes?tipo=entrada
GET /movimentacoes?produto_id=1&tipo=saida
```

### Resumo / Dashboard
```
GET /produtos/resumo

Retorna:
{
  "produtos": {
    "total": 10,
    "ativos": 9,
    "inativos": 1,
    "com_estoque_baixo": 3
  },
  "movimentacoes": {
    "total": 20,
    "entradas": 12,
    "saidas": 8
  },
  "valor_total_em_estoque": "R$ 1580.00"
}
```

### Inativar produto (soft delete)
```
DELETE /produtos/:id
```
> Não apaga do banco — apenas muda o status para "inativo".

---

## ⚙️ Regras de Negócio

| Regra | Comportamento |
|-------|--------------|
| Saída > estoque | ❌ Bloqueada com erro 400 |
| Produto inativo | ❌ Sem movimentação permitida |
| Estoque baixo | ⚠️ Aparece em `/produtos/estoque-baixo` quando `quantidade <= estoque_mínimo` |
| Entrada | ✅ Soma ao estoque automaticamente |
| Saída | ✅ Subtrai do estoque automaticamente |
| Soft delete | ✅ `DELETE` apenas inativa, não apaga |

---

## ✅ Validações implementadas

- Nome não pode ser vazio ou string em branco
- Preço deve ser maior que zero
- Quantidades devem ser **números inteiros** positivos
- Status deve ser `"ativo"` ou `"inativo"`
- Tipo de movimentação deve ser `"entrada"` ou `"saida"`

---

## 🗄️ Banco de Dados (SQLite)

### Tabela `produtos`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER PK | Identificador único |
| nome | TEXT | Nome do produto |
| descricao | TEXT | Descrição opcional |
| preco | REAL | Preço unitário (> 0) |
| quantidade_estoque | INTEGER | Quantidade atual |
| estoque_minimo | INTEGER | Mínimo antes do alerta |
| status | TEXT | `ativo` \| `inativo` |
| criado_em | DATETIME | Data de criação |
| atualizado_em | DATETIME | Última atualização |

### Tabela `movimentacoes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER PK | Identificador único |
| produto_id | INTEGER FK | Referência ao produto |
| tipo | TEXT | `entrada` \| `saida` |
| quantidade | INTEGER | Unidades movimentadas |
| observacao | TEXT | Observação opcional |
| data_movimentacao | DATETIME | Data/hora do registro |

---

## 🗂️ Estrutura do Projeto

```
estoque/
├── package.json
├── README.md
└── src/
    ├── server.js
    ├── database/
    │   ├── db.js          ← Configuração do banco
    │   └── seed.js        ← Dados iniciais de teste
    ├── controllers/
    │   ├── produtosController.js
    │   └── movimentacoesController.js
    └── routes/
        ├── produtos.js
        └── movimentacoes.js
```
