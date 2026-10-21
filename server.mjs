import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {api} from './src/controllers/AppController.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export function database(filename=':memory:'){
  const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  if(!sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get())sqlite.exec(fs.readFileSync(path.join(root,'db/migration.sql'),'utf8'));
  const db={prepare(sql){return{bind(...args){return{async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){const r=sqlite.prepare(sql).run(...args);return{meta:{changes:Number(r.changes)}};},sql,args};}};},async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}},close(){sqlite.close();}};return db;
}
export function serve({port=Number(process.env.PORT||3000),dbPath=process.env.DB_PATH||path.join(root,'data/meritus.sqlite')}={}){
  if(dbPath!==':memory:')fs.mkdirSync(path.dirname(dbPath),{recursive:true});const DB=database(dbPath);
  const server=http.createServer(async(req,res)=>{try{
    const url=new URL(req.url,'http://'+(req.headers.host||'localhost'));let response;
    if(url.pathname.startsWith('/api/')){
      let body='';for await(const chunk of req){body+=chunk; if(body.length>900000){res.writeHead(413);res.end('Arquivo muito grande');return;}}
      response=await api(new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:body}),{DB,RESEND_API_KEY:process.env.RESEND_API_KEY,EMAIL_FROM:process.env.EMAIL_FROM});
    }else{
      const allowed={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/assets/cafe.svg':'assets/cafe.svg','/assets/material.svg':'assets/material.svg'};
      const file=allowed[url.pathname];response=file?new Response(fs.readFileSync(path.join(root,'src/views',file)),{headers:{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'application/javascript; charset=utf-8'}}):new Response('Não encontrado',{status:404});
    }
    response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','same-origin');res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch(e){console.error(e);res.writeHead(500);res.end('Erro interno');}});
  server.listen(port,'127.0.0.1',()=>console.log(`Meritus disponível em http://localhost:${server.address().port}`));return {server,DB};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))serve();
