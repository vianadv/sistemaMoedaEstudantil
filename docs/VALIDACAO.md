# Validação

Em 21/10/2026, a suíte registrou 13 testes aprovados (12 subtestes e o agrupador), zero falhas. Execute o comando abaixo para reproduzir a verificação; o resultado do runner é a evidência da execução atual.

Comando: `node --test tests/*.test.mjs`.

Cobertura: login e sessão; crédito idempotente e acumulável; motivo e inteiro; autorização; reconhecimento; saldo insuficiente; resgate com código e mensagens; cupom de uso único; rollback; CRUD aluno e empresa; edição de vantagem alheia bloqueada; CPF e origem; extrato e logout.

Limites: testes usam SQLite em memória; não equivalem a auditoria, teste de carga ou comprovação de entrega de e-mail pelo provedor. A compilação da hospedagem foi concluída. O resultado da publicação fica em DEPLOY.md. As verificações visuais e do ambiente hospedado devem ser registradas apenas quando efetivamente realizadas.

## Verificação no site público

Em 21/10/2026, a primeira hospedagem foi usada para conferir o fluxo completo pela interface:

- Login do professor, com crédito de 1.000 moedas.
- Reconhecimento de 200 moedas para a conta fictícia Ana Souza; professor passou a 800.
- Login do aluno e saldo de 200, com catálogo carregado.
- Resgate do café por 50 moedas; saldo resultante de 150.
- Emissão de um código único de cupom.
- Login da empresa, confirmação do cupom e status Utilizado.
- Nova tentativa recusada com a mensagem "Este cupom já foi utilizado".

O teste usou somente dados e moedas fictícios. Não houve compra real nem envio externo de e-mail. Os saldos são persistentes e podem mudar em novas demonstrações.

## Publicação independente na Cloudflare Free

Em 21/10/2026, a aplicação foi publicada em https://meritus-estudantil.vianadv.workers.dev, com D1. Foram verificados HTTPS válido e resposta HTTP 200 de `/api/health`, com `database: true`. A tela inicial abriu sem exigir login na Cloudflare. O login do professor, o extrato, o login do aluno e o catálogo foram conferidos pela interface pública.

O extrato já continha um reconhecimento de 100 moedas registrado durante o uso das contas fictícias: professor com 900 e aluno com 100 no momento da conferência. Esses saldos são dados persistentes de demonstração e podem mudar com o uso. A captura `preview-cloudflare.png` documenta a interface desta hospedagem. O teste completo de resgate e uso único acima refere-se à primeira hospedagem, não a esta nova base.

A suíte local foi executada novamente, com 13 testes aprovados. O envio externo de e-mail permanece não configurado. Não foi contratado plano pago.
