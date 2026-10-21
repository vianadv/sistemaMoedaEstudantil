import {uid,check,text,integer} from './security.mjs';
import {EmailService} from './EmailService.mjs';
export class MeritService {
  constructor(repo,env){this.repo=repo;this.env=env;this.mail=new EmailService(repo,env);}
  async semester(teacher){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'numeric'}).formatToParts(new Date());
    const year=parts.find(p=>p.type==='year').value,month=Number(parts.find(p=>p.type==='month').value);const s=`${year}.${month<=6?1:2}`;
    await this.repo.run("INSERT OR IGNORE INTO transactions(id,kind,to_id,amount,reason,semester) VALUES(?,'semester',?,1000,?,?)",uid(),teacher.id,`Crédito semestral ${s}`,s);
  }
  async recognize(teacher,b){
    const amount=integer(b.amount,'Moedas'), reason=text(b.reason,'Motivo',3,500), key=text(b.key,'Chave da operação',8,100);
    const prior=await this.repo.one('SELECT * FROM transactions WHERE request_key=?',key);if(prior){check(prior.from_id===teacher.id,'Operação inválida.',403);return {message:'Reconhecimento já registrado.'};}
    const student=await this.repo.one("SELECT * FROM users WHERE id=? AND role='student' AND active=1",b.studentId);
    check(student&&student.institution_id===teacher.institution_id,'Selecione um aluno ativo da sua instituição.');
    const transactionId=uid(), mailId=uid();
    await this.repo.batch([
      ["INSERT INTO transactions(id,kind,from_id,to_id,amount,reason,request_key) VALUES(?,'recognition',?,?,?,?,?)",transactionId,teacher.id,student.id,amount,reason,key],
      ["INSERT INTO emails(id,user_id,recipient,subject,body,transaction_id) VALUES(?,?,?,?,?,?)",mailId,student.id,student.email,'Você recebeu um reconhecimento no Meritus',`${teacher.name} reconheceu você com ${amount} moedas. Motivo: ${reason}`,transactionId]
    ]);
    await this.mail.deliver([mailId]);return {message:'Reconhecimento registrado. Notificação disponível na caixa de saída.'};
  }
  async redeem(student,b){
    const key=text(b.key,'Chave da operação',8,100);const prior=await this.repo.one('SELECT * FROM coupons WHERE request_key=?',key);
    if(prior){check(prior.student_id===student.id,'Operação inválida.',403);return {coupon:prior};}
    const o=await this.repo.one('SELECT o.*,u.email partner_email,u.name partner_name FROM offers o JOIN users u ON u.id=o.partner_id WHERE o.id=? AND o.active=1 AND u.active=1',b.offerId);check(o,'Vantagem indisponível.',404);
    const id=uid(), code='MER-'+uid().replaceAll('-','').slice(0,16).toUpperCase(), tx=uid(),m1=uid(),m2=uid();
    const body=`Cupom ${code}. Vantagem: ${o.title}. Aluno: ${student.name}. Parceiro: ${o.partner_name}. Custo: ${o.cost} moedas. Apresente este código na troca presencial. Uso único; a empresa deve confirmar o código no Meritus.`;
    await this.repo.batch([
      ["INSERT INTO coupons(id,code,student_id,partner_id,offer_id,title,cost,request_key) VALUES(?,?,?,?,?,?,?,?)",id,code,student.id,o.partner_id,o.id,o.title,o.cost,key],
      ["INSERT INTO transactions(id,kind,from_id,amount,reason,coupon_id,request_key) VALUES(?,'redemption',?,?,?,?,?)",tx,student.id,o.cost,`Resgate: ${o.title}`,id,key],
      ["INSERT INTO emails(id,user_id,recipient,subject,body,transaction_id) VALUES(?,?,?,?,?,?)",m1,student.id,student.email,`Seu cupom ${code}`,body,tx],
      ["INSERT INTO emails(id,user_id,recipient,subject,body,transaction_id) VALUES(?,?,?,?,?,?)",m2,o.partner_id,o.partner_email,`Conferência do cupom ${code}`,body,tx]
    ]);await this.mail.deliver([m1,m2]);return {coupon:await this.repo.one('SELECT * FROM coupons WHERE id=?',id)};
  }
}
