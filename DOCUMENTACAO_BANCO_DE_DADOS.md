# Documentação do Banco de Dados

## 1. Modelo Conceitual (Diagrama Entidade-Relacionamento)

```mermaid
erDiagram
    USUÁRIO ||--o{ INTERAÇÃO_FILME : realiza
    FILME ||--o{ INTERAÇÃO_FILME : recebe

    USUÁRIO {
        id ID_PK
        email EMAIL
        nome_perfil TEXTO
        data_criacao TIMESTAMP
    }

    FILME {
        tconst ID_PK
        tipo_titulo TEXTO
        titulo_principal TEXTO
        titulo_original TEXTO
        conteudo_adulto BOOL
        ano_inicio BIGINT
        ano_fim BIGINT
        duracao_minutos BIGINT
        generos TEXTO
        nota_media DECIMAL
        numero_votos BIGINT
    }

    INTERAÇÃO_FILME {
        id_usuario ID_FK
        id_filme_curtido ID_FILME_FK
        id_filme_rejeitado ID_FILME_FK
        data_criacao TIMESTAMP
    }
```

---

## 2. Modelo Lógico

### USUÁRIO
| Campo | Tipo | Restrição |
|-------|------|-----------|
| id | BIGINT | PK, IDENTITY |
| email | VARCHAR | UNIQUE, NOT NULL |
| nome_perfil | TEXT | UNIQUE, NOT NULL |
| data_criacao | TIMESTAMP | NOT NULL |

### FILME
| Campo | Tipo | Restrição |
|-------|------|-----------|
| tconst | TEXT | PK |
| tipo_titulo | TEXT | |
| titulo_principal | TEXT | |
| titulo_original | TEXT | |
| conteudo_adulto | BOOLEAN | |
| ano_inicio | BIGINT | |
| ano_fim | BIGINT | |
| duracao_minutos | BIGINT | |
| generos | TEXT | |
| nota_media | DOUBLE PRECISION | |
| numero_votos | BIGINT | |

### INTERAÇÃO_FILME
| Campo | Tipo | Restrição |
|-------|------|-----------|
| id | BIGINT | PK, IDENTITY |
| id_usuario | BIGINT | FK |
| id_filme_curtido | TEXT | FK |
| id_filme_rejeitado | TEXT | FK |
| data_criacao | TIMESTAMP | NOT NULL |

---

## 3. Modelo Físico (Script SQL)

```sql
-- Criação das tabelas
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE movies (
  tconst text NOT NULL,
  titleType text,
  primaryTitle text,
  originalTitle text,
  isAdult boolean,
  startYear bigint,
  endYear bigint,
  runtimeMinutes bigint,
  genres text,
  averageRating double precision,
  numVotes bigint,
  CONSTRAINT movies_pkey PRIMARY KEY (tconst)
);

CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email character varying NOT NULL UNIQUE,
  profile_name text NOT NULL DEFAULT ''::text UNIQUE,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE users_movies (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_movie_liked text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_movie_disliked text,
  id_user bigint NOT NULL,
  CONSTRAINT users_movies_pkey PRIMARY KEY (id),
  CONSTRAINT users_profile_id_movie_fkey FOREIGN KEY (id_movie_liked) REFERENCES movies(tconst),
  CONSTRAINT users_movies_id_movie_disliked_fkey FOREIGN KEY (id_movie_disliked) REFERENCES movies(tconst),
  CONSTRAINT users_movies_id_user_fkey FOREIGN KEY (id_user) REFERENCES users(id)
);
```
---
## 1. Requisitos Funcionais
Os requisitos abaixo descrevem as principais funcionalidades do sistema que envolvem operações com o banco de dados:

- **Cadastro de usuários**
  - Inserção de dados na tabela de usuários
  - Validação de dados únicos (email, nome_perfil)

- **Interações com filmes**
  - Registro de curtidas/descurtidas 
  - Armazenamento do histórico de interações

- **Busca e filtros**
  - Busca de filmes por gênero
  - Filtros por avaliação
  - Controle de conteúdo adulto

---

## 2. Modelo de Dados

### 2.1 Estrutura
- Diagrama Entidade-Relacionamento (DER)
- Modelo Relacional
- Dicionário de dados das tabelas
- Mapeamento dos relacionamentos

### 2.2 Relacionamentos
- Usuário → Interações (1:N)
- Filme → Interações (1:N)

---

## 3. Requisitos Não Funcionais

### 3.1 Performance
- Tempo de resposta das consultas
- Otimização de índices
- Cache de consultas frequentes

### 3.2 Segurança
- Criptografia de dados sensíveis
- Controle de acesso
- Proteção contra injeção SQL

### 3.3 Escalabilidade
- Capacidade de crescimento
- Particionamento de dados
- Balanceamento de carga

### 3.4 Backup e Recuperação
- Políticas de backup
- Procedimentos de recuperação
- Retenção de dados

---

## 4. Regras de Negócio

### 4.1 Interações
- Um usuário não pode curtir e descurtir o mesmo filme simultaneamente
- Todas as interações devem ser registradas com timestamp

### 4.2 Conteúdo
- Filmes adultos têm acesso restrito
- Classificação etária deve ser respeitada

---

## 5. Requisitos de Integração

### 5.1 APIs Externas
- Integração com IMDb
- Sincronização periódica
- Tratamento de inconsistências

### 5.2 Formato dos Dados
- Padronização de dados importados
- Mapeamento de campos externos
- Validação de integridade