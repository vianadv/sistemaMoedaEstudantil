# Validação

Em 21/10/2026, a primeira execução da suíte registrou 13 testes aprovados (12 subtestes e o agrupador), zero falhas. Após ajustes, execute novamente para obter o resultado final; o runner é a evidência atual.

Comando: `node --test tests/*.test.mjs`.

Cobertura: login e sessão; crédito idempotente e acumulável; motivo e inteiro; autorização; reconhecimento; saldo insuficiente; resgate com código e mensagens; cupom de uso único; rollback; CRUD aluno e empresa; edição de vantagem alheia bloqueada; CPF e origem; extrato e logout.

Limites: testes usam SQLite em memória; não equivalem a auditoria, teste de carga ou comprovação de entrega de e-mail pelo provedor. A compilação da hospedagem foi concluída. O resultado da publicação fica em DEPLOY.md. As verificações visuais e do ambiente hospedado devem ser registradas apenas quando efetivamente realizadas.

## Verificação no site público

Em 21/10/2026, às 09:49 (São Paulo), foi conferido pela interface publicada:

- Login do professor, com crédito de 1.000 moedas.
- Reconhecimento de 200 moedas para a conta fictícia Ana Souza; professor passou a 800.
- Login do aluno e saldo de 200, com catálogo carregado.
- Resgate do café por 50 moedas, autorizado pelo usuário para este teste; saldo resultante de 150.
- Emissão do cupom MER-6D7E50A89DED43A8.
- Login da empresa, confirmação do cupom e status Utilizado.
- Nova tentativa recusada com a mensagem "Este cupom já foi utilizado".

O teste usa somente dados e moedas fictícios. Não houve compra real nem envio externo de e-mail. O site ficou com esses registros de demonstração; o próximo ensaio começa a partir do saldo atual. O fluxo publicado foi verificado, além da suíte local de 13 testes aprovada novamente.
