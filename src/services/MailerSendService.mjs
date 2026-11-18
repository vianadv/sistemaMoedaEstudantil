const address = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

export function mailerSendSender(env) {
  const value = env.MAILERSEND_FROM?.trim();
  if (!value || /[\r\n]/.test(value)) return null;
  const match = value.match(/^([^<>]+)\s*<([^<>]+)>$/);
  const email = (match ? match[2] : value).trim();
  if (!address.test(email) || email.length > 254) return null;
  return { email, name: match ? match[1].trim() : 'Meritus' };
}

export async function sendMailerSend(message, env) {
  const from = mailerSendSender(env);
  if (!from || !address.test(message.recipient)) throw new Error('Confira os endereços de envio e do cadastro.');
  if (/@meritus\.demo$/i.test(message.recipient)) throw new Error('Este é um endereço fictício de demonstração. Use uma conta cadastrada com e-mail real.');
  let response;
  try {
    response = await fetch('https://api.mailersend.com/v1/email', {
      // Workers aceita manual/follow; manual mantém a chave apenas neste destino.
      method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${env.MAILERSEND_API_KEY.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [{ email: message.recipient }], subject: message.subject, text: message.body })
    });
  } catch {
    throw new Error('O serviço de e-mail não respondeu. Confira o painel antes de tentar novamente.');
  }
  if (response.status !== 202) {
    if (response.status === 422) {
      const detail = await response.text().catch(() => '');
      if (/MS42225/.test(detail)) throw new Error('A conta de teste permite apenas dois destinatários diferentes. Use os endereços definidos para a demonstração.');
      if (/MS42222/.test(detail)) throw new Error('A cota de e-mails da conta de teste terminou. Aguarde a renovação ou a liberação do serviço.');
    }
    const errors = {
      401: 'A chave de envio foi recusada. Confira a autorização do serviço.',
      403: 'O serviço ainda não liberou este envio. Confira a conta e as permissões.',
      422: 'O serviço recusou o remetente ou destinatário. Confira a verificação e os limites da conta.',
      429: 'O limite de envios do serviço foi atingido. Tente novamente mais tarde.'
    };
    throw new Error(errors[response.status] || 'O serviço recusou o envio. Tente novamente mais tarde.');
  }
  // 202 sem identificador também ocorre quando o destinatário foi bloqueado pelo provedor.
  if (!response.headers.get('x-message-id')) throw new Error('O serviço não confirmou o aceite da mensagem. Confira o destinatário no painel.');
  // O provedor já tem a mensagem; não reenviar uma fila pausada para evitar duplicação.
  return response.headers.get('x-send-paused') === 'true'
    ? 'Mensagem aceita pelo serviço, aguardando liberação da fila no painel.' : null;
}
