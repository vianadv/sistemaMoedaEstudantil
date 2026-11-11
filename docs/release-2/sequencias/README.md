# Diagramas de sequência da Release 2

Um diagrama para cada um dos seis casos de uso desta continuação (consultas de professor e aluno representadas separadamente) e um diagrama geral. Cada arquivo `.mmd` pode ser aberto em um visualizador Mermaid; as mesmas sequências são exibidas abaixo no GitHub.

Cadastro de usuários, login, manutenção de perfis e conferência de cupom continuam descritos nos [casos de uso da Release 1](../../sprints/03/casos-de-uso.md). O login e a conferência também aparecem na sequência geral como apoio aos fluxos da Release 2.

O controlador valida origem, sessão e usuário ativo antes das rotas de negócio. Em cada requisição autenticada de professor, garante o crédito semestral idempotente. Esses passos comuns são resumidos quando não são o foco do diagrama. Os lotes usam `Repository.batch`, transação SQLite no adaptador local e batch atômico no D1. Falhas de entrega após o commit não desfazem moedas nem cupons. Sem configuração, a outbox permanece pendente.

- [Enviar moedas](#enviar-moedas)
- [Consultar extrato do professor](#consultar-extrato-do-professor)
- [Consultar extrato do aluno](#consultar-extrato-do-aluno)
- [Cadastrar vantagem](#cadastrar-vantagem)
- [Listar vantagens](#listar-vantagens)
- [Trocar vantagem](#trocar-vantagem)
- [Sequência geral](#sequência-geral)

## Enviar moedas

Lab04S01: confirmação de envio para professor e recebimento para aluno. [Arquivo Mermaid](enviar-moedas.mmd).

```mermaid
sequenceDiagram
  actor Professor
  participant View as View (app.js)
  participant Controller as AppController.api
  participant Service as MeritService
  participant Templates as emailTemplates
  participant DAO as Repository
  participant DB as SQLite ou D1
  participant Mail as EmailService
  participant Delivery as Gmail SMTP ou Resend
  Professor->>View: Selecionar aluno, quantidade e motivo
  View->>Controller: POST /api/recognitions + chave + cookie
  Controller->>Controller: Autenticar e exigir perfil teacher
  Controller->>Service: recognize(teacher, body)
  Service->>Service: Validar inteiro positivo, motivo e chave
  Service->>DAO: one(transação pela chave)
  alt Operação já registrada para este professor
    DAO-->>Service: Transação existente
    Service-->>Controller: Reconhecimento já registrado
    Controller-->>View: 201, sem novo débito ou mensagem
  else Nova operação
    Service->>DAO: one(aluno ativo)
    DAO-->>Service: Aluno e instituição
    Service->>Service: Exigir mesma instituição
    Service->>Templates: recognitionTemplates(dados e referência)
    Templates-->>Service: Mensagem do aluno e mensagem do professor
    Service->>DAO: batch(transação, e-mail aluno, e-mail professor)
    DAO->>DB: Executar lote atômico
    DB->>DB: Verificar saldo e aplicar débito/crédito por gatilhos
    alt Saldo insuficiente ou falha de persistência
      DB-->>DAO: Rollback de moedas e mensagens
      DAO-->>Controller: Erro propagado pelo serviço
      Controller-->>View: Erro, sem reconhecimento parcial
    else Commit
      DB-->>DAO: Transação e duas mensagens persistidas
      DAO-->>Service: Sucesso
      Service->>Mail: deliver(ids das duas mensagens)
      alt Provedor configurado
        loop Para cada mensagem ainda não enviada
          Mail->>DAO: one(e-mail por id)
          DAO-->>Mail: Destinatário, assunto e corpo
          Mail->>Delivery: Enviar pelo provedor configurado
          Delivery-->>Mail: Aceite ou falha
          Mail->>DAO: run(status sent ou failed)
        end
      else Sem chave ou remetente
        Note over Mail,DAO: Mensagens permanecem pending em modo demonstração
      end
      Service-->>Controller: Reconhecimento registrado
      Controller-->>View: 201, confirmações disponíveis
      View-->>Professor: Atualizar saldo e mostrar confirmação
    end
  end
```

## Consultar extrato do professor

Lab04S01: saldo, crédito semestral e envios. [Arquivo Mermaid](extrato-professor.mmd).

```mermaid
sequenceDiagram
  actor Professor
  participant View as View (statementView)
  participant Controller as AppController.api
  participant Service as MeritService
  participant DAO as Repository
  participant DB as SQLite ou D1
  Professor->>View: Abrir Extrato
  View->>Controller: GET /api/me + cookie
  Controller->>DAO: Consultar sessão válida e professor ativo
  DAO-->>Controller: Professor autenticado
  Controller->>Service: semester(teacher)
  Service->>DAO: INSERT OR IGNORE crédito de 1.000 do semestre
  DAO->>DB: Inserir com unicidade de professor e semestre
  DB-->>DAO: Crédito aplicado uma vez ou já existente
  Controller->>DAO: Recarregar usuário com saldo atualizado
  DAO-->>Controller: Professor e saldo
  Controller-->>View: Perfil e saldo
  View->>Controller: GET /api/statement + cookie
  Controller->>Controller: Autenticar e garantir crédito semestral idempotente
  Controller->>DAO: all(transações do usuário com nomes)
  DAO->>DB: SELECT por from_id ou to_id, ordem decrescente
  DB-->>DAO: Até 200 créditos semestrais e envios
  DAO-->>Controller: Transações com aluno, motivo, valor e data
  Controller-->>View: 200, extrato do professor
  View-->>Professor: Saldo, créditos e débitos
  Note over Controller,DB: Sessão ausente, expirada ou inativa retorna 401
```

## Consultar extrato do aluno

Lab04S01: saldo, recebimentos e trocas. [Arquivo Mermaid](extrato-aluno.mmd).

```mermaid
sequenceDiagram
  actor Aluno
  participant View as View (statementView)
  participant Controller as AppController.api
  participant DAO as Repository
  participant DB as SQLite ou D1
  Aluno->>View: Abrir Extrato
  View->>Controller: GET /api/me + cookie
  Controller->>DAO: Consultar sessão válida e aluno ativo
  DAO-->>Controller: Aluno autenticado e saldo
  Controller-->>View: Perfil e saldo
  View->>Controller: GET /api/statement + cookie
  Controller->>DAO: Autenticar sessão
  DAO-->>Controller: Aluno autenticado
  Controller->>DAO: all(transações do próprio usuário com nomes)
  DAO->>DB: SELECT por from_id ou to_id, ordem decrescente
  DB-->>DAO: Até 200 recebimentos e resgates
  DAO-->>Controller: Transações com professor, motivo, valor e data
  Controller-->>View: 200, extrato do aluno
  View-->>Aluno: Saldo, moedas recebidas e moedas trocadas
  Note over Controller,DB: O usuário vem da sessão, sem parâmetro para consultar outra conta
```

## Cadastrar vantagem

Lab04S02: empresa autenticada e campos obrigatórios. [Arquivo Mermaid](cadastrar-vantagem.mmd).

```mermaid
sequenceDiagram
  actor Empresa
  participant View as View (offerForm)
  participant Controller as AppController.api
  participant DAO as Repository
  participant DB as SQLite ou D1
  Empresa->>View: Informar título, descrição, foto e custo
  View->>Controller: POST /api/offers + cookie
  Controller->>DAO: Consultar sessão e usuário ativo
  DAO-->>Controller: Usuário autenticado
  alt Perfil diferente de partner
    Controller-->>View: 403, acesso negado
  else Empresa autenticada
    Controller->>Controller: Validar campos, custo inteiro positivo e foto
    alt Dados inválidos
      Controller-->>View: 400, erro de validação
      View-->>Empresa: Corrigir formulário
    else Dados válidos
      Controller->>DAO: run(INSERT oferta com partner_id da sessão)
      DAO->>DB: Persistir vantagem ativa
      DB-->>DAO: Sucesso
      Controller-->>View: 201, vantagem salva
      View->>Controller: GET /api/me e GET /api/offers
      Controller->>DAO: Consultar perfil e vantagens da empresa
      DAO-->>Controller: Perfil e catálogo próprio
      Controller-->>View: Dados atualizados
      View-->>Empresa: Exibir vantagem cadastrada
    end
  end
```

## Listar vantagens

Lab04S02: catálogo ativo para o aluno. [Arquivo Mermaid](listar-vantagens.mmd).

```mermaid
sequenceDiagram
  actor Aluno
  participant View as View (homeView)
  participant Controller as AppController.api
  participant DAO as Repository
  participant DB as SQLite ou D1
  Aluno->>View: Abrir Vantagens
  View->>Controller: GET /api/me + cookie
  Controller->>DAO: Autenticar sessão e consultar saldo
  DAO-->>Controller: Aluno ativo e saldo
  Controller-->>View: Perfil e saldo
  View->>Controller: GET /api/offers + cookie
  Controller->>DAO: Autenticar sessão
  DAO-->>Controller: Aluno autenticado
  Controller->>DAO: all(ofertas ativas de empresas ativas)
  DAO->>DB: SELECT offers JOIN users com filtros active
  DB-->>DAO: Título, descrição, foto, custo e empresa
  DAO-->>Controller: Catálogo
  Controller-->>View: 200, lista de vantagens
  alt Catálogo vazio
    View-->>Aluno: Nenhuma vantagem cadastrada
  else Há vantagens
    View-->>Aluno: Cartões de vantagens e saldo disponível
    Note over View,Aluno: Botão de resgate desabilitado se o saldo exibido for insuficiente
  end
  Note over Controller,DB: O resgate valida novamente oferta e saldo no servidor
```

## Trocar vantagem

Lab04S03: débito atômico, cupom e dois e-mails. [Arquivo Mermaid](trocar-vantagem.mmd).

```mermaid
sequenceDiagram
  actor Aluno
  participant View as View (app.js)
  participant Controller as AppController.api
  participant Service as MeritService
  participant Templates as emailTemplates
  participant DAO as Repository
  participant DB as SQLite ou D1
  participant Mail as EmailService
  participant Delivery as Gmail SMTP ou Resend
  Aluno->>View: Selecionar vantagem e confirmar custo
  View->>Controller: POST /api/redemptions com offerId, chave e cookie
  Controller->>Controller: Autenticar e exigir perfil student
  Controller->>Service: redeem(student, body)
  Service->>DAO: one(cupom pela chave)
  alt Chave já registrada para este aluno
    DAO-->>Service: Cupom existente
    Service-->>Controller: Mesmo cupom, sem novo débito ou e-mail
    Controller-->>View: 201, cupom existente
  else Nova operação
    Service->>DAO: one(vantagem e empresa ativas)
    DAO-->>Service: Vantagem, custo e destinatário da empresa
    alt Vantagem indisponível
      Service-->>Controller: Erro 404
      Controller-->>View: Vantagem indisponível
    else Vantagem disponível
      Service->>Service: Gerar código único e copiar título e custo
      Service->>Templates: couponTemplates(aluno, oferta, código)
      Templates-->>Service: Mensagem do aluno e mensagem da empresa
      Service->>DAO: batch(cupom, débito, dois e-mails)
      DAO->>DB: Executar lote atômico
      DB->>DB: Gatilhos verificam saldo e descontam moedas
      alt Saldo insuficiente ou falha de persistência
        DB-->>DAO: Rollback de cupom, débito e e-mails
        DAO-->>Controller: Erro propagado pelo serviço
        Controller-->>View: Erro sem resgate parcial
      else Commit
        DB-->>DAO: Cupom, transação e mensagens persistidos
        DAO-->>Service: Sucesso
        Service->>Mail: deliver(ids dos dois e-mails)
        alt Provedor configurado
          loop Para cada mensagem
            Mail->>DAO: Carregar e-mail
            DAO-->>Mail: Dados da mensagem
            Mail->>Delivery: Enviar template com o mesmo código
            Delivery-->>Mail: Aceite ou falha
            Mail->>DAO: Atualizar sent ou failed
          end
        else Sem configuração
          Note over Mail,DAO: Mensagens ficam pending para consulta no modo demonstração
        end
        Service->>DAO: one(cupom persistido)
        DAO-->>Service: Cupom
        Service-->>Controller: Cupom emitido
        Controller-->>View: 201, cupom
        View-->>Aluno: Mostrar código em Meus cupons e atualizar saldo
      end
    end
  end
```

## Sequência geral

Lab04S03: colaboração entre os três perfis, do reconhecimento à troca presencial. [Arquivo Mermaid](geral.mmd).

```mermaid
sequenceDiagram
  actor Professor
  actor Aluno
  actor Empresa
  participant View as View HTML/CSS/JS
  participant Controller as AppController.api
  participant Service as MeritService
  participant Templates as emailTemplates
  participant DAO as Repository / Banco
  participant Mail as EmailService / Gmail ou Resend
  Note over View,DAO: Cada perfil usa sua própria sessão. Todas as rotas de negócio exigem autenticação
  Professor->>View: Entrar com e-mail e senha
  View->>Controller: POST /api/login
  Controller->>DAO: Conferir usuário, senha e registrar hash da sessão
  Controller-->>View: Cookie HttpOnly
  View->>Controller: GET /api/me
  Controller->>Service: semester(professor)
  Service->>DAO: Crédito único de 1.000 por semestre, acumulável
  Controller-->>View: Professor e saldo atualizado
  Professor->>View: Enviar moedas com aluno e motivo
  View->>Controller: POST /api/recognitions
  Controller->>Service: recognize(professor, dados)
  Service->>DAO: Verificar chave, aluno e instituição
  Service->>Templates: recognitionTemplates(dados)
  Templates-->>Service: Confirmação do professor e recebimento do aluno
  Service->>DAO: Lote atômico de transação e duas mensagens
  Note over Service,DAO: Gatilhos impedem saldo insuficiente e atualizam os dois saldos
  Service->>Mail: Tentar entregar mensagens após commit
  Mail->>DAO: Registrar status de cada mensagem
  Controller-->>View: Reconhecimento registrado
  Professor->>View: Consultar Extrato e Notificações
  View->>Controller: GET /api/statement e GET /api/emails
  Controller->>DAO: Consultar registros do professor autenticado
  Controller-->>View: Envios e confirmação
  Empresa->>View: Entrar com e-mail e senha
  View->>Controller: POST /api/login
  Controller->>DAO: Autenticar empresa e criar sessão
  Controller-->>View: Cookie HttpOnly
  Empresa->>View: Cadastrar título, descrição, foto e custo
  View->>Controller: POST /api/offers
  Controller->>DAO: Validar perfil/dados e inserir oferta da empresa
  Controller-->>View: Vantagem salva
  Aluno->>View: Entrar com e-mail e senha
  View->>Controller: POST /api/login
  Controller->>DAO: Autenticar aluno e criar sessão
  Controller-->>View: Cookie HttpOnly
  Aluno->>View: Consultar saldo, Extrato e Notificações
  View->>Controller: GET /api/me, /api/statement e /api/emails
  Controller->>DAO: Consultar registros do aluno autenticado
  Controller-->>View: Saldo, recebimentos e mensagem do aluno
  Aluno->>View: Abrir catálogo
  View->>Controller: GET /api/offers
  Controller->>DAO: Listar vantagens ativas de empresas ativas
  Controller-->>View: Catálogo com foto e custo
  Aluno->>View: Confirmar resgate
  View->>Controller: POST /api/redemptions
  Controller->>Service: redeem(aluno, dados)
  Service->>DAO: Verificar chave e vantagem disponível
  Service->>Templates: couponTemplates(aluno, oferta, código)
  Templates-->>Service: Templates do aluno e da empresa com mesmo código
  Service->>DAO: Lote atômico de cupom, débito e dois e-mails
  Note over Service,DAO: Falha reverte o lote. Repetir chave retorna o cupom existente
  Service->>Mail: Tentar entregar mensagens após commit
  Mail->>DAO: Registrar sent, failed ou manter pending sem configuração
  Controller-->>View: Cupom único
  View-->>Aluno: Código e saldo atualizado
  Aluno->>Empresa: Apresentar código na troca presencial
  Empresa->>View: Conferir código em sua sessão
  View->>Controller: POST /api/coupons/validate
  Controller->>DAO: Consultar cupom da empresa e atualizar available para used
  alt Cupom disponível da empresa
    DAO-->>Controller: Uma linha alterada
    Controller-->>View: Utilização confirmada
    View-->>Empresa: Entregar vantagem
  else Código alheio, inexistente ou já usado
    Controller-->>View: 404 ou 409, troca recusada
  end
```
