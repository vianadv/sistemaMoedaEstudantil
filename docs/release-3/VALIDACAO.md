# Conferência da entrega Lab05S01

Data: 18/11/2026. Escopo conferido contra a seção 4.1 do enunciado fornecido pelo responsável.

## Cobertura

- Três funcionalidades selecionadas: opções 2.2, 2.3 e 2.4.
- Um padrão GoF justificado por escolha: Strategy, State e Factory Method.
- Problema, responsabilidades e pontos de integração MVC descritos nas três análises.
- Três diagramas de estados, com objeto relevante, estados, eventos, guardas e efeitos.
- Três diagramas de atividades, com raias, decisões e fluxos alternativos.
- Propostas futuras diferenciadas do comportamento já implementado. O código-base de referência é `82a4d53`.

## Verificações realizadas

1. O enunciado de quatro páginas foi extraído e conferido visualmente, incluindo os limites de S01, S02 e S03.
2. As seis fontes `.puml` passaram pela validação de sintaxe do PlantUML 1.2026.10.
3. Foram gerados seis SVGs e seis PNGs; XML dos SVGs e integridade dos PNGs foram conferidos.
4. Os eventos e caminhos alternativos foram revisados contra as regras textuais. Raias separam o domínio da persistência e do envio de notificações.
5. O PDF consolidado possui 11 páginas: cinco de análise e seis de diagramas. A renderização em imagens foi revisada para conferir paginação, tabelas, legibilidade e ausência de cortes.
6. Links locais da nova documentação e a correspondência dos seis diagramas com suas fontes foram conferidos. `git diff --check` não apontou erros.

Esta validação é da modelagem do S01. Não houve implementação das novas funcionalidades, migração do banco ou nova publicação do aplicativo. Participação em aula e apresentação pelo grupo não são comprovadas por estes arquivos.
