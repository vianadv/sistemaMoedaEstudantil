# Modelos - versão proposta 02

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

## Modelo ER

```mermaid

erDiagram
 institutions ||--o{ users : vincula
 users ||--o{ sessions : autentica
 users ||--o{ offers : empresa_oferece
 users ||--o{ coupons : aluno_ou_empresa
 offers ||--o{ coupons : origina
 users |o--o{ transactions : origem_ou_destino
 coupons |o--|| transactions : resgate
 transactions ||--o{ emails : gera
 users ||--o{ emails : destinatario
 institutions { TEXT id PK "Identificador"

 TEXT name "Nome" }
 users { TEXT id PK

 TEXT role "student teacher partner"

 TEXT name

 TEXT email UK

 TEXT password_hash

 TEXT cpf UK

 TEXT rg

 TEXT address

 TEXT institution_id FK

 TEXT course

 TEXT department

 INTEGER balance

 INTEGER active

 TEXT created_at }
 sessions { TEXT token_hash PK

 TEXT user_id FK

 INTEGER expires_at }
 offers { TEXT id PK

 TEXT partner_id FK

 TEXT title

 TEXT description

 TEXT photo

 INTEGER cost

 INTEGER active }
 coupons { TEXT id PK

 TEXT code UK

 TEXT student_id FK

 TEXT partner_id FK

 TEXT offer_id FK

 TEXT title

 INTEGER cost

 TEXT status

 TEXT request_key UK

 TEXT created_at

 TEXT used_at }
 transactions { TEXT id PK

 TEXT kind

 TEXT from_id FK

 TEXT to_id FK

 INTEGER amount

 TEXT reason

 TEXT coupon_id FK,UK

 TEXT semester

 TEXT request_key UK

 TEXT created_at }
 emails { TEXT id PK

 TEXT user_id FK

 TEXT recipient

 TEXT subject

 TEXT body

 TEXT transaction_id FK

 TEXT status

 TEXT error

 TEXT created_at }

```

A tabela users representa aluno, professor e empresa; instituição é opcional apenas para empresa. SQL e DAO em db/ e src/models.
