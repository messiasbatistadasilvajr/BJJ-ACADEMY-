import React, { useState } from "react";
import { Academy, Student, SaasPlatformInvoice } from "../types";
import { 
  Building2, CreditCard, QrCode, CheckCircle2, 
  Clock, Copy, Check, FileText, Download, 
  Sparkles, ShieldCheck, ArrowUpRight, HelpCircle,
  Smartphone, ExternalLink
} from "lucide-react";
import { SAAS_FIXED_FEE, SAAS_PER_STUDENT_FEE, calculateAcademySaasBilling } from "../services/saasBillingService";

interface MyAcademySubscriptionProps {
  academy: Academy;
  students: Student[];
  currentInvoice?: SaasPlatformInvoice;
  onPayInvoice?: (invoiceId: string) => void;
}

export default function MyAcademySubscription({
  academy,
  students,
  currentInvoice,
  onPayInvoice
}: MyAcademySubscriptionProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD" | "BOLETO">("PIX");
  const [showCardModal, setShowCardModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Real count of active students for this academy
  const activeStudentsCount = students.filter(s => s.academyId === academy.id && s.status === "Active").length || academy.activeStudents || 50;
  const billing = calculateAcademySaasBilling(activeStudentsCount);

  // Effective invoice
  const invoice: SaasPlatformInvoice = currentInvoice || {
    id: `saas-inv-${academy.id}`,
    academyId: academy.id,
    academyName: academy.name,
    unit: academy.unit,
    invoiceMonth: "Agosto/2026",
    activeStudentsCount,
    fixedFee: billing.fixedFee,
    perStudentFee: billing.perStudentFee,
    variableAmount: billing.variableAmount,
    amount: billing.amount,
    dueDate: "2026-09-10",
    status: "PENDING",
    billingType: "PIX",
    pixCopiaECola: `00020126580014br.gov.bcb.pix0136bjjacademy-sub-${academy.id}-88195204000053039865802BR5919BJJ ACADEMY6009SAO PAULO62070503***6304E9A1`,
    pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014br.gov.bcb.pix0136bjjacademy-sub-${academy.id}`,
    pdfUrl: `https://bjjacademy.app.br/faturas/${academy.id}.pdf`
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSimulateCardPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowCardModal(false);
      setPaymentSuccess(true);
      if (onPayInvoice) {
        onPayInvoice(invoice.id);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6" id="my-academy-subscription">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/60 border border-blue-500/30 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-mono font-bold uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sua Assinatura da Plataforma
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
              Licença BJJ Academy — {academy.name}
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl">
              Plano de gestão para sua unidade. Inclui chamadas por foto com IA Gemini, painel financeiro Asaas, aplicativo do aluno e suporte ilimitado.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-right shadow-inner">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Status da Assinatura</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Plataforma Ativa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Invoice Card for Academy Owner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Invoice Calculation & Details */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-blue-400 uppercase font-bold block">Fatura Mensal</span>
              <h3 className="text-lg font-bold text-white font-display">Competência: {invoice.invoiceMonth}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Vencimento</span>
              <span className="text-sm font-bold text-white font-mono">
                {invoice.dueDate ? new Date(invoice.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "10/09/2026"}
              </span>
            </div>
          </div>

          {/* Detailed breakdown */}
          <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80">
            <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">Detalhamento do Valor</h4>
            
            <div className="space-y-2 text-xs divide-y divide-slate-800">
              <div className="flex justify-between py-2 text-slate-300">
                <span>Taxa Base de Plataforma & Servidores:</span>
                <strong className="text-white font-mono">R$ {invoice.fixedFee.toFixed(2).replace(".", ",")}</strong>
              </div>

              <div className="flex justify-between py-2 text-slate-300">
                <div>
                  <span>Alunos Ativos no Dojo:</span>
                  <span className="text-[11px] text-slate-500 block">({invoice.activeStudentsCount} alunos matriculados × R$ 1,30)</span>
                </div>
                <strong className="text-indigo-300 font-mono self-center">R$ {invoice.variableAmount.toFixed(2).replace(".", ",")}</strong>
              </div>

              <div className="flex justify-between pt-3 text-base font-bold text-white">
                <span>TOTAL DA MENSALIDADE:</span>
                <span className="text-blue-400 font-mono text-lg">
                  R$ {invoice.amount.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>

          {/* Status info */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-3">
              {invoice.status === "PAID" || paymentSuccess ? (
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-xs text-slate-400 block font-medium">Status do Pagamento</span>
                <span className="text-sm font-bold text-white">
                  {invoice.status === "PAID" || paymentSuccess ? "🟢 Mensalidade Liquidada" : "🟡 Aguardando Pagamento"}
                </span>
              </div>
            </div>

            {invoice.status !== "PAID" && !paymentSuccess && (
              <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold border border-amber-400/30">
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Right Col: Instant Payment Section (PIX / Boleto / Cartão) */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            Opções de Pagamento
          </h3>

          {/* Method tabs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setPaymentMethod("PIX")}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                paymentMethod === "PIX"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              PIX
            </button>
            <button
              onClick={() => setPaymentMethod("CREDIT_CARD")}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                paymentMethod === "CREDIT_CARD"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Cartão
            </button>
            <button
              onClick={() => setPaymentMethod("BOLETO")}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                paymentMethod === "BOLETO"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Boleto
            </button>
          </div>

          {/* PIX View */}
          {paymentMethod === "PIX" && (
            <div className="space-y-4 text-center">
              {invoice.pixQrCodeUrl && (
                <div className="bg-white p-3 rounded-2xl w-44 h-44 mx-auto shadow-lg flex items-center justify-center">
                  <img
                    src={invoice.pixQrCodeUrl}
                    alt="QR Code PIX BJJ Academy"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="space-y-2 text-left">
                <span className="text-[11px] text-slate-400 block font-medium">PIX Copia e Cola:</span>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-[10px] text-slate-300 break-all max-h-16 overflow-y-auto">
                  {invoice.pixCopiaECola}
                </div>
                <button
                  onClick={() => handleCopy(invoice.pixCopiaECola || "", "pix-academy")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
                >
                  {copiedKey === "pix-academy" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedKey === "pix-academy" ? "Código PIX Copiado!" : "Copiar Código PIX"}
                </button>
              </div>
            </div>
          )}

          {/* Credit Card View */}
          {paymentMethod === "CREDIT_CARD" && (
            <div className="space-y-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <div className="space-y-1">
                <span className="text-white font-bold block">Pagamento com Cartão de Crédito</span>
                <p className="text-slate-400 text-[11px]">
                  Fatura de R$ {invoice.amount.toFixed(2).replace(".", ",")} com confirmação instantânea.
                </p>
              </div>

              <button
                onClick={() => setShowCardModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                Pagar com Cartão de Crédito
              </button>
            </div>
          )}

          {/* Boleto View */}
          {paymentMethod === "BOLETO" && (
            <div className="space-y-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <div className="space-y-1">
                <span className="text-white font-bold block">Boleto Bancário Registrado</span>
                <p className="text-slate-400 text-[11px]">
                  Vencimento para {invoice.dueDate ? new Date(invoice.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "10/09/2026"}.
                </p>
              </div>

              <button
                onClick={() => {
                  window.open(invoice.bankSlipUrl || "https://bjjacademy.app.br/boletos/exemplo", "_blank");
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Download className="w-4 h-4" />
                Visualizar e Imprimir Boleto
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Credit Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-display">Dados do Cartão</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome no Cartão:</label>
                <input
                  type="text"
                  placeholder="NOME COMO NO CARTÃO"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Número do Cartão:</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Validade:</label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CVV:</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleSimulateCardPayment}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
              >
                {isProcessingPayment ? "Processando..." : `Pagar R$ ${invoice.amount.toFixed(2).replace(".", ",")}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
