import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database } from '../server.mjs';
import { api } from '../src/controllers/AppController.mjs';
import { Repository } from '../src/models/Repository.mjs';
import { MeritService } from '../src/services/MeritService.mjs';

async function fixture(t, config = {}) {
  const DB = database();
  t.after(() => DB.close());
  const env = { DB, ...config }, repo = new Repository(DB), cookies = {};
  async function call(path, method = 'GET', body, profile) {
    const response = await api(new Request('http://localhost/api' + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookies[profile] ? { Cookie: cookies[profile] } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    }), env);
    return { status: response.status, data: await response.json(), headers: response.headers };
  }
  async function login(profile, email) {
    const response = await call('/login', 'POST', { email, password: 'Meritus@123' });
    assert.equal(response.status, 200);
    cookies[profile] = response.headers.get('Set-Cookie').split(';')[0];
  }
  await login('teacher', 'professor@meritus.demo');
  await login('student', 'aluno@meritus.demo');
  await login('partner', 'empresa@meritus.demo');
  // O crédito semestral ocorre no primeiro acesso autenticado após o login.
  await call('/me', 'GET', undefined, 'teacher');
  const recognize = (overrides = {}) => call('/recognitions', 'POST', {
    studentId: 'demo-student', amount: 200,
    reason: 'Participação e colaboração na aula', key: crypto.randomUUID(), ...overrides
  }, 'teacher');
  return { env, repo, call, login, recognize };
}

test('Lab04S01: confirmação de envio e recebimento, extratos e idempotência', async t => {
  const { call, recognize, repo } = await fixture(t);
  const key = crypto.randomUUID();
  assert.equal((await recognize({ key })).status, 201);
  assert.equal((await recognize({ key })).status, 201);

  const studentMail = (await call('/emails', 'GET', undefined, 'student')).data;
  const teacherMail = (await call('/emails', 'GET', undefined, 'teacher')).data;
  assert.equal(studentMail.length, 1);
  assert.equal(teacherMail.length, 1);
  assert.equal(studentMail[0].recipient, 'aluno@meritus.demo');
  assert.equal(teacherMail[0].recipient, 'professor@meritus.demo');
  assert.match(studentMail[0].subject, /recebeu um reconhecimento/);
  assert.match(teacherMail[0].subject, /envio de moedas foi confirmado/);
  assert.notEqual(studentMail[0].body, teacherMail[0].body);
  for (const mail of [studentMail[0], teacherMail[0]]) {
    assert.equal(mail.status, 'pending');
    assert.match(mail.body, /200 moedas/);
    assert.match(mail.body, /Participação e colaboração na aula/);
    assert.match(mail.body, /Extrato/);
    assert.ok(mail.body.includes(mail.transaction_id));
  }
  assert.equal(studentMail[0].transaction_id, teacherMail[0].transaction_id);
  assert.equal((await call('/emails', 'GET', undefined, 'partner')).data.length, 0);
  const teacherStatement = (await call('/statement', 'GET', undefined, 'teacher')).data;
  const studentStatement = (await call('/statement', 'GET', undefined, 'student')).data;
  assert.equal(teacherStatement.length, 2);
  assert.equal(studentStatement.length, 1);
  assert.equal(studentStatement[0].id, teacherMail[0].transaction_id);
  assert.equal(teacherStatement[0].id, studentStatement[0].id);
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-teacher'")).balance, 800);
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-student'")).balance, 200);
});

test('Lab04S01: falha ao gravar a confirmação do professor reverte moedas e ambas as mensagens', async t => {
  const { env, repo } = await fixture(t);
  await repo.run(`CREATE TRIGGER fail_teacher_email BEFORE INSERT ON emails
    WHEN NEW.user_id='demo-teacher' BEGIN SELECT RAISE(ABORT,'Falha simulada'); END`);
  const teacher = await repo.one("SELECT * FROM users WHERE id='demo-teacher'");
  await assert.rejects(new MeritService(repo, env).recognize(teacher, {
    studentId: 'demo-student', amount: 200, reason: 'Colaboração na aula', key: crypto.randomUUID()
  }), /Falha simulada/);
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-teacher'")).balance, 1000);
  assert.equal((await repo.one("SELECT balance FROM users WHERE id='demo-student'")).balance, 0);
  assert.equal((await repo.one('SELECT COUNT(*) count FROM emails')).count, 0);
  assert.equal((await repo.one("SELECT COUNT(*) count FROM transactions WHERE kind='recognition'")).count, 0);
});

