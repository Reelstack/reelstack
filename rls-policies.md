#  Configuração e Planejamento de Políticas de RLS (Row-Level Security)

##  Visão Geral

Este documento descreve a configuração atual e o planejamento futuro das **políticas de segurança (RLS)** utilizadas no banco de dados hospedado no **Supabase**.  
O objetivo é garantir um **ambiente de desenvolvimento ágil no presente**, mas com **segurança robusta e granular em produção**.
Atualmente, o foco do projeto está no **consumo da API do banco** e na integração de dados, portanto as políticas estão **propositalmente permissivas** para facilitar os testes e o desenvolvimento.  
Entretanto, **há a preocupação e o compromisso de endurecer as políticas** antes da entrega ou publicação final do projeto.

---
##  Situação Atual (Desenvolvimento)
Durante a fase de desenvolvimento, todas as tabelas estão com **RLS ativado**, mas com **políticas amplamente permissivas**.
Essas políticas permitem todas as operações de **DML (INSERT, UPDATE, DELETE)**, **DDL (ALTER, DROP, CREATE)** e **DTL (SELECT, TRUNCATE)** sem restrições de usuário.
```sql
-- Exemplo de política permissiva de desenvolvimento
CREATE POLICY "Permitir todas as operações (DEV)"
ON public.nome_da_tabela
FOR ALL
USING (true)
WITH CHECK (true);
-- Garantir que o RLS esteja habilitado
ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;
```
Essas configurações têm caráter temporário e não serão mantidas na versão final do projeto.
Elas existem apenas para permitir um fluxo de desenvolvimento rápido e sem bloqueios durante o consumo e manipulação dos dados pela API.

---

## Planejamento Futuro (Produção)

Quando o projeto atingir o estágio de produção ou revisão final, todas as políticas serão revistas e substituídas por **regras seguras baseadas no usuário autenticado**.

### Objetivos da versão final:

• Restringir o acesso de leitura/escrita por **usuário autenticado (auth.uid())**.
• Garantir que **cada usuário veja apenas os próprios registros**.
• Aplicar **políticas específicas por tipo de operação (SELECT, INSERT, UPDATE, DELETE)**.
• Implementar **diferentes níveis de permissão** conforme o papel do usuário (admin, analista, etc.).
• Criar **scripts de migração versionados** em SQL para padronizar a aplicação das políticas.

---

## Exemplo de Políticas Restritivas (Produção)

Abaixo está um exemplo de como as políticas serão implementadas no ambiente final:
```sql
-- SELECT: usuário vê apenas os próprios registros
CREATE POLICY "Usuário pode ler apenas seus dados"
ON public.nome_da_tabela
FOR SELECT
USING (auth.uid() = user_id);
-- INSERT: usuário só insere dados em seu nome
CREATE POLICY "Usuário pode inserir seus próprios dados"
ON public.nome_da_tabela
FOR INSERT
WITH CHECK (auth.uid() = user_id);
-- UPDATE: usuário só atualiza seus próprios dados
CREATE POLICY "Usuário pode atualizar seus próprios dados"
ON public.nome_da_tabela
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- DELETE: usuário só pode deletar seus próprios registros
CREATE POLICY "Usuário pode deletar seus próprios dados"
ON public.nome_da_tabela
FOR DELETE
USING (auth.uid() = user_id);
```
## Controle por Papéis (Roles)

Em casos onde existam papéis diferentes (ex: admin, user, service), serão criadas políticas complementares com base em **JWT claims** ou funções internas do Supabase:
```sql
-- Administradores podem visualizar todos os dados
CREATE POLICY "Admins podem visualizar todos os dados"
ON public.nome_da_tabela
FOR SELECT
USING (auth.role() = 'admin');
```
Essas roles poderão ser definidas dentro do Supabase, em **Auth → Policies → JWT Custom Claims**, permitindo granularidade de acesso sem duplicar tabelas.

---

## Testes e Validação das Políticas
O Supabase oferece uma ferramenta nativa para simulação de políticas:
**Dashboard → Auth → Policies → Simulate**

Antes de ir para produção, todos os testes de acesso serão realizados para:
• Confirmar que usuários comuns veem apenas seus próprios dados.
• Verificar se administradores têm acesso ampliado quando necessário.
• Garantir que tentativas de operações não permitidas sejam bloqueadas.

---

## Boas Práticas
•  **Ativar RLS** em todas as tabelas sensíveis.
•  **Versionar políticas** em scripts SQL dentro de /sql/policies/.
•  Evitar USING (true) e WITH CHECK (true) fora de desenvolvimento.
•  **Centralizar lógica de acesso em views** para limitar colunas expostas na API.
•  **Auditar operações** sensíveis com triggers de log ou tabelas de histórico.

## Estrutura Recomendada do Projeto

```bash
/docs
 └── security/
       ├── rls-policies.md       ← este documento
/sql
 └── policies/
       ├── dev_policies.sql      ← políticas abertas (fase atual)
       ├── prod_policies.sql     ← políticas restritivas (versão final)
       └── enable_rls.sql        ← comandos para ativar RLS nas tabelas
```

## Recursos de Referência

• [Supabase Docs — Policies](https://supabase.com/docs/guides/database/postgres/row-level-security)
• [PostgreSQL Docs — CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)
• [Supabase Auth — Custom JWT Claims](https://supabase.com/docs/guides/auth/auth-jwt-claims)

