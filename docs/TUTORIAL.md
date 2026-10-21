# Tutorial das tecnologias: 5 minutos dentro da apresentação

## 1. Por que estas tecnologias?

HTML estrutura a tela; CSS define aparência e adaptação ao celular; JavaScript controla interações. No backend, o mesmo JavaScript executa regras no servidor. SQLite mantém tabelas e relacionamentos sem instalar um servidor de banco. O DAO concentra acesso aos dados. A hospedagem usa Worker/D1, preservando o mesmo contrato SQL.

Não apresente Vinext como requisito da versão local: ele integra o pacote de hospedagem. O navegador nunca abre diretamente o banco.

## 2. Execute na frente da turma

```sh
node --version
node server.mjs
```

Abra http://localhost:3000. Mostre que a interface depende da API. Ao encerrar o servidor com Ctrl+C, a API deixa de responder. Reinicie e veja o histórico preservado no arquivo SQLite.

## 3. Siga uma requisição

No `src/views/app.js`, procure `/recognitions`. O formulário manda JSON com aluno, quantidade, motivo e chave da operação. Em `AppController.mjs`, procure a mesma rota: o Controller verifica professor e chama o serviço. Abra `MeritService.mjs`: valida regras e insere pelo DAO. Abra `Repository.mjs`: `prepare().bind()` transmite parâmetros separadamente do SQL. Em `db/migration.sql`, mostre o gatilho que rejeita saldo insuficiente.

## 4. Execute testes

```sh
node --test tests/*.test.mjs
```

Abra o teste "resgate sem saldo reverte cupom e mensagens". Explique a diferença entre apenas testar uma função e verificar um efeito no banco. O teste é isolado, não altera contas da apresentação.

## 5. Explique a migração

`db/schema.ts` descreve tabelas para as ferramentas. `drizzle/` contém SQL e metadados versionados. `npm run db:generate` gera uma nova migração após alterar o esquema. Gatilhos são SQL complementar. Depois de uma migração aplicada, crie uma nova; não edite o histórico. Para testar o modelo final use o guia de deploy; não aplique SQL local em uma base hospedada já existente.

Documentação oficial: [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html), [D1](https://developers.cloudflare.com/d1/worker-api/d1-database/), [GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository), [Resend](https://resend.com/docs/api-reference/emails/send-email).
