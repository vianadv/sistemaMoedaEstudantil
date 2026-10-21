# Guia completo de entrega e apresentação

## 1. O que entregar

Entregue o link do repositório com código, modelos das três versões, guia, slides e roteiro. Entregue também a URL hospedada indicada em `docs/DEPLOY.md`. Abra os links em outra janela antes da apresentação. Não entregue apenas um ZIP dentro do GitHub: os arquivos devem estar extraídos e navegáveis.

## 2. Como rodar no computador

1. Extraia o pacote. Entre na pasta que contém `server.mjs` e `README.md`.
2. Instale Node.js **24 LTS** pelo site oficial https://nodejs.org/ . Se já está instalado, execute `node --version` no terminal. A versão deve começar com v24.
3. No Explorador de Arquivos, abra a pasta do projeto. Clique na barra de endereço, digite `powershell` e pressione Enter.
4. Execute `node server.mjs` e aguarde "Meritus disponível em http://localhost:3000".
5. Abra esse endereço no navegador. Mantenha o terminal aberto enquanto usa o sistema.
6. Para encerrar, vá ao terminal e pressione Ctrl+C.

O banco fica em `data/meritus.sqlite`, criado no primeiro uso. Ele não é enviado ao GitHub. Reiniciar não zera o saldo. Se o terminal disser "porta em uso", feche sua execução anterior ou use `$env:PORT='3001'` no PowerShell antes de iniciar e acesse http://localhost:3001.

Se `node` não for reconhecido, feche e reabra o terminal depois da instalação. Se `node:sqlite` não existir, a versão do Node está antiga. Se aparecer ECONNREFUSED no navegador, confira se o servidor está aberto e se a porta é a mesma. `npm install` não é necessário para a demonstração local.

## 3. Como enviar ao seu GitHub

Destino: https://github.com/vianadv/sistemaMoedaEstudantil

### Opção A: navegador, para quem nunca usou Git

1. Entre no GitHub com a conta que pode editar esse repositório.
2. Abra o repositório. Se estiver vazio, clique no link **uploading an existing file**. Se já houver arquivos, use **Add file → Upload files**.
3. Arraste o **conteúdo** da pasta do projeto. O `README.md` deve ficar na raiz, e não dentro de outra pasta chamada meritus.
4. Envie as pastas de código, `db`, `drizzle`, `docs`, `tests`, `worker`, `scripts`, `apresentacao` e arquivos de configuração. Preserve `.openai/hosting.json` e `.gitignore`.
5. **Não envie** `node_modules`, `data`, `.git`, `.env` com credenciais, `.wrangler`, `.sites-runtime` ou arquivos de deploy temporários.
6. Escreva uma mensagem honesta, como "Entrega do protótipo Meritus, modelos e apresentação", e confirme o commit.
7. Abra o README e cada pasta de sprint para conferir a visualização.

O GitHub aceita até 100 arquivos por envio pelo navegador e 25 MiB por arquivo. Se exceder, envie por partes ou use a opção B. Não renomeie o ZIP para fingir que é código extraído.

### Opção B: Git, mais confiável para muitas pastas

Instale o Git oficial e abra um terminal **na pasta do projeto**. Para uma cópia extraída sem repositório local:

```sh
git init
git branch -M main
git add .
git commit -m "Entrega do prototipo Meritus e documentacao"
git remote add origin https://github.com/vianadv/sistemaMoedaEstudantil.git
git push -u origin main
```

Se o Git solicitar identidade no primeiro commit, use `git config user.name "Seu nome"` e `git config user.email "Seu e-mail do GitHub"`. Não invente nomes de integrantes. O login do GitHub pode abrir no navegador. Não coloque senha ou token nos arquivos nem na URL do repositório.

Se a pasta já possuir `.git`, confira `git remote -v` e `git status` antes. O pacote pode ter histórico da hospedagem Sites: para enviar também ao GitHub sem trocar esse destino, use um remoto separado:

```sh
git remote add github https://github.com/vianadv/sistemaMoedaEstudantil.git
git push -u github main
```

Se `github` já existir, use-o sem adicionar de novo. Se aparecer "non-fast-forward", o GitHub já tem commits: faça uma cópia da pasta, clone o repositório em outra pasta, copie os arquivos da entrega sem `.git`, depois adicione, confirme e envie. **Não use push --force.**

### Atualizações posteriores

```sh
git add .
git commit -m "Atualiza modelos e implementacao"
git push
```

Não retroaja datas e não apresente os modelos propostos como histórico real de aulas. O Git deve contar o que foi feito de verdade.

## 4. Publicação e acesso

Consulte `docs/DEPLOY.md` para o resultado confirmado da publicação. GitHub hospeda o código; ele não executa automaticamente esse backend. **GitHub Pages não atende esta aplicação completa**, pois não executa a API e o banco do servidor.

O site público está em https://meritus-estudantil.vianadv.workers.dev. Ele usa Cloudflare Workers Free e D1 Free, na conta autorizada do proprietário. O professor não precisa entrar em uma conta Cloudflare; usa apenas o login do próprio aplicativo. A base hospedada é independente da local. Não é necessário manter o computador ligado.

### Publicação reproduzível: Cloudflare Workers Free + D1 Free

