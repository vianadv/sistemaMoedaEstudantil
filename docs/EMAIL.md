# E-mail automático para as contas cadastradas

O Meritus envia ao endereço informado no cadastro. Alunos, professores e empresas não precisam conectar Gmail nem autorizar serviços para receber. A instalação usa um único remetente do sistema, configurado pelo responsável pelo projeto.

## Gmail, sem Resend e sem domínio próprio

1. No Google, crie uma [senha de app](https://myaccount.google.com/apppasswords) para o Meritus. O Google exige verificação em duas etapas para disponibilizar essa opção. Use uma conta destinada ao projeto quando possível. A senha normal do Google não deve ser usada.
2. Na raiz do projeto, preencha o arquivo local `.env.gmail.json` com o e-mail remetente em `GMAIL_USER` e a senha de app em `GMAIL_APP_PASSWORD`. Esse arquivo é ignorado pelo Git. Não envie a senha pelo chat, não a inclua em capturas e não a coloque no código.
3. Após o build/deploy da aplicação, execute `npm run email:setup`. O script envia apenas essas configurações e `EMAIL_PROVIDER=gmail` ao armazenamento privado da Cloudflare. Os valores não são impressos nem colocados nos argumentos do processo.

Se o arquivo não existir, crie-o com a estrutura abaixo e preencha os valores no seu computador:

```json
{
  "GMAIL_USER": "",
  "GMAIL_APP_PASSWORD": ""
}
```

Para execução local, essas mesmas duas variáveis podem ser colocadas no `.env`, carregado por `npm start`. Não é necessário instalar dependências adicionais para enviar via Gmail: a conexão usa `node:tls`, suportado pelo Node e pela compatibilidade Node do Worker.

O [Google documenta](https://support.google.com/accounts/answer/185833?hl=pt-BR) os requisitos e restrições das senhas de app; elas podem não estar disponíveis em contas organizacionais ou com determinadas políticas de proteção. O projeto não modifica essas configurações da conta.

## Fluxo de envio

- Reconhecimento: confirmação para o professor e aviso para o aluno, nos endereços dos respectivos cadastros.
- Resgate: cupom para o aluno e conferência para a empresa, com o mesmo código.
- As mensagens são gravadas na mesma transação das moedas. A entrega é tentada após o commit.
- Gmail usa SMTP com TLS obrigatório em `smtp.gmail.com:465`; o endereço remetente é a conta autorizada. O destino vem da mensagem persistida, nunca do remetente técnico.
- `sent` significa que o servidor aceitou a mensagem. Entrega na caixa de entrada ainda pode depender de filtros ou rejeições posteriores.
- Falhas ficam registradas e podem ser reenviadas em Notificações. Mensagens já marcadas como enviadas são ignoradas.

O SMTP não oferece a chave de idempotência da API Resend. Se o provedor aceitar uma mensagem mas a conexão cair antes da confirmação, o status pode ficar como falha e o reenvio pode duplicar o e-mail. O `Message-ID` é estável nas tentativas, mas não é garantia de deduplicação pelo destinatário. As moedas e os cupons continuam protegidos pelas chaves de operação do banco.

## Alternativa Resend

Quem preferir Resend pode configurar `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` e `EMAIL_FROM`. A integração anterior foi mantida. Gmail dispensa esses valores.

Sem configuração explícita de provedor, o sistema seleciona Gmail quando há alguma variável Gmail; caso contrário seleciona Resend. Uma configuração incompleta não ativa o envio. Credenciais presentes não comprovam que são válidas: a entrega e o status de cada mensagem precisam ser conferidos.

## Verificação e estado atual

`/api/health` informa apenas `emailConfigured`, sem expor credenciais. Antes de configurar a conta, o valor permanece `false`. Os testes SMTP e de outbox usam transporte simulado, sem enviar a pessoas reais. Depois da configuração, faça a verificação com um endereço real autorizado; os endereços `@meritus.demo` não são caixas de entrada reais.

As mensagens antigas não são disparadas em lote automaticamente ao configurar o remetente. Os usuários podem tentar reenviar suas mensagens pendentes pela interface. Novas operações tentam entregar suas próprias mensagens após o commit.

Referências: [SMTP do Gmail](https://developers.google.com/workspace/gmail/imap/imap-smtp), [TLS no Worker](https://developers.cloudflare.com/workers/runtime-apis/nodejs/tls/).
