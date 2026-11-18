import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mailerSendSender } from '../src/services/MailerSendService.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  let config;
  try { config = JSON.parse(await readFile(new URL('../.env.mailersend.json', import.meta.url), 'utf8')); }
  catch { throw new Error('Configure a chave e o remetente no arquivo privado .env.mailersend.json.'); }
  const key = String(config.MAILERSEND_API_KEY || '').trim();
  if (!/^[A-Za-z0-9._-]{20,4096}$/.test(key) || !mailerSendSender(config)) {
    throw new Error('A configuração privada precisa de uma chave válida e do remetente autorizado do MailerSend.');
  }
  const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'secret', 'bulk', '--config', 'wrangler.cloudflare.jsonc'], {
    cwd: root, stdio: ['pipe', 'inherit', 'inherit']
  });
  child.stdin.on('error', () => {});
  child.stdin.end(JSON.stringify({ EMAIL_PROVIDER: 'mailersend', MAILERSEND_API_KEY: key, MAILERSEND_FROM: config.MAILERSEND_FROM.trim() }));
  const code = await new Promise((resolve, reject) => {
    child.on('error', () => reject(new Error('Não foi possível iniciar a configuração. Confira a instalação do projeto.')));
    child.on('close', resolve);
  });
  if (code !== 0) throw new Error('A Cloudflare não concluiu a configuração. Confira o acesso à hospedagem.');
  console.log('MailerSend configurado na hospedagem. Ainda é necessário conferir um envio real e os limites da conta.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
