import { connect as connectTls } from 'node:tls';

const encode = value => btoa(String.fromCharCode(...new TextEncoder().encode(value)));
const validAddress = value => typeof value === 'string' && /^[^\s\x00-\x1f\x7f<>@]+@[^\s\x00-\x1f\x7f<>@]+\.[^\s\x00-\x1f\x7f<>@]+$/.test(value);

function subjectHeader(subject) {
  const words = [];
  let part = '';
  for (const character of String(subject)) {
    if (new TextEncoder().encode(part + character).length > 42) {
      words.push(`=?UTF-8?B?${encode(part)}?=`);
      part = '';
    }
    part += character;
  }
  words.push(`=?UTF-8?B?${encode(part)}?=`);
  return words.join('\r\n ');
}

// SMTP do Gmail com TLS desde a conexão. Não usa a senha normal da conta.
// A fábrica de socket é substituída somente nos testes isolados.
export async function sendGmail(message, env, connect = connectTls) {
  const sender = String(env.GMAIL_USER || '').trim();
  const password = String(env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  if (!validAddress(sender) || !validAddress(message.recipient)) throw new Error('Endereço de e-mail inválido.');
  if (!/^[a-zA-Z0-9]{16}$/.test(password)) throw new Error('Configure a senha de app do remetente Gmail.');
  const socket = connect({ host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com', minVersion: 'TLSv1.2', rejectUnauthorized: true });
  const replies = [], waiters = [];
  let buffer = '', replyCode, failure, finished = false;
  const fail = error => {
    if (failure || finished) return;
    failure = error;
    for (const waiter of waiters.splice(0)) waiter.reject(error);
  };
  socket.setEncoding('utf8');
  socket.on('error', () => fail(new Error('Não foi possível conectar ao Gmail.')));
  socket.on('close', () => fail(new Error('A conexão com o Gmail foi encerrada antes da confirmação.')));
  socket.setTimeout(15000, () => {
    fail(new Error('O Gmail demorou a responder. Tente enviar novamente.'));
    socket.destroy();
  });
  socket.on('data', chunk => {
    if (failure || finished) return;
    buffer += chunk;
    if (buffer.length > 65536) {
      fail(new Error('Resposta inválida do servidor de e-mail.'));
      socket.destroy();
      return;
    }
    while (buffer.includes('\r\n')) {
      const end = buffer.indexOf('\r\n'), line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const match = /^(\d{3})([ -])(.*)$/.exec(line);
      if (!match || (replyCode && replyCode !== Number(match[1]))) {
        fail(new Error('Resposta inválida do servidor de e-mail.'));
        socket.destroy();
        return;
      }
      replyCode = Number(match[1]);
      if (match[2] === ' ') {
        const reply = { code: replyCode };
        replyCode = undefined;
        const waiter = waiters.shift();
        if (waiter) waiter.resolve(reply); else replies.push(reply);
      }
    }
  });
  const read = () => {
    if (replies.length) return Promise.resolve(replies.shift());
    if (failure) return Promise.reject(failure);
    return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
  };
  const expect = async (codes, label) => {
    const reply = await read();
    if (!codes.includes(reply.code)) throw new Error(`${label} (SMTP ${reply.code}).`);
  };
  const command = async (line, codes, label) => {
    if (failure) throw failure;
    socket.write(line + '\r\n');
    await expect(codes, label);
  };
  try {
    await expect([220], 'O Gmail não aceitou a conexão');
    await command('EHLO meritus-estudantil.vianadv.workers.dev', [250], 'O Gmail recusou a conexão');
    await command('AUTH PLAIN ' + encode(`\0${sender}\0${password}`), [235], 'O Gmail recusou a autorização. Confira a senha de app do remetente');
    await command(`MAIL FROM:<${sender}>`, [250], 'O Gmail recusou o remetente');
    await command(`RCPT TO:<${message.recipient}>`, [250, 251], 'O Gmail recusou o destinatário cadastrado');
    await command('DATA', [354], 'O Gmail recusou a mensagem');
    const id = String(message.id).replace(/[^a-zA-Z0-9-]/g, '') || crypto.randomUUID();
    const body = encode(String(message.body)).match(/.{1,76}/g)?.join('\r\n') || '';
    const mime = [
      `From: Meritus <${sender}>`, `To: <${message.recipient}>`,
      `Subject: ${subjectHeader(message.subject)}`, `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${id}@${sender.split('@')[1]}>`, 'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', body
    ].join('\r\n');
    await command(mime + '\r\n.', [250], 'O Gmail não confirmou o envio');
    finished = true; // Uma falha no QUIT não deve transformar envio aceito em falha.
    socket.end('QUIT\r\n');
  } finally {
    socket.setTimeout(0);
    if (!finished) socket.destroy();
  }
}
