import { sendGmail } from './GmailService.mjs';
import { mailerSendSender, sendMailerSend } from './MailerSendService.mjs';

export function emailProvider(env) {
  const provider = env.EMAIL_PROVIDER || (env.MAILERSEND_API_KEY ? 'mailersend' : (env.GMAIL_USER || env.GMAIL_APP_PASSWORD) ? 'gmail' : 'resend');
  if (provider === 'mailersend' && env.MAILERSEND_API_KEY?.trim() && mailerSendSender(env)) return 'mailersend';
  if (provider === 'gmail' && env.GMAIL_USER?.trim() && env.GMAIL_APP_PASSWORD?.trim()) return 'gmail';
  if (provider === 'resend' && env.RESEND_API_KEY?.trim() && env.EMAIL_FROM?.trim()) return 'resend';
  return null;
}

// Outbox durável. O destinatário sempre vem do cadastro, com remetente único do sistema.
export class EmailService {
  constructor(repo,env,{gmail=sendGmail}={}){this.repo=repo;this.env=env;this.gmail=gmail;}
  async deliver(ids){
    const provider=emailProvider(this.env);if(!provider)return;
    for(const id of ids){
      const m=await this.repo.one('SELECT * FROM emails WHERE id=?',id); if(!m||m.status==='sent')continue;
      try{
        let notice=null;
        if(provider==='gmail')await this.gmail(m,this.env);
        else if(provider==='mailersend')notice=await sendMailerSend(m,this.env);
        else {
          const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${this.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:this.env.EMAIL_FROM,to:[m.recipient],subject:m.subject,text:m.body})});
          if(!r.ok)throw new Error('Provedor recusou o envio.');
        }
        await this.repo.run("UPDATE emails SET status='sent',error=? WHERE id=?",notice,id);
      }catch(e){await this.repo.run("UPDATE emails SET status='failed',error=? WHERE id=?",String(e.message).slice(0,200),id);}
    }
  }
}
