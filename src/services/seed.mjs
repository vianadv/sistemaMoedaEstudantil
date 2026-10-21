import {passwordHash} from './security.mjs';
const init = new WeakMap();
export function seed(repo){
  if(!init.has(repo.db))init.set(repo.db,seedData(repo).catch(e=>{init.delete(repo.db);throw e;}));return init.get(repo.db);
}
async function seedData(repo){
  if(await repo.one("SELECT id FROM users WHERE id='demo-teacher'"))return;
  const h=await passwordHash('Meritus@123');
  await repo.batch([
    ["INSERT OR IGNORE INTO institutions(id,name) VALUES('puc','PUC Minas')"],
    ["INSERT OR IGNORE INTO institutions(id,name) VALUES('ifmg','IFMG')"],
    ["INSERT OR IGNORE INTO users(id,role,name,email,password_hash,cpf,department,institution_id) VALUES('demo-teacher','teacher','Prof. Lucas Almeida','professor@meritus.demo',?,'52998224725','Engenharia de Software','puc')",h],
    ["INSERT OR IGNORE INTO users(id,role,name,email,password_hash,cpf,rg,address,institution_id,course) VALUES('demo-student','student','Ana Souza','aluno@meritus.demo',?,'11144477735','MG-DEMO-001','Endereço fictício, 100','puc','Engenharia de Software')",h],
    ["INSERT OR IGNORE INTO users(id,role,name,email,password_hash,address) VALUES('demo-partner','partner','Café do Campus','empresa@meritus.demo',?,'Endereço fictício, 200')",h],
    ["INSERT OR IGNORE INTO offers(id,partner_id,title,description,photo,cost) VALUES('demo-coffee','demo-partner','Pausa para um café','Um café expresso para celebrar sua dedicação. Apresente seu cupom no balcão.','/assets/cafe.svg',50)"],
    ["INSERT OR IGNORE INTO offers(id,partner_id,title,description,photo,cost) VALUES('demo-books','demo-partner','Desconto em material','10% de desconto em material de estudo no parceiro. Uma utilização por cupom.','/assets/material.svg',100)"]
  ]);
}
