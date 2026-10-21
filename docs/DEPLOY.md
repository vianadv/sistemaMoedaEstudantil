# Publicação na Cloudflare Free

URL pública: https://meritus-estudantil.vianadv.workers.dev

Aplicativo: meritus-estudantil. Hospedagem: Cloudflare Workers Free. Banco: Cloudflare D1 Free, meritus-db. Configuração reproduzível: wrangler.cloudflare.jsonc. Nenhum plano pago ou domínio foi contratado.

A Cloudflare confirmou o deploy em 21/10/2026. Versão: 59c0d971-7628-4574-be68-9dd004990fc3. O endereço workers.dev é independente da primeira hospedagem. O computador local pode estar desligado; o aplicativo e o banco executam na Cloudflare.

Esta base é independente da primeira demonstração e da execução local. Ela começa com contas e vantagens fictícias; os saldos persistem após a utilização. O professor é creditado com 1.000 moedas no primeiro acesso do semestre. O aluno começa sem moedas.

Contas: professor@meritus.demo, aluno@meritus.demo e empresa@meritus.demo. Senha de todas: Meritus@123. Também há botões na tela inicial que preenchem e realizam esses logins.

E-mails externos continuam dependendo de RESEND_API_KEY, EMAIL_FROM e destinatários reais. Sem essa configuração, a caixa de saída é demonstrativa e as mensagens não chegam a caixas externas.

Para atualizar: npm ci; npm run build; npx wrangler login; npx wrangler deploy --config wrangler.cloudflare.jsonc. Não reaplique o SQL inicial ao banco já configurado. Consulte CLOUDFLARE.md para manutenção e limites gratuitos.

A infraestrutura foi simplificada para um único Worker ESM, sem alteração das regras de negócio ou migração do banco. O build e a simulação de publicação passaram; após a atualização foram novamente conferidos o endpoint de saúde e o catálogo com sessão persistente.
