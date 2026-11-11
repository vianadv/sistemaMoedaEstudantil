# Roteiro de demonstração da Release 2

Roteiro sugerido para demonstração ao vivo ou gravação de vídeo. Não registra apresentação ou gravação já realizada. Use `node server.mjs` e abra `http://localhost:3000`; as três contas de demonstração estão no README. As moedas e os dados são fictícios.

## 1. Comparar modelos e implementação

Abra [modelos.md](modelos.md) e a [sequência geral](sequencias/README.md#sequência-geral). Mostre a correspondência View, Controller, Services e Repository no código. Explique que a Release 1 já tinha os fluxos principais; esta continuação acrescenta a confirmação do professor, templates específicos, sequências e testes. O esquema não mudou e as versões anteriores dos modelos foram preservadas.

## 2. Lab04S01 - Reconhecimento e extratos

1. Entre como professor e anote o saldo inicial. A primeira consulta autenticada do semestre concede 1.000 moedas uma única vez, acumuladas com eventual saldo anterior.
2. Reconheça Ana com 200 moedas e motivo "Participação e colaboração na aula".
3. Consulte Extrato: o saldo diminuiu em 200 e o envio mostra aluno, motivo e data.
4. Abra Notificações: confira o template de confirmação do professor.
5. Saia e entre como aluno. Confira o aumento de 200 no saldo e o recebimento no extrato.
6. Abra Notificações e compare o template do aluno com o do professor; quantidade, motivo e referência são comuns.
7. Mostre que motivo vazio, fração e envio acima do saldo são recusados.

## 3. Lab04S02 - Vantagens

1. Entre como empresa e cadastre uma vantagem com título, descrição, foto e custo de 50 moedas.
2. Entre como aluno e mostre a vantagem no catálogo com foto, descrição, empresa e custo.
3. Explique nos diagramas individuais as validações do controlador e a consulta ao DAO.

## 4. Lab04S03 - Resgate e troca presencial

1. Como aluno, resgate a vantagem de 50 moedas. O saldo cai em 50 e o extrato ganha o débito.
2. Copie o código em Meus cupons e confira o template de cupom em Notificações.
3. Entre como empresa e confira a mensagem da empresa, com o mesmo código.
4. Confirme o código em Conferir cupons. Tente usá-lo novamente: deve ser recusado.
5. Mostre na sequência geral que cupom, débito e mensagens são persistidos atomicamente, e que o provedor é chamado depois.

Os saldos são persistentes; relate as diferenças em relação ao saldo inicial observado, sem assumir que o aluno começou em zero. Para o roteiro de 200 moedas, o professor precisa de saldo suficiente.

## 5. Evidências e limites

Execute `node --test tests/*.test.mjs` para apresentar a verificação atual. Os testes de provedor usam simulação, sem enviar e-mails externos. Sem credenciais, a interface informa modo demonstração e permite consultar o conteúdo pendente.

Para a demonstração de entrega real, configure Resend conforme [EXECUCAO.md](../EXECUCAO.md) e use destinatários reais autorizados nos cadastros. Professores são pré-cadastrados: configure os dados desse perfil em uma base local de demonstração controlada pelo grupo; não substitua dados reais na base pública para ensaiar. Não exponha a chave do provedor na gravação. Caso o ambiente não possa ser reproduzido no laboratório, grave o fluxo conforme solicitado pelo enunciado.