test('Lab04S01: entrega dos dois templates ao provedor e reenvio sem duplicar mensagens enviadas', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, ...options, payload: JSON.parse(options.body) });
    return new Response('{}', { status: 200 });
  });
  const { recognize, call, repo } = await fixture(t, {
    RESEND_API_KEY: 'test-key', EMAIL_FROM: 'Meritus <meritus@example.test>'
  });
  assert.equal((await recognize()).status, 201);
  assert.equal(requests.length, 2);
  const rows = await repo.all('SELECT * FROM emails');
  for (const row of rows) {
    assert.equal(row.status, 'sent');
    const request = requests.find(r => r.headers['Idempotency-Key'] === row.id);
    assert.ok(request);
    assert.equal(request.url, 'https://api.resend.com/emails');
    assert.deepEqual(request.payload.to, [row.recipient]);
    assert.equal(request.payload.subject, row.subject);
    assert.equal(request.payload.text, row.body);
    assert.equal(request.payload.from, 'Meritus <meritus@example.test>');
  }
  await call('/emails/retry', 'POST', {}, 'teacher');
  await call('/emails/retry', 'POST', {}, 'student');
  assert.equal(requests.length, 2);
});

test('Lab04S01: falha do provedor mantém a transferência e permite reenvio apenas pelo destinatário', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    requests.push({ id: options.headers['Idempotency-Key'], ...JSON.parse(options.body) });
    return new Response('{}', { status: requests.length === 1 ? 503 : 200 });
  });
  const { call, recognize, repo } = await fixture(t, {
    RESEND_API_KEY: 'test-key', EMAIL_FROM: 'Meritus <meritus@example.test>'
  });
  assert.equal((await recognize()).status, 201);
  const studentMail = (await call('/emails', 'GET', undefined, 'student')).data[0];
  assert.equal(studentMail.status, 'failed');
  assert.equal((await call('/emails', 'GET', undefined, 'teacher')).data[0].status, 'sent');
  assert.equal((await call('/me', 'GET', undefined, 'student')).data.user.balance, 200);
  assert.equal((await call('/me', 'GET', undefined, 'teacher')).data.user.balance, 800);
  await call('/emails/retry', 'POST', {}, 'partner');
  await call('/emails/retry', 'POST', {}, 'teacher');
  assert.equal(requests.length, 2);
  await call('/emails/retry', 'POST', {}, 'student');
  assert.equal(requests.length, 3);
  assert.equal(requests[2].id, studentMail.id);
  const retried = await repo.one('SELECT * FROM emails WHERE id=?', studentMail.id);
  assert.equal(retried.status, 'sent');
  assert.equal(retried.error, null);
  assert.equal((await repo.one('SELECT COUNT(*) count FROM emails')).count, 2);
});

