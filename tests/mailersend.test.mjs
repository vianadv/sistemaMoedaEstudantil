import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database } from '../server.mjs';
import { Repository } from '../src/models/Repository.mjs';
import { seed } from '../src/services/seed.mjs';
import { MeritService } from '../src/services/MeritService.mjs';
import { EmailService, emailProvider } from '../src/services/EmailService.mjs';
import { sendMailerSend } from '../src/services/MailerSendService.mjs';
import { api } from '../src/controllers/AppController.mjs';

const config = { EMAIL_PROVIDER: 'mailersend', MAILERSEND_API_KEY: 'private-test-token', MAILERSEND_FROM: 'Meritus <no-reply@example.test>' };
const accepted = (headers = {}) => new Response(null, { status: 202, headers: { 'x-message-id': crypto.randomUUID(), ...headers } });

async function fixture(t, env = config) {
  const DB = database();
  t.after(() => DB.close());
  const repo = new Repository(DB);
  await seed(repo);
  for (const [id, email] of [['demo-teacher', 'professor@example.test'], ['demo-student', 'aluno@example.test'], ['demo-partner', 'empresa@example.test']]) {
    await repo.run('UPDATE users SET email=? WHERE id=?', email, id);
  }
  const teacher = await repo.one("SELECT * FROM users WHERE id='demo-teacher'");
  const student = await repo.one("SELECT * FROM users WHERE id='demo-student'");
  const service = new MeritService(repo, { DB, ...env });
  await service.semester(teacher);
  return { DB, repo, teacher, student, service };
}

test('MailerSend exige chave e remetente válido e health não revela credenciais', async t => {
  assert.equal(emailProvider(config), 'mailersend');
  assert.equal(emailProvider({ ...config, EMAIL_PROVIDER: undefined }), 'mailersend');
  for (const invalid of [{ MAILERSEND_API_KEY: '' }, { MAILERSEND_FROM: '' }, { MAILERSEND_FROM: 'nome inválido' }, { MAILERSEND_FROM: 'a@example.test\r\nBcc: b@example.test' }]) {
    assert.equal(emailProvider({ ...config, ...invalid }), null);
  }
  assert.equal(emailProvider({ ...config, EMAIL_PROVIDER: 'other' }), null);
  const { DB } = await fixture(t);
  const data = await (await api(new Request('http://localhost/api/health'), { DB, ...config })).json();
  assert.equal(data.emailConfigured, true);
  assert.ok(!JSON.stringify(data).includes(config.MAILERSEND_API_KEY));
  assert.ok(!JSON.stringify(data).includes('no-reply@example.test'));
});

test('MailerSend recebe confirmações e cupons nos e-mails cadastrados, sem reenviar aceitos', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, ...options, payload: JSON.parse(options.body) });
    return accepted();
  });
  const { service, repo, teacher, student } = await fixture(t);
  const recognition = { studentId: student.id, amount: 200, reason: 'Colaboração na apresentação', key: crypto.randomUUID() };
  await service.recognize(teacher, recognition);
  await service.recognize(teacher, recognition);
  const redemption = { offerId: 'demo-coffee', key: crypto.randomUUID() };
  const { coupon } = await service.redeem(student, redemption);
  await service.redeem(student, redemption);
  const rows = await repo.all('SELECT * FROM emails');
  await service.mail.deliver(rows.map(row => row.id));
  assert.equal(requests.length, 4);
  for (const row of rows) {
    assert.equal(row.status, 'sent');
    assert.equal(row.error, null);
    const request = requests.find(r => r.payload.subject === row.subject && r.payload.to[0].email === row.recipient);
    assert.ok(request);
    assert.equal(request.url, 'https://api.mailersend.com/v1/email');
    assert.equal(request.redirect, 'error');
    assert.ok(request.signal instanceof AbortSignal);
    assert.equal(request.headers.Authorization, `Bearer ${config.MAILERSEND_API_KEY}`);
    assert.deepEqual(request.payload.from, { email: 'no-reply@example.test', name: 'Meritus' });
    assert.deepEqual(request.payload.to, [{ email: row.recipient }]);
    assert.equal(request.payload.text, row.body);
  }
  const couponMessages = requests.filter(r => r.payload.subject.includes(coupon.code));
  assert.equal(couponMessages.length, 2);
  assert.deepEqual(new Set(couponMessages.map(r => r.payload.to[0].email)), new Set(['aluno@example.test', 'empresa@example.test']));
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-student'")).balance, 150);
});

