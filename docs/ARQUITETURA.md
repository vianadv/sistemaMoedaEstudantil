# Arquitetura MVC e camada de persistência

## Decisão de escopo

Um monólito web, com uma interface e uma API no mesmo domínio. Não há microserviços, filas externas ou aplicativos separados. Para três aulas de 1h40, concentramos a complexidade nas regras exigidas: saldos, transações e cupons.

## MVC no código real

| Papel | Implementação | Responsabilidade |
|---|---|---|
| View | `src/views/index.html`, `style.css`, `app.js` | Exibir formulários, navegar entre perfis, chamar API e mostrar feedback |
| Controller | função `api()` em `src/controllers/AppController.mjs` | Interpretar HTTP, autenticar, autorizar, validar entrada e devolver JSON |
| Model / domínio | `MeritService`, `EmailService` e registros do banco | Aplicar reconhecimento, resgate, semestre e notificação |
| Model / mensagens | `emailTemplates.mjs` | Compor confirmações de reconhecimento e cupons com texto próprio para cada destinatário |
| Adaptador de e-mail | `GmailService.sendGmail` | Entregar os textos por SMTP com TLS, usando um remetente do sistema |
| Model / persistência | `Repository` | Encapsular `one`, `all`, `run` e `batch`, com parâmetros SQL |
| Adaptadores | `server.mjs`, `worker/app.mjs` | Traduzir ambiente Node/SQLite ou Worker/D1 para o mesmo controlador |

O Model não precisa ser um ORM. Escolhemos o padrão **DAO**, opção expressamente aceita no enunciado. Drizzle descreve o esquema e gera migrações; o acesso de negócio é pelo DAO, não pelo ORM em tempo de execução. As entidades são registros relacionais. O modelo conceitual usa Aluno, Professor e Empresa; na implementação eles compartilham `users`, diferenciados por `role`. Não existem classes `Aluno` ou `Professor` artificiais que o código não utilize.

## Fluxo de reconhecimento

1. A View envia aluno, quantidade, motivo e chave de operação.
2. O Controller verifica sessão, perfil de professor e origem da requisição.
3. `MeritService.recognize()` verifica valor inteiro, motivo, aluno ativo e mesma instituição.
4. `recognitionTemplates` compõe a confirmação de envio do professor e a confirmação de recebimento do aluno. O DAO insere a transação e as duas mensagens no mesmo lote.
5. O gatilho do banco impede saldo insuficiente e movimenta os dois saldos.
6. Após o commit, `EmailService.deliver()` tenta enviar as duas mensagens, quando configurado. Uma falha de entrega não desfaz as moedas.
7. A View consulta novamente saldo e extrato.

## Integridade das moedas

`transactions` é o histórico. `users.balance` é o saldo materializado. O gatilho `prevent_overdraft` verifica saldo na inserção da transação; `apply_debit` e `apply_credit` atualizam os saldos na mesma operação do banco. Isso evita confiar no valor exibido na tela. Uma falha de saldo aborta a transação. No resgate, o lote inteiro reverte: cupom, débito e mensagens não ficam pela metade.

`request_key` única fornece idempotência para repetições da mesma operação. A aplicação retorna a operação existente quando a encontra; numa corrida de duplicatas pode retornar conflito, sem débito duplicado. A unicidade por professor e semestre impede crédito semestral em duplicidade. O crédito é concedido no primeiro acesso autenticado do professor no semestre, pelo calendário de São Paulo. Não há rotina de recomposição de semestres não acessados.

O cupom guarda título e custo no momento do resgate. Alterar a vantagem depois não altera o benefício já contratado. A utilização usa `UPDATE ... WHERE status='available'`, com verificação de linhas alteradas. Apenas a empresa do cupom pode confirmá-lo.

## Exclusão lógica

Aluno e empresa têm `active=0` ao excluir. As sessões são removidas e as vantagens do parceiro são desativadas. O histórico não é apagado. Essa decisão atende ao CRUD e mantém referências das movimentações. Não há tela para reativação; em um produto real, seria necessário um fluxo administrativo de suporte.

## Autenticação

Senhas derivadas com PBKDF2/SHA-256, 100.000 iterações e salt aleatório. O banco não guarda senha em texto. O navegador recebe cookie HttpOnly, SameSite=Strict, Secure em HTTPS, com oito horas de validade. O banco guarda apenas SHA-256 do token de sessão. Logout remove a sessão. A API valida permissões mesmo que alguém altere a interface. Não há rate limiting nem recuperação de senha nesta versão acadêmica.

## E-mail e outbox

As mensagens nascem na mesma transação das moedas. `emailTemplates.mjs` centraliza os templates em texto simples: `recognitionTemplates` retorna recebimento do aluno e confirmação do professor; `couponTemplates` retorna cupom do aluno e conferência da empresa com o mesmo código. O texto é persistido na outbox e enviado ao provedor no campo `text`, sem migração de banco.

Envio é posterior ao commit e não desfaz um reconhecimento ou resgate válido se o provedor falhar. Status: pending, sent ou failed. `emailProvider` seleciona Gmail ou Resend conforme a configuração. Gmail usa `node:tls` em `smtp.gmail.com:465`, com verificação de certificado e senha de app. O remetente é a conta técnica configurada; o destino é `emails.recipient`, originado no cadastro.

Na opção Resend, o id da mensagem é a chave de idempotência do provedor. No SMTP Gmail, ele compõe um `Message-ID` estável, que não garante deduplicação se a confirmação do provedor for perdida. O usuário pode tentar reenviar suas próprias mensagens; as já enviadas são ignoradas. Sem configuração, as mensagens ficam pendentes. O build mantém `node:tls` como módulo nativo, atendido pela compatibilidade Node do Worker. Veja [EMAIL.md](EMAIL.md) para configuração e limites da confirmação de entrega.

Os [modelos da Release 2](release-2/modelos.md) e os [diagramas de sequência](release-2/sequencias/README.md) mostram a correspondência dessas operações com os métodos reais. Os modelos da Release 1 permanecem versionados em `docs/sprints/`.

## Ambientes

- Local: Node.js 24, HTTP nativo e `node:sqlite`, arquivo persistente.
- Hospedado: Cloudflare Worker ESM e D1; o esbuild reúne código e arquivos da interface em um único módulo.
- As duas implementações expõem ao Repository o mesmo contrato de consultas e lotes.
- A base local e a base hospedada são independentes. O teste em memória também é separado.

Referências: [Node SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html), [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Resend](https://resend.com/docs/api-reference/emails/send-email).