test('Lab04S01: configuração incompleta não anuncia envio real', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', () => assert.fail('Não deve chamar o provedor'));
  const { call, recognize } = await fixture(t, { RESEND_API_KEY: 'test-key' });
  await recognize();
  assert.equal((await call('/me', 'GET', undefined, 'teacher')).data.emailConfigured, false);
  for (const profile of ['teacher', 'student']) {
    const response = await call('/emails/retry', 'POST', {}, profile);
    assert.match(response.data.message, /Modo demonstração/);
    assert.equal((await call('/emails', 'GET', undefined, profile)).data[0].status, 'pending');
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('Lab04S02: empresa cadastra vantagem completa e aluno vê apenas o catálogo ativo', async t => {
  const { call } = await fixture(t);
  const offer = {
    title: 'Desconto no almoço', description: 'Desconto de 20% no almoço do campus.',
    photo: 'https://example.test/almoco.jpg', cost: 80
  };
  assert.equal((await call('/offers')).status, 401);
  assert.equal((await call('/offers', 'POST', offer, 'student')).status, 403);
  assert.equal((await call('/offers', 'POST', offer, 'teacher')).status, 403);
  for (const invalid of [
    { description: '' }, { photo: '' }, { photo: 'http://example.test/foto.jpg' },
    { cost: 0 }, { cost: 2.5 }
  ]) {
    assert.equal((await call('/offers', 'POST', { ...offer, ...invalid }, 'partner')).status, 400);
  }
  assert.equal((await call('/offers', 'POST', offer, 'partner')).status, 201);
  const catalog = (await call('/offers', 'GET', undefined, 'student')).data;
  const created = catalog.find(o => o.title === offer.title);
  assert.ok(created);
  assert.equal(created.photo, offer.photo);
  assert.equal(created.cost, offer.cost);
  assert.equal(created.description, offer.description);
  assert.ok(created.partner);
  assert.equal((await call('/offers/' + created.id, 'DELETE', undefined, 'partner')).status, 200);
  assert.ok(!(await call('/offers', 'GET', undefined, 'student')).data.some(o => o.id === created.id));
  assert.ok((await call('/offers', 'GET', undefined, 'partner')).data.some(o => o.id === created.id && !o.active));
});

test('Lab04S03: cupom com mesmo código nos dois templates, débito único e histórico preservado', async t => {
  const { call, recognize, repo } = await fixture(t);
  await recognize();
  const body = { offerId: 'demo-coffee', key: crypto.randomUUID() };
  const redemption = await call('/redemptions', 'POST', body, 'student');
  assert.equal(redemption.status, 201);
  const coupon = redemption.data.coupon;
  assert.equal((await call('/redemptions', 'POST', body, 'student')).data.coupon.code, coupon.code);
  const tx = await repo.one('SELECT * FROM transactions WHERE coupon_id=?', coupon.id);
  const messages = await repo.all('SELECT * FROM emails WHERE transaction_id=?', tx.id);
  assert.equal(messages.length, 2);
  assert.deepEqual(new Set(messages.map(m => m.user_id)), new Set(['demo-student', 'demo-partner']));
  for (const message of messages) {
    assert.ok(message.subject.includes(coupon.code));
    assert.ok(message.body.includes(coupon.code));
    assert.ok(message.body.includes(coupon.title));
    assert.ok(message.body.includes(`${coupon.cost} moedas`));
    assert.match(message.body, /uso único/);
  }
  assert.notEqual(messages[0].body, messages[1].body);
  assert.equal((await call('/me', 'GET', undefined, 'student')).data.user.balance, 150);
  assert.equal((await call('/statement', 'GET', undefined, 'student')).data.length, 2);
  // Atualizar o catálogo não modifica o benefício que o aluno já resgatou.
  await repo.run('UPDATE offers SET title=?,cost=? WHERE id=?', 'Novo café', 90, 'demo-coffee');
  const saved = (await call('/coupons', 'GET', undefined, 'student')).data[0];
  assert.equal(saved.title, coupon.title);
  assert.equal(saved.cost, 50);
});

test('Lab04S03: saldo insuficiente e vantagem inativa não deixam débitos, cupons ou mensagens', async t => {
  const { call, repo } = await fixture(t);
  assert.equal((await call('/redemptions', 'POST', {
    offerId: 'demo-coffee', key: crypto.randomUUID()
  }, 'student')).status, 409);
  await repo.run("UPDATE offers SET active=0 WHERE id='demo-coffee'");
  assert.equal((await call('/redemptions', 'POST', {
    offerId: 'demo-coffee', key: crypto.randomUUID()
  }, 'student')).status, 404);
  for (const table of ['coupons', 'emails']) {
    assert.equal((await repo.one(`SELECT COUNT(*) count FROM ${table}`)).count, 0);
  }
  assert.equal((await repo.one("SELECT COUNT(*) count FROM transactions WHERE kind='redemption'")).count, 0);
});

test('Lab04S03: provedor recebe os dois templates de cupom com o mesmo código', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return new Response('{}', { status: 200 });
  });
  const { call, recognize } = await fixture(t, {
    RESEND_API_KEY: 'test-key', EMAIL_FROM: 'Meritus <meritus@example.test>'
  });
  await recognize();
  requests.length = 0;
  const body = { offerId: 'demo-coffee', key: crypto.randomUUID() };
  const redemption = await call('/redemptions', 'POST', body, 'student');
  assert.equal(redemption.status, 201);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map(r => r.to[0]), ['aluno@meritus.demo', 'empresa@meritus.demo']);
  for (const request of requests) {
    assert.ok(request.subject.includes(redemption.data.coupon.code));
    assert.ok(request.text.includes(redemption.data.coupon.code));
  }
  assert.match(requests[0].text, /Apresente este código/);
  assert.match(requests[1].text, /confirme a utilização/);
  await call('/redemptions', 'POST', body, 'student');
  assert.equal(requests.length, 2);
});

test('Lab04S03: apenas a empresa do cupom confirma uma troca, uma única vez', async t => {
  const { call, login, recognize } = await fixture(t);
  await recognize();
  const coupon = (await call('/redemptions', 'POST', {
    offerId: 'demo-coffee', key: crypto.randomUUID()
  }, 'student')).data.coupon;
  assert.equal((await call('/register', 'POST', {
    role: 'partner', name: 'Outra empresa', email: 'outra@example.test',
    password: 'Meritus@123', address: 'Rua Teste, 10'
  })).status, 201);
  await login('other', 'outra@example.test');
  assert.equal((await call('/coupons', 'GET', undefined, 'other')).data.length, 0);
  assert.equal((await call('/coupons/validate', 'POST', { code: coupon.code }, 'other')).status, 404);
  assert.equal((await call('/coupons/validate', 'POST', { code: coupon.code }, 'student')).status, 403);
  assert.equal((await call('/coupons/validate', 'POST', { code: coupon.code }, 'partner')).status, 200);
  assert.equal((await call('/coupons/validate', 'POST', { code: coupon.code }, 'partner')).status, 409);
});
