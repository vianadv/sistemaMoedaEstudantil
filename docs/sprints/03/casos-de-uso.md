# Casos de uso finais

O arquivo `casos-de-uso.puml` contém a notação UML formal. Esta versão Mermaid é uma visualização navegável no GitHub.

```mermaid
flowchart LR
 A[Aluno] --> L([Autenticar])
 P[Professor] --> L
 E[Empresa] --> L
 A --> C([Manter próprio cadastro])
 E --> C
 A --> X([Consultar saldo e extrato])
 P --> X
 P --> R([Reconhecer com motivo])
 P --> S([Crédito semestral])
 A --> V([Resgatar vantagem])
 E --> G([Gerenciar vantagem com foto])
 A --> U([Consultar cupom])
 E --> U
 E --> F([Conferir uso único])
 R --> N([Registrar e enviar notificação])
 V --> N
 V --> U
```

Pré-condição dos casos de uso de negócio: usuário autenticado e autorizado. Exceção: cadastro e lista pública de instituições. Envio externo depende de configuração do provedor.
