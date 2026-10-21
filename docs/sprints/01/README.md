# Sprint 01 · Modelagem

**Status:** versão proposta reconstruída nesta entrega, sem alegação de execução anterior.

Objetivo: entender os três perfis e o circuito reconhecimento → resgate. Entregas: casos de uso em `casos-de-uso.puml`, histórias abaixo e classes/componentes em [modelos.md](modelos.md).

| História | Como / quero / para | Aceitação |
|---|---|---|
| HU01 | Como aluno, quero me cadastrar para participar | Nome, e-mail, CPF, RG, endereço, instituição e curso obrigatórios |
| HU02 | Como usuário, quero autenticar para acessar minhas funções | Login válido, sessão e acesso por perfil |
| HU03 | Como professor, quero receber crédito semestral para reconhecer | +1.000 acumulável, sem duplicar o semestre |
| HU04 | Como professor, quero enviar moedas para reconhecer o mérito | Aluno ativo da instituição, saldo suficiente, inteiro positivo e motivo |
| HU05 | Como aluno/professor, quero consultar extrato para conferir saldo | Entradas e saídas com motivo e data |
| HU06 | Como empresa, quero cadastrar vantagens para participar | Foto, descrição e custo positivo |
| HU07 | Como aluno, quero resgatar uma vantagem para usar minhas moedas | Débito e cupom no mesmo fluxo, saldo suficiente |
| HU08 | Como aluno/empresa, quero receber o cupom para realizar a troca | Mesmo código nos dois e-mails; envio exige provedor |
| HU09 | Como empresa, quero conferir cupom para evitar segundo uso | Apenas meu cupom e uso único |
| HU10 | Como aluno/empresa, quero editar e desativar cadastro | Apenas o próprio cadastro, histórico preservado |

Planejamento sugerido dos 100 minutos: 15 análise, 25 casos/histórias, 35 classes/componentes, 15 revisão cruzada e 10 apresentação do avanço. Não é registro de tempo medido.
