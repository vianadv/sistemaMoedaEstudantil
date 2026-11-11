import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { sendGmail } from '../src/services/GmailService.mjs';
import { EmailService, emailProvider } from '../src/services/EmailService.mjs';
import { database } from '../server.mjs';
import { api } from '../src/controllers/AppController.mjs';
import { Repository } from '../src/models/Repository.mjs';
import { MeritService } from '../src/services/MeritService.mjs';
import { seed } from '../src/services/seed.mjs';

const env = { GMAIL_USER: 'meritus@example.test', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' };
const message = {
  id: crypto.randomUUID(), recipient: 'aluno@example.test',
  subject: 'Você recebeu um reconhecimento pela colaboração na apresentação do projeto',
  body: 'Olá, Ana!\nVocê recebeu 10 moedas.\n.Motivo: participação e colaboração.'
};

function smtp({ authCode = 235, disconnectOnData = false, timeoutOnEhlo = false, recipientCode = 250 } = {}) {
  const socket = new EventEmitter(), writes = [];
  let timeout;
  socket.setEncoding = () => socket;
  socket.setTimeout = (_ms, handler) => { timeout = handler; return socket; };
  socket.destroy = () => { socket.destroyed = true; socket.emit('close'); };
  socket.end = line => { socket.ended = line; socket.emit('error', new Error('Erro após a confirmação')); socket.emit('close'); };
  socket.write = line => {
    writes.push(line);
    queueMicrotask(() => {
      if (writes.length === 1 && timeoutOnEhlo) { timeout(); return; }
      if (writes.length === 6 && disconnectOnData) { socket.emit('close'); return; }
      const responses = [
        '250-smtp.gmail.com\r\n250-AUTH PLAIN LOGIN\r\n250 SMTPUTF8\r\n',
        `${authCode} Authentication result\r\n`, '250 Sender OK\r\n',
        `${recipientCode} Recipient result\r\n`, '354 Send message\r\n', '250 Message accepted\r\n'
      ];
      const response = responses[writes.length - 1];
      // Simula respostas TCP divididas no meio de uma linha.
      socket.emit('data', response.slice(0, 7));
      socket.emit('data', response.slice(7));
    });
    return true;
  };
  return {
    socket, writes,
    connect(options) {
      assert.equal(options.host, 'smtp.gmail.com');
      assert.equal(options.port, 465);
      assert.equal(options.rejectUnauthorized, true);
      assert.equal(options.minVersion, 'TLSv1.2');
      queueMicrotask(() => socket.emit('data', '220 SMTP ready\r\n'));
      return socket;
    }
  };
}

test('configuração aceita Gmail completo, mantém Resend e recusa configuração incompleta', () => {
  assert.equal(emailProvider({}), null);
  assert.equal(emailProvider({ GMAIL_USER: env.GMAIL_USER }), null);
  assert.equal(emailProvider({ GMAIL_APP_PASSWORD: ' ' }), null);
  assert.equal(emailProvider(env), 'gmail');
  assert.equal(emailProvider({ RESEND_API_KEY: 'key', EMAIL_FROM: 'Meritus <from@example.test>' }), 'resend');
  assert.equal(emailProvider({ EMAIL_PROVIDER: 'unknown', ...env }), null);
});

test('Gmail envia por TLS ao destinatário cadastrado e preserva texto e assunto em português', async () => {
  const server = smtp();
  await sendGmail(message, env, server.connect);
  assert.equal(server.writes[1], 'AUTH PLAIN ' + Buffer.from('\0meritus@example.test\0abcdefghijklmnop').toString('base64') + '\r\n');
  assert.equal(server.writes[2], 'MAIL FROM:<meritus@example.test>\r\n');
  assert.equal(server.writes[3], 'RCPT TO:<aluno@example.test>\r\n');
  const data = server.writes[5];
  assert.ok(data.includes('From: Meritus <meritus@example.test>'));
  assert.ok(data.includes('To: <aluno@example.test>'));
  const encodedSubject = data.match(/Subject: ([\s\S]+?)\r\nDate:/)[1];
  const subject = [...encodedSubject.matchAll(/=\?UTF-8\?B\?([^?]+)\?=/g)]
    .map(m => Buffer.from(m[1], 'base64').toString('utf8')).join('');
  assert.equal(subject, message.subject);
  const body = data.split('\r\n\r\n')[1].replace(/\r\n\.\r\n$/, '').replaceAll('\r\n', '');
  assert.equal(Buffer.from(body, 'base64').toString('utf8'), message.body);
  assert.ok(!data.includes('abcdefghijklmnop'));
  assert.equal(server.socket.ended, 'QUIT\r\n');
});

test('Gmail recusa autorização inválida sem revelar a senha e sem enviar a mensagem', async () => {
  const server = smtp({ authCode: 535 });
  await assert.rejects(sendGmail(message, env, server.connect), error => {
    assert.match(error.message, /senha de app.*SMTP 535/);
    assert.ok(!error.message.includes('abcdefghijklmnop'));
    return true;
  });
  assert.equal(server.writes.length, 2);
  assert.equal(server.socket.destroyed, true);
});

test('Gmail trata desconexão e timeout como falha, sem confirmar envio', async () => {
  const disconnected = smtp({ disconnectOnData: true });
  await assert.rejects(sendGmail(message, env, disconnected.connect), /encerrada antes da confirmação/);
  const timedOut = smtp({ timeoutOnEhlo: true });
  await assert.rejects(sendGmail(message, env, timedOut.connect), /demorou a responder/);
  const rejectedRecipient = smtp({ recipientCode: 550 });
  await assert.rejects(sendGmail(message, env, rejectedRecipient.connect), /destinatário cadastrado.*SMTP 550/);
});

test('Gmail valida endereços e senha de app antes de conectar', async () => {
  const connect = () => assert.fail('Não deve abrir conexão com dados inválidos');
  await assert.rejects(sendGmail({ ...message, recipient: 'ana@example.test\r\nBcc: outro@example.test' }, env, connect), /Endereço/);
  await assert.rejects(sendGmail(message, { ...env, GMAIL_APP_PASSWORD: '' }, connect), /senha de app/);
});

async function outbox(t) {
  const DB = database(), repo = new Repository(DB);
  t.after(() => DB.close());
  await seed(repo);
  const teacher = await repo.one("SELECT * FROM users WHERE id='demo-teacher'");
  const service = new MeritService(repo, { DB });
  await service.semester(teacher);
  await service.recognize(teacher, { studentId: 'demo-student', amount: 10, reason: 'Participação no projeto', key: crypto.randomUUID() });
  return { DB, repo, messages: await repo.all('SELECT * FROM emails') };
}

test('outbox Gmail usa os dois cadastros e não reenvia mensagens já aceitas', async t => {
  const { repo, messages } = await outbox(t);
  const delivered = [];
  const mail = new EmailService(repo, env, { gmail: async m => delivered.push(m) });
  const ids = messages.map(m => m.id);
  await mail.deliver(ids);
  await mail.deliver(ids);
  assert.equal(delivered.length, 2);
  assert.deepEqual(new Set(delivered.map(m => m.recipient)), new Set(['aluno@meritus.demo', 'professor@meritus.demo']));
  assert.ok((await repo.all('SELECT * FROM emails')).every(m => m.status === 'sent'));
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-teacher'")).balance, 990);
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-student'")).balance, 10);
});

test('falha Gmail permite reenvio e preserva as moedas e a outra confirmação', async t => {
  const { repo, messages } = await outbox(t);
  let fail = true;
  const mail = new EmailService(repo, env, { gmail: async m => {
    if (fail && m.user_id === 'demo-student') throw new Error('Gmail temporariamente indisponível.');
  } });
  await mail.deliver(messages.map(m => m.id));
  assert.equal((await repo.one("SELECT status FROM emails WHERE user_id='demo-student'")).status, 'failed');
  assert.equal((await repo.one("SELECT status FROM emails WHERE user_id='demo-teacher'")).status, 'sent');
  fail = false;
  await mail.deliver(messages.map(m => m.id));
  assert.ok((await repo.all('SELECT * FROM emails')).every(m => m.status === 'sent' && m.error === null));
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-student'")).balance, 10);
});

test('health reconhece Gmail sem expor credenciais e mantém modo demonstração quando incompleto', async t => {
  const { DB } = await outbox(t);
  for (const [config, expected] of [[env, true], [{ GMAIL_USER: env.GMAIL_USER }, false]]) {
    const response = await api(new Request('http://localhost/api/health'), { DB, ...config });
    const data = await response.json();
    assert.equal(data.emailConfigured, expected);
    assert.ok(!JSON.stringify(data).includes(env.GMAIL_USER));
    assert.ok(!JSON.stringify(data).includes(env.GMAIL_APP_PASSWORD));
  }
});
