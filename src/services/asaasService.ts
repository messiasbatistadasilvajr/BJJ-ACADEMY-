import { AsaasInvoice, AsaasSubscription, AsaasFinancialMetrics, AsaasWebhookEvent, AsaasSubaccountInfo } from "../types/asaas";
import { Student, PaymentHistory } from "../types";

// Helper sound & voice notification for instant payment confirmation
export const playPaymentSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);

    // Text to Speech voice confirmation
    if ("speechSynthesis" in window) {
      const msg = new SpeechSynthesisUtterance("Pagamento PIX confirmado com sucesso!");
      msg.lang = "pt-BR";
      msg.rate = 1.1;
      window.speechSynthesis.speak(msg);
    }
  } catch (e) {
    console.log("Audio feedback error or blocked:", e);
  }
};

export const generateAsaasPixCode = (studentId: string, amount: number): string => {
  const hash = Math.random().toString(36).substring(2, 12).toUpperCase();
  return `00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/pay_${studentId}_${amount}_${hash}`;
};

export const generateAsaasBoletoBarCode = (): string => {
  const p1 = Math.floor(10000 + Math.random() * 90000);
  const p2 = Math.floor(10000 + Math.random() * 90000);
  const p3 = Math.floor(10000 + Math.random() * 90000);
  return `23793.38128 ${p1}.${p2} ${p3}.900001 8 98210000022000`;
};

export const calculateAsaasMetrics = (
  students: Student[],
  payments: PaymentHistory[]
): AsaasFinancialMetrics => {
  const totalStudents = students.length || 1;
  const compliantStudents = students.filter(s => s.paymentStatus === "Paid").length;
  const overdueStudents = students.filter(s => s.paymentStatus === "Overdue");

  const adimplenciaRate = Math.round((compliantStudents / totalStudents) * 100);

  const totalReceivedMonth = payments
    .filter(p => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverdueAmount = overdueStudents
    .reduce((sum, s) => sum + (s.planValue || 220), 0);

  const totalPendingFuture = students
    .filter(s => s.paymentStatus === "Pending")
    .reduce((sum, s) => sum + (s.planValue || 220), 0);

  const mrr = students.reduce((sum, s) => sum + (s.planValue || 220), 0);
  const arr = mrr * 12;

  return {
    adimplenciaRate,
    totalReceivedMonth,
    totalOverdueAmount,
    totalPendingFuture,
    mrr,
    arr,
    activeSubscriptionsCount: compliantStudents,
    overdueCount: overdueStudents.length,
  };
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error("Failed to copy: ", err);
    return false;
  }
};

/**
 * Split Calculation Helper:
 * Determines the exact payout for the tenant academy subaccount and SaaS platform fee
 */
export const calculateAsaasSplit = (
  grossAmount: number,
  academySplitPercent = 95,
  platformFixedFee = 0.00
) => {
  const asaasGatewayFee = grossAmount >= 100 ? 0.99 : 0.79; // Asaas PIX average fee
  const platformFee = Math.max(0, (grossAmount * ((100 - academySplitPercent) / 100)) + platformFixedFee);
  const academyNet = Math.max(0, grossAmount - platformFee - asaasGatewayFee);

  return {
    grossAmount,
    asaasGatewayFee,
    platformFee,
    academyNet,
    academyPercent: academySplitPercent,
    platformPercent: 100 - academySplitPercent
  };
};

/**
 * Initial Pre-Configured Subaccounts for Multi-Tenant Academies
 */
export const initialSubaccounts: AsaasSubaccountInfo[] = [
  {
    id: "subacc_ac1_gracie",
    academyId: "ac-1",
    academyName: "Gracie Barra Barra da Tijuca",
    cnpjOrCpf: "34.112.980/0001-44",
    walletId: "wal_gracie_889210041",
    apiKeyMasked: "$aact_YTU5YTE0M2M6...4b8e",
    status: "ACTIVE",
    balanceTotal: 18200.00,
    balanceAvailable: 15450.00,
    balancePending: 2750.00,
    splitPercentageAcademy: 95,
    splitPercentagePlatform: 5,
    autoTransferDaily: true,
    bankAccount: {
      bankName: "Banco Itaú Unibanco (341)",
      agency: "0452",
      accountNumber: "28910-4",
      accountType: "CONTA_CORRENTE",
      pixKey: "financeiro@graciebarratijuca.com.br"
    }
  },
  {
    id: "subacc_ac2_alliance",
    academyId: "ac-2",
    academyName: "Alliance São Paulo",
    cnpjOrCpf: "18.445.671/0001-92",
    walletId: "wal_alliance_994120381",
    apiKeyMasked: "$aact_ZGY0MmFiOWE6...9f12",
    status: "ACTIVE",
    balanceTotal: 15400.00,
    balanceAvailable: 14100.00,
    balancePending: 1300.00,
    splitPercentageAcademy: 95,
    splitPercentagePlatform: 5,
    autoTransferDaily: true,
    bankAccount: {
      bankName: "Banco Bradesco (237)",
      agency: "1230",
      accountNumber: "99120-1",
      accountType: "CONTA_CORRENTE",
      pixKey: "pix@alliancesp.com.br"
    }
  },
  {
    id: "subacc_ac3_atos",
    academyId: "ac-3",
    academyName: "Atos BJJ San Diego",
    cnpjOrCpf: "29.771.302/0001-18",
    walletId: "wal_atos_110293847",
    apiKeyMasked: "$aact_M2U4YTFkOTQ6...2c71",
    status: "ACTIVE",
    balanceTotal: 13500.00,
    balanceAvailable: 12200.00,
    balancePending: 1300.00,
    splitPercentageAcademy: 95,
    splitPercentagePlatform: 5,
    autoTransferDaily: true,
    bankAccount: {
      bankName: "Banco Santander (033)",
      agency: "3489",
      accountNumber: "0019283-9",
      accountType: "CONTA_CORRENTE",
      pixKey: "accounts@atosbjj.com"
    }
  }
];

export const generateAsaasPaymentLink = (
  subaccountWalletId: string,
  studentIdOrAmount: string | number,
  amountOrDesc: number | string = 220,
  billingTypeOrAcademy: string = "PIX"
): string => {
  const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
  const val = typeof studentIdOrAmount === "number" ? studentIdOrAmount : (typeof amountOrDesc === "number" ? amountOrDesc : 220);
  const identifier = typeof studentIdOrAmount === "string" ? studentIdOrAmount : "instant";
  const typeParam = typeof billingTypeOrAcademy === "string" ? billingTypeOrAcademy.toLowerCase() : "pix";
  return `https://bjjacademy.app.br/pay/${subaccountWalletId}/${identifier}?val=${val}&type=${typeParam}&ref=${hash}`;
};

