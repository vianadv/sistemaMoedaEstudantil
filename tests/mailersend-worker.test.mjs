import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, createFetchMock } from 'miniflare';

test('MailerSend funciona no runtime Workers e não segue redirecionamento com a chave', async t => {
  const fetchMock = createFetchMock();
  fetchMock.disableNetConnect();
  const provider = fetchMock.get('https://api.mailersend.com');
  provider.intercept({ path: '/v1/email', method: 'POST' }).reply(202, '', { headers: { 'x-message-id': 'worker-accepted' } });
  provider.intercept({ path: '/v1/email', method: 'POST' }).reply(302, '', { headers: { Location: 'https://other.example.test/steal' } });
  const adapter = await readFile(new URL('../src/services/MailerSendService.mjs', import.meta.url), 'utf8');
  const script = adapter + `
    export default { async fetch(request, env) {
      try {
        const notice = await sendMailerSend({recipient:'aluno@example.test',subject:'Confirmação',body:'Participação na aula'}, env);
        return Response.json({accepted:true,notice});
      } catch (error) { return Response.json({error:error.message}, {status:502}); }
    } };
  `;
  const runtime = new Miniflare({
    modules: true, script, compatibilityDate: '2026-05-15', fetchMock,
    bindings: { MAILERSEND_API_KEY: 'worker-private-test-key', MAILERSEND_FROM: 'Meritus <no-reply@example.test>' }
  });
  t.after(() => runtime.dispose());
  t.after(() => fetchMock.close());
  const accepted = await runtime.dispatchFetch('http://localhost/send');
  assert.equal(accepted.status, 200, await accepted.clone().text());
  assert.deepEqual(await accepted.json(), { accepted: true, notice: null });
  const redirected = await runtime.dispatchFetch('http://localhost/send');
  assert.equal(redirected.status, 502);
  assert.match((await redirected.json()).error, /serviço recusou o envio/);
  fetchMock.assertNoPendingInterceptors();
});
