import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database } from '../server.mjs';
import { Repository } from '../src/models/Repository.mjs';
import { api } from '../src/controllers/AppController.mjs';
import { seed } from '../src/services/seed.mjs';
import { MeritService } from '../src/services/MeritService.mjs';

async function fixture(t) {
  const DB = database(), repo = new Repository(DB);
  t.after(() => DB.close());
  await seed(repo);
  await repo.run("UPDATE users SET email=? WHERE id='demo-teacher'", 'docente@example.test');
  const login = async (email, password = 'Meritus@123') => {
    const response = await api(new Request('http://localhost/api/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    }), { DB });
    return { status: response.status, data: await response.json() };
  };
  return { DB, repo, login };
}

test('troca de e-mail do professor preserva login real, atalho e verificação da senha', async t => {
  const { repo, login } = await fixture(t);
  for (const email of ['docente@example.test', 'professor@meritus.demo']) {
    const result = await login(email);
    assert.equal(result.status, 200);
    assert.equal(result.data.user.id, 'demo-teacher');
    assert.equal(result.data.user.email, 'docente@example.test');
    assert.ok(!('password_hash' in result.data.user));
    assert.equal((await login(email, 'senha-incorreta')).status, 401);
  }
  assert.equal((await login('aluno@meritus.demo')).data.user.id, 'demo-student');
  assert.equal((await login('desconhecido@example.test')).status, 401);
  // Se o endereço antigo pertencer a outra conta, o login normal dessa conta prevalece.
  await repo.run("UPDATE users SET email='professor@meritus.demo' WHERE id='demo-student'");
  assert.equal((await login('professor@meritus.demo')).data.user.id, 'demo-student');
  await repo.run("UPDATE users SET email='aluno@meritus.demo' WHERE id='demo-student'");
  await repo.run("UPDATE users SET active=0 WHERE id='demo-teacher'");
  assert.equal((await login('professor@meritus.demo')).status, 401);
  assert.equal((await login('docente@example.test')).status, 401);
});

test('novos reconhecimentos destinam a confirmação ao e-mail atualizado do professor', async t => {
  const { DB, repo } = await fixture(t);
  const teacher = await repo.one("SELECT * FROM users WHERE id='demo-teacher'");
  const service = new MeritService(repo, { DB });
  await service.semester(teacher);
  await service.recognize(teacher, {
    studentId: 'demo-student', amount: 10, reason: 'Participação na aula', key: crypto.randomUUID()
  });
  const message = await repo.one("SELECT recipient FROM emails WHERE user_id='demo-teacher'");
  assert.equal(message.recipient, 'docente@example.test');
  assert.equal((await repo.one("SELECT recipient FROM emails WHERE user_id='demo-student'")).recipient, 'aluno@meritus.demo');
});
