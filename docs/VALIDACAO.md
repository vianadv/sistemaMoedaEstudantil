# Validação

## Release 2 - 11/11/2026

Verificações executadas na cópia local desta atualização:

- `node --test tests/*.test.mjs`: **23 testes aprovados, zero falhas**, incluindo a suíte anterior e dez testes adicionais da Release 2.
- `npm ci` e `npm run build`: dependências do lockfile instaladas e Worker compilado com sucesso.
- Módulo compilado do Worker executado com SQLite isolado em memória: `/`, `/app.js`, `/style.css` e `/api/health` responderam 200; login e reconhecimento com os novos templates responderam 200 e 201, respectivamente.
- Os sete arquivos de sequência `.mmd` passaram pelo parser Mermaid. As cópias exibidas em Markdown foram conferidas contra os arquivos, e os links locais dos documentos novos/atualizados foram verificados.
- `git diff --check`: sem erros de espaços ou marcadores de conflito.

A nova suíte cobre confirmações distintas para professor/aluno com mesma transação, extratos dos dois perfis, rollback se falha a gravação do e-mail do professor, integração simulada de envio e reenvio, idempotência, isolamento das caixas de saída, configuração incompleta, cadastro e catálogo de vantagens, resgate atômico, código comum nos templates de cupom, preservação do título/custo e conferência por empresa proprietária com uso único.

Limites desta execução: SQLite em memória e provedor Resend simulado nos testes; nenhum e-mail foi enviado a caixas externas. O smoke test do Worker usa o adaptador SQLite local, não uma instância D1 hospedada. A compilação local não publica a atualização no site. As evidências de hospedagem abaixo são históricas da Release 1. Não foi registrada nova apresentação em aula nem gravação de vídeo.

## Histórico da Release 1

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
