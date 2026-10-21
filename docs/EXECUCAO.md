# Execução e configuração

## Requisitos e execução local

Use Node.js 24. O servidor local usa os módulos nativos HTTP, criptografia e SQLite; não exige instalação de dependências.

```sh
node --version
node server.mjs
```

Abra http://localhost:3000. O arquivo `data/meritus.sqlite` é criado automaticamente com o esquema e os dados fictícios de demonstração. Ele preserva os registros entre execuções. Encerre com `Ctrl+C`.

Os perfis de demonstração são `professor@meritus.demo`, `aluno@meritus.demo` e `empresa@meritus.demo`, todos com senha `Meritus@123`. Não use dados pessoais reais nessa demonstração pública.

## Configuração opcional

Copie `.env.example` para `.env` e ajuste os valores necessários. O arquivo com valores reais deve permanecer fora do Git.

```sh
node --env-file-if-exists=.env server.mjs
```

| Variável | Finalidade |
|---|---|
| `PORT` | Porta local, padrão 3000 |
| `DB_PATH` | Caminho do SQLite local, padrão `./data/meritus.sqlite` |
| `RESEND_API_KEY` | Credencial privada do provedor de e-mail |
| `EMAIL_FROM` | Remetente autorizado no provedor |

Para enviar e-mails externos, configure uma conta Resend, um remetente verificado e destinatários válidos. Os endereços `@meritus.demo` são fictícios. Sem configuração, o conteúdo fica registrado na caixa de saída com status pendente; a interface indica modo demonstração. Uma tentativa de envio pode ser iniciada na própria caixa de saída. Essa situação não comprova entrega real de e-mail.

Na Cloudflare, configure esses valores como secrets, sem escrevê-los no arquivo de configuração:

```sh
npx wrangler secret put RESEND_API_KEY --config wrangler.cloudflare.jsonc
npx wrangler secret put EMAIL_FROM --config wrangler.cloudflare.jsonc
```

## Testes e build

```sh
node --test tests/*.test.mjs
npm ci
npm run build
```

Os testes usam um SQLite isolado em memória e não modificam as contas públicas. As dependências de desenvolvimento são usadas para gerar o Worker e manter o esquema. O build incorpora a interface e o backend em `dist/cloudflare/index.js`.

## Banco e publicação

`db/migration.sql` inicializa a execução local. `db/schema.ts`, `drizzle.config.ts` e `drizzle/` mantêm o esquema e as migrações da hospedagem. Não reaplique o SQL inicial no banco publicado que já contém dados. Para alterações de esquema, gere e revise uma nova migração antes de aplicá-la.

Consulte [CLOUDFLARE.md](CLOUDFLARE.md) para autenticação e publicação e [DEPLOY.md](DEPLOY.md) para o endereço em funcionamento. O Worker publicado e o banco D1 funcionam independentemente do computador local.
