import { AsaasInvoice, AsaasSubscription, AsaasFinancialMetrics, AsaasWebhookEvent } from "../types/asaas";
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
