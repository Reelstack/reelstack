# ReelStack  
**Grupo:**  
**Documento de Requisitos de Software**  
**Data:** 17/09/25  
---
## Introdução  
### Propósito do documento  
Este documento tem como objetivo definir e consolidar os requisitos do sistema **ReelStack**, servindo como base para as fases de projeto, desenvolvimento, testes e manutenção do software.  
### Definições, acrônimos e abreviações  
- **CRUD** – Create, Read, Update, Delete: operações básicas de manipulação de dados.  
- **TMDB** – The Movie Database: API gratuita utilizada para obter dados de filmes e séries.  
- **MVP** – Produto Mínimo Viável.  
- **Swipe** – Gesto horizontal (arrastar para esquerda/direita) usado para rejeitar ou aceitar sugestões.  
### Metodologia de Levantamento de Requisitos
O levantamento de requisitos foi conduzido com base em abordagens colaborativas e centradas no usuário, integrando práticas de _Design Thinking_, _Scrum_ e _User-Centered Design_. Inicialmente, a equipe realizou sessões de discussão em grupo para explorar o problema e levantar hipóteses sobre as necessidades dos usuários. Em paralelo, foi desenvolvida uma prototipagem inicial da interface e do fluxo de navegação, permitindo testes exploratórios e coleta de feedback qualitativo.

Para enriquecer a compreensão do perfil do usuário, foram realizadas entrevistas informais com consumidores reais do serviço, o que possibilitou validar expectativas e ajustar funcionalidades. As informações obtidas foram organizadas em histórias de usuário e estruturadas em um backlog, que passou por ciclos de refinamento e priorização com base em novas discussões internas. Todo o processo foi alinhado às diretrizes metodológicas da disciplina, garantindo coerência entre os objetivos técnicos e pedagógicos do projeto.
  
---
## Visão geral dos requisitos funcionais  
### Escolha de abordagem  
O projeto utilizará **Histórias de Usuário** para representar os requisitos funcionais.  
### Justificativa  
Essa abordagem foi escolhida por ser adequada ao desenvolvimento incremental e centrado no usuário, permitindo descrever as funcionalidades sob a perspectiva de quem utiliza o sistema.  
A priorização das histórias seguiu a técnica **MoSCoW** (Must, Should, Could, Won’t).  

