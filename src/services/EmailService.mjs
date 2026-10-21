// Outbox durável. Sem chave, mensagens ficam explicitamente em modo demonstração.
export class EmailService {
  constructor(repo,env){this.repo=repo;this.env=env;}
  async deliver(ids){
    if(!this.env.RESEND_API_KEY||!this.env.EMAIL_FROM)return;
    for(const id of ids){
      const m=await this.repo.one('SELECT * FROM emails WHERE id=?',id); if(!m||m.status==='sent')continue;
      try{
        const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${this.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:this.env.EMAIL_FROM,to:[m.recipient],subject:m.subject,text:m.body})});
        if(!r.ok)throw new Error('Provedor recusou o envio.');
        await this.repo.run("UPDATE emails SET status='sent',error=NULL WHERE id=?",id);
      }catch(e){await this.repo.run("UPDATE emails SET status='failed',error=? WHERE id=?",String(e.message).slice(0,200),id);}
    }
  }
}
