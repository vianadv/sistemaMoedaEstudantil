// Os templates geram texto simples para a outbox e para o provedor de e-mail.
export function recognitionTemplates({ teacher, student, amount, reason, transactionId }) {
  const details = `Quantidade: ${amount} moedas.\nMotivo: ${reason}\nReferência da transação: ${transactionId}`;
  return [
    {
      userId: student.id,
      recipient: student.email,
      subject: 'Você recebeu um reconhecimento no Meritus',
      body: `Olá, ${student.name}!\n\n${teacher.name} reconheceu você com ${amount} moedas.\n${details}\n\nAs moedas já estão disponíveis na sua conta. Consulte seu saldo e o recebimento em Extrato no Meritus.`
    },
    {
      userId: teacher.id,
      recipient: teacher.email,
      subject: 'Seu envio de moedas foi confirmado no Meritus',
      body: `Olá, ${teacher.name}!\n\nSeu envio de moedas para ${student.name} foi confirmado.\n${details}\n\nO valor foi descontado da sua conta e creditado ao aluno. Consulte seu saldo e o envio em Extrato no Meritus.`
    }
  ];
}

export function couponTemplates({ student, offer, code }) {
  const details = `Código do cupom: ${code}\nVantagem: ${offer.title}\nAluno: ${student.name}\nParceiro: ${offer.partner_name}\nCusto: ${offer.cost} moedas.`;
  return [
    {
      userId: student.id,
      recipient: student.email,
      subject: `Seu cupom ${code}`,
      body: `Olá, ${student.name}!\n\nSeu resgate foi confirmado e ${offer.cost} moedas foram descontadas do seu saldo.\n\n${details}\n\nApresente este código à empresa na troca presencial. O cupom é de uso único e também está disponível em Meus cupons no Meritus.`
    },
    {
      userId: offer.partner_id,
      recipient: offer.partner_email,
      subject: `Conferência do cupom ${code}`,
      body: `Olá, ${offer.partner_name}!\n\nUm aluno resgatou uma vantagem da sua empresa.\n\n${details}\n\nConfira o código apresentado pelo aluno na troca presencial e confirme a utilização em Conferir cupons no Meritus. O cupom é de uso único.`
    }
  ];
}
