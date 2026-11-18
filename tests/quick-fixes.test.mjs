import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database } from '../server.mjs';
import { Repository } from '../src/models/Repository.mjs';
import { api } from '../src/controllers/AppController.mjs';
import { seed } from '../src/services/seed.mjs';
import { MeritService } from '../src/services/MeritService.mjs';
import { EmailService } from '../src/services/EmailService.mjs';

async function fixture(t) {
  const DB = database(), repo = new Repository(DB);
  t.after(() => DB.close());
  await seed(repo);
  const call = async (path, method = 'GET', body, cookie, config = {}) => {
    const response = await api(new Request('http://localhost/api' + path, {
      method, headers: cookie ? { Cookie: cookie } : {},
      body: body === undefined ? undefined : JSON.stringify(body)
    }), { DB, ...config });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('Set-Cookie')?.split(';')[0] };
  };
  return { DB, repo, call };
}

test('JSON nulo, lista e primitivos recebem erro de entrada sem falha interna', async t => {
  const { call } = await fixture(t);
  for (const body of [null, [], 'texto', 7, true]) {
    assert.equal((await call('/login', 'POST', body)).status, 400);
  }
});

test('senha inválida não deixa nome e e-mail parcialmente atualizados', async t => {
  const { call, repo } = await fixture(t);
  const login = await call('/login', 'POST', { email: 'aluno@meritus.demo', password: 'Meritus@123' });
  const before = await repo.one("SELECT * FROM users WHERE id='demo-student'");
  const bad = await call('/me', 'PUT', { ...before, name: 'Nome novo', email: 'novo@example.test', password: 'curta' }, login.cookie);
  assert.equal(bad.status, 400);
  const after = await repo.one("SELECT * FROM users WHERE id='demo-student'");
  assert.equal(after.name, before.name);
  assert.equal(after.email, before.email);
  assert.equal(after.password_hash, before.password_hash);
  const good = await call('/me', 'PUT', { ...before, name: 'Nome novo', email: 'novo@example.test', password: 'NovaSenha@123' }, login.cookie);
  assert.equal(good.status, 200);
  assert.equal((await call('/login', 'POST', { email: 'novo@example.test', password: 'NovaSenha@123' })).status, 200);
  assert.equal((await call('/login', 'POST', { email: 'novo@example.test', password: 'Meritus@123' })).status, 401);
});

test('atalhos dos três perfis acompanham troca de e-mail sem dispensar senha', async t => {
  const { repo, call } = await fixture(t);
  for (const [id, alias, email] of [
    ['demo-teacher', 'professor@meritus.demo', 'professor@example.test'],
    ['demo-student', 'aluno@meritus.demo', 'aluno@example.test'],
    ['demo-partner', 'empresa@meritus.demo', 'empresa@example.test']
  ]) {
    await repo.run('UPDATE users SET email=? WHERE id=?', email, id);
    const login = await call('/login', 'POST', { email: alias, password: 'Meritus@123' });
    assert.equal(login.status, 200);
    assert.equal(login.data.user.id, id);
    assert.equal(login.data.user.email, email);
    assert.equal((await call('/login', 'POST', { email: alias, password: 'senhaerrada' })).status, 401);
  }
});

test('reenvio usa cadastro atual e preserva destinatário de mensagens já aceitas', async t => {
  const { DB, repo } = await fixture(t);
  const service = new MeritService(repo, { DB });
  const teacher = await repo.one("SELECT * FROM users WHERE id='demo-teacher'");
  await service.semester(teacher);
  await service.recognize(teacher, { studentId: 'demo-student', amount: 10, reason: 'Colaboração na aula', key: crypto.randomUUID() });
  const studentMail = await repo.one("SELECT * FROM emails WHERE user_id='demo-student'");
  await repo.run("UPDATE users SET email='atual@example.test' WHERE id='demo-student'");
  const delivered = [];
  const mail = new EmailService(repo, { GMAIL_USER: 'remetente@example.test', GMAIL_APP_PASSWORD: 'abcdefghijklmnop' }, { gmail: async m => delivered.push(m.recipient) });
  await mail.deliver([studentMail.id]);
  assert.deepEqual(delivered, ['atual@example.test']);
  assert.equal((await repo.one('SELECT recipient FROM emails WHERE id=?', studentMail.id)).recipient, 'atual@example.test');
  await repo.run("UPDATE users SET email='outro@example.test' WHERE id='demo-student'");
  await mail.deliver([studentMail.id]);
  assert.equal(delivered.length, 1);
  assert.equal((await repo.one('SELECT recipient FROM emails WHERE id=?', studentMail.id)).recipient, 'atual@example.test');
  assert.equal((await repo.one("SELECT status FROM emails WHERE user_id='demo-teacher'")).status, 'pending');
});

test('reenvio individual respeita dono, evita histórico em lote e não duplica aceitos', async t => {
  const { DB, repo, call } = await fixture(t);
  const service = new MeritService(repo, { DB });
  const teacher = await repo.one("SELECT * FROM users WHERE id='demo-teacher'");
  await service.semester(teacher);
  await service.recognize(teacher, { studentId: 'demo-student', amount: 10, reason: 'Participação', key: crypto.randomUUID() });
  await service.recognize(teacher, { studentId: 'demo-student', amount: 10, reason: 'Colaboração', key: crypto.randomUUID() });
  const login = await call('/login', 'POST', { email: 'aluno@meritus.demo', password: 'Meritus@123' });
  const teacherMail = await repo.one("SELECT id FROM emails WHERE user_id='demo-teacher'");
  const studentMail = await repo.one("SELECT id FROM emails WHERE user_id='demo-student'");
  const provider = t.mock.method(globalThis, 'fetch', async () => new Response('{}'));
  const config = { RESEND_API_KEY: 'fake-key', EMAIL_FROM: 'Meritus <sender@example.test>' };
  assert.equal((await call('/emails/retry', 'POST', { id: teacherMail.id }, login.cookie, config)).status, 404);
  assert.equal(provider.mock.callCount(), 0);
  for (let i = 0; i < 2; i++) assert.equal((await call('/emails/retry', 'POST', { id: studentMail.id }, login.cookie, config)).status, 200);
  assert.equal(provider.mock.callCount(), 1);
  assert.equal((await repo.one("SELECT COUNT(*) n FROM emails WHERE status='pending'")).n, 3);
});
