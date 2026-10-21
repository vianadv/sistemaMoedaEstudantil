import { app } from './app.mjs';

export default {
  async fetch(request, env) {
    return (await app(request, env)) ?? new Response('Não encontrado', { status: 404 });
  }
};