test('MailerSend recusado preserva moedas, oculta erros sensíveis e permite reenvio', async t => {
  let fail = true;
  t.mock.method(globalThis, 'fetch', async () => fail
    ? new Response(JSON.stringify({ error: config.MAILERSEND_API_KEY }), { status: 401 }) : accepted());
  const { service, repo, teacher, student } = await fixture(t);
  await service.recognize(teacher, { studentId: student.id, amount: 10, reason: 'Participação', key: crypto.randomUUID() });
  const failed = await repo.all('SELECT * FROM emails');
  assert.ok(failed.every(m => m.status === 'failed' && /chave de envio/.test(m.error)));
  assert.ok(!JSON.stringify(failed).includes(config.MAILERSEND_API_KEY));
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-student'")).balance, 10);
  fail = false;
  await service.mail.deliver(failed.map(m => m.id));
  assert.ok((await repo.all('SELECT * FROM emails')).every(m => m.status === 'sent' && m.error === null));
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-student'")).balance, 10);
});

test('MailerSend incompleto não envia; supressão sem identificador e falha de rede não viram sucesso', async t => {
  const { repo, service, teacher, student } = await fixture(t, { ...config, MAILERSEND_FROM: '' });
  const mock = t.mock.method(globalThis, 'fetch', () => assert.fail('Configuração incompleta não deve enviar'));
  await service.recognize(teacher, { studentId: student.id, amount: 10, reason: 'Participação', key: crypto.randomUUID() });
  assert.equal(mock.mock.callCount(), 0);
  await assert.rejects(sendMailerSend({ recipient: 'aluno@meritus.demo' }, config), /fictício de demonstração/);
  assert.equal(mock.mock.callCount(), 0);
  const rows = await repo.all('SELECT * FROM emails');
  assert.ok(rows.every(m => m.status === 'pending'));
  mock.mock.mockImplementation(async () => new Response('{"warnings":[{"type":"ALL_SUPPRESSED"}]}', { status: 202 }));
  const mail = new EmailService(repo, config);
  await mail.deliver([rows[0].id]);
  assert.equal((await repo.one('SELECT status FROM emails WHERE id=?', rows[0].id)).status, 'failed');
  mock.mock.mockImplementation(async () => { throw new Error(config.MAILERSEND_API_KEY); });
  await mail.deliver([rows[0].id]);
  const failed = await repo.one('SELECT * FROM emails WHERE id=?', rows[0].id);
  assert.equal(failed.status, 'failed');
  assert.ok(!failed.error.includes(config.MAILERSEND_API_KEY));
});

test('MailerSend mantém fila pausada aceita sem duplicá-la e trata limites sem expor resposta', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => accepted({ 'x-send-paused': 'true' }));
  const { repo, service, teacher, student } = await fixture(t);
  await service.recognize(teacher, { studentId: student.id, amount: 10, reason: 'Participação', key: crypto.randomUUID() });
  const rows = await repo.all('SELECT * FROM emails');
  assert.ok(rows.every(m => m.status === 'sent' && /aguardando liberação/.test(m.error)));
  await service.mail.deliver(rows.map(m => m.id));
  assert.equal(mock.mock.callCount(), 2);
  for (const status of [403, 422, 429, 500]) {
    mock.mock.mockImplementation(async () => new Response(config.MAILERSEND_API_KEY, { status }));
    await assert.rejects(sendMailerSend(rows[0], config), e => !e.message.includes(config.MAILERSEND_API_KEY));
  }
});
