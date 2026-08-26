import { Academy, SaasPlatformInvoice, SaasMasterBillingOverview, Student } from "../types";

export const SAAS_FIXED_FEE = 130.00;
export const SAAS_PER_STUDENT_FEE = 1.30;

/**
 * Calculates SaaS billing for an academy based on active students.
 */
export function calculateAcademySaasBilling(activeStudentsCount: number) {
  const variableAmount = Math.round(activeStudentsCount * SAAS_PER_STUDENT_FEE * 100) / 100;
  const amount = Math.round((SAAS_FIXED_FEE + variableAmount) * 100) / 100;
  return {
    fixedFee: SAAS_FIXED_FEE,
    perStudentFee: SAAS_PER_STUDENT_FEE,
    activeStudentsCount,
    variableAmount,
    amount
  };
}

/**
 * Generates official notification message text for WhatsApp & E-mail.
 */
export function generateSaasInvoiceMessage(invoice: SaasPlatformInvoice): string {
  const dueDateFormatted = new Date(invoice.dueDate + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  return `🥋 *BJJ Academy — Fatura Mensal da Plataforma*
Olá, *${invoice.ownerName || invoice.academyName}*!

Sua fatura referente ao mês de *${invoice.invoiceMonth}* está disponível:

📋 *Detalhamento da Assinatura:*
• Taxa Fixa de Plataforma & Servidores: *R$ ${invoice.fixedFee.toFixed(2).replace(".", ",")}*
• Alunos Ativos no Tatame: *${invoice.activeStudentsCount} alunos* × R$ 1,30 = *R$ ${invoice.variableAmount.toFixed(2).replace(".", ",")}*
━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL A PAGAR: R$ ${invoice.amount.toFixed(2).replace(".", ",")}*
📅 *Vencimento: ${dueDateFormatted}*
━━━━━━━━━━━━━━━━━━━━

🔗 *Pagar via PIX Instantâneo, Boleto ou Cartão:*
${invoice.pixCopiaECola ? `\n🔑 *PIX Copia e Cola:*\n\`${invoice.pixCopiaECola}\`\n` : ""}
👉 *Acesse sua fatura online:*
https://bjjacademy.app.br/faturas/${invoice.id}

Dúvidas ou suporte? Estamos à disposição no tatame virtual! 🥋✨`;
}

/**
 * Initial Mock/Seed Invoices for Master Super Admin & Academies
 */
export const initialSaasPlatformInvoices: SaasPlatformInvoice[] = [
  {
    id: "saas-inv-001",
    academyId: "ac-1",
    academyName: "Gracie Barra Barra da Tijuca",
    unit: "Matriz - Rio de Janeiro",
    ownerName: "Mestre Carlos Gracie Jr.",
    ownerPhone: "+55 (21) 98888-1122",
    ownerEmail: "diretoria@graciebarra.com.br",
    invoiceMonth: "Agosto/2026",
    activeStudentsCount: 145,
    fixedFee: 130.00,
    perStudentFee: 1.30,
    variableAmount: 188.50,
    amount: 318.50,
    dueDate: "2026-09-10",
    paymentDate: "2026-08-25T14:30:00Z",
    status: "PAID",
    billingType: "PIX",
    pixCopiaECola: "00020126580014br.gov.bcb.pix0136bjjacademy-saas-inv-0015204000053039865802BR5919BJJ ACADEMY SAAS6009SAO PAULO62070503***6304E8A1",
    pixQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014br.gov.bcb.pix0136bjjacademy-saas-inv-001",
    pdfUrl: "https://bjjacademy.app.br/invoices/saas-inv-001.pdf",
    bankSlipUrl: "https://bjjacademy.app.br/boletos/saas-inv-001",
    asaasInvoiceId: "pay_saas_gracie_881902",
    lastSentAt: "2026-08-20T10:00:00Z",
    sentChannel: "WHATSAPP",
    notes: "Pagamento confirmado via PIX Asaas automático."
  },
  {
    id: "saas-inv-002",
    academyId: "ac-2",
    academyName: "Alliance São Paulo",
    unit: "São Paulo - Itaim Bibi",
    ownerName: "Mestre Fabio Gurgel",
    ownerPhone: "+55 (11) 97777-3344",
    ownerEmail: "financeiro@alliancebjj.com.br",
    invoiceMonth: "Agosto/2026",
    activeStudentsCount: 112,
    fixedFee: 130.00,
    perStudentFee: 1.30,
    variableAmount: 145.60,
    amount: 275.60,
    dueDate: "2026-09-10",
    status: "PENDING",
    billingType: "PIX",
    pixCopiaECola: "00020126580014br.gov.bcb.pix0136bjjacademy-saas-inv-0025204000053039865802BR5919BJJ ACADEMY SAAS6009SAO PAULO62070503***6304C92B",
    pixQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014br.gov.bcb.pix0136bjjacademy-saas-inv-002",
    pdfUrl: "https://bjjacademy.app.br/invoices/saas-inv-002.pdf",
    bankSlipUrl: "https://bjjacademy.app.br/boletos/saas-inv-002",
    asaasInvoiceId: "pay_saas_alliance_992104",
    lastSentAt: "2026-08-24T09:15:00Z",
    sentChannel: "WHATSAPP",
    notes: "Aguardando pagamento até o dia 10."
  },
  {
    id: "saas-inv-003",
    academyId: "ac-3",
    academyName: "Atos BJJ San Diego",
    unit: "California - Headquarters",
    ownerName: "Mestre André Galvão",
    ownerPhone: "+1 (619) 555-0199",
    ownerEmail: "admin@atosjiujitsuhq.com",
    invoiceMonth: "Agosto/2026",
    activeStudentsCount: 89,
    fixedFee: 130.00,
    perStudentFee: 1.30,
    variableAmount: 115.70,
    amount: 245.70,
    dueDate: "2026-09-10",
    paymentDate: "2026-08-22T18:10:00Z",
    status: "PAID",
    billingType: "CREDIT_CARD",
    pdfUrl: "https://bjjacademy.app.br/invoices/saas-inv-003.pdf",
    asaasInvoiceId: "pay_saas_atos_110293",
    lastSentAt: "2026-08-20T10:00:00Z",
    sentChannel: "EMAIL",
    notes: "Cobrança internacional debitada no cartão."
  },
  {
    id: "saas-inv-004",
    academyId: "ac-4",
    academyName: "Loyalty Jiu-Jitsu",
    unit: "Matriz - São Paulo",
    ownerName: "Prof. Roberto Mendes",
    ownerPhone: "+55 (11) 97123-9988",
    ownerEmail: "roberto@layoutjiujitsu.com.br",
    invoiceMonth: "Agosto/2026",
    activeStudentsCount: 128,
    fixedFee: 130.00,
    perStudentFee: 1.30,
    variableAmount: 166.40,
    amount: 296.40,
    dueDate: "2026-09-10",
    status: "PENDING",
    billingType: "PIX",
    pixCopiaECola: "00020126580014br.gov.bcb.pix0136bjjacademy-saas-inv-0045204000053039865802BR5919BJJ ACADEMY SAAS6009SAO PAULO62070503***6304771A",
    pixQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014br.gov.bcb.pix0136bjjacademy-saas-inv-004",
    pdfUrl: "https://bjjacademy.app.br/invoices/saas-inv-004.pdf",
    bankSlipUrl: "https://bjjacademy.app.br/boletos/saas-inv-004",
    asaasInvoiceId: "pay_saas_loyalty_774129",
    lastSentAt: "2026-08-25T11:00:00Z",
    sentChannel: "WHATSAPP",
    notes: "Cobrança enviada via WhatsApp do gestor."
  }
];

/**
 * Calculates master overview statistics from invoices and academies.
 */
export function computeSaasMasterOverview(
  academies: Academy[],
  students: Student[],
  invoices: SaasPlatformInvoice[]
): SaasMasterBillingOverview {
  const totalAcademies = academies.length;
  const activeAcademies = academies.filter(a => a.status !== "Suspended").length;
  
  // Real-time active student counts
  const totalActiveStudents = students.filter(s => s.status === "Active").length;

  let projectedRevenue = 0;
  let receivedRevenue = 0;
  let pendingRevenue = 0;
  let overdueRevenue = 0;

  invoices.forEach(inv => {
    projectedRevenue += inv.amount;
    if (inv.status === "PAID") {
      receivedRevenue += inv.amount;
    } else if (inv.status === "PENDING") {
      pendingRevenue += inv.amount;
    } else if (inv.status === "OVERDUE") {
      overdueRevenue += inv.amount;
    }
  });

  return {
    totalAcademies,
    activeAcademies,
    totalActiveStudents,
    fixedFeeUnit: SAAS_FIXED_FEE,
    perStudentFeeUnit: SAAS_PER_STUDENT_FEE,
    projectedRevenue: Math.round(projectedRevenue * 100) / 100,
    receivedRevenue: Math.round(receivedRevenue * 100) / 100,
    pendingRevenue: Math.round(pendingRevenue * 100) / 100,
    overdueRevenue: Math.round(overdueRevenue * 100) / 100,
    billingMonth: "Agosto/2026",
    invoices
  };
}
