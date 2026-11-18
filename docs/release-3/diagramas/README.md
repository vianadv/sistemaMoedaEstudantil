# Diagramas UML - Lab05S01

As seis figuras são propostas de comportamento para a Release 3, ainda não implementadas. A referência textual é [lab05s01.md](../lab05s01.md).

| Figura | Tipo / objeto ou fluxo | Fonte | Visualização |
|---|---|---|---|
| 1 | Estados de ConfiguracaoPolitica | [PlantUML](01-politicas-estados.puml) | [SVG](renderizados/01-politicas-estados.svg) / [PNG](renderizados/01-politicas-estados.png) |
| 2 | Atividades de cálculo de benefício | [PlantUML](02-politicas-atividades.puml) | [SVG](renderizados/02-politicas-atividades.svg) / [PNG](renderizados/02-politicas-atividades.png) |
| 3 | Estados de Resgate | [PlantUML](03-resgate-estados.puml) | [SVG](renderizados/03-resgate-estados.svg) / [PNG](renderizados/03-resgate-estados.png) |
| 4 | Atividades de transição de resgate | [PlantUML](04-resgate-atividades.puml) | [SVG](renderizados/04-resgate-atividades.svg) / [PNG](renderizados/04-resgate-atividades.png) |
| 5 | Estados de DocumentoResgate | [PlantUML](05-documentos-estados.puml) | [SVG](renderizados/05-documentos-estados.svg) / [PNG](renderizados/05-documentos-estados.png) |
| 6 | Atividades de emissão de documento | [PlantUML](06-documentos-atividades.puml) | [SVG](renderizados/06-documentos-atividades.svg) / [PNG](renderizados/06-documentos-atividades.png) |

## Legenda

- Estados representam situações duradouras do objeto; eventos aparecem nas setas.
- Transição: `evento [condição de guarda] / efeito`. Uma seta sem evento para o estado final indica encerramento lógico, sem exclusão do registro.
- A transição inicial contém somente o efeito de inicialização. Autenticação e elegibilidade são precondições verificadas pelo fluxo da aplicação, não gatilhos do pseudoestado inicial.
- Nas atividades, raias identificam o participante, losangos representam decisões e os rótulos representam resultados mutuamente exclusivos.
- Os diagramas de estados de política e documento não significam aplicação do padrão State nessas duas funcionalidades. O padrão State foi escolhido para o contexto Resgate.
- Aceite de e-mail pelo serviço não comprova chegada à caixa de entrada. Nenhum diagrama depende de leitura pelo destinatário para concluir uma transação financeira.

## Renderização local

Ferramenta validada: PlantUML 1.2026.10, com Java e layout Smetana nos estados. A ferramenta fica fora do código do aplicativo e os fontes não usam includes remotos.

Na raiz do repositório, ajuste o caminho do JAR para sua instalação:

```sh
java '-Djava.awt.headless=true' -jar /caminho/plantuml.jar -charset UTF-8 -checkonly docs/release-3/diagramas
java '-Djava.awt.headless=true' -jar /caminho/plantuml.jar -charset UTF-8 -tpng -o renderizados docs/release-3/diagramas
java '-Djava.awt.headless=true' -jar /caminho/plantuml.jar -charset UTF-8 -tsvg -o renderizados docs/release-3/diagramas
```

Depois gere o PDF: `python scripts/docs/build-lab05s01.py`, com ReportLab e Pillow instalados. Consulte a [documentação de linha de comando](https://plantuml.com/command-line), a [notação de estados](https://plantuml.com/state-diagram) e a [notação de atividades com raias](https://plantuml.com/activity-diagram-beta).
