# Documentação da API 

## Visão Geral

A API do BeelBack foi reorganizada em uma arquitetura modular e extensível que pode facilmente acomodar novas APIs e serviços.

## Estrutura

```
src/services/
├── api/
│   ├── types.ts          # Todas as interfaces TypeScript relacionadas à API
│   ├── base.ts           # Classe base do cliente API
│   ├── omdb.ts           # Implementação do serviço da API OMDb
│   └── index.ts          # Exportações principais
├── hooks/
│   ├── useOMDB.ts        # Hook React para API OMDb
│   └── index.ts          # Exportações dos hooks
└── index.ts               # Exportações principais dos serviços
```

## Componentes Principais

### 1. Cliente Base da API (`base.ts`)

Classe abstrata base que fornece:
- Tratamento de requisições HTTP com suporte a timeout
- Tratamento de erros e validação de resposta
- Gerenciamento de configuração comum
- Controlador de aborto para cancelamento de requisições

**Uso:**
```typescript
export class MeuServicoAPI extends BaseAPIClient {
    constructor() {
        const config: APIConfig = {
            baseURL: 'https://api.exemplo.com/',
            apiKey: 'sua-chave-api',
            timeout: 10000
        };
        super(config);
    }
}
```

### 2. Definições de Tipos (`types.ts`)

Interfaces TypeScript centralizadas para:
- Respostas da API
- Parâmetros de requisição
- Objetos de configuração
- Wrappers de resposta genéricos

**Tipos Principais:**
- `APIResponse<T>` - Wrapper genérico de resposta
- `APIConfig` - Interface de configuração da API
- `OMDBMovie`, `OMDBSearchResponse`, `OMDBMovieDetail` - Tipos específicos do OMDb

### 3. Serviço OMDb (`omdb.ts`)

Implementação concreta estendendo BaseAPIClient:
- Funcionalidade de busca de filmes
- Recuperação de informações detalhadas de filmes
- Tratamento de erros específico da API OMDb
- Serviço baseado em instância (não estático)

**Métodos:**
- `searchMovies(query, year?, type?)` - Busca filmes por título
- `getMovieById(imdbId)` - Obtém detalhes por ID do IMDB
- `getMovieByTitle(title, year?)` - Obtém detalhes por título
- `getMoviesByTitle(title, year?)` - Obtém múltiplos filmes por título

### 4. Hooks React (`hooks/`)

Hooks personalizados para gerenciamento de estado:
- `useOMDB()` - Gerencia estado e operações da API OMDb
- Estados de carregamento, tratamento de erros e gerenciamento de dados
- Callbacks memorizados para performance

## Adicionando Novas APIs

### Passo 1: Definir Tipos
```typescript
// src/services/api/types.ts
export interface RespostaNovaAPI {
    dados: any;
    status: string;
}
```

### Passo 2: Criar Serviço
```typescript
// src/services/api/novaapi.ts
import { BaseAPIClient } from './base';
import type { RespostaNovaAPI, APIConfig } from './types';

export class NovaAPIService extends BaseAPIClient {
    constructor() {
        const config: APIConfig = {
            baseURL: 'https://novaapi.com/',
            apiKey: import.meta.env.VITE_NOVA_API_KEY,
            timeout: 15000
        };
        super(config);
    }

    async obterDados(): Promise<RespostaNovaAPI> {
        return this.makeRequest<RespostaNovaAPI>('/endpoint');
    }
}
```

### Passo 3: Criar Hook
```typescript
// src/hooks/useNovaAPI.ts
import { useState, useCallback } from 'react';
import { NovaAPIService } from '../services/api/novaapi';

export const useNovaAPI = () => {
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState(null);
    
    const servico = new NovaAPIService();
    
    const obterDados = useCallback(async () => {
        setCarregando(true);
        try {
            const resultado = await servico.obterDados();
            setDados(resultado);
        } catch (err) {
            setErro(err.message);
        } finally {
            setCarregando(false);
        }
    }, [servico]);
    
    return { dados, carregando, erro, obterDados };
};
```

### Passo 4: Exportar
```typescript
// src/services/index.ts
export { NovaAPIService } from './api/novaapi';
export type { RespostaNovaAPI } from './api/types';
```

## Benefícios

1. **Modularidade** - Fácil adicionar novas APIs sem afetar as existentes
2. **Reutilização** - Funcionalidade comum compartilhada através de classes base
3. **Segurança de Tipos** - Definições de tipos centralizadas
4. **Tratamento de Erros** - Tratamento de erros consistente em todos os serviços
5. **Configuração** - Gerenciamento de configuração flexível
6. **Testes** - Fácil mockar e testar componentes individuais
7. **Manutenção** - Separação clara de responsabilidades

## Variáveis de Ambiente

Variáveis de ambiente necessárias:
```bash
VITE_OMDB_API_KEY=sua_chave_api_omdb_aqui
```

## Exemplos de Uso

### Uso Básico do Serviço
```typescript
import { OMDBService } from '../services';

const omdb = new OMDBService();
const filmes = await omdb.searchMovies('Batman');
```

### Uso do Hook
```typescript
import { useOMDB } from '../hooks';

const { searchMovies, loading, error, data } = useOMDB();
searchMovies('Vingadores');
```

### Estendendo para Novas APIs
```typescript
import { BaseAPIClient } from '../services';

class ServicoSpotify extends BaseAPIClient {
    // Implementar métodos específicos do Spotify
}
```

## Tratamento de Erros

A API inclui tratamento robusto de erros:

- **Timeouts** - Requisições são canceladas automaticamente
- **Erros HTTP** - Status codes são tratados adequadamente
- **Erros da API** - Respostas de erro são capturadas e tratadas
- **Fallbacks** - Mensagens de erro padrão para casos desconhecidos

## Configuração de Timeout

Cada serviço pode configurar seu próprio timeout:

```typescript
const config: APIConfig = {
    baseURL: 'https://api.exemplo.com/',
    apiKey: 'chave-api',
    timeout: 10000 // 10 segundos
};
```

## Suporte a Abort Controller

Todas as requisições suportam cancelamento:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

// A requisição será cancelada automaticamente após o timeout
```

## Estrutura de Resposta Padrão

Todas as APIs seguem um padrão de resposta consistente:

```typescript
interface APIResponse<T> {
    data: T | null;      // Dados da resposta
    loading: boolean;     // Estado de carregamento
    error: string | null; // Mensagem de erro (se houver)
}
```

## Considerações de Performance

- **Callbacks memorizados** - Evitam re-renderizações desnecessárias
- **Timeouts configuráveis** - Previnem requisições pendentes
- **Abort controller** - Permite cancelamento de requisições
- **Lazy loading** - Serviços são instanciados apenas quando necessário

## Próximos Passos

Para expandir a API:

1. **Identificar nova fonte de dados**
2. **Definir interfaces TypeScript**
3. **Criar serviço estendendo BaseAPIClient**
4. **Implementar hook React personalizado**
5. **Adicionar testes unitários**
6. **Documentar novos endpoints**

## Suporte

Para dúvidas sobre a implementação da API, consulte:
- Código fonte em `src/services/api/`
- Hooks em `src/hooks/`
- Tipos em `src/services/api/types.ts`