---
## Seção 1 – Backlog Resumido  
| ID   | Título                          | Valor de Negócio                                                   | Prioridade | Estimativa (pts) | Dependências       |
|------|----------------------------------|--------------------------------------------------------------------|------------|------------------|--------------------|
| US01 | Autenticação e conta             | Permite consultar os dados cadastrados do usuário para autenticação | Must       | 3                | US02, US03         |
| US02 | Cadastrar novo usuário           | Permite armazenamento de preferências                              | Must       | 3                | N/A                |
| US03 | Fazer login                     | Acesso seguro e individualizado ao sistema                         | Must       | 2                | US02               |
| US04 | Engajamento com conteúdo         | Experiência do usuário ao interagir com catálogo de filmes         | Must       | –                | US05, US06, US07   |
| US05 | Visualizar filme recomendado     | Início da experiência principal                                    | Must       | 3                | –                  |
| US06 | Curtir/rejeitar filme (swipe)    | Coleta dados para o algoritmo de recomendação                      | Must       | 5                | US03               |
| US07 | Visualizar histórico de curtidas | Permite rever filmes favoritos                                     | Should     | 3                | US05               |
| US08 | Comunicação e feedback ao usuário| Fornece informações claras sobre estados de carregamento           | Should     | –                | US09               |
| US09 | Exibir mensagem de erro          | Garante feedback em falhas                                         | Should     | 2                | US01, US02, US03   |
---
## Seção 2 – Histórias Detalhadas  
### US01 – Autenticar e conta  
**Como** usuário,  
**Quero** autenticar meus dados cadastrados no sistema,  
**Para** garantir acesso seguro às minhas informações e funcionalidades.  
**Critérios de aceite**  
- **Dado** que o usuário já possua cadastro, **quando** inserir credenciais válidas, **então** o sistema deve autenticar e liberar o acesso.  
- **Dado** que o usuário insira credenciais inválidas, **quando** tentar acessar, **então** o sistema deve negar o login e exibir mensagem de erro.  
- **Dado** que o usuário não esteja autenticado, **quando** tentar acessar áreas restritas, **então** o sistema deve redirecioná-lo para a tela de login.
- **Dado** que o usuário não esteja cadastrado, **quando** tentar realizar o login, **então** o sistema deve redirecioná-lo para a tela de cadastro.  
---
### US02 – Cadastrar novo usuário  
**Como** visitante,  
**Quero** me cadastrar com e-mail e senha,  
**Para** poder salvar minhas preferências e utilizar o sistema posteriormente.  
**Critérios de aceite**  
- **Dado** que o visitante preencha o formulário com dados válidos, **quando** clicar em “Cadastrar”, **então** a conta deve ser criada e o usuário redirecionado para a tela inicial.  
- **Dado** que o visitante use um e-mail já existente, **quando** tentar cadastrar, **então** o sistema deve informar que o e-mail já está em uso.  
---
### US03 – Fazer login  
**Como** usuário registrado,  
**Quero** acessar o sistema com e-mail e senha,  
**Para** continuar de onde parei e visualizar minhas preferências.  
**Critérios de aceite**  
- **Dado** que o usuário insira credenciais corretas, **quando** clicar em “Entrar”, **então** deve ser autenticado e redirecionado à tela inicial.  
- **Dado** que o usuário insira credenciais inválidas, **quando** tentar autenticar, **então** deve visualizar uma mensagem de erro.  
---
### US04 – Engajamento com conteúdo  
**Como** usuário,  
**Quero** interagir com o catálogo de filmes disponíveis,  
**Para** ter uma experiência dinâmica e personalizada com o sistema.  
**Critérios de aceite**  
- **Dado** que o usuário esteja autenticado, **quando** acessar o catálogo, **então** deve visualizar os filmes disponíveis.  
- **Dado** que o usuário interaja com filmes, **quando** realizar ações (curtir, rejeitar, visualizar), **então** o sistema deve registrar a interação corretamente.  
---
### US05 – Visualizar filme recomendado  
**Como** usuário logado,  
**Quero** visualizar cards com informações de filmes recomendados,  
**Para** decidir se me interesso por eles.  
**Critérios de aceite**  
- **Dado** que o usuário esteja autenticado, **quando** acessar a tela de recomendações, **então** deve visualizar cards com título, imagem, ano e sinopse.  
- **Dado** que o usuário interaja (curtir/rejeitar), **quando** concluir a ação, **então** o próximo filme deve ser carregado automaticamente.  
---
### US06 – Curtir/rejeitar filme (swipe)  
**Como** usuário,  
**Quero** curtir ou rejeitar filmes com um gesto (swipe),  
**Para** treinar o algoritmo de recomendação com base nas minhas preferências.  
**Critérios de aceite**  
- **Dado** que o usuário faça swipe para a direita, **então** o filme deve ser marcado como curtido.  
- **Dado** que o usuário faça swipe para a esquerda, **então** o filme deve ser marcado como rejeitado.  
- **Dado** que o usuário já tenha interagido com o filme, **quando** tentar repetir a ação, **então** o sistema deve impedir duplicidade.  
---
### US07 – Visualizar histórico de curtidas  
**Como** usuário,  
**Quero** acessar uma tela com todos os filmes que já curti,  
**Para** poder rever e procurar esses filmes depois.  
**Critérios de aceite**  
- **Dado** que o usuário tenha curtido filmes, **quando** acessar o histórico, **então** deve visualizar lista com título e imagem.  
- **Dado** que não haja filmes curtidos, **quando** acessar o histórico, **então** o sistema deve exibir mensagem “nenhum item encontrado”.  
- **Dado** que o usuário não esteja autenticado, **quando** tentar acessar o histórico, **então** deve ser redirecionado para o login.  
---
### US08 – Comunicação e feedback ao usuário  
**Como** usuário,  
**Quero** receber informações claras sobre o carregamento e estado das ações,  
**Para** ter maior confiança e engajamento ao interagir com o sistema.  
**Critérios de aceite**  
- **Dado** que o sistema esteja processando uma requisição, **quando** houver carregamento, **então** deve exibir indicador visual (ex: spinner).  
- **Dado** que a ação seja concluída com sucesso, **quando** finalizada, **então** deve exibir mensagem de confirmação.  
- **Dado** que ocorra erro, **quando** detectado, **então** deve exibir mensagem clara ao usuário.  
---
### US09 – Exibir mensagem de erro  
**Como** usuário,  
**Quero** visualizar mensagens de erro claras,  
**Para** entender problemas e tomar as ações necessárias.  
**Critérios de aceite**  
- **Dado** que o usuário insira credenciais incorretas, **quando** tentar login, **então** o sistema deve exibir mensagem de erro específica.  
- **Dado** que ocorra falha de rede ou API, **quando** o sistema não conseguir carregar dados, **então** deve exibir mensagem de falha.  
- **Dado** que uma ação seja inválida ou repetida, **quando** for detectada, **então** deve exibir aviso apropriado.  
---
## Lista de Regras de Negócio  
### RN-001 – Recomendação não repetida  
- **Descrição:** Um filme rejeitado por determinado usuário não pode ser sugerido novamente para ele nos próximos 2 meses.  
- **Objetivo:** Garantir que a experiência de recomendação seja personalizada e não repetitiva.  
- **Fonte/autoridade:** Política de recomendação do ReelStack, versão 1.0.  
- **Impacto:** Requisito US05 – Visualizar filme recomendado; US06 – Curtir/rejeitar filme.  
---
### RN-002 – Interação única por filme  
- **Descrição:** Cada usuário pode curtir ou rejeitar um filme apenas uma vez. Filmes sugeridos novamente deverão ter seu registro de rejeição anterior apagado.
- **Objetivo:** Evitar duplicidade de registros que possam distorcer o algoritmo de recomendação.  
- **Fonte/autoridade:** Lógica de integridade do banco de dados.  
- **Impacto:** Requisito US06 – Curtir/rejeitar filme; US05 – Salvar interação no backend.  
---
### RN-003 – Acesso restrito ao histórico  
- **Descrição:** Apenas usuários autenticados podem acessar o histórico de filmes curtidos.  
- **Objetivo:** Garantir segurança e privacidade dos dados de preferência do usuário.  
- **Fonte/autoridade:** Política mínima de autenticação para acesso a dados personalizados.  
- **Impacto:** Requisito US07 – Visualizar histórico de curtidas.  
---
### RN-004 – Dados mínimos obrigatórios do filme  
- **Descrição:** Todo filme exibido deve conter, no mínimo, título, imagem, ano de lançamento e sinopse.  
- **Objetivo:** Assegurar consistência nas informações apresentadas e melhor experiência de navegação.  
- **Fonte/autoridade:** Estrutura da API TMDB.  
- **Impacto:** Requisito US05 – Visualizar filme recomendado.  
---
### RN-005 – Fonte de dados exclusiva  
- **Descrição:** Todos os dados de filmes e séries devem ser obtidos exclusivamente da API oficial do TMDB.  
- **Objetivo:** Garantir padronização, confiabilidade e atualização contínua das informações.  
- **Fonte/autoridade:** Decisão técnica de integração, Documento de Visão v1.0.  
- **Impacto:** Requisitos US05 – Visualizar filme recomendado; US06 – Curtir/rejeitar filme.  
---
### RN-006 – Validação obrigatória de campos  
- **Descrição:** O sistema deve validar o preenchimento de campos obrigatórios (e-mail e senha) antes de permitir cadastro ou login.  
- **Objetivo:** Prevenir falhas de autenticação e melhorar a experiência de uso.  
- **Fonte/autoridade:** Boas práticas de UX e validação de entrada.  
- **Impacto:** Requisitos US02 – Cadastrar novo usuário; US03 – Fazer login.  
---
### RN-007 – Mensagem de erro obrigatória  
- **Descrição:** Toda operação que falhar (login inválido, erro de carregamento, tentativa duplicada) deve gerar mensagem clara e específica ao usuário.  
- **Objetivo:** Garantir feedback adequado para que o usuário compreenda a falha e saiba como agir.  
- **Fonte/autoridade:** Diretriz de usabilidade e feedback visual do sistema.  
- **Impacto:** Requisitos US01, US02, US03, US09.
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
O grupo declara que utilizou ferramentas de inteligência artificial generativa, especificamente o modelo **[ChatGPT-4 (OpenAI)](https://openai.com/pt-BR/index/chatgpt/)**, para auxiliar na estruturação, formulação e revisão deste documento (maio de 2025 - setembro de 2025).  
- Seções com suporte da IA: Introdução, requisitos funcionais, histórias de usuário, regras de negócio, requisitos não funcionais e revisão técnica.  
- Todo o conteúdo foi revisado criticamente pelos membros do grupo, garantindo exatidão, clareza e conformidade acadêmica.  
- Dados sensíveis não foram incluídos; apenas exemplos genéricos foram usados.  
- O uso de IA foi ético, transparente e em conformidade com as diretrizes institucionais de integridade acadêmica.  
---
<p align="center">  
<img src="https://ucb.catolica.edu.br/hs-fs/hubfs/Logo%20Cat%C3%B3lica-01%201.png?width=200&height=40" alt="UCB" width="300">  
</p>
