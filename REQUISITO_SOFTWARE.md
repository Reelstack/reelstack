# ReelStack  
**Grupo:**  
**Documento de Requisitos de Software**  
**Data:** 16/09/25  
---
## Introdução  
### Propósito do documento  
Este documento tem como objetivo definir e consolidar os requisitos do sistema **ReelStack**, servindo como base para as fases de projeto, desenvolvimento, testes e manutenção do software.  
### Definições, acrônimos e abreviações  
- **CRUD** – Create, Read, Update, Delete: operações básicas de manipulação de dados.  
- **TMDB** – The Movie Database: API gratuita utilizada para obter dados de filmes e séries.  
- **MVP** – Produto Mínimo Viável.  
- **Swipe** – Gesto horizontal (arrastar para esquerda/direita) usado para rejeitar ou aceitar sugestões.  
### Metodologia de elicitação  
Os requisitos foram identificados por meio das seguintes técnicas:  
- Discussões em grupo entre os membros da equipe (abril–maio de 2025).  
- Prototipagem inicial de interface e fluxo de usuário (versão 0.1, maio de 2025).  
- Entrevistas informais com colegas consumidores de streaming (amostra de 5 pessoas).  
---
## Visão geral dos requisitos funcionais  
### Escolha de abordagem  
O projeto utilizará **Histórias de Usuário** para representar os requisitos funcionais.  
### Justificativa  
Essa abordagem foi escolhida por ser adequada ao desenvolvimento incremental e centrado no usuário, permitindo descrever as funcionalidades sob a perspectiva de quem utiliza o sistema.  
A priorização das histórias seguiu a técnica **MoSCoW** (Must, Should, Could, Won’t).  
### Backlog do Produto (versão atual)  
| ID   | Título                        | Valor de Negócio                                     | Prioridade | Estimativa (pts) | Dependências         |
|------|--------------------------------|------------------------------------------------------|------------|------------------|----------------------|
| US01 | Cadastrar novo usuário         | Permite o uso do sistema e armazenamento de preferências | Must       | 3                | N/A                  |
| US02 | Fazer login                   | Acesso seguro e individualizado ao sistema           | Must       | 2                | US01                 |
| US03 | Visualizar filme recomendado  | Início da experiência principal do usuário           | Must       | 3                | US02, API TMDB       |
| US04 | Curtir/rejeitar filme (swipe) | Coleta dados para o algoritmo de recomendação        | Must       | 5                | US03                 |
| US05 | Salvar interação no backend   | Armazena preferências do usuário                     | Must       | 4                | US04                 |
| US06 | Visualizar histórico de curtidas | Permite ao usuário rever seus filmes favoritos     | Should     | 3                | US05                 |
| US07 | Exibir mensagem de erro       | Garante feedback ao usuário em falhas                | Should     | 2                | US01, US02, US03     |
| US08 | Design responsivo para web    | Permite uso confortável em qualquer navegador        | Could      | 3                | US03, US04           |
| US09 | Interface de swipe animada    | Melhora a experiência de interação                   | Could      | 5                | US04                 |
| US10 | Validação de campos no frontend | Evita erros de cadastro e login                    | Should     | 2                | US01, US02           |

 <p>As funcionalidades mais críticas estão relacionadas à experiência de recomendação: visualizar filmes, interagir com eles por meio de gestos (swipe) e manter um histórico de preferências. O cadastro e login garantem a vinculação dessas interações ao usuário, permitindo um aprendizado contínuo do algoritmo.</p>

---
## Especificação dos requisitos funcionais  
### US01 – Cadastrar novo usuário  
**Responsável:** [Nome do integrante]  
**Descrição:**  
Como visitante, quero me cadastrar com e-mail e senha, para salvar minhas preferências e utilizar o sistema posteriormente.  
**Critérios de aceite:**  
- **GIVEN** que o visitante preenche o formulário com e-mail e senha válidos,  
 **WHEN** clicar em "Cadastrar",  
 **THEN** o sistema deve criar a conta e redirecionar o usuário à tela inicial.  
- **GIVEN** que o e-mail já esteja cadastrado,  
 **WHEN** tentar registrar,  
 **THEN** o sistema deve informar que o e-mail já está em uso.  
**Dependências:** Nenhuma  
---
### US02 – Fazer login  
**Responsável:** [Nome do integrante]  
**Descrição:**  
Como usuário registrado, quero fazer login com meu e-mail e senha, para acessar minhas preferências e continuar de onde parei.  
**Critérios de aceite:**  
- **GIVEN** que o usuário insira e-mail e senha válidos,  
 **WHEN** clicar em "Entrar",  
 **THEN** ele deve ser autenticado e redirecionado à tela inicial.  
