# Release 3 - LABDESENV_5

## Entrega atual: Lab05S01

Seleção e modelagem das três funcionalidades avançadas propostas para o Meritus, conforme a seção 4.1 do enunciado fornecido pelo responsável.

| Opção | Funcionalidade selecionada | Padrão GoF |
|---|---|---|
| 2.2 | Diferentes políticas de concessão de benefícios | Strategy |
| 2.3 | Controle do ciclo de vida dos resgates | State |
| 2.4 | Emissão de cupons e comprovantes de resgate | Factory Method |

- [Documento completo do S01](lab05s01.md): problemas, responsabilidades, justificativas, integração MVC e decisões de negócio propostas.
- [PDF para apresentação e entrega](Lab05S01-Meritus.pdf).
- [Seis diagramas UML](diagramas/README.md): três de estados e três de atividades, com fontes PlantUML, SVG e PNG.

**Situação:** entrega de planejamento e modelagem do S01. As classes e comportamentos novos descritos são propostos, ainda não implementados. O aplicativo publicado mantém a versão funcional anterior. Os modelos das releases anteriores foram preservados em `docs/sprints` e `docs/release-2`.

O S02 prevê o diagrama de implantação, a atualização do diagrama de classes e a especificação técnica detalhada. O S03 prevê implementação, integração e demonstração. Esses dois marcos não são apresentados como concluídos nesta entrega.

## Conferência da entrega S01

| Exigência | Evidência |
|---|---|
| Escolher três funcionalidades | Tabela acima e seção 1 do documento |
| Problema, responsabilidades, justificativa e arquitetura por escolha | Seções 2, 3 e 4 |
| Um diagrama de estados por funcionalidade | Figuras 1, 3 e 5 |
| Um diagrama de atividades por funcionalidade | Figuras 2, 4 e 6 |
| Estados, eventos, condições e transições | Fontes de estados com notação `evento [guarda] / efeito` |
| Atividades, decisões, responsáveis e alternativas | Diagramas de atividades com raias e saídas de erro |

## Reproduzir os artefatos

As fontes `.puml` são a referência dos diagramas. A renderização foi feita localmente com PlantUML 1.2026.10, sem enviar conteúdo do projeto a um servidor de diagramas. Veja [instruções de geração](diagramas/README.md).

O PDF é gerado do Markdown e das imagens pelo script `scripts/docs/build-lab05s01.py`, usando Python com ReportLab e Pillow. O caminho do Python é definido pelo ambiente de execução; não é necessário alterar o aplicativo ou instalar essas bibliotecas no Worker.

A apresentação semanal ao professor continua sendo uma atividade presencial do grupo. Os arquivos não comprovam participação em aula.
