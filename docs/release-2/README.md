# Release 2 - LABDESENV_4

Continuação da Release 1, conforme o enunciado `LABDESENV_4 (1).pdf`, páginas 1 e 2, fornecido em 04/11/2026. O cabeçalho do documento diz Laboratório 3; os marcos desta continuação são **Lab04S01, Lab04S02 e Lab04S03**.

**Publicada em 11/11/2026:** [abrir o sistema](https://meritus-estudantil.vianadv.workers.dev). A atualização foi integrada à `main` e o Worker está atendendo com o banco D1 existente. [Registro de publicação e verificações](../DEPLOY.md). O envio de e-mails para caixas externas ainda depende de conectar uma conta autorizada; as mensagens estão disponíveis na outbox.

## Entregas por sprint

| Marco | Requisitos | Código e evidência |
|---|---|---|
| [Lab04S01](lab04s01.md) | Enviar moedas, consultar extratos de professor e aluno e enviar confirmações com templates distintos | `MeritService.recognize`, `/api/statement`, `emailTemplates.mjs`, outbox e testes |
| [Lab04S02](lab04s02.md) | Cadastrar vantagens pela empresa, listar para o aluno e produzir um diagrama de sequência por caso de uso | `/api/offers`, telas do catálogo e [sequências individuais](sequencias/README.md) |
| [Lab04S03](lab04s03.md) | Trocar moedas por vantagens e produzir o diagrama de sequência geral | `MeritService.redeem`, cupons, dois e-mails, [sequência geral](sequencias/README.md#sequência-geral) e testes |

## O que esta continuação acrescenta

A Release 1 já continha os fluxos de moedas, extrato, catálogo e resgate. A Release 2 acrescenta a confirmação de envio para o professor, centraliza quatro templates de e-mail (recebimento, envio, cupom do aluno e conferência da empresa), documenta as sequências e amplia os testes dos fluxos exigidos. As duas confirmações de reconhecimento são persistidas com a mesma transação das moedas; ambas são tentadas pelo provedor após o commit.

Não houve alteração de esquema: as notificações usam a tabela `emails` e seu vínculo com `transactions`. Bancos existentes permanecem compatíveis. A confirmação para o professor é gerada para novos reconhecimentos; operações anteriores não recebem mensagens retroativas. Repetir a chave de uma operação existente não cria novos e-mails.

## Modelos e apresentação

- [Modelos alinhados ao código da Release 2](modelos.md): classes e componentes efetivos, com comparação com a Release 1.
- [Diagramas de sequência](sequencias/README.md): seis casos de uso da Release 2 e uma sequência geral, também disponíveis como arquivos `.mmd`.
- [Versões anteriores dos modelos](../sprints/03/modelos.md): preservadas com os demais materiais da Release 1 em `docs/sprints/01`, `02` e `03`.
- [Roteiro de demonstração e comparação com os modelos](apresentacao.md).
- [Matriz geral de requisitos](../REQUISITOS.md) e [registro de validação](../VALIDACAO.md).

## Execução e verificação

```sh
node server.mjs
node --test tests/*.test.mjs
npm ci
npm run build
```

O servidor local não precisa de dependências externas. A instalação é necessária para gerar o Worker. Veja [EXECUCAO.md](../EXECUCAO.md) para configurar e-mail e [CLOUDFLARE.md](../CLOUDFLARE.md) para publicação.

Sem um remetente configurado, os templates podem ser conferidos em Notificações dos respectivos perfis com status pendente. A integração aceita Gmail (sem domínio próprio) ou Resend; veja [EMAIL.md](../EMAIL.md). Os testes simulam o transporte do provedor e não comprovam entrega em caixas externas. Para demonstrar envio real, autorize o remetente e use endereços válidos, pois os perfis `@meritus.demo` são fictícios.

As pastas registram o escopo e os artefatos desta atualização. Apresentações semanais, participação em aula e eventual gravação de vídeo dependem de realização pelo grupo; estes arquivos não afirmam que ocorreram.
