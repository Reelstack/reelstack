```mermaid
%%{init:{
  'theme':'dark',
  'themeVariables':{
    'background':'transparent',
    'primaryTextColor':'#e6edf3',
    'lineColor':'#8b949e'
  },
  'themeCSS':'
    .edgeLabel{ color:#e6edf3 !important; fill:#e6edf3 !important; }
    .labelBkg{ fill:transparent !important; }
  '
}}%%
C4Context
title ReelStack – Diagrama Compacto (Centralizado)
Person(usuario, "Usuário", "Descobreorganiza filmes")
System_Boundary(rs, "ReelStack") {
System(reelstack, "Web App", "Recomendaorganiza filmes")
}
Person(admin, "Admin", "Gerenciadados")
System_Ext(tmdb, "TMDB", "Dadosfilmes")
System_Ext(postgres, "PostgreSQL", "Bancodados")
System_Ext(cdn, "CDN", "Imagens")
Rel(usuario, reelstack, "Navegador", "HTTPS")
Rel(admin, reelstack, "Console", "HTTPS")
Rel(reelstack, tmdb, "API TMDB", "HTTPS")
Rel(reelstack, postgres, "Persistência", "")
Rel(reelstack, cdn, "Imagens", "HTTPS")
UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
UpdateRelStyle(usuario, reelstack, $offsetY="-10")
UpdateRelStyle(admin, reelstack, $offsetY="10")
```

### Descrição do Contexto e Limites

O **ReelStack** é um sistema **web-first** que centraliza as funcionalidades de descoberta, recomendação e organização de filmes, fornecendo uma experiência de uso fluida baseada em gestos de swipe. Ele atua como intermediário entre o **usuário final**, que realiza interações como curtir, rejeitar e criar coleções, e as fontes externas de dados e mídia — notadamente a **API do TMDB**, utilizada como fonte exclusiva de metadados conforme a RN-005, e uma **CDN de imagens**, responsável pela entrega rápida de recursos visuais. Todas as interações entre navegador e sistema ocorrem via **HTTPS/TLS 1.3**, garantindo a proteção dos dados em trânsito e atendendo ao requisito não funcional de **segurança**.

O **Administrador** acessa o sistema por meio de um painel protegido, dedicado à gestão de dados internos, auditoria de logs e resolução de falhas operacionais, mantendo o controle de integridade e conformidade do sistema. O **Banco de Dados PostgreSQL** concentra o armazenamento de informações críticas — perfis, coleções, interações e vetores de recomendação — sustentando as operações do back-end e garantindo consistência relacional.

Essa arquitetura de contexto reforça os **NFRs de desempenho e segurança**, ao delimitar claramente as fronteiras de comunicação segura (TLS 1.3) e ao delegar tarefas de latência crítica — como o carregamento de imagens — para componentes otimizados (CDN). Além disso, o uso de uma API consolidada (TMDB) e o isolamento entre camadas de aplicação e dados favorecem o controle de tempo de resposta (swipe ≤1s p90 com 100 usuários) e a escalabilidade do MVP.

```mermaid
%%{init:{
  'theme':'dark',
  'themeVariables':{
    'background':'transparent',
    'primaryTextColor':'#e6edf3',
    'lineColor':'#8b949e'
  },
  'themeCSS':'
    .edgeLabel{ color:#e6edf3 !important; fill:#e6edf3 !important; }
    .labelBkg{ fill:transparent !important; }
  '
}}%%
C4Container
title ReelStack – Containers (GitHub-optimized)
Person(u, "Usuário")
Person(a, "Admin")
System_Boundary(rs, "ReelStack") {
Container_Boundary(f, "Frontend") {
Container(web, "Web(React/TS)", "SPA", "UI e coleções")
}
Container_Boundary(b, "Backend") {
Container(api, "API(Node/Express)", "REST", "Auth, recs, dados")
Container(vec, "Vetores(Python)", "Worker", "user/movie vectors")
}
Container_Boundary(d, "Dados") {
ContainerDb(db, "PostgreSQL", "Relacional", "Perfis, filmes, interações")
}
}
System_Ext(tmdb, "TMDB", "API filmes")
System_Ext(obs, "Observabilidade", "Logs/Métricas")
Rel(u, web, "Navegador", "HTTPS")
Rel(a, web, "Painel", "HTTPS")
Rel(web, api, "REST/JSON", "HTTPS/JWT")
Rel(api, db, "SQL")
Rel(api, vec, "Atualiza/Lê")
Rel(api, tmdb, "Consulta", "HTTPS")
Rel(api, obs, "Logs", "HTTPS")
UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="2")
UpdateRelStyle(web, api, $offsetY="-10")
UpdateRelStyle(api, db, $offsetY="10")
UpdateRelStyle(api, vec, $offsetX="-20")
```

### Justificativa Arquitetural

A arquitetura em **nível de containers** do ReelStack foi projetada para garantir **segurança, baixa latência** e **escalabilidade horizontal**, preservando a simplicidade de um MVP web-first. O **Frontend Web (SPA)**, desenvolvido em React/TypeScript, oferece uma experiência contínua e responsiva, minimizando recarregamentos de página e permitindo que interações de swipe ocorram em menos de 1 segundo (p90) graças à renderização local e cache leve de requisições. O **Backend API REST**, implementado em Node.js/Express, é responsável por autenticação, persistência e lógica de negócio, comunicando-se exclusivamente via **HTTPS/TLS 1.3** e utilizando **JSON** como formato padrão de troca de dados.

O **PostgreSQL** centraliza o armazenamento transacional (coleções, filmes, gêneros, interações), além dos **vetores de recomendação** (user_vectors e movie_vectors), garantindo consistência e integridade das informações. O **Serviço de Vetores**, modular e interno, realiza a manutenção dos dados de similaridade, otimizando as recomendações sem sobrecarregar o fluxo principal de requisições do usuário. Esse desacoplamento permite que o swipe responda rapidamente, mesmo durante cálculos de recomendação em segundo plano.

A comunicação com a **API do TMDB** ocorre de forma segura e assíncrona, assegurando conformidade com a RN-005 e reduzindo latência com caching e pré-carregamento seletivo. A camada de **observabilidade** coleta logs e métricas de latência (via Prometheus, Grafana ou ELK), permitindo monitorar tempos de resposta e detecção proativa de falhas. O uso consistente de TLS 1.3 em todas as conexões externas e a autenticação via **JWT** garantem a confidencialidade e integridade dos dados, atendendo diretamente aos NFRs de **desempenho** (swipe ≤1s p90) e **segurança**.
 