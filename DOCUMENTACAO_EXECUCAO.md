# DOCUMENTACAO_EXECUCAO.md

## Guia de Execução – Projeto Reelstack

---

### 1. Visão Geral

O **Reelstack** é um projeto desenvolvido com **React + TypeScript + Vite**, integrando funcionalidades como:

- Background dinâmico por rota  
- Navegação entre páginas (`Home`, `Login`, `Profile`)  
- Integração com APIs externas (ex.: OMDb API)  
- Hooks personalizados para gerenciamento de estado  

Este documento orienta a **configuração e execução local** do software, incluindo dependências, variáveis de ambiente e scripts úteis.

---

### 2. Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** (versão LTS ≥ 20.0)  
- **npm** ou **yarn**  
- **Git** para clonar o repositório  

Opcionalmente, um editor de código como **VS Code**.

---

### 3. Clonando o repositório

```bash
git clone https://github.com/Reelstack/reelstack.git
cd reelstack
```

--- 

### 4. Instalação de dependências

```
# Usando npm
npm install

# Ou usando yarn
yarn install
```

**Dependências principais:**

- `react`, `react-dom`, `react-router-dom`
- `typescript`
- `vite`

Dependências adicionais de hooks, estado e estilização (ver [`package.json`](https://github.com/Reelstack/reelstack/blob/main/package.json))

---

### 5. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as variáveis necessárias:
```
# Exemplo para integração com OMDb
VITE_OMDB_API_KEY=sua_chave_api_omdb_aqui
```
Um arquivo de template [`.env.local.example`](https://github.com/Reelstack/reelstack/blob/main/.env.local.example) está disponível para referência.
 >Observação: Não comite o `.env.local` para não expor chaves sensíveis.

---

### 6. Estrutura do projeto

```
src/
 ├── [pages](https://github.com/Reelstack/reelstack/tree/main/src/pages)/
 │    ├── [Home](https://github.com/Reelstack/reelstack/blob/main/src/pages/Home/index.tsx)
 │    ├── [Login](https://github.com/Reelstack/reelstack/blob/main/src/pages/Login/index.tsx)
 │    └── [Profile](https://github.com/Reelstack/reelstack/blob/main/src/pages/Profile/index.tsx)
 ├── [components](https://github.com/Reelstack/reelstack/tree/main/src/components)/
 ├── [hooks](https://github.com/Reelstack/reelstack/tree/main/src/hooks)/
 │    └── [useOMDB.ts](https://github.com/Reelstack/reelstack/blob/main/src/hooks/useOMDB.ts)
 ├── [services](https://github.com/Reelstack/reelstack/tree/main/src/services)/
 │    ├── [api](https://github.com/Reelstack/reelstack/tree/main/src/services/api)/
 │    │    ├── [base.ts](https://github.com/Reelstack/reelstack/blob/main/src/services/api/base.ts)
 │    │    ├── [omdb.ts](https://github.com/Reelstack/reelstack/blob/main/src/services/api/omdb.ts)
 │    │    └── [types.ts](https://github.com/Reelstack/reelstack/blob/main/src/services/api/types.ts)
 │    └── [index.ts](https://github.com/Reelstack/reelstack/blob/main/src/services/index.ts)
 ├── [styles](https://github.com/Reelstack/reelstack/tree/main/src/styles)/
 │    └── [global.css](https://github.com/Reelstack/reelstack/blob/main/src/styles/global.css)
 └── [index.tsx](https://github.com/Reelstack/reelstack/blob/main/src/index.tsx)

```

---

### 7. Scripts úteis

| Comando           | Descrição                                        |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Inicializa o servidor de desenvolvimento com HMR |
| `npm run build`   | Gera a versão de produção do projeto             |
| `npm run preview` | Pré-visualiza a build de produção localmente     |
| `npm run lint`    | Verifica estilo e padrões de código (ESLint)     |
| `npm run format`  | Formata o código com Prettier                    |

---

### 8. Execução do projeto

1. Certifique-se de que o .env.local está configurado.
2. Inicie o servidor de desenvolvimento:
```
npm run dev
```
3. Abra o navegador e acesse:
```
http://localhost:5173
```
4. Navegue entre as páginas e confira funcionalidades como:
 - Background dinâmico por rota
 - Sinopse expansível na Home
 - Botões de debug para QA

---

### 9. Integração com APIs

O projeto utiliza um cliente base de API (`BaseAPIClient`) que fornece:
 - Configuração de timeout para requisições
 - Suporte a `AbortController` para cancelamento de requisições
 - Tratamento centralizado de erros de API

Serviços como OMDBService implementam métodos específicos (`searchMovies`, `getMovieById`, etc.), enquanto hooks como `useOMDB` gerenciam estado, loading e erros.

---

### 10. Próximos passos / manutenção

 - Adicionar novas APIs seguindo o padrão `BaseAPIClient + Hook`
 - Atualizar estilos globais e módulos CSS conforme necessário
 - Criar testes unitários e de integração para componentes e hooks

---
