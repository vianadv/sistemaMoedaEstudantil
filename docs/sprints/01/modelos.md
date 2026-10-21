# Modelos - versão proposta 01

Estes modelos foram organizados nesta entrega como evolução proposta; não comprovam datas ou participação anterior.

## Classes do domínio conceitual

Os três perfis compartilham users.role na implementação. As especializações abaixo são conceituais, não classes concretas do código.

```mermaid

classDiagram
class Instituicao { +id: string
+nome: string }
class Usuario { +id: string
+role: student|teacher|partner
+nome: string
+email: string
+password_hash: string
+saldo: inteiro
+ativo: booleano }
class Aluno { <<perfil>>
+CPF
+RG
+endereco
+curso }
class Professor { <<perfil>>
+CPF
+departamento }
class Empresa { <<perfil>>
+endereco }
class Vantagem { +id
+titulo
+descricao
+foto
+custo
+ativo }
class Cupom { +id
+codigoUnico
+tituloNoResgate
+custoNoResgate
+status
+request_key }
class Transacao { +id
+tipo
+quantidade
+motivo
+semestre
+request_key }
class Notificacao { +id
+destinatario
+assunto
+corpo
+status }
Usuario <|-- Aluno
Usuario <|-- Professor
Usuario <|-- Empresa
Instituicao "1" --> "0..*" Aluno : vincula
Instituicao "1" --> "0..*" Professor : vincula
Empresa "1" --> "0..*" Vantagem : oferece
Aluno "1" --> "0..*" Cupom : resgata
Vantagem "1" --> "0..*" Cupom : origina
Empresa "1" --> "0..*" Cupom : confere
Usuario "1" --> "0..*" Transacao : participa
Cupom "0..1" --> "1" Transacao : debito
Transacao "1" --> "0..*" Notificacao : gera

```

## Componentes / arquitetura

```mermaid

flowchart LR
 U["Navegador: View\nHTML / CSS / JavaScript"] -->|"HTTP / JSON + cookie"| C["Controller\nAppController.api"]
 C --> M["Model: Services\nMeritService / EmailService"]
 C --> R["Repository DAO"]
 M --> R
 R --> DB[("SQLite local / D1 hospedado")]
 M -->|"HTTPS, quando configurado"| E["Resend"]
 A["server.mjs / worker/app.ts\nAdaptadores HTTP"] --> C

```
