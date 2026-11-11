# Publicação na Cloudflare Free

URL pública: https://meritus-estudantil.vianadv.workers.dev

Aplicativo: meritus-estudantil. Hospedagem: Cloudflare Workers Free. Banco: Cloudflare D1 Free, meritus-db. Configuração reproduzível: wrangler.cloudflare.jsonc. Nenhum plano pago ou domínio foi contratado.

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
