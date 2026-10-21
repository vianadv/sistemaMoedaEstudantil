# Publicação independente na Cloudflare Free

O projeto pode ser publicado diretamente na conta Cloudflare do proprietário, com endereço público `workers.dev`. Essa publicação usa Workers Free e D1 Free e não depende de o computador local permanecer ligado.

## Configuração do projeto

- `wrangler.cloudflare.jsonc`: aplicativo `meritus-estudantil`, banco `meritus-db` e binding `DB`.
- `dist/cloudflare/index.js`: módulo compilado com backend e arquivos estáticos incorporados.
- `src/`: interface, controlador, serviços e DAO da aplicação.
- OAuth e arquivos de autenticação são locais, ignorados pelo Git e excluídos do ZIP. Os IDs públicos da conta e do banco não são credenciais.

## Conta e plano

1. Crie ou acesse sua conta Cloudflare.
2. Confirme o endereço de e-mail. A Cloudflare exige a verificação para publicar Workers.
3. Mantenha **Workers Free**. Este projeto não exige comprar domínio, contratar Workers Paid, R2 ou outros produtos pagos.
4. Autorize o Wrangler na página oficial. A autorização permite publicar o aplicativo e administrar o banco; ela não muda a assinatura da conta.

## Publicação e atualizações

Em um computador com Node.js 24 e Git:

```sh
npm ci
npm run build
npx wrangler login --scopes account:read user:read workers:write workers_scripts:write d1:write
npx wrangler deploy --config wrangler.cloudflare.jsonc
```

O arquivo de configuração já identifica o banco desta conta. Em outra conta, crie um novo D1 e substitua os IDs pelos valores retornados pelo provedor. Não copie credenciais entre contas.

O banco foi criado e o esquema aplicado uma vez durante a configuração. **Não execute novamente o SQL inicial nessa mesma base.** Para uma base nova, use o arquivo de `drizzle/`; para mudanças posteriores, gere uma nova migração.

## Dados

A base desta publicação é independente das bases local e da primeira hospedagem. Os três perfis fictícios, instituições e vantagens são inseridos automaticamente no primeiro acesso. Não foram transferidos dados pessoais reais. Os dados e saldos persistem depois de atualizar o aplicativo.

## Limites e manutenção

Workers Free e D1 Free têm limites de uso. Mantenha a conta no plano gratuito; atingir limites pode interromper o atendimento até a renovação da cota, em vez de ser motivo para contratar um plano sem autorização. Para esta entrega, confira o funcionamento real no endereço retornado após o deploy.

O serviço de e-mail é separado: sem `RESEND_API_KEY` e `EMAIL_FROM`, as mensagens permanecem na caixa de saída e a interface indica modo demonstração. A mudança da hospedagem não configura o envio externo.

Referências oficiais: [Workers Free](https://developers.cloudflare.com/workers/platform/pricing/), [D1 Free](https://developers.cloudflare.com/d1/platform/pricing/), [endereço workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/), [verificação de e-mail](https://developers.cloudflare.com/fundamentals/setup/account/verify-email-address/).
