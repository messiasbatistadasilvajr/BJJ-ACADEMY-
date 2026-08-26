import React, { useState } from "react";
import { Academy, Student, SaasPlatformInvoice, SaasInvoiceStatus } from "../types";
import { 
  DollarSign, Building2, Users, Send, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, Eye, Sparkles, Copy, 
  Check, MessageSquare, Mail, QrCode, FileText, Ban, 
  TrendingUp, ShieldCheck, ChevronRight, Download, 
  Calculator, ArrowUpRight, CheckCheck, X, ExternalLink,
  Smartphone, Share2
} from "lucide-react";
import { 
  SAAS_FIXED_FEE, 
  SAAS_PER_STUDENT_FEE, 
  calculateAcademySaasBilling, 
  generateSaasInvoiceMessage,
  initialSaasPlatformInvoices
} from "../services/saasBillingService";

interface SaasBillingViewProps {
  academies: Academy[];
  students: Student[];
  onNavigateToAcademy?: (academyId: string) => void;
}

export default function SaasBillingView({
  academies,
  students,
  onNavigateToAcademy
}: SaasBillingViewProps) {
  const [invoices, setInvoices] = useState<SaasPlatformInvoice[]>(() => {
    const saved = localStorage.getItem("bjj_saas_invoices");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialSaasPlatformInvoices;
      }
    }
    return initialSaasPlatformInvoices;
  });

  const [selectedInvoice, setSelectedInvoice] = useState<SaasPlatformInvoice | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"invoices" | "calculator" | "audit">("invoices");
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Custom sending parameters
  const [sendChannel, setSendChannel] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [customPhone, setCustomPhone] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Calculator state
  const [simAcademiesCount, setSimAcademiesCount] = useState<number>(25);
  const [simAvgStudentsPerAcademy, setSimAvgStudentsPerAcademy] = useState<number>(130);

  // Synchronize state to localStorage
  const saveInvoices = (newInvoices: SaasPlatformInvoice[]) => {
    setInvoices(newInvoices);
    localStorage.setItem("bjj_saas_invoices", JSON.stringify(newInvoices));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copiado para a área de transferência!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Compute live overview
  const totalAcademies = academies.length;
  const activeAcademies = academies.filter(a => a.status !== "Suspended").length;
  
  // Real active students in current DB
  const totalActiveStudentsInSystem = students.filter(s => s.status === "Active").length;

  const totalProjected = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalReceived = invoices.filter(i => i.status === "PAID").reduce((acc, inv) => acc + inv.amount, 0);
  const totalPending = invoices.filter(i => i.status === "PENDING").reduce((acc, inv) => acc + inv.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "OVERDUE").reduce((acc, inv) => acc + inv.amount, 0);

  // Handler to recalculate/generate an invoice for an academy with real active student count
  const handleRecalculateInvoice = (academy: Academy) => {
    const academyActiveStudents = students.filter(s => s.academyId === academy.id && s.status === "Active").length;
    const studentCount = academyActiveStudents > 0 ? academyActiveStudents : (academy.activeStudents || 50);
    
    const billing = calculateAcademySaasBilling(studentCount);
    
    const existingIndex = invoices.findIndex(i => i.academyId === academy.id);
    const updatedInvoice: SaasPlatformInvoice = {
      id: existingIndex >= 0 ? invoices[existingIndex].id : `saas-inv-${Date.now()}`,
      academyId: academy.id,
      academyName: academy.name,
      unit: academy.unit,
      ownerName: existingIndex >= 0 ? invoices[existingIndex].ownerName : "Mestre / Gestor Titular",
      ownerPhone: existingIndex >= 0 ? invoices[existingIndex].ownerPhone : "+55 11 98888-0000",
      ownerEmail: existingIndex >= 0 ? invoices[existingIndex].ownerEmail : `gestao@${academy.subdomain || 'academia'}.com.br`,
      invoiceMonth: "Agosto/2026",
      activeStudentsCount: studentCount,
      fixedFee: billing.fixedFee,
      perStudentFee: billing.perStudentFee,
      variableAmount: billing.variableAmount,
      amount: billing.amount,
      dueDate: "2026-09-10",
      status: existingIndex >= 0 ? invoices[existingIndex].status : "PENDING",
      billingType: "PIX",
      pixCopiaECola: `00020126580014br.gov.bcb.pix0136bjjacademy-${academy.id}-${Date.now().toString(36)}5204000053039865802BR5919BJJ ACADEMY SAAS6009SAO PAULO62070503***6304${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
      pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014br.gov.bcb.pix0136bjjacademy-${academy.id}`,
      pdfUrl: `https://bjjacademy.app.br/invoices/${academy.id}.pdf`,
      bankSlipUrl: `https://bjjacademy.app.br/boletos/${academy.id}`,
      notes: `Recalculado em tempo real: R$ 130 fixo + (${studentCount} alunos × R$ 1,30 = R$ ${billing.variableAmount.toFixed(2)})`
    };

    let newInvoices: SaasPlatformInvoice[];
    if (existingIndex >= 0) {
      newInvoices = [...invoices];
      newInvoices[existingIndex] = updatedInvoice;
    } else {
      newInvoices = [updatedInvoice, ...invoices];
    }

    saveInvoices(newInvoices);
    showToast(`Fatura de ${academy.name} recalculada: R$ ${billing.amount.toFixed(2)} (${studentCount} alunos ativos).`);
  };

  // Batch generate/recalculate all academies
  const handleRecalculateAll = () => {
    const updated = academies.map(ac => {
      const activeCount = students.filter(s => s.academyId === ac.id && s.status === "Active").length || ac.activeStudents || 50;
      const billing = calculateAcademySaasBilling(activeCount);
      const existing = invoices.find(i => i.academyId === ac.id);

      return {
        id: existing ? existing.id : `saas-inv-${ac.id}`,
        academyId: ac.id,
        academyName: ac.name,
        unit: ac.unit,
        ownerName: existing?.ownerName || "Mestre / Gestor Titular",
        ownerPhone: existing?.ownerPhone || "+55 11 98888-0000",
        ownerEmail: existing?.ownerEmail || `contato@${ac.subdomain || 'bjj'}.com.br`,
        invoiceMonth: "Agosto/2026",
        activeStudentsCount: activeCount,
        fixedFee: billing.fixedFee,
        perStudentFee: billing.perStudentFee,
        variableAmount: billing.variableAmount,
        amount: billing.amount,
        dueDate: "2026-09-10",
        status: existing?.status || "PENDING",
        billingType: existing?.billingType || "PIX",
        pixCopiaECola: existing?.pixCopiaECola || `00020126580014br.gov.bcb.pix0136bjjacademy-${ac.id}5204000053039865802BR5919BJJ ACADEMY SAAS6009SAO PAULO62070503***6304E1A0`,
        pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014br.gov.bcb.pix0136bjjacademy-${ac.id}`,
        lastSentAt: existing?.lastSentAt,
        sentChannel: existing?.sentChannel,
        notes: `Sincronizado com ${activeCount} alunos ativos.`
      } as SaasPlatformInvoice;
    });

    saveInvoices(updated);
    showToast("Todas as faturas foram recalculadas com base nos alunos ativos!");
  };

  const handleUpdateStatus = (invoiceId: string, newStatus: SaasInvoiceStatus) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: newStatus,
          paymentDate: newStatus === "PAID" ? new Date().toISOString() : undefined
        };
      }
      return inv;
    });
    saveInvoices(updated);
    showToast(`Status da fatura alterado para: ${newStatus}`);
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleOpenSendModal = (invoice: SaasPlatformInvoice) => {
    setSelectedInvoice(invoice);
    setCustomPhone(invoice.ownerPhone || "");
    setCustomEmail(invoice.ownerEmail || "");
    setIsSendModalOpen(true);
  };

  const handleDispatchInvoice = () => {
    if (!selectedInvoice) return;
    setIsSending(true);

    setTimeout(() => {
      const now = new Date().toISOString();
      const updated = invoices.map(inv => {
        if (inv.id === selectedInvoice.id) {
          return {
            ...inv,
            ownerPhone: customPhone || inv.ownerPhone,
            ownerEmail: customEmail || inv.ownerEmail,
            lastSentAt: now,
            sentChannel: sendChannel
          };
        }
        return inv;
      });

      saveInvoices(updated);
      setIsSending(false);
      setIsSendModalOpen(false);
      showToast(`Cobrança enviada com sucesso para ${selectedInvoice.academyName} via ${sendChannel}!`);
    }, 900);
  };

  const handleOpenDetailsModal = (invoice: SaasPlatformInvoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
  };

  // Calculator calculations
  const simTotalStudents = simAcademiesCount * simAvgStudentsPerAcademy;
  const simFixedRevenue = simAcademiesCount * SAAS_FIXED_FEE;
  const simVariableRevenue = simTotalStudents * SAAS_PER_STUDENT_FEE;
  const simTotalMonthlyRevenue = simFixedRevenue + simVariableRevenue;
  const simAnnualRevenue = simTotalMonthlyRevenue * 12;

  return (
    <div className="space-y-6" id="saas-billing-view">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Master Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/70 border border-blue-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-mono font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel Master — Super Admin
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
              Faturamento da Plataforma BJJ Academy
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Gestão financeira centralizada do SaaS. Controle a cobrança mensal das academias contratantes com taxa fixa de <strong className="text-white">R$ 130,00</strong> + <strong className="text-blue-300">R$ 1,30 por aluno ativo</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRecalculateAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
              Recalcular Todas em Lote
            </button>
            <div className="bg-blue-600/20 border border-blue-400/40 rounded-xl px-4 py-2 text-right">
              <span className="text-[10px] text-blue-300 font-mono uppercase block">Modelo de Cobrança</span>
              <span className="text-xs text-white font-bold">R$ 130 fixo + R$ 1,30/aluno</span>
            </div>
          </div>
        </div>

        {/* Master Ascii-Inspired Summary Card Box */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Academias Ativas</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white font-display">
              {activeAcademies} <span className="text-xs text-slate-400 font-normal font-sans">/ {totalAcademies} cadastradas</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> 100% integradas
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Alunos no Tatame</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-display">
              {totalActiveStudentsInSystem.toLocaleString("pt-BR")}
            </div>
            <div className="text-[11px] text-blue-300 mt-1 font-mono">
              × R$ 1,30 = R$ {(totalActiveStudentsInSystem * 1.30).toFixed(2).replace(".", ",")}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-4 shadow-inner bg-gradient-to-br from-blue-950/40 to-slate-900">
            <div className="flex items-center justify-between text-blue-300 text-xs font-medium mb-1">
              <span>Faturamento Previsto</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400 font-display">
              R$ {totalProjected.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Mês ref. Agosto/2026
            </div>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-inner bg-gradient-to-br from-emerald-950/40 to-slate-900">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-medium mb-1">
              <span>Total Recebido</span>
              <CheckCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-display">
              R$ {totalReceived.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">
              {totalProjected > 0 ? `${((totalReceived / totalProjected) * 100).toFixed(1)}% liquidado` : "0%"}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-inner bg-gradient-to-br from-amber-950/40 to-slate-900">
            <div className="flex items-center justify-between text-amber-300 text-xs font-medium mb-1">
              <span>Total Pendente</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-display">
              R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-amber-300/80 mt-1">
              Vencimento até 10/09
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs for Master */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSelectedTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedTab === "invoices"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Faturas & Cobranças por Academia
        </button>
        <button
          onClick={() => setSelectedTab("calculator")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedTab === "calculator"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Calculator className="w-4 h-4" />
          Simulador de Escala & MRR
        </button>
      </div>

      {/* TAB 1: INVOICES TABLE & DIRECT ACTIONS */}
      {selectedTab === "invoices" && (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Relação de Faturas Mensais das Academias Contratantes
              </h2>
              <p className="text-xs text-slate-400">
                Detalhamento exato da taxa de R$ 130,00 fixo + R$ 1,30 por aluno ativo de cada cliente SaaS.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Competência:</span>
              <span className="text-xs bg-slate-900 text-blue-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700">
                Agosto/2026
              </span>
            </div>
          </div>

          {/* Master Responsive Invoices Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Academia / Unidade</th>
                  <th className="py-3.5 px-4 text-center">Alunos Ativos</th>
                  <th className="py-3.5 px-4 text-right">Taxa Fixa</th>
                  <th className="py-3.5 px-4 text-right">Alunos (× R$ 1,30)</th>
                  <th className="py-3.5 px-4 text-right">Total Mensal</th>
                  <th className="py-3.5 px-4 text-center">Vencimento</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Último Envio</th>
                  <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => {
                  const matchingAcademy = academies.find(a => a.id === inv.academyId);
                  const isPaid = inv.status === "PAID";
                  const isPending = inv.status === "PENDING";
                  const isOverdue = inv.status === "OVERDUE";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {inv.academyName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{inv.unit}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-300">{inv.ownerName || "Mestre Titular"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-blue-300 font-bold font-mono">
                          {inv.activeStudentsCount} alunos
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-300">
                        R$ {inv.fixedFee.toFixed(2).replace(".", ",")}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-indigo-300 font-medium">
                        R$ {inv.variableAmount.toFixed(2).replace(".", ",")}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-white font-mono text-sm bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-500/20">
                          R$ {inv.amount.toFixed(2).replace(".", ",")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        {inv.dueDate ? new Date(inv.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "10/09/2026"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Pago 🟢
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Pendente 🟡
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Atrasado 🔴
                          </span>
                        )}
                        {inv.status === "CANCELLED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[11px]">
                            Cancelado ⚪
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center text-[11px]">
                        {inv.lastSentAt ? (
                          <div className="text-slate-400 font-mono">
                            <span className="text-blue-400 font-bold flex items-center justify-center gap-1">
                              {inv.sentChannel === "WHATSAPP" ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                              {inv.sentChannel}
                            </span>
                            <span>{new Date(inv.lastSentAt).toLocaleDateString("pt-BR")}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Não enviado</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetailsModal(inv)}
                            title="Ver detalhes e extrato de alunos"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {matchingAcademy && (
                            <button
                              onClick={() => handleRecalculateInvoice(matchingAcademy)}
                              title="Recalcular com base nos alunos ativos atuais"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenSendModal(inv)}
                            title="Enviar fatura via WhatsApp / E-mail"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-md shadow-blue-600/20 transition-all"
                          >
                            <Send className="w-3 h-3" />
                            {inv.lastSentAt ? "Reenviar" : "Enviar"}
                          </button>

                          {isPending && (
                            <button
                              onClick={() => handleUpdateStatus(inv.id, "PAID")}
                              title="Marcar como pago (baixa manual)"
                              className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isPaid && (
                            <button
                              onClick={() => handleUpdateStatus(inv.id, "PENDING")}
                              title="Reabrir fatura"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Model Transparency Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-400/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-200 font-bold block">Como funciona o cálculo automático do BJJ Academy?</span>
                <span>Fórmula: <strong className="text-white">R$ 130,00</strong> (taxa fixa de infraestrutura, IA Gemini e aplicativo) + (<strong className="text-white">Nº de Alunos Ativos × R$ 1,30</strong>).</span>
              </div>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-slate-400">Exemplo 100 alunos:</span>
              <span className="font-mono font-bold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                R$ 130 + R$ 130 = R$ 260,00/mês
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCALE & REVENUE SIMULATOR (CALCULADORA DE MRR) */}
      {selectedTab === "calculator" && (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              Simulador de Projeção e Escala SaaS
            </h2>
            <p className="text-xs text-slate-400">
              Projete a receita mensal (MRR) e anual (ARR) da sua plataforma BJJ Academy conforme novas academias forem contratando o sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2">
                  <span>Quantidade de Academias Contratantes:</span>
                  <span className="text-blue-400 font-mono text-sm">{simAcademiesCount} academias</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={simAcademiesCount}
                  onChange={(e) => setSimAcademiesCount(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>1</span>
                  <span>50</span>
                  <span>100</span>
                  <span>200 academias</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2">
                  <span>Média de Alunos Ativos por Academia:</span>
                  <span className="text-indigo-400 font-mono text-sm">{simAvgStudentsPerAcademy} alunos</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="400"
                  step="5"
                  value={simAvgStudentsPerAcademy}
                  onChange={(e) => setSimAvgStudentsPerAcademy(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>20</span>
                  <span>100</span>
                  <span>200</span>
                  <span>400 alunos</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Total de Atletas no Ecossistema:</span>
                  <strong className="text-white font-mono">{simTotalStudents.toLocaleString("pt-BR")} alunos</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Receita Fixa ({simAcademiesCount} × R$ 130):</span>
                  <strong className="text-slate-300 font-mono">R$ {simFixedRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Receita Variável ({simTotalStudents.toLocaleString("pt-BR")} × R$ 1,30):</span>
                  <strong className="text-indigo-300 font-mono">R$ {simVariableRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="bg-gradient-to-br from-blue-950/60 via-slate-900 to-indigo-950/60 p-6 rounded-2xl border border-blue-500/30 space-y-4 shadow-xl">
                <div className="text-xs text-blue-300 font-mono uppercase tracking-wider">
                  Faturamento Recorrente Mensal (MRR)
                </div>
                <div className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                  R$ {simTotalMonthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm font-sans font-normal text-slate-400 ml-2">/mês</span>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Projeção Anualizada (ARR)</span>
                    <span className="text-xl font-bold text-emerald-400 font-display">
                      R$ {simAnnualRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Ticket Médio por Academia</span>
                    <span className="text-sm font-bold text-white font-mono">
                      R$ {(simTotalMonthlyRevenue / simAcademiesCount).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>Cobrança 100% automatizada no Asaas via PIX, Boleto e Cartão de Crédito recorrente com emissão de nota fiscal.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ENVIAR COBRANÇA INDIVIDUALMENTE (WHATSAPP / EMAIL) */}
      {isSendModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-blue-500/40 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsSendModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono font-bold">
                <Send className="w-3 h-3" /> Disparo Individual de Fatura
              </div>
              <h3 className="text-xl font-bold text-white font-display">
                Enviar Cobrança — {selectedInvoice.academyName}
              </h3>
              <p className="text-xs text-slate-400">
                A cobrança contém somente os dados da academia selecionada, preservando sigilo multi-tenant.
              </p>
            </div>

            {/* Live Message Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Pré-visualização da Mensagem Oficial:
                </span>
                <button
                  onClick={() => handleCopy(generateSaasInvoiceMessage(selectedInvoice), "msg-preview")}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                >
                  {copiedKey === "msg-preview" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-blue-400" />}
                  Copiar Texto
                </button>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {generateSaasInvoiceMessage(selectedInvoice)}
              </div>
            </div>

            {/* Destination inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Canal de Envio:</label>
                <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSendChannel("WHATSAPP")}
                    className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 ${
                      sendChannel === "WHATSAPP"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendChannel("EMAIL")}
                    className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 ${
                      sendChannel === "EMAIL"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    E-mail
                  </button>
                </div>
              </div>

              {sendChannel === "WHATSAPP" ? (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">WhatsApp do Mestre / Gestor:</label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="+55 11 99999-8888"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">E-mail Financeiro:</label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="financeiro@academia.com.br"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                disabled={isSending}
                onClick={handleDispatchInvoice}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Disparando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Cobrança Agora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETALHES DA FATURA & EXTRATO DE ALUNOS ATIVOS */}
      {isDetailsModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono font-bold">
                <Building2 className="w-3.5 h-3.5" /> Extrato Detalhado do Cliente SaaS
              </div>
              <h3 className="text-xl font-bold text-white font-display">
                {selectedInvoice.academyName}
              </h3>
              <p className="text-xs text-slate-400">
                Unidade: {selectedInvoice.unit} • Mês: {selectedInvoice.invoiceMonth}
              </p>
            </div>

            {/* Breakdown card */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Memória de Cálculo da Mensalidade
              </h4>
              
              <div className="space-y-2 text-xs divide-y divide-slate-800/80">
                <div className="flex justify-between py-1.5 text-slate-300">
                  <span>1. Taxa Fixa de Plataforma (Servidores + Whitelabel + IA):</span>
                  <strong className="text-white font-mono">R$ {selectedInvoice.fixedFee.toFixed(2).replace(".", ",")}</strong>
                </div>
                <div className="flex justify-between py-1.5 text-slate-300">
                  <span>2. Variável por Aluno Ativo ({selectedInvoice.activeStudentsCount} alunos × R$ 1,30):</span>
                  <strong className="text-indigo-300 font-mono">R$ {selectedInvoice.variableAmount.toFixed(2).replace(".", ",")}</strong>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold text-white">
                  <span>TOTAL FATURADO NO MÊS:</span>
                  <span className="text-blue-400 font-mono text-base">R$ {selectedInvoice.amount.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Status do Pagamento:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-display">
                    {selectedInvoice.status === "PAID" ? "🟢 Pago e Liquidado" : "🟡 Pendente de Pagamento"}
                  </span>
                </div>
                {selectedInvoice.paymentDate && (
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    Pago em: {new Date(selectedInvoice.paymentDate).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Vencimento:</span>
                <span className="text-sm font-bold text-white font-mono block">
                  {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "10/09/2026"}
                </span>
                <span className="text-[10px] text-slate-500 block">Cobrança gerada via Asaas Subcontas</span>
              </div>
            </div>

            {/* PIX Copia e Cola */}
            {selectedInvoice.pixCopiaECola && (
              <div className="space-y-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    PIX Copia e Cola da Fatura:
                  </span>
                  <button
                    onClick={() => handleCopy(selectedInvoice.pixCopiaECola || "", "pix-code")}
                    className="text-blue-400 hover:text-blue-300 font-medium text-[11px] flex items-center gap-1"
                  >
                    {copiedKey === "pix-code" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copiar Código PIX
                  </button>
                </div>
                <p className="font-mono text-[10px] text-slate-300 bg-slate-950 p-2.5 rounded-xl break-all border border-slate-800">
                  {selectedInvoice.pixCopiaECola}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
