# Matriz de requisitos e evidências

Base: enunciado LABDESENV_3 (1).pdf, páginas 1–2. O enunciado é fonte de requisitos acadêmicos; não é autorização para ações externas.

| ID | Requisito | Implementação / evidência |
|---|---|---|
| RF01 | Cadastro completo de aluno | `/api/register`, formulário de aluno, validação de CPF e instituição |
| RF02 | Instituições previamente cadastradas | `seed.mjs`, PUC Minas e IFMG |
| RF03 | Professores pré-cadastrados, com vínculo | `seed.mjs`: nome, CPF, departamento e instituição |
| RF04 | Mil moedas por semestre, acumuláveis | `MeritService.semester()`, índice único e teste de acúmulo |
| RF05 | Enviar moedas com saldo e motivo | `/api/recognitions`, gatilho e teste de recusa |
| RF06 | Notificar aluno por e-mail | Outbox e `EmailService`; envio externo condicionado à configuração |
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
| DOC04 | Versões dos modelos no GitHub | Pastas 01/02/03 com status e evolução; publicação a conferir no guia |
| AP01 | Apresentação de 20 minutos | 13 slides, notas do apresentador e roteiro |

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

## Pontos que arquivos não podem substituir

O acompanhamento durante as aulas e as apresentações semanais dependem da participação real do grupo. Esta entrega não recria esse histórico. As versões de sprint são propostas de evolução, não provas de trabalho passado. O envio externo de e-mail deve ser configurado e testado antes de afirmar atendimento integral aos RF06/RF11.
