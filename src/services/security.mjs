export const uid = () => crypto.randomUUID();
export const hex = bytes => Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export async function digest(value) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))); }
export async function passwordHash(password, salt=uid()) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  return salt+':'+hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256));
}
export async function passwordMatches(value, stored) {
  const hash=await passwordHash(value,stored.split(':')[0]);
  let diff=hash.length^stored.length; for(let i=0;i<hash.length;i++) diff|=hash.charCodeAt(i)^stored.charCodeAt(i);
  return diff===0;
}
export function check(ok,message,status=400) { if(!ok) { const e=new Error(message); e.status=status; throw e; } }
export function text(value,label,min=2,max=200) { const v=String(value??'').trim(); check(v.length>=min&&v.length<=max,`${label}: informe de ${min} a ${max} caracteres.`); return v; }
export function email(value) { const v=text(value,'E-mail',5,180).toLowerCase(); check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),'E-mail inválido.'); return v; }
export function integer(value,label) { const n=Number(value); check(Number.isSafeInteger(n)&&n>0&&n<=100000,`${label}: use um inteiro positivo até 100.000.`); return n; }
export function cpf(value) {
  const v=String(value??'').replace(/\D/g,''); check(v.length===11&&!/^(\d)\1+$/.test(v),'CPF inválido.');
  for(let n=9;n<=10;n++){let sum=0;for(let i=0;i<n;i++)sum+=Number(v[i])*(n+1-i);let d=(sum*10)%11;if(d===10)d=0;check(d===Number(v[n]),'CPF inválido.');} return v;
}
export const publicUser = u => { const {password_hash,...safe}=u; return safe; };
