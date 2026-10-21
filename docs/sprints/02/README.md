# Sprint 02 · ER, DAO e primeira integração

**Status:** versão proposta de transição; não é um commit histórico de aula.

Entregas previstas: ER, escolha do DAO e CRUDs iniciais de aluno/empresa com interface comunicando com backend. O ER está em [modelos.md](modelos.md). A estratégia de acesso usa consultas parametrizadas e lotes; o código final pode ser inspecionado em `src/models/Repository.mjs`.

Fluxos iniciais: POST /api/register cria aluno ou empresa; GET /api/me consulta o próprio cadastro; PUT /api/me atualiza; DELETE /api/me desativa. Login e sessão são pré-condições. O primeiro recorte prioriza campos, validação e persistência; Sprint 03 integra transações e cupons ao fluxo final. Não foi fabricado um código parcial diferente do projeto final para fingir uma entrega passada.

Decisão: exclusão lógica evita quebrar o extrato. O Model conceitual é mapeado para tabelas; perfis viram a coluna role. SQL local em `db/migration.sql`; SQL de implantação em `drizzle/`.

Planejamento sugerido dos 100 minutos: 20 ER, 20 DAO/migração, 45 formulários e CRUD, 15 teste e revisão.
