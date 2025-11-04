 # 1. Introdução
## 1.1 Finalidade
Este documento tem como finalidade descrever a arquitetura de software do sistema **ReelStack**, detalhando sua estrutura lógica, componentes, integrações e decisões arquiteturais que sustentam seu funcionamento. O objetivo é assegurar que todos os envolvidos no desenvolvimento, manutenção e evolução do sistema possuam uma visão unificada e tecnicamente fundamentada sobre sua concepção, atendendo aos requisitos funcionais e não funcionais especificados.
## 1.2 Escopo
O **ReelStack** é uma aplicação **web-first** voltada à recomendação personalizada de filmes, permitindo que usuários expressem preferências por meio de interações do tipo *swipe* (like/dislike), formem coleções temáticas e recebam sugestões baseadas em similaridade e histórico de interações.  
O sistema integra-se exclusivamente à API **TMDB (The Movie Database)** para obtenção de metadados de filmes, e utiliza autenticação via e-mail e senha. O backend opera sobre banco de dados **PostgreSQL**, conforme o esquema definido no artefato `schema.sql`. O sistema é protegido por autenticação **JWT**, comunicação segura via **TLS 1.3** e políticas de **Row-Level Security (RLS)** quando aplicável.
## 1.3 Definições, Acrônimos e Abreviações
| Termo | Definição |
|-------|------------|
| **API** | Interface de Programação de Aplicações, utilizada para integração com serviços externos. |
| **JWT** | *JSON Web Token*, padrão para autenticação e autorização baseada em tokens. |
| **TMDB** | *The Movie Database*, serviço externo de metadados de filmes e séries. |
| **RLS** | *Row-Level Security*, política de segurança em nível de linha do PostgreSQL. |
| **ETL** | *Extract, Transform, Load*, processo de extração, transformação e carga de dados. |
| **ReelStack** | Sistema de recomendação e gerenciamento de coleções de filmes desenvolvido neste projeto. |
## 1.4 Referências
- **REQUISITO_SOFTWARE.md** – Documento de requisitos funcionais, não funcionais e regras de negócio do projeto ReelStack.  
- **schema.sql** – Artefato contendo o esquema relacional completo do banco de dados PostgreSQL.  
- **Template_DocumentoArquiteturaSoftware.docx** – Modelo base utilizado para a estruturação deste documento conforme o método RUP/4+1.

# 2. Requisitos e Restrições da Arquitetura
A seguir são apresentados os principais requisitos e restrições arquiteturais do sistema **ReelStack**, definidos a partir dos requisitos funcionais, não funcionais e regras de negócio documentados.
| Categoria | Descrição | Decisão Arquitetural / Restrição |
|------------|------------|----------------------------------|
| **Linguagem / Plataforma** | O sistema deve ser web-first, priorizando compatibilidade com navegadores modernos e dispositivos móveis. | Implementação em **TypeScript/JavaScript (Node.js)** no backend e **React** no frontend. Arquitetura RESTful e comunicação via HTTPS. |
| **Segurança** | O acesso deve ser autenticado e autorizado de forma segura. | Utilização de **JWT (JSON Web Token)** para autenticação, **TLS 1.3** para criptografia de tráfego e **RLS (Row-Level Security)** no PostgreSQL para controle de acesso por perfil. |
| **Persistência** | O sistema deve armazenar dados de usuários, filmes, coleções e interações de forma consistente e rastreável. | Banco de dados **PostgreSQL**, conforme o artefato `schema.sql`. Tabelas normalizadas, chaves primárias compostas e *foreign keys* explícitas. |
| **Internacionalização** | O conteúdo deve ser adaptável a múltiplos idiomas. | MVP restrito ao idioma **português (pt-BR)**. Estrutura preparada para futura integração de i18n no frontend. |
| **Integração Externa (TMDB)** | Os metadados de filmes devem ser obtidos de fonte externa. | Integração exclusiva com a **API TMDB**, utilizando chave de acesso segura e cache local para otimização de requisições. |
| **Desempenho** | O sistema deve manter boa responsividade sob carga moderada. | Meta de **p90 ≤ 1s** de tempo de resposta com **até 100 usuários simultâneos** no MVP. Uso de cache em memória (Redis opcional) e otimização de consultas SQL. |
| **Manutenibilidade / Padronização** | O código deve seguir boas práticas e padrões de desenvolvimento. | Adoção de **ESLint**, **Prettier**, **TypeScript**, *design patterns* RESTful e versionamento semântico. Estrutura modular para facilitar testes e refatorações. |
| **Dependências / Infraestrutura** | A solução deve operar em ambiente escalável e seguro. | Implantação em **nuvem (AWS ou Supabase)**, com **PostgreSQL gerenciado** e suporte a **CI/CD** via GitHub Actions. Dependências gerenciadas por **npm**. |

<div style="text-align: right;">
<em>Tabela 1 – Requisitos e Restrições da Arquitetura do ReelStack</em>
</div>
