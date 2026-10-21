# Arquitetura MVC e camada de persistência

## Decisão de escopo

Um monólito web, com uma interface e uma API no mesmo domínio. Não há microserviços, filas externas ou aplicativos separados. Para três aulas de 1h40, concentramos a complexidade nas regras exigidas: saldos, transações e cupons.

## MVC no código real

| Papel | Implementação | Responsabilidade |
|---|---|---|
| View | `src/views/index.html`, `style.css`, `app.js` | Exibir formulários, navegar entre perfis, chamar API e mostrar feedback |
| Controller | função `api()` em `src/controllers/AppController.mjs` | Interpretar HTTP, autenticar, autorizar, validar entrada e devolver JSON |
| Model / domínio | `MeritService`, `EmailService` e registros do banco | Aplicar reconhecimento, resgate, semestre e notificação |
| Model / persistência | `Repository` | Encapsular `one`, `all`, `run` e `batch`, com parâmetros SQL |
| Adaptadores | `server.mjs`, `worker/app.mjs` | Traduzir ambiente Node/SQLite ou Worker/D1 para o mesmo controlador |

O Model não precisa ser um ORM. Escolhemos o padrão **DAO**, opção expressamente aceita no enunciado. Drizzle descreve o esquema e gera migrações; o acesso de negócio é pelo DAO, não pelo ORM em tempo de execução. As entidades são registros relacionais. O modelo conceitual usa Aluno, Professor e Empresa; na implementação eles compartilham `users`, diferenciados por `role`. Não existem classes `Aluno` ou `Professor` artificiais que o código não utilize.

## Fluxo de reconhecimento

1. A View envia aluno, quantidade, motivo e chave de operação.
2. O Controller verifica sessão, perfil de professor e origem da requisição.
3. `MeritService.recognize()` verifica valor inteiro, motivo, aluno ativo e mesma instituição.
4. O DAO insere transação e mensagem no mesmo lote.
5. O gatilho do banco impede saldo insuficiente e movimenta os dois saldos.
6. `EmailService.deliver()` tenta enviar a mensagem, quando configurado.
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

A mensagem nasce na mesma transação das moedas. Envio é posterior e não desfaz um reconhecimento válido se o provedor falhar. Status: pending, sent ou failed. A tentativa utiliza chave de idempotência do provedor. O usuário pode tentar reenviar suas próprias mensagens. Sem configuração externa, a interface informa o modo demonstração. Um produto em produção precisaria de fila/retry automático, monitoramento e políticas operacionais.

## Ambientes

- Local: Node.js 24, HTTP nativo e `node:sqlite`, arquivo persistente.
- Hospedado: Cloudflare Worker ESM e D1; o esbuild reúne código e arquivos da interface em um único módulo.
- As duas implementações expõem ao Repository o mesmo contrato de consultas e lotes.
- A base local e a base hospedada são independentes. O teste em memória também é separado.

Referências: [Node SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html), [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Resend](https://resend.com/docs/api-reference/emails/send-email).