1. Instale as ferramentas com `npm ci` e gere o pacote com `npm run build`.
2. Entre na sua conta Cloudflare pelo Wrangler: `npx wrangler login`.
3. Crie um D1: `npx wrangler d1 create meritus-db`.
4. Copie o `database_id` retornado para um arquivo de configuração **seu**. O projeto inclui `wrangler.example.jsonc` como referência. Não use o ID placeholder do build.
5. Aplique o arquivo SQL de `drizzle/` a essa base nova com `npx wrangler d1 execute meritus-db --remote --file drizzle/0000_skinny_mastermind.sql`. Isso cria o esquema; não execute de novo numa base já inicializada.
6. Publique com `npx wrangler deploy --config wrangler.jsonc` depois de copiar e preencher o exemplo. A URL aparecerá no terminal.
7. Confira `/api/health`, faça login e execute professor → aluno → empresa. O seed fictício é inserido no primeiro acesso.

A publicação já foi configurada na conta Cloudflare autorizada, sem contratar um plano pago. Para atualizá-la, use `npx wrangler deploy --config wrangler.cloudflare.jsonc` após gerar o build. Não crie outro banco nem reaplique o esquema na base existente. As etapas acima servem para uma nova conta/base. O arquivo docs/CLOUDFLARE.md detalha o procedimento.

## 5. Como apresentar em formato de pitch

O PDF exige 20 minutos e tutorial das tecnologias. Por isso o material une pitch inicial, demonstração e defesa técnica.

| Tempo | Conteúdo |
|---|---|
| 0:00–3:45 | Problema, público, proposta e escopo |
| 3:45–8:00 | Demonstração do circuito professor → aluno → empresa |
| 8:00–12:45 | MVC, DAO, banco e correspondência dos modelos |
| 12:45–15:00 | Tutorial prático das tecnologias |
| 15:00–18:30 | Sprints, testes e condições de uso |
| 18:30–20:00 | Fechamento e perguntas |

Leia `apresentacao/ROTEIRO.md` e as notas dos slides. Não leia cada frase da tela. Explique as regras com um exemplo: enviar 200 moedas, gastar 50 e mostrar a diferença no extrato. Prepare o código do cupom e mantenha o projeto local como alternativa se a internet falhar.

Perguntas prováveis:

- **Por que MVC?** Para separar interface, tratamento HTTP e regras/persistência.
- **Por que DAO, não ORM?** O escopo é pequeno, SQL explícito facilita explicar e testar; DAO é aceito no enunciado.
- **Como evita saldo negativo?** O banco verifica o débito e atualiza saldos na mesma transação.
- **Como evita cupom duplicado?** Código e chave únicos; utilização muda o status uma única vez.
- **Onde está a persistência?** Arquivo SQLite local ou D1 hospedado, nunca apenas no navegador.
- **Como o modelo corresponde ao código?** Perfis conceituais viram users.role; módulos e classes reais aparecem no diagrama de implementação.
- **Os e-mails estão chegando?** Responda conforme o status real. Sem chave: "São registrados na outbox; o envio externo ainda depende da configuração do provedor".
- **Foi feito ao longo das aulas?** Relate somente a participação real. Os arquivos de sprint são propostas de evolução documentadas nesta entrega.

## 6. Ativar e testar e-mails reais

1. Tenha uma conta no Resend e um remetente permitido pelo provedor. Confira as restrições da conta e do domínio na documentação oficial.
2. Crie uma API key na conta do provedor. Guarde-a em segredo, fora do GitHub.
3. Localmente, copie `.env.example` para `.env`. Preencha `RESEND_API_KEY` e `EMAIL_FROM` com valores válidos.
4. Execute `node --env-file=.env server.mjs`. O arquivo de exemplo não contém credenciais reais.
5. Na hospedagem, configure as mesmas variáveis no painel de ambiente/segredos e publique a configuração.
6. Use **contas com e-mails reais** de teste. Os endereços terminados em `.demo` não recebem mensagens. Edite o cadastro do aluno e do parceiro ou crie contas novas.
7. Envie moedas e confira se o aluno recebeu o motivo e a quantidade. Depois resgate e confira **aluno e empresa**, com o mesmo código nos dois e-mails.
8. Na tela Notificações, `Enviado` significa aceito pela API do provedor; confira também a caixa de entrada e spam. `Falha` exige corrigir chave, remetente ou permissão do destinatário e tentar novamente.

Sem domínio/remetente e chave, não é possível declarar que esse requisito externo foi integralmente validado.

## 7. Conferência final antes de entregar

- Código e modelos estão extraídos e navegáveis no GitHub.
- README identifica a execução e as três contas.
- URL de deploy abre no ambiente de apresentação e tem audiência apropriada.
- Professor consegue enviar moedas; aluno resgata; empresa confere.
- CRUD aluno e empresa: criar, consultar, editar e desativar foram demonstrados.
- Apresentação e roteiro estão na pasta `apresentacao`.
- E-mail foi configurado e testado, ou a condição pendente está declarada.
- Nomes reais da equipe foram inseridos no slide de abertura, se desejado.
- Não há senha real, chave de API ou banco com dados pessoais no repositório.

Fontes oficiais consultadas: [GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository), [Node 24](https://nodejs.org/docs/latest-v24.x/api/sqlite.html), [Cloudflare D1](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Resend](https://resend.com/docs/api-reference/emails/send-email).