- Caso as credenciais sejam incorretas, o sistema deve exibir uma mensagem de erro.  
**Dependências:** US01  
---
### US03 – Visualizar filme recomendado  
**Responsável:** [Nome do integrante]  
**Descrição:**  
Como usuário logado, quero visualizar um card com dados de um filme (imagem, título, ano e sinopse), para decidir se me interesso por ele.  
**Critérios de aceite:**  
- O sistema deve exibir o card com informações básicas.  
- A cada interação (curtir/rejeitar), um novo filme deve ser carregado.  
- Em caso de erro com a API, uma mensagem de falha deve ser exibida.  
**Dependências:** US02, API TMDB  
---
### US04 – Curtir/rejeitar filme (swipe)  
**Responsável:** [Nome do integrante]  
**Descrição:**  
Como usuário, quero curtir ou rejeitar um filme com um gesto (swipe), para treinar o algoritmo de recomendação.  
**Critérios de aceite:**  
- Swipe para a direita → marcar como “curtido”.  
- Swipe para a esquerda → marcar como “rejeitado”.  
- O sistema deve registrar a interação e exibir o próximo filme.  
- A mesma interação não pode ser registrada mais de uma vez.  
**Dependências:** US03  
---
### US05 – Visualizar histórico de curtidas  
**Responsável:** [Nome do integrante]  
**Descrição:**  
Como usuário, quero acessar uma tela com todos os filmes que já curti, para poder lembrar e procurar esses filmes depois.  
**Critérios de aceite:**  
- O sistema deve exibir lista com imagem e título dos filmes curtidos.  
- Caso não haja filmes, deve exibir a mensagem “nenhum item encontrado”.  
- O histórico só deve ser acessado após autenticação.  
**Dependências:** US04  
---
## Lista de Regras de Negócio  
- **RN-001 – Recomendação não repetida:** filmes rejeitados não devem ser exibidos novamente.  
- **RN-002 – Interação única por filme:** cada usuário só pode curtir ou rejeitar um filme uma vez.  
- **RN-003 – Acesso restrito ao histórico:** apenas usuários autenticados podem visualizar seu histórico.  
- **RN-004 – Dados mínimos obrigatórios:** cada filme deve ter título, imagem, ano e descrição.  
- **RN-005 – Fonte exclusiva de dados:** os filmes devem ser obtidos apenas da API TMDB.  
- **RN-006 – Validação obrigatória de campos:** cadastro e login só podem ser feitos com e-mail e senha preenchidos.  
- **RN-007 – Mensagens de erro obrigatórias:** qualquer falha deve gerar feedback claro ao usuário.  
---
## Lista de Requisitos Não Funcionais  
- **RNF-001 – Desempenho:** resposta ao swipe em ≤ 1 s para 90% dos casos (até 100 usuários simultâneos).  
- **RNF-002 – Segurança:** toda comunicação deve usar TLS 1.3 com certificado válido.  
- **RNF-003 – Usabilidade:** onboarding concluído em até 5 min com taxa de sucesso ≥ 85%.  
- **RNF-004 – Compatibilidade:** suporte a Chrome, Firefox e Edge (últimas versões).  
- **RNF-005 – Usabilidade:** mensagens de erro claras e específicas em todas as falhas.  
- **RNF-006 – Manutenibilidade:** código deve seguir convenções e documentar todas as funções públicas.  
---
## Declaração de uso ético e responsável de IA  
O grupo declara que utilizou ferramentas de inteligência artificial generativa, especificamente o modelo [**ChatGPT-4 (OpenAI)**](https://openai.com/pt-BR/index/chatgpt/), para auxiliar na estruturação, formulação e revisão deste documento (maio de 2025).  
- Seções com suporte da IA: Introdução, requisitos funcionais, histórias de usuário, regras de negócio, requisitos não funcionais e revisão técnica.  
- Todo o conteúdo foi revisado criticamente pelos membros do grupo, garantindo exatidão, clareza e conformidade acadêmica.  
- Dados sensíveis não foram incluídos; apenas exemplos genéricos foram usados.  
- O uso de IA foi ético, transparente e em conformidade com as diretrizes institucionais de integridade acadêmica.

  ---
  
<p align="center">
 <img src="https://ucb.catolica.edu.br/hs-fs/hubfs/Logo%20Cat%C3%B3lica-01%201.png?width=200&height=40&name=Logo%20Cat%C3%B3lica-01%201.png" alt="UCB" width="300">
</p>
