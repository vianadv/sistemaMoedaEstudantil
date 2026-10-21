import {Repository} from '../models/Repository.mjs';
import {MeritService} from '../services/MeritService.mjs';
import {seed} from '../services/seed.mjs';
import {uid,digest,passwordHash,passwordMatches,check,text,email,cpf,integer,publicUser} from '../services/security.mjs';
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
export async function api(request,env){
  try{
    const url=new URL(request.url), path=url.pathname.replace(/^\/api/,'');const repo=new Repository(env.DB),service=new MeritService(repo,env);
    if(path==='/health')return json({ok:true,app:'Meritus',database:!!(await repo.one('SELECT 1 ok')),emailConfigured:!!(env.RESEND_API_KEY&&env.EMAIL_FROM)});
    await seed(repo);
    if(!['GET','HEAD'].includes(request.method)){
      check(!request.headers.get('Origin')||request.headers.get('Origin')===url.origin,'Origem não permitida.',403);
      check((Number(request.headers.get('Content-Length'))||0)<900000,'Arquivo muito grande.',413);
    }
    let b={};if(['POST','PUT','PATCH'].includes(request.method)){const raw=await request.text();check(raw.length<900000,'Arquivo muito grande.',413);try{b=JSON.parse(raw||'{}');}catch{check(false,'JSON inválido.');}}
    if(path==='/institutions'&&request.method==='GET')return json(await repo.all('SELECT * FROM institutions ORDER BY name'));
    if(path==='/register'&&request.method==='POST'){
      check(['student','partner'].includes(b.role),'Perfil inválido.');const name=text(b.name,'Nome'),em=email(b.email),password=text(b.password,'Senha',8,120);const id=uid();
      if(b.role==='student'){
        check(await repo.one('SELECT id FROM institutions WHERE id=?',b.institution_id),'Instituição inválida.');
        await repo.run("INSERT INTO users(id,role,name,email,password_hash,cpf,rg,address,institution_id,course) VALUES(?,'student',?,?,?,?,?,?,?,?)",id,name,em,await passwordHash(password),cpf(b.cpf),text(b.rg,'RG'),text(b.address,'Endereço',5,300),b.institution_id,text(b.course,'Curso'));
      }else await repo.run("INSERT INTO users(id,role,name,email,password_hash,address) VALUES(?,'partner',?,?,?,?)",id,name,em,await passwordHash(password),text(b.address,'Endereço',5,300));
      return json({message:'Cadastro realizado. Entre com seu e-mail e senha.'},201);
    }
    if(path==='/login'&&request.method==='POST'){
      const u=await repo.one('SELECT * FROM users WHERE email=? AND active=1',email(b.email));
      check(u&&await passwordMatches(String(b.password??''),u.password_hash),'E-mail ou senha incorretos.',401);
      const token=uid()+uid();await repo.run('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)',await digest(token),u.id,Date.now()+8*60*60*1000);
      await repo.run('DELETE FROM sessions WHERE expires_at<?',Date.now());
      return json({user:publicUser(u)},200,{'Set-Cookie':`meritus_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${url.protocol==='https:'?'; Secure':''}`});
    }
    const token=(request.headers.get('Cookie')||'').split(';').map(c=>c.trim()).find(c=>c.startsWith('meritus_session='))?.slice(16);
    check(token,'Entre para continuar.',401);const hashed=await digest(token);
    let user=await repo.one('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1',hashed,Date.now());check(user,'Sessão encerrada. Entre novamente.',401);
    if(user.role==='teacher'){await service.semester(user);user=await repo.one('SELECT * FROM users WHERE id=?',user.id);}
    const role=(...roles)=>check(roles.includes(user.role),'Seu perfil não possui acesso a esta operação.',403);
    if(path==='/logout'&&request.method==='POST'){await repo.run('DELETE FROM sessions WHERE token_hash=?',hashed);return json({ok:true},200,{'Set-Cookie':'meritus_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
    if(path==='/me'&&request.method==='GET')return json({user:publicUser(user),emailConfigured:!!(env.RESEND_API_KEY&&env.EMAIL_FROM)});
    if(path==='/me'&&request.method==='PUT'){
      role('student','partner');const name=text(b.name,'Nome'),em=email(b.email),address=text(b.address,'Endereço',5,300);
      if(user.role==='student'){check(await repo.one('SELECT id FROM institutions WHERE id=?',b.institution_id),'Instituição inválida.');await repo.run('UPDATE users SET name=?,email=?,address=?,cpf=?,rg=?,institution_id=?,course=? WHERE id=?',name,em,address,cpf(b.cpf),text(b.rg,'RG'),b.institution_id,text(b.course,'Curso'),user.id);}
      else await repo.run('UPDATE users SET name=?,email=?,address=? WHERE id=?',name,em,address,user.id);
      if(b.password)await repo.run('UPDATE users SET password_hash=? WHERE id=?',await passwordHash(text(b.password,'Senha',8,120)),user.id);
      return json({message:'Cadastro atualizado.'});
    }
    if(path==='/me'&&request.method==='DELETE'){
      role('student','partner');await repo.batch([['UPDATE users SET active=0 WHERE id=?',user.id],['DELETE FROM sessions WHERE user_id=?',user.id],['UPDATE offers SET active=0 WHERE partner_id=?',user.id]]);return json({message:'Cadastro desativado; histórico preservado.'});
    }
    if(path==='/students'&&request.method==='GET'){role('teacher');return json(await repo.all("SELECT id,name,email,course FROM users WHERE role='student' AND active=1 AND institution_id=? ORDER BY name",user.institution_id));}
    if(path==='/recognitions'&&request.method==='POST'){role('teacher');return json(await service.recognize(user,b),201);}
    if(path==='/statement'&&request.method==='GET')return json(await repo.all('SELECT t.*,f.name sender,tou.name receiver FROM transactions t LEFT JOIN users f ON f.id=t.from_id LEFT JOIN users tou ON tou.id=t.to_id WHERE t.from_id=? OR t.to_id=? ORDER BY t.created_at DESC,t.rowid DESC LIMIT 200',user.id,user.id));
    if(path==='/offers'&&request.method==='GET')return json(await repo.all(`SELECT o.*,u.name partner FROM offers o JOIN users u ON u.id=o.partner_id WHERE u.active=1 AND ${user.role==='partner'?'o.partner_id=?':'o.active=1'} ORDER BY o.rowid DESC`,...(user.role==='partner'?[user.id]:[])));
    if((path==='/offers'||/^\/offers\/[^/]+$/.test(path))&&['POST','PUT','DELETE'].includes(request.method)){
      role('partner');const id=path.split('/')[2];if(id)check(await repo.one('SELECT id FROM offers WHERE id=? AND partner_id=?',id,user.id),'Vantagem não encontrada.',404);
      if(request.method==='DELETE'){check(id,'Vantagem não informada.');await repo.run('UPDATE offers SET active=0 WHERE id=?',id);return json({message:'Vantagem desativada.'});}
      const title=text(b.title,'Título',3,100),description=text(b.description,'Descrição',10,1000),cost=integer(b.cost,'Custo'),photo=text(b.photo,'Foto',5,700000);
      check(/^https:\/\//.test(photo)||/^data:image\/(png|jpeg|webp);base64,/.test(photo)||/^\/assets\/(cafe|material)\.svg$/.test(photo),'Use foto PNG, JPEG, WebP ou link HTTPS.');
      if(request.method==='POST')await repo.run('INSERT INTO offers(id,partner_id,title,description,photo,cost) VALUES(?,?,?,?,?,?)',uid(),user.id,title,description,photo,cost);
      else {check(id,'Vantagem não informada.');await repo.run('UPDATE offers SET title=?,description=?,photo=?,cost=?,active=? WHERE id=?',title,description,photo,cost,b.active===false?0:1,id);}
      return json({message:'Vantagem salva.'},request.method==='POST'?201:200);
    }
    if(path==='/redemptions'&&request.method==='POST'){role('student');return json(await service.redeem(user,b),201);}
    if(path==='/coupons'&&request.method==='GET')return json(await repo.all(`SELECT c.*,u.name student,p.name partner FROM coupons c JOIN users u ON u.id=c.student_id JOIN users p ON p.id=c.partner_id WHERE c.${user.role==='partner'?'partner_id':'student_id'}=? ORDER BY c.created_at DESC`,user.id));
    if(path==='/coupons/validate'&&request.method==='POST'){
      role('partner');const code=text(b.code,'Código',8,50).toUpperCase();const c=await repo.one('SELECT * FROM coupons WHERE code=? AND partner_id=?',code,user.id);check(c,'Cupom não encontrado para sua empresa.',404);check(c.status==='available','Este cupom já foi utilizado.',409);
      const r=await repo.run("UPDATE coupons SET status='used',used_at=CURRENT_TIMESTAMP WHERE id=? AND status='available'",c.id);check(r.meta.changes===1,'Cupom já utilizado.',409);return json({message:`Cupom confirmado: ${c.title}.`,coupon:{...c,status:'used'}});
    }
    if(path==='/emails'&&request.method==='GET')return json(await repo.all('SELECT * FROM emails WHERE user_id=? ORDER BY created_at DESC,rowid DESC LIMIT 100',user.id));
    if(path==='/emails/retry'&&request.method==='POST'){const rows=await repo.all("SELECT id FROM emails WHERE user_id=? AND status!='sent' LIMIT 20",user.id);await service.mail.deliver(rows.map(r=>r.id));return json({message:env.RESEND_API_KEY?'Tentativa concluída. Confira o status.':'Modo demonstração: configure RESEND_API_KEY e EMAIL_FROM para envio real.'});}
    return json({error:'Rota não encontrada.'},404);
  }catch(e){
    let message=e.message||'Erro inesperado.',status=e.status||500;
    if(/Saldo insuficiente/.test(message)){status=409;message='Saldo insuficiente para esta operação.';}
    else if(/UNIQUE constraint/.test(message)){status=409;message='CPF, e-mail ou operação já cadastrado. Atualize a página e confira.';}
    else if(!e.status){console.error(e);message='Não foi possível concluir. Tente novamente.';}
    return json({error:message},status);
  }
}
