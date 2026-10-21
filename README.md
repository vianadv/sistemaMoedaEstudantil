# Meritus · Sistema de Moeda Estudantil

Reconhecimento de professores que se transforma em vantagens no campus. Projeto acadêmico do Laboratório de Desenvolvimento de Software, PUC Minas, segundo semestre de 2026.

**Repositório:** https://github.com/vianadv/sistemaMoedaEstudantil

**Site público:** https://meritus-estudantil.vianadv.workers.dev

Hospedagem Cloudflare Workers Free, com banco D1 Free. O professor pode abrir o endereço em outro computador e usar as contas de demonstração abaixo.

## Comece aqui

1. Instale o **Node.js 24 LTS** em https://nodejs.org/ e abra um terminal nesta pasta.
2. Execute `node server.mjs`.
3. Acesse http://localhost:3000 e clique em um dos perfis de demonstração.
4. Para encerrar, pressione `Ctrl+C` no terminal.

**Não precisa executar npm install para rodar a versão local.** Ela usa os módulos HTTP, criptografia e SQLite do próprio Node. Node 20 não atende; use a versão 24. O banco será criado em `data/meritus.sqlite` e permanece após reiniciar. Não abra `index.html` diretamente: o servidor é necessário.

| Perfil | E-mail fictício | Senha de demonstração |
|---|---|---|
| Professor | professor@meritus.demo | Meritus@123 |
| Aluno | aluno@meritus.demo | Meritus@123 |
| Empresa | empresa@meritus.demo | Meritus@123 |

As contas e os dados são fictícios. São públicas para demonstração, não devem receber informações pessoais reais. Os botões preenchem e enviam o login normalmente, sem ignorar autenticação.

## Demonstração em 5 passos

1. Professor: envie 200 moedas à Ana, com motivo "Participação e colaboração na aula".
2. Aluno: confira saldo, extrato e notificação.
3. Aluno: resgate o café de 50 moedas e copie o código do cupom.
4. Empresa: entre em **Conferir cupons** e confirme o código.
5. Tente confirmar o mesmo código outra vez: o sistema deve recusar.

O exemplo termina com 150 moedas **se o aluno começou em zero**. A base é persistente: ensaios anteriores alteram o saldo. Consulte o extrato para explicar as diferenças.

## O que foi implementado

- Login e senha para aluno, professor e empresa; sessão com cookie HttpOnly.
- Cadastro, consulta, atualização e exclusão lógica de aluno e empresa, com frontend ligado ao backend.
- Todos os campos do aluno: nome, e-mail, CPF, RG, endereço, instituição pré-cadastrada e curso.
- Professor pré-cadastrado com nome, CPF, departamento e vínculo institucional.
- Crédito de 1.000 moedas por semestre, acumulável e sem duplicação no mesmo semestre.
- Reconhecimento com motivo obrigatório, valor inteiro positivo, instituição e saldo suficientes.
- Extratos de professor e aluno; débito de resgates e crédito de recebimentos.
- Vantagens da empresa com título, descrição, foto e custo; edição e desativação.
- Resgate atômico, cupom único e conferência presencial pelo parceiro dono do cupom.
- Mensagem de reconhecimento e duas mensagens de cupom, com o mesmo código, registradas em outbox.
- Integração para envio externo via Resend e tentativa manual de reenvio.
- MVC, DAO com consultas parametrizadas, SQLite local e D1 na hospedagem.

### Condição importante: e-mail

**Sem `RESEND_API_KEY` e `EMAIL_FROM`, e-mails não são enviados para caixas externas.** Ficam registrados no banco com status pendente, e a interface informa "Modo demonstração". Isso permite demonstrar o conteúdo, mas **não substitui o requisito de entrega real de e-mail**. A integração está implementada; configure o provedor e use destinatários reais para concluir essa verificação. Veja [a configuração de execução e e-mail](docs/EXECUCAO.md).

## Testes

```sh
node --test tests/*.test.mjs
```

Os testes exercitam o controlador e SQLite real em memória. Incluem fluxo de reconhecimento e resgate, CRUDs, perfis, saldo insuficiente, rollback, CPF, origem, semestre, duplicação e cupom de uso único. O resultado de cada execução está no terminal; verifique o registro em `docs/VALIDACAO.md`.

## Organização

```text
src/views/                 Interface HTML, CSS e JavaScript
src/controllers/           Controlador HTTP, autenticação e autorização
src/services/              Regras de moedas, e-mails, segurança e seed
src/models/Repository.mjs  DAO com acesso parametrizado ao banco
db/                        Esquema relacional e SQL local
drizzle/                   Migração versionada para o banco hospedado
server.mjs                 Adaptador local Node + SQLite
worker/                    Adaptador hospedado Cloudflare + D1
docs/sprints/01,02,03/      Versões propostas dos modelos
docs/                      Execução, arquitetura, requisitos, tutorial e testes
apresentacao/              Slides da apresentação
```

### Ferramentas de hospedagem

`npm ci` instala as quatro dependências de desenvolvimento fixadas no lockfile: esbuild, Wrangler, Drizzle Kit e Drizzle ORM. `npm run build` gera um único módulo em `dist/cloudflare/index.js`. `npm run deploy` publica o build na Cloudflare. A execução local não precisa dessas dependências.

## Entrega acadêmica

- [Pitch curto: 8 slides, fala estimada de 7 a 8 minutos](apresentacao/Meritus_Pitch.pptx)
- [Execução local, build e configuração de e-mail](docs/EXECUCAO.md)
- [Matriz de requisitos e evidências](docs/REQUISITOS.md)
- [Arquitetura e persistência](docs/ARQUITETURA.md)
- [Sprint 01: casos de uso, histórias, classes e componentes](docs/sprints/01/README.md)
- [Sprint 02: modelo ER, DAO e CRUDs iniciais](docs/sprints/02/README.md)
- [Sprint 03: implementação, modelos finais e tutorial](docs/sprints/03/README.md)
- [Tutorial das tecnologias](docs/TUTORIAL.md)
- [Situação do deploy](docs/DEPLOY.md)
- [Publicação e atualizações na Cloudflare Free](docs/CLOUDFLARE.md)

As pastas de sprints registram **versões propostas reconstruídas nesta entrega**, não alegam execução ou apresentação em datas anteriores. Elas não substituem a participação semanal prevista no enunciado.
