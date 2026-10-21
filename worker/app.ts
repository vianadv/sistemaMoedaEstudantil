import html from '../src/views/index.html?raw';
import css from '../src/views/style.css?raw';
import js from '../src/views/app.js?raw';
import cafe from '../src/views/assets/cafe.svg?raw';
import material from '../src/views/assets/material.svg?raw';
import { api } from '../src/controllers/AppController.mjs';
export async function app(request: Request, env: any) {
  const path = new URL(request.url).pathname;
  if(path.startsWith('/api/'))return api(request,env);
  const assets:Record<string,[string,string]>={'/':[html,'text/html; charset=utf-8'],'/style.css':[css,'text/css'],'/app.js':[js,'application/javascript; charset=utf-8'],'/assets/cafe.svg':[cafe,'image/svg+xml'],'/assets/material.svg':[material,'image/svg+xml']};
  if(!assets[path])return null;
  const [body,type]=assets[path];return new Response(body,{headers:{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});
}
