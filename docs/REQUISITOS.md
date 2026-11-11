# Matriz de requisitos e evidências

Base da Release 1: enunciado LABDESENV_3 (1).pdf, páginas 1–2. Continuação Release 2: enunciado LABDESENV_4 (1).pdf, páginas 1–2, fornecido em 04/11/2026. Veja [as entregas da Release 2](release-2/README.md).

| ID | Requisito | Implementação / evidência |
|---|---|---|
| RF01 | Cadastro completo de aluno | `/api/register`, formulário de aluno, validação de CPF e instituição |
| RF02 | Instituições previamente cadastradas | `seed.mjs`, PUC Minas e IFMG |
| RF03 | Professores pré-cadastrados, com vínculo | `seed.mjs`: nome, CPF, departamento e instituição |
| RF04 | Mil moedas por semestre, acumuláveis | `MeritService.semester()`, índice único e teste de acúmulo |
| RF05 | Enviar moedas com saldo e motivo | `/api/recognitions`, gatilho e teste de recusa |
| RF06 | Notificar aluno por e-mail e confirmar envio ao professor | Dois templates em `emailTemplates.mjs`, outbox atômica e `EmailService`; envio externo condicionado à configuração |
| RF07 | Extratos e saldo de professor/aluno | `/api/me`, `/api/statement`, tela Extrato |
| RF08 | Cadastro da empresa parceira | Formulário e CRUD autenticado em `/api/me` |
| RF09 | Vantagem com custo, descrição e foto | `/api/offers`, upload PNG/JPEG/WebP ou URL HTTPS |
| RF10 | Resgate desconta saldo | `/api/redemptions`, lote atômico e gatilho |
| RF11 | Cupom para aluno e parceiro com mesmo código | Duas mensagens na outbox; código único em `coupons` |
| RF12 | Login e senha dos três perfis | `/api/login`, sessão, papéis e logout |
| RF13 | CRUD aluno e empresa finalizados | Cadastro, consulta/edição do próprio perfil e desativação |
| RF14 | Conferência presencial | `/api/coupons/validate`, propriedade e uso único |
| ARQ01 | MVC | Views, Controller, Services e Repository mapeados na arquitetura |
| PERS01 | Banco e estratégia de acesso | ER, SQL, migração e DAO parametrizado |
| DOC01 | Casos de uso, histórias, classes e componentes | `docs/sprints/01`, atualizados na Sprint 03 |
| DOC02 | ER e CRUDs iniciais | `docs/sprints/02` |
| DOC03 | Arquitetura, persistência e tutorial | `docs/ARQUITETURA.md`, `docs/TUTORIAL.md` e apresentação |
| DOC04 | Versões dos modelos no GitHub | Pastas 01/02/03 com status e evolução |
| AP01 | Apresentação curta, com menos de 10 minutos | 8 slides com texto de apoio à fala e tutorial compacto |

## Continuação - Release 2 / LAB04

| ID | Marco e requisito | Implementação / evidência |
|---|---|---|
| R2-S01-01 | Lab04S01: envio de moedas com motivo e saldo | `MeritService.recognize`, `/api/recognitions`, lote atômico e gatilhos |
| R2-S01-02 | Lab04S01: consulta de extrato por professor e aluno | `/api/me`, `/api/statement`, `statementView` e testes dos dois perfis |
| R2-S01-03 | Lab04S01: e-mail de confirmação de envio e recebimento, template por perfil | `recognitionTemplates`, duas mensagens por reconhecimento, entrega e reenvio testados com provedor simulado |
| R2-S02-01 | Lab04S02: diagramas de sequência por caso de uso | [Seis sequências individuais](release-2/sequencias/README.md), com arquivos `.mmd` |
| R2-S02-02 | Lab04S02: cadastro de vantagens pela empresa | `POST /api/offers`, `offerForm`, validação de título, descrição, foto, custo e perfil |
| R2-S02-03 | Lab04S02: listagem de vantagens para aluno | `GET /api/offers`, `homeView` e teste de catálogo ativo |
| R2-S03-01 | Lab04S03: diagrama de sequência geral | [Sequência geral](release-2/sequencias/README.md#sequência-geral), do reconhecimento à conferência presencial |
| R2-S03-02 | Lab04S03: troca de vantagens pelo aluno | `MeritService.redeem`, cupom, débito, dois templates com mesmo código e testes de rollback/uso único |
| R2-DOC-01 | Modelos atualizados e alinhados à implementação | [Classes, componentes e comparação com a Release 1](release-2/modelos.md); modelos anteriores preservados |
| R2-AP-01 | Apresentação final e vídeo se necessário | [Roteiro reproduzível](release-2/apresentacao.md); realização/gravação pelo grupo não comprovada por arquivos |

A suíte `tests/release2.test.mjs` complementa `tests/integration.test.mjs`. Esta atualização é compatível com bancos existentes, sem nova migração. E-mails antigos não são recriados; as confirmações do professor são geradas em novos reconhecimentos.

## Critérios verificáveis

1. Professor não envia zero, fração ou valor acima do saldo.
2. Motivo não pode estar vazio.
3. Aluno não recebe de professor de instituição diferente.
4. Repetir a mesma chave de operação não duplica as moedas.
5. Resgate sem saldo não deixa cupom nem mensagens órfãs.
6. Cupom usado não é aceito novamente.
7. Empresa não altera vantagem de outra empresa.
8. Perfil desativado não autentica; seu histórico permanece.
9. Crédito do mesmo semestre não é aplicado duas vezes.
10. Sem credencial de e-mail, a interface informa que não houve envio externo.
11. Reconhecimento novo gera uma mensagem para o aluno e outra para o professor, com textos distintos e mesma referência de transação.
12. Falha na gravação de uma confirmação reverte o reconhecimento; falha do provedor após commit permite reenvio sem alterar os saldos.
13. Resgate gera templates distintos para aluno e empresa, contendo o mesmo código de cupom.

## Pontos que arquivos não podem substituir

O acompanhamento durante as aulas e as apresentações semanais dependem da participação real do grupo. Esta entrega não recria esse histórico. As versões de sprint são propostas de evolução, não provas de trabalho passado. O envio externo de e-mail deve ser configurado e testado antes de afirmar atendimento integral aos RF06/RF11.
