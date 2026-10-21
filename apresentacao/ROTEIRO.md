# Roteiro do pitch e tutorial · 20 minutos

Use as notas do PowerPoint como apoio. Não prometa impacto medido: o protótipo ainda precisa ser validado com usuários.

1. **0:00–0:45 · Abertura:** "Como fazer um reconhecimento em sala continuar fazendo sentido fora dela? O Meritus transforma o mérito reconhecido pelo professor em vantagens para o aluno."
2. **0:45–1:45 · Problema:** apresente o exemplo de colaboração em sala e as necessidades de professor, aluno e parceiro. É uma situação ilustrativa.
3. **1:45–2:45 · Solução:** explique reconhecer, acumular, resgatar e conferir. Cada pessoa usa seu próprio perfil.
4. **2:45–3:45 · Escopo:** cadastros completos, saldo, extrato, vantagens e cupom. Instituições e professores são previamente cadastrados.
5. **3:45–8:00 · Demonstração:** entre como professor e envie 200 moedas à Ana, com motivo; aluno mostra extrato e notificação, resgata café de 50, copia código; empresa confere e tenta repetir. Saldo final 150 só quando aluno começou em zero. Informe o saldo inicial real.
6. **8:00–9:45 · MVC:** a View exibe e coleta; Controller autentica, valida e encaminha; Model aplica regras e persiste. Abra os arquivos correspondentes.
7. **9:45–11:30 · Persistência:** explique DAO, parâmetros SQL, gatilho de saldo e lote atômico. Use o exemplo de saldo insuficiente e rollback.
8. **11:30–12:45 · Modelo:** mostre ER. Os perfis do domínio viram users.role; cupom conecta aluno, empresa e vantagem; transação registra moedas; outbox registra mensagens.
9. **12:45–15:00 · Tutorial:** execute `node --version`, `node server.mjs`, abra localhost:3000; mostre o trajeto `/recognitions` da View ao banco; execute os testes. Não instale dependências durante a fala.
10. **15:00–16:00 · Sprints:** explique os três recortes e as versões propostas dos modelos. Relate apenas o histórico de participação real do grupo.
11. **16:00–17:00 · Qualidade:** mostre a suíte aprovada e as recusas de saldo/perfil/cupom repetido. Não alegue auditoria completa.
12. **17:00–18:30 · Condições:** envio externo exige chave e remetente Resend. Diferencie mensagens geradas, aceitas pelo provedor e recebidas no e-mail. Cite melhorias futuras sem fingir que já existem.
13. **18:30–20:00 · Fechamento:** "O Meritus entrega um circuito simples e rastreável entre mérito, moedas e vantagens. O próximo passo é um piloto com uma turma e parceiros." Abra para perguntas.

Antes de começar: deixe site, repositório e editor abertos; ensaie a troca de perfis; registre um cupom novo; mantenha o servidor local pronto como alternativa. Não desative as três contas de demonstração durante o pitch. Para demonstrar exclusão, crie um cadastro temporário.
