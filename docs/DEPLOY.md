# Publicação na Cloudflare Free

URL pública: https://meritus-estudantil.vianadv.workers.dev

Aplicativo: meritus-estudantil. Hospedagem: Cloudflare Workers Free. Banco: Cloudflare D1 Free, meritus-db. Configuração reproduzível: wrangler.cloudflare.jsonc. Nenhum plano pago ou domínio foi contratado.

## Correção de envio no Worker - 18/11/2026

Código `05b4d12`, versão `50c85cd5-ab58-4421-8432-c797d460927b`. A configuração anterior usava `redirect: error`, aceita pelo Node, mas não pelo runtime Workers: a chamada falhava antes de alcançar o MailerSend. O adaptador agora usa `manual` e rejeita respostas diferentes de `202`, sem encaminhar a chave a outro destino. O teste Miniflare reproduziu a falha antes do ajuste e passou depois. Os 39 testes e o build concluíram com sucesso.

Após a publicação, a confirmação existente do professor foi reenviada pela API autenticada do próprio site, sem repetir a transferência de moedas. O D1 passou a registrar `sent`, sem erro, e o MailerSend confirmou **Delivered** no painel. A sessão de verificação foi encerrada. Banco e configuração de envio continuaram ativos.

A confirmação do aluno da mesma transferência não foi reenviada; permanece com a falha anterior. Seu endereço é diferente dos dois destinatários já utilizados no modo de teste. A correção do transporte não remove esse limite de destinatários do serviço. Não houve alteração do cadastro do aluno nem contratação de plano.

## E-mail do professor atualizado em 18/11/2026

Código `04f4f6c`, versão `ccb2c5bc-a23e-42fc-b6bb-e890b90cbfb7`. O e-mail de uma única conta de professor foi atualizado no D1 para o endereço confirmado pelo responsável, sem alterar senha, saldo ou histórico. O endereço pessoal não foi inserido no código nem nesta documentação pública.

O atalho de demonstração continua funcionando após a troca, com a mesma verificação de senha. O login pelo novo endereço e pelo atalho retornou HTTP 200 para a mesma conta no site; ambas as sessões de verificação foram encerradas. Nenhuma transferência, resgate ou mensagem de teste foi criada. `/api/health` confirmou banco ativo e e-mail configurado. Os 38 testes locais passaram, incluindo regressões de autenticação e destinatário atualizado; o build concluiu.

## MailerSend ativado em 18/11/2026

Código `02b504f`, publicado inicialmente como `9f27252d-6ba3-4a04-a9c1-a709429932d2`. Após guardar as três configurações privadas (`EMAIL_PROVIDER`, `MAILERSEND_API_KEY` e `MAILERSEND_FROM`), a versão ativa passou a `ea623f85-0619-4da8-b131-dcaaa0844795`, com 100% do tráfego. Não houve migração nem alteração de dados do D1. A chave fica fora do GitHub e não aparece nos logs de configuração.

A página inicial respondeu HTTP 200 e `/api/health` confirmou `database: true` e `emailConfigured: true`. Os 36 testes passaram e o build concluiu. Um teste real, enviado pelo mesmo adaptador de transporte com a configuração do projeto, foi aceito pelo MailerSend; o painel registrou **Delivered**. Esse teste foi feito fora das transações de negócio e não criou reconhecimentos, débitos ou cupons no banco público. A caixa de entrada do destinatário não foi acessada.

**Limite atual:** a conta continua em Sandbox com domínio de teste, inicialmente limitada a dois destinatários distintos e 100 e-mails mensais. A integração ativada não significa liberação para todos os cadastros. O painel orienta adicionar domínio próprio para sair do teste; qualquer ampliação depende das condições e da aprovação do provedor. A chave criada pelo proprietário tem validade até 30/11/2027. As mensagens antigas não foram disparadas automaticamente. Contas `@meritus.demo` são recusadas pelo adaptador antes de consumir os destinatários do serviço.

## Integração Gmail publicada em 11/11/2026

Código `b8cb532`, versão Cloudflare `e294f290-bebf-42f7-957f-97158cd037a3`. A atualização adiciona Gmail por SMTP/TLS como alternativa ao Resend, com remetente único do sistema e destinatários originados nos cadastros. O banco foi preservado. A interface explica a situação do envio sem apresentar nomes de credenciais aos usuários.

A suíte registrou 31 testes aprovados e o build concluiu. Após o deploy, `/api/health` retornou 200 e `database: true`; o JavaScript público contém os novos avisos. **O envio real ainda está inativo (`emailConfigured: false`)**, pois não foi fornecida autorização de uma conta remetente. Não houve teste de entrega em caixa externa. A ativação está documentada em [EMAIL.md](EMAIL.md); ela exige a credencial do remetente, que não pode ser criada pelo código da aplicação.

## Release 2 publicada em 11/11/2026

A Release 2 foi integrada à `main` e publicada no endereço acima. Código da atualização: `9bbf19f`. A Cloudflare confirmou a versão `8654a682-4ca0-4de2-84e5-7c2251dcad5f`, atendendo 100% do tráfego. O banco D1 existente foi preservado, sem reaplicar o esquema nem criar migração.

Verificações após a publicação: página inicial, JavaScript, CSS e `/api/health` responderam HTTP 200; o health confirmou `database: true`. Acesso sem sessão a catálogo e extrato foi recusado com HTTP 401. A suíte local, com base isolada, aprovou 23 testes antes da publicação. Não foram criadas movimentações de moedas, vantagens ou cupons no banco público nesta verificação.

**E-mails externos ainda não estão ativados:** `/api/health` confirmou `emailConfigured: false` e a lista de secrets de e-mail está vazia. O código compõe e guarda as mensagens dos respectivos destinatários. Para entregá-las fora do sistema, falta conectar uma conta de envio autorizada. A integração disponível nesta versão é Resend; ela não é uma exigência do enunciado e pode ser substituída por outro serviço conforme a conta escolhida pelo grupo.

## Histórico da publicação inicial

A Cloudflare confirmou o deploy em 21/10/2026. Versão: 59c0d971-7628-4574-be68-9dd004990fc3. O endereço workers.dev é independente da primeira hospedagem. O computador local pode estar desligado; o aplicativo e o banco executam na Cloudflare.

Esta base é independente da primeira demonstração e da execução local. Ela começa com contas e vantagens fictícias; os saldos persistem após a utilização. O professor é creditado com 1.000 moedas no primeiro acesso do semestre. O aluno começa sem moedas.

Contas: professor@meritus.demo, aluno@meritus.demo e empresa@meritus.demo. Senha de todas: Meritus@123. Também há botões na tela inicial que preenchem e realizam esses logins.

E-mails externos continuam dependendo de RESEND_API_KEY, EMAIL_FROM e destinatários reais. Sem essa configuração, a caixa de saída é demonstrativa e as mensagens não chegam a caixas externas.

Para atualizar: npm ci; npm run build; npx wrangler login; npx wrangler deploy --config wrangler.cloudflare.jsonc. Não reaplique o SQL inicial ao banco já configurado. Consulte CLOUDFLARE.md para manutenção e limites gratuitos.

A infraestrutura foi simplificada para um único Worker ESM, sem alteração das regras de negócio ou migração do banco. O build e a simulação de publicação passaram; após a atualização foram novamente conferidos o endpoint de saúde e o catálogo com sessão persistente.
