import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  let values;
  try {
    values = JSON.parse(await readFile(new URL('../.env.gmail.json', import.meta.url), 'utf8'));
  } catch {
    throw new Error('Preencha .env.gmail.json com GMAIL_USER e GMAIL_APP_PASSWORD. Não envie a senha pelo chat.');
  }
  const user = String(values.GMAIL_USER || '').trim();
  const password = String(values.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(user) || !/^[a-zA-Z0-9]{16}$/.test(password)) {
    throw new Error('Preencha o remetente e a senha de app de 16 caracteres em .env.gmail.json. A senha normal do Google não serve.');
  }
  // Os valores vão por stdin ao Wrangler, sem argumentos, logs ou arquivos versionados.
  const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'secret', 'bulk', '--config', 'wrangler.cloudflare.jsonc'], {
    cwd: root, stdio: ['pipe', 'inherit', 'inherit']
  });
  child.stdin.on('error', () => {});
  child.stdin.end(JSON.stringify({ EMAIL_PROVIDER: 'gmail', GMAIL_USER: user, GMAIL_APP_PASSWORD: password }));
  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', () => reject(new Error('Não foi possível iniciar a configuração. Execute npm ci e tente novamente.')));
    child.on('close', resolve);
  });
  if (exitCode !== 0) throw new Error('A Cloudflare não concluiu a configuração. Confira a autenticação do Wrangler.');
  console.log('Remetente configurado. Confira o envio de uma nova notificação para um endereço real cadastrado.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
