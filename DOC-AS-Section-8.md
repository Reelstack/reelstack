# 8. Visão de Dados (opcional)

## 8.1 Diagrama Entidade-Relacionamento (ER)

```mermaid
erDiagram
    profiles {
        uuid id PK
        text profile_name
        text bio
        text avatar_url
        timestamptz created_at
        timestamptz updated_at
    }
    collections {
        bigint id PK
        uuid profile_id FK
        text name
        text description
        text visibility
        text cover_image_url
        timestamptz created_at
        timestamptz updated_at
    }
    collection_movies {
        bigint collection_id FK
        text movie_id FK
        timestamptz added_at
    }
    movies {
        text tconst PK
        bigint title_type_id FK
        text primary_title
        text original_title
        boolean is_adult
        smallint start_year
        smallint end_year
        smallint runtime_minutes
        double average_rating
        bigint num_votes
        text director
        text actors
        text banner
    }
    title_types {
        bigint id PK
        text type_name
    }
    genres_name {
        bigint id PK
        text name
    }
    movie_genres {
        text movie_id FK
        bigint genre_id FK
    }
    user_movie_interactions {
        bigint id PK
        uuid profile_id FK
        text movie_id FK
        text interaction_type
        timestamptz created_at
    }
    user_preferences {
        bigint id PK
        uuid profile_id FK
        text preference_type
        text preference_value
    }

    profiles ||--o{ collections : "possui"
    collections ||--o{ collection_movies : "inclui"
    collection_movies }o--|| movies : "referencia"
    movies ||--o{ movie_genres : "tem"
    movie_genres }o--|| genres_name : "pertence_a"
    movies }o--|| title_types : "do_tipo"
    profiles ||--o{ user_movie_interactions : "faz"
    movies ||--o{ user_movie_interactions : "recebe"
    profiles ||--o{ user_preferences : "tem"
```

## 8.2 Melhorias Técnicas Recomendadas

- **Timestamps:** padronizar todas as colunas de data para `timestamptz DEFAULT now()`, garantindo consistência temporal em UTC.  
- **Índices:** criar índices para colunas de chave estrangeira e de filtro frequente (`profile_id`, `movie_id`, `genre_id`, `title_type_id`, `average_rating`, `num_votes`) para otimizar desempenho.  
- **UNIQUE compostas:** aplicar restrições em `(profile_id, movie_id)` em `user_movie_interactions` e `(profile_id, preference_type, preference_value)` em `user_preferences` para prevenir duplicações lógicas.  
- **ON DELETE:** definir políticas adequadas (`CASCADE` ou `SET NULL`) nas FKs derivadas de `profiles` e `collections` para evitar registros órfãos.  
- **Vetores:** planejar migração futura de campos de vetor (usuários e filmes) para o tipo **pgvector**, permitindo consultas vetoriais mais eficientes em recomendações.  
