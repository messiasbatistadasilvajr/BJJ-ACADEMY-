import React, { useState } from "react";
import { 
  PaymentHistory, Student, Academy, AsaasWebhookEvent, PaymentProvider, 
  PaymentBillingType, SubscriptionPlan, AccountsPayable, AccountsReceivable, 
  AuditLog, GatewayAdapterConfig, UserRole, SaasPlatformInvoice
} from "../types";
import { 
  CreditCard, TrendingUp, DollarSign, ArrowUpRight, 
  Clock, ShieldAlert, Sparkles, Send, Copy, Check, Users, X,
  QrCode, CheckCircle, Building2, Heart, FileText, RefreshCw, Settings,
  Link as LinkIcon, AlertTriangle, Zap, Calendar, Sliders, Eye, UserPlus, FileCheck,
  PauseCircle, PlayCircle, Ban, Layers, ShieldCheck, Database, Code, FileSpreadsheet,
  Download, ArrowDownRight, Tag, Shield, Terminal, CheckSquare, PlusCircle
} from "lucide-react";

interface FinanceViewProps {
  payments: PaymentHistory[];
  students: Student[];
  academies?: Academy[];
  onAddPayment: (pay: Omit<PaymentHistory, "id" | "academyId">) => void;
  onSendInvoiceAlert: (student: Student) => void;
  onAddStudent?: (student: Omit<Student, "id">) => void;
  onUpdateStudent?: (student: Student) => void;
}

export default function FinanceView({
  payments,
  students,
  academies = [],
  onAddPayment,
  onSendInvoiceAlert,
  onAddStudent,
  onUpdateStudent
}: FinanceViewProps) {
  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<
    "dashboard" | "subscriptions" | "asaas-gateway" | "accounts" | "audit" | "api-docs" | "saas"
  >("dashboard");

  // Multi-Tenant Academy Filter
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>("ALL");

  // User Role (RBAC Simulator)
  const [currentRole, setCurrentRole] = useState<UserRole>("GESTOR_ACADEMIA");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // BJJ Academy SaaS Platform Master Invoices (Licenciamento do Software cobrado das Academias Contratantes)
  const [saasInvoices, setSaasInvoices] = useState<SaasPlatformInvoice[]>([
    {
      id: "saas-inv-101",
      academyId: "ac-1",
      academyName: "Gracie Barra",
      unit: "Barra da Tijuca",
      planName: "Pro SaaS",
      amount: 350,
      dueDate: "2026-08-10",
      status: "PAID",
      paymentDate: "2026-08-01",
      billingType: "PIX",
      pixCopiaECola: "00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/saas_ac1_350_48123910",
      asaasInvoiceId: "pay_saas_gracie_350"
    },
    {
      id: "saas-inv-102",
      academyId: "ac-2",
      academyName: "Alliance",
      unit: "São Paulo Moema",
      planName: "Enterprise SaaS",
      amount: 450,
      dueDate: "2026-08-15",
      status: "PENDING",
      billingType: "PIX",
      pixCopiaECola: "00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/saas_ac2_450_99123841",
      asaasInvoiceId: "pay_saas_alliance_450"
    },
    {
      id: "saas-inv-103",
      academyId: "ac-3",
      academyName: "Atos BJJ",
      unit: "San Diego / SP HQ",
      planName: "Pro SaaS",
      amount: 350,
      dueDate: "2026-08-05",
      status: "OVERDUE",
      billingType: "BOLETO",
      pixCopiaECola: "00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/saas_ac3_350_77123901",
      asaasInvoiceId: "pay_saas_atos_350"
    }
  ]);

  const [showCreateSaasModal, setShowCreateSaasModal] = useState(false);
  const [newSaasForm, setNewSaasForm] = useState({
    academyId: "ac-1",
    planName: "Pro SaaS" as SaasPlatformInvoice["planName"],
    amount: "350",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    billingType: "PIX" as PaymentBillingType
  });

  // Gateway Adapters Config State (Strategy Pattern)
  const [gateways, setGateways] = useState<GatewayAdapterConfig[]>([
    {
      id: "gw-asaas",
      provider: "Asaas",
      name: "Asaas Financial API v3",
      isActive: true,
      adapterClass: "AsaasGatewayAdapter",
      supportedMethods: ["PIX", "BOLETO", "CREDIT_CARD"],
      environment: "sandbox",
      apiKey: "$asaas_api_key_live_98123749123847192",
      webhookSecret: "wh_tok_bjj_academy_2026_sec",
      autoReconcile: true,
      multaPercent: 2.0,
      jurosPercent: 0.033,
      discountEarlyPercent: 5.0
    },
    {
      id: "gw-mercadopago",
      provider: "Mercado Pago",
      name: "Mercado Pago SDK v2",
      isActive: false,
      adapterClass: "MercadoPagoGatewayAdapter",
      supportedMethods: ["PIX", "CREDIT_CARD"],
      environment: "sandbox",
      apiKey: "APP_USR-7819238120391203",
      webhookSecret: "mp_wh_sec_991203",
      autoReconcile: true,
      multaPercent: 2.0,
      jurosPercent: 0.033,
      discountEarlyPercent: 0.0
    },
    {
      id: "gw-stripe",
      provider: "Stripe",
      name: "Stripe Billing Connect",
      isActive: false,
      adapterClass: "StripeGatewayAdapter",
      supportedMethods: ["CREDIT_CARD"],
      environment: "sandbox",
      apiKey: "sk_test_51Mz239810239102",
      webhookSecret: "whsec_stripe_88123712",
      autoReconcile: true,
      multaPercent: 2.0,
      jurosPercent: 0.033,
      discountEarlyPercent: 0.0
    }
  ]);

  // Accounts Payable State (Contas a Pagar)
  const [accountsPayable, setAccountsPayable] = useState<AccountsPayable[]>([
    {
      id: "ap-1",
      academyId: "ac-1",
      description: "Aluguel Galpão Tatame Principal",
      category: "Aluguel Tatame",
      supplier: "Imobiliária Central SP",
      amount: 4500,
      dueDate: "2026-07-28",
      status: "PENDING",
      notes: "Vencimento todo dia 28"
    },
    {
      id: "ap-2",
      academyId: "ac-1",
      description: "Folha Pagamento - Professores Black Belt",
      category: "Salários Professores",
      supplier: "Professores BJJ Alliance",
      amount: 8200,
      dueDate: "2026-07-30",
      status: "PENDING"
    },
    {
      id: "ap-3",
      academyId: "ac-1",
      description: "Servidor Cloud AWS & Software BJJ SaaS",
      category: "Software SaaS",
      supplier: "BJJ Academy SaaS Corp",
      amount: 350,
      dueDate: "2026-07-15",
      paymentDate: "2026-07-14",
      status: "PAID"
    },
    {
      id: "ap-4",
      academyId: "ac-2",
      description: "Luz e Ar Condicionado do Tatame",
      category: "Luz e Água",
      supplier: "Enel Distribuição",
      amount: 1120,
      dueDate: "2026-07-20",
      status: "OVERDUE"
    }
  ]);

  // Audit Trail Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "aud-101",
      academyId: "ac-1",
      timestamp: new Date(Date.now() - 3600000).toLocaleString("pt-BR"),
      userName: "Professor Gabriel (Gestor)",
      userRole: "GESTOR_ACADEMIA",
      action: "PROCESS_WEBHOOK",
      entity: "AsaasInvoice",
      entityId: "pay_982138910",
      details: "Webhook Asaas: Pagamento de R$ 200,00 liquidado via PIX para Carlos Eduardo.",
      ipAddress: "187.54.210.12"
    },
    {
      id: "aud-102",
      academyId: "ac-1",
      timestamp: new Date(Date.now() - 7200000).toLocaleString("pt-BR"),
      userName: "Fernanda Financeiro",
      userRole: "FINANCEIRO",
      action: "UPDATE_GATEWAY",
      entity: "GatewayAdapter",
      entityId: "gw-asaas",
      details: "Regras de Cobrança atualizadas: Multa 2.0% e Juros 0.033%/dia configurados no Asaas.",
      ipAddress: "177.12.89.44"
    },
    {
      id: "aud-103",
      academyId: "ac-1",
      timestamp: new Date(Date.now() - 14400000).toLocaleString("pt-BR"),
      userName: "Sistema Automático Asaas",
      userRole: "ADMIN_MASTER",
      action: "CREATE_SUBSCRIPTION",
      entity: "AsaasSubscription",
      entityId: "sub_10091823",
      details: "Nova assinatura recorrente Anual gerada para Beatriz Oliveira no valor de R$ 180,00/mês.",
      ipAddress: "52.91.104.22"
    }
  ]);

  // Asaas Webhook Events Log State
  const [webhookLogs, setWebhookLogs] = useState<AsaasWebhookEvent[]>([
    {
      id: "wh-101",
      event: "PAYMENT_RECEIVED",
      timestamp: new Date(Date.now() - 3600000).toLocaleString("pt-BR"),
      invoiceId: "pay_982138910",
      studentName: "Carlos Eduardo",
      academyName: "Alliance São Paulo",
      value: 200,
      billingType: "PIX",
      payload: { event: "PAYMENT_RECEIVED", payment: { id: "pay_982138910", status: "RECEIVED", value: 200 } },
      status: "PROCESSED"
    },
    {
      id: "wh-102",
      event: "PAYMENT_OVERDUE",
      timestamp: new Date(Date.now() - 86400000).toLocaleString("pt-BR"),
      invoiceId: "pay_481203912",
      studentName: "Guilherme Silva",
      academyName: "Alliance São Paulo",
      value: 220,
      billingType: "BOLETO",
      payload: { event: "PAYMENT_OVERDUE", payment: { id: "pay_481203912", status: "OVERDUE", value: 220 } },
      status: "PROCESSED"
    }
  ]);

  // Modal States
  const [showNewAsaasStudentModal, setShowNewAsaasStudentModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddPayableModal, setShowAddPayableModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<AsaasWebhookEvent | null>(null);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [selectedStudentForPayNow, setSelectedStudentForPayNow] = useState<Student | null>(null);
  const [selectedStudentForBoleto, setSelectedStudentForBoleto] = useState<Student | null>(null);
  const [thankYouModalData, setThankYouModalData] = useState<{
    studentName: string;
    academyName: string;
    amount: number;
    date: string;
    phone?: string;
  } | null>(null);

  // New Student Form State
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    cpf: "",
    phone: "",
    email: "",
    plan: "Mensal" as SubscriptionPlan,
    planValue: 220,
    billingType: "PIX" as PaymentBillingType,
    belt: "White" as Student["belt"],
    academyId: academies[0]?.id || "ac-1"
  });

  // New Payable Form State
  const [newPayableForm, setNewPayableForm] = useState<{
    description: string;
    category: AccountsPayable["category"];
    supplier: string;
    amount: number;
    dueDate: string;
    academyId: string;
  }>({
    description: "",
    category: "Aluguel Tatame",
    supplier: "",
    amount: 500,
    dueDate: new Date().toISOString().split("T")[0],
    academyId: academies[0]?.id || "ac-1"
  });

  // Pay Now Modal State
  const [pixAmount, setPixAmount] = useState<number>(220);
  const [pixGeneratedCode, setPixGeneratedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Helper Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch (e) {
      console.log("Clipboard write fallback");
    }
  };

  // Add Audit Log Entry
  const pushAudit = (
    action: AuditLog["action"],
    entity: string,
    entityId: string,
    details: string
  ) => {
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      academyId: selectedAcademyId === "ALL" ? (academies[0]?.id || "ac-1") : selectedAcademyId,
      timestamp: new Date().toLocaleString("pt-BR"),
      userName: currentRole === "ADMIN_MASTER" ? "Master Admin" : currentRole === "GESTOR_ACADEMIA" ? "Gestor da Academia" : "Operador Financeiro",
      userRole: currentRole,
      action,
      entity,
      entityId,
      details,
      ipAddress: "187.54.210." + Math.floor(Math.random() * 200 + 10)
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Filter students and payments based on tenant selection
  const filteredStudents = selectedAcademyId === "ALL" 
    ? students 
    : students.filter(s => s.academyId === selectedAcademyId);

  const filteredPayments = selectedAcademyId === "ALL"
    ? payments
    : payments.filter(p => {
        const student = students.find(s => s.id === p.studentId);
        return student ? student.academyId === selectedAcademyId : true;
      });

  const filteredPayables = selectedAcademyId === "ALL"
    ? accountsPayable
    : accountsPayable.filter(ap => ap.academyId === selectedAcademyId);

  // KPIs Calculations
  const compliantCount = filteredStudents.filter(s => s.paymentStatus === "Paid").length;
  const overdueCount = filteredStudents.filter(s => s.paymentStatus === "Overdue").length;
  
  const totalRevenueMonth = filteredPayments
    .filter(p => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayablesMonth = filteredPayables
    .filter(ap => ap.status === "PENDING" || ap.status === "OVERDUE")
    .reduce((sum, ap) => sum + ap.amount, 0);

  const netCashFlow = totalRevenueMonth - totalPayablesMonth;
  const mrrValue = filteredStudents.reduce((sum, s) => sum + (s.planValue || 220), 0);
  const arrValue = mrrValue * 12;

  const generatePixCodeForStudent = (student: Student) => {
    const randomTxId = Math.random().toString(36).substring(2, 17).toUpperCase();
    return "00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/pay_" + randomTxId;
  };

  const handleOpenPayNow = (student?: Student) => {
    const target = student || filteredStudents[0];
    if (!target) {
      triggerToast("Nenhum aluno cadastrado para efetuar cobrança.");
      return;
    }
    setSelectedStudentForPayNow(target);
    setPixGeneratedCode(generatePixCodeForStudent(target));
    setCopied(false);
    setShowPayNowModal(true);
  };

  const handleConfirmPayNow = () => {
    if (!selectedStudentForPayNow) return;

    const amountPaid = pixAmount || 220;

    onAddPayment({
      studentId: selectedStudentForPayNow.id,
      studentName: selectedStudentForPayNow.name,
      amount: amountPaid,
      date: new Date().toISOString().split("T")[0],
      status: "Paid",
      method: "PIX",
    });

    if (onUpdateStudent) {
      onUpdateStudent({
        ...selectedStudentForPayNow,
        paymentStatus: "Paid",
        status: "Active"
      });
    }

    pushAudit(
      "MANUAL_BAIXA",
      "AsaasInvoice",
      selectedStudentForPayNow.asaasCustomerId || "cus_001",
      `Baixa de R$ ${amountPaid},00 realizada com sucesso via PIX Asaas para ${selectedStudentForPayNow.name}.`
    );

    setShowPayNowModal(false);

    setThankYouModalData({
      studentName: selectedStudentForPayNow.name,
      academyName: academies.find(a => a.id === selectedStudentForPayNow.academyId)?.name || "Alliance SP",
      amount: amountPaid,
      date: new Date().toLocaleDateString("pt-BR"),
      phone: selectedStudentForPayNow.phone,
    });

    triggerToast(`Pagamento Asaas de ${selectedStudentForPayNow.name} confirmado com sucesso!`);
  };

  // Subscription Actions: Pause, Resume, Cancel
  const handleSubscriptionAction = (student: Student, action: "PAUSE" | "RESUME" | "CANCEL") => {
    let newStatus: Student["paymentStatus"] = student.paymentStatus;
    let studentStatus: Student["status"] = student.status;
    let auditAction: AuditLog["action"] = "PAUSE_SUBSCRIPTION";
    let message = "";

    if (action === "PAUSE") {
      newStatus = "Pending";
      studentStatus = "Inactive";
      auditAction = "PAUSE_SUBSCRIPTION";
      message = `Assinatura Asaas do aluno ${student.name} foi PAUSADA com sucesso.`;
    } else if (action === "RESUME") {
      newStatus = "Paid";
      studentStatus = "Active";
      auditAction = "REACTIVATE_SUBSCRIPTION";
      message = `Assinatura Asaas do aluno ${student.name} foi REATIVADA com sucesso.`;
    } else if (action === "CANCEL") {
      newStatus = "Overdue";
      studentStatus = "Inactive";
      auditAction = "CANCEL_SUBSCRIPTION";
      message = `Assinatura Asaas do aluno ${student.name} foi CANCELADA permanentemente.`;
    }

    if (onUpdateStudent) {
      onUpdateStudent({
        ...student,
        paymentStatus: newStatus,
        status: studentStatus
      });
    }

    pushAudit(auditAction, "AsaasSubscription", student.asaasSubscriptionId || "sub_001", message);
    triggerToast(message);
  };

  // Register Asaas Student
  const handleRegisterAsaasStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name || !newStudentForm.phone) {
      triggerToast("Preencha ao menos o nome e o telefone do aluno.");
      return;
    }

    const generatedCustomerId = `cus_00000${Math.floor(Math.random() * 900000 + 100000)}`;
    const generatedSubId = `sub_${Math.floor(Math.random() * 9000000 + 1000000)}`;

    const newStudentData: Omit<Student, "id"> = {
      academyId: newStudentForm.academyId,
      name: newStudentForm.name,
      email: newStudentForm.email || `${newStudentForm.name.toLowerCase().replace(/\s+/g, '')}@email.com`,
      phone: newStudentForm.phone,
      cpf: newStudentForm.cpf || "123.456.789-00",
      plan: newStudentForm.plan,
      planValue: Number(newStudentForm.planValue),
      belt: newStudentForm.belt,
      stripes: 0,
      attendance30Days: 0,
      daysSinceLastClass: 0,
      status: "Active",
      paymentStatus: "Paid",
      registrationDate: new Date().toISOString().split("T")[0],
      birthDate: "1998-05-10",
      asaasCustomerId: generatedCustomerId,
      asaasSubscriptionId: generatedSubId,
      billingType: newStudentForm.billingType
    };

    if (onAddStudent) {
      onAddStudent(newStudentData);
    }

    onAddPayment({
      studentId: `st-${Date.now()}`,
      studentName: newStudentForm.name,
      amount: Number(newStudentForm.planValue),
      date: new Date().toISOString().split("T")[0],
      status: "Paid",
      method: newStudentForm.billingType
    });

    pushAudit(
      "CREATE_CUSTOMER",
      "AsaasCustomer",
      generatedCustomerId,
      `Aluno ${newStudentForm.name} cadastrado com sucesso no Asaas. Assinatura ${newStudentForm.plan} ativada.`
    );

    setShowNewAsaasStudentModal(false);
    triggerToast(`Aluno ${newStudentForm.name} matriculado com sucesso no Asaas! ID: ${generatedCustomerId}`);
  };

  // Add Accounts Payable Entry
  const handleAddPayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayableForm.description || !newPayableForm.supplier) {
      triggerToast("Preencha a descrição e o fornecedor.");
      return;
    }

    const item: AccountsPayable = {
      id: `ap-${Date.now()}`,
      academyId: newPayableForm.academyId,
      description: newPayableForm.description,
      category: newPayableForm.category,
      supplier: newPayableForm.supplier,
      amount: Number(newPayableForm.amount),
      dueDate: newPayableForm.dueDate,
      status: "PENDING"
    };

    setAccountsPayable(prev => [item, ...prev]);

    pushAudit(
      "ADD_ACCOUNT_PAYABLE",
      "AccountsPayable",
      item.id,
      `Conta a pagar registrada: ${item.description} (R$ ${item.amount},00) para ${item.supplier}.`
    );

    setShowAddPayableModal(false);
    triggerToast(`Despesa "${item.description}" registrada no fluxo de caixa!`);
  };

  // Asaas Webhook Event Simulator
  const handleSimulateWebhook = (eventType: AsaasWebhookEvent["event"]) => {
    const randomStudent = filteredStudents[Math.floor(Math.random() * filteredStudents.length)] || students[0];
    if (!randomStudent) return;

    const invoiceId = `pay_${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const eventTime = new Date().toLocaleString("pt-BR");

    let eventPayload: any = {
      event: eventType,
      payment: {
        id: invoiceId,
        customer: randomStudent.asaasCustomerId || "cus_0000010091",
        subscription: randomStudent.asaasSubscriptionId || "sub_10091823",
        value: randomStudent.planValue || 220,
        netValue: (randomStudent.planValue || 220) * 0.98,
        billingType: randomStudent.billingType || "PIX",
        status: eventType === "PAYMENT_RECEIVED" ? "RECEIVED" : eventType === "PAYMENT_OVERDUE" ? "OVERDUE" : "PENDING",
        dueDate: new Date().toISOString().split("T")[0]
      }
    };

    if (eventType === "PAYMENT_RECEIVED") {
      if (onUpdateStudent) {
        onUpdateStudent({
          ...randomStudent,
          paymentStatus: "Paid",
          status: "Active"
        });
      }
      onAddPayment({
        studentId: randomStudent.id,
        studentName: randomStudent.name,
        amount: randomStudent.planValue || 220,
        date: new Date().toISOString().split("T")[0],
        status: "Paid",
        method: randomStudent.billingType || "PIX"
      });
      triggerToast(`[Asaas Webhook] Notificação de pagamento liquidado para ${randomStudent.name}! Status e caixa atualizados em tempo real.`);
    } else if (eventType === "PAYMENT_OVERDUE") {
      if (onUpdateStudent) {
        onUpdateStudent({
          ...randomStudent,
          paymentStatus: "Overdue",
          status: "ChurnRisk"
        });
      }
      triggerToast(`[Asaas Webhook] Fatura Vencida para ${randomStudent.name}. Régua de cobrança ativada (+Multa 2% e Juros)!`);
    } else {
      triggerToast(`[Asaas Webhook] Evento ${eventType} registrado para ${randomStudent.name}.`);
    }

    const newLog: AsaasWebhookEvent = {
      id: `wh-${Date.now()}`,
      event: eventType,
      timestamp: eventTime,
      invoiceId: invoiceId,
      studentName: randomStudent.name,
      academyName: academies.find(a => a.id === randomStudent.academyId)?.name || "Alliance SP",
      value: randomStudent.planValue || 220,
      billingType: randomStudent.billingType || "PIX",
      payload: eventPayload,
      status: "PROCESSED"
    };

    setWebhookLogs(prev => [newLog, ...prev]);

    pushAudit(
      "PROCESS_WEBHOOK",
      "AsaasWebhook",
      invoiceId,
      `Webhook Asaas [${eventType}] recebido e concordo automaticamente no banco de dados.`
    );
  };

  return (
    <div className="space-y-6 relative" id="finance-saas-suite">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] max-w-md w-full bg-slate-900 border border-emerald-500/40 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-emerald-400 text-lg">💰</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Bar: Multi-Tenant Switcher & RBAC Role Selector */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-display flex items-center gap-2">
              SaaS Financial Hub & Multi-Gateway
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                MULTI-TENANT
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Gestão financeira completa, assinaturas Asaas, DRE, conciliação e auditoria em Clean Architecture.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Tenant Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedAcademyId}
              onChange={(e) => setSelectedAcademyId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todas as Academias (Consolidado)</option>
              {academies.map(ac => (
                <option key={ac.id} value={ac.id} className="bg-slate-900">{ac.name} ({ac.unit})</option>
              ))}
            </select>
          </div>

          {/* RBAC Role Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Shield className="w-4 h-4 text-indigo-400" />
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ADMIN_MASTER" className="bg-slate-900">Perfil: Master Admin (SaaS)</option>
              <option value="GESTOR_ACADEMIA" className="bg-slate-900">Perfil: Gestor da Academia</option>
              <option value="FINANCEIRO" className="bg-slate-900">Perfil: Operador Financeiro</option>
              <option value="PROFESSOR" className="bg-slate-900">Perfil: Professor / Instrutor</option>
              <option value="ALUNO" className="bg-slate-900">Perfil: Aluno / Praticante</option>
            </select>
          </div>
        </div>
      </div>

      {/* High-Level Scope Switcher: Plataforma Master vs Academias Contratantes */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab("dashboard")}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-display text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab !== "saas"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span className="text-sm">🥋</span>
            <span>Financeiro da Academia (Mensalidades dos Alunos & Tatame)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("saas")}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-display text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === "saas"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span className="text-sm">⚡</span>
            <span>Financeiro BJJ Academy Master (Licenças das Academias Contratantes)</span>
            <span className="text-[9px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-mono font-bold">
              PLATAFORMA
            </span>
          </button>
        </div>
      </div>

      {/* Main Sub-Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "dashboard"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard & Fluxo de Caixa</span>
        </button>

        <button
          onClick={() => setActiveSubTab("subscriptions")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "subscriptions"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Zap className="w-4 h-4 text-blue-400" />
          <span>Assinaturas Recorrentes Asaas</span>
          <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-mono">
            {filteredStudents.length} ativas
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("saas")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "saas"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Licenças BJJ Academy (SaaS)</span>
          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 font-mono font-bold">
            Master B2B
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("asaas-gateway")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "asaas-gateway"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Gateways & Adapters (Strategy)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("accounts")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "accounts"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <span>Contas a Pagar e Receber</span>
        </button>

        <button
          onClick={() => setActiveSubTab("audit")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "audit"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Auditoria Completa (Logs)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("api-docs")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "api-docs"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>API REST & Prisma Schema</span>
        </button>
      </div>

      {/* SUB-TAB 1: DASHBOARD & FLUXO DE CAIXA */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Receita Liquidada (Entradas)</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-display">
                {totalRevenueMonth.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <ArrowUpRight className="w-3 h-3" /> Conciliado via Asaas / PIX
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Contas a Pagar (Saídas)</span>
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-rose-400 font-display">
                {totalPayablesMonth.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-[10px] text-rose-400/80 font-mono">
                {filteredPayables.filter(ap => ap.status === "PENDING").length} contas a vencer este mês
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Resultado Líquido do Caixa</span>
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
              <div className={`text-2xl font-bold font-display ${netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {netCashFlow.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Entradas - Saídas no período</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>MRR (Receita Mensal Recorrente)</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 font-display">
                {mrrValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">ARR Projetado: {arrValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            </div>
          </div>

          {/* Quick Actions & Asaas Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Emissão de Cobrança Instantânea via Asaas API
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                    PIX / BOLETO
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Matricule novos praticantes, gere links de pagamento dinâmicos e envie a régua de cobrança automática por WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowNewAsaasStudentModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Matricular Aluno</span>
              </button>

              <button
                onClick={() => handleOpenPayNow()}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Cobrar PIX Agora</span>
              </button>
            </div>
          </div>

          {/* Fluxo de Caixa Recente (Transações Conciliadas) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Extrato de Lançamentos do Caixa & Conciliação Asaas
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Total: {filteredPayments.length} mensalidades</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Aluno / Cliente</th>
                    <th className="p-4">Data</th>
                    <th className="p-4">Forma Cobrança</th>
                    <th className="p-4">Valor Liquidado</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <span className="font-semibold text-slate-200 block">{p.studentName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {p.studentId} | Asaas Pay: {p.asaasInvoiceId || "pay_8812"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-mono">{p.date}</td>
                      <td className="p-4">
                        <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-200">
                        {p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold ${
                          p.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          p.status === "Pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {p.status === "Paid" ? "Compensado" : p.status === "Pending" ? "Aguardando PIX" : "Atrasado / Recusado"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setThankYouModalData({
                              studentName: p.studentName,
                              academyName: academies.find(a => a.id === selectedAcademyId)?.name || "Alliance SP",
                              amount: p.amount,
                              date: p.date
                            });
                          }}
                          className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold underline inline-flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Recibo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ASSINATURAS RECORRENTES ASAAS */}
      {activeSubTab === "subscriptions" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                Gestão de Assinaturas Recorrentes Asaas
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-mono">
                  Ciclos: Mensal, Trimestral, Semestral, Anual
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Acompanhe e gerencie a vida útil das assinaturas dos praticantes (Ativas, Pausadas, Atrasadas e Canceladas).
              </p>
            </div>

            <button
              onClick={() => setShowNewAsaasStudentModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nova Assinatura Recorrente</span>
            </button>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Aluno / CPF</th>
                    <th className="p-4">Plano / Ciclo</th>
                    <th className="p-4">Valor Recorrente</th>
                    <th className="p-4">Forma Pagamento</th>
                    <th className="p-4">Status Financeiro</th>
                    <th className="p-4 text-right">Ações da Assinatura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <span className="font-semibold text-white block">{st.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          CPF: {st.cpf || "123.456.789-00"} | Asaas ID: {st.asaasCustomerId || "cus_001"}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        <span className="font-bold text-slate-100 block">{st.plan || "Mensal"}</span>
                        <span className="text-[10px] text-slate-500">Sub: {st.asaasSubscriptionId || "sub_10091823"}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-200">
                        R$ {st.planValue || 220},00 / mês
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                          {st.billingType || "PIX"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] px-2.5 py-1 rounded font-bold ${
                          st.paymentStatus === "Paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          st.paymentStatus === "Pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {st.paymentStatus === "Paid" ? "ATIVA (EM DIA)" : st.paymentStatus === "Pending" ? "PAUSADA" : "INADIMPLENTE"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {st.paymentStatus === "Paid" ? (
                            <button
                              onClick={() => handleSubscriptionAction(st, "PAUSE")}
                              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[10px] px-2.5 py-1 rounded font-semibold flex items-center gap-1"
                            >
                              <PauseCircle className="w-3 h-3" /> Pausar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSubscriptionAction(st, "RESUME")}
                              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-1 rounded font-semibold flex items-center gap-1"
                            >
                              <PlayCircle className="w-3 h-3" /> Reativar
                            </button>
                          )}

                          <button
                            onClick={() => handleSubscriptionAction(st, "CANCEL")}
                            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[10px] px-2.5 py-1 rounded font-semibold flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" /> Cancelar
                          </button>

                          <button
                            onClick={() => handleOpenPayNow(st)}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2.5 py-1 rounded font-semibold flex items-center gap-1"
                          >
                            <QrCode className="w-3 h-3" /> Cobrar PIX
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GATEWAYS & ADAPTERS (STRATEGY PATTERN) */}
      {activeSubTab === "asaas-gateway" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  Arquitetura Pluggable Gateways (Strategy Pattern)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adicione e configure múltiplos gateways de pagamento por academia sem alterar o código principal da aplicação.
                </p>
              </div>

              <button
                onClick={() => triggerToast("Interface de adição de novo adapter (Mercado Pago, Stripe, Pagar.me) pronta!")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Conectar Novo Gateway
              </button>
            </div>

            {/* Gateway Adapters List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gateways.map((gw) => (
                <div 
                  key={gw.id} 
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    gw.isActive 
                      ? "bg-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-950/20" 
                      : "bg-slate-950/60 border-slate-800 opacity-80"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">{gw.provider}</span>
                      <strong className="text-sm text-white font-bold block mt-0.5">{gw.name}</strong>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      gw.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                    }`}>
                      {gw.isActive ? "ATIVO" : "DESATIVADO"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Adapter Class:</span>
                      <span className="text-indigo-400 font-bold">{gw.adapterClass}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ambiente:</span>
                      <span className="text-amber-400 uppercase">{gw.environment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Multa / Juros:</span>
                      <span className="text-slate-200">{gw.multaPercent}% / {gw.jurosPercent}% ao dia</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Metodos: {gw.supportedMethods.join(", ")}
                    </span>
                    <button
                      onClick={() => setShowConfigModal(true)}
                      className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Settings className="w-3.5 h-3.5" /> Configurar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook Event Trigger Simulator */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Simulador de Webhooks & Notificações do Asaas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simule o recebimento de eventos de webhook do Asaas para testar a conciliação automática.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSimulateWebhook("PAYMENT_RECEIVED")}
                  className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Simular Pagamento Liquidado
                </button>

                <button
                  onClick={() => handleSimulateWebhook("PAYMENT_OVERDUE")}
                  className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Simular Vencimento (Atraso)
                </button>
              </div>
            </div>

            {/* Asaas Webhook Event Log Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Logs de Webhooks Recebidos em Tempo Real</span>
                <span className="text-[10px] text-slate-500 font-normal">{webhookLogs.length} eventos registrados</span>
              </h4>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Data / Hora</th>
                      <th className="p-3">Evento Asaas</th>
                      <th className="p-3">Aluno</th>
                      <th className="p-3">ID Fatura</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Payload JSON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {webhookLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-3 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                        <td className="p-3 font-mono font-bold">
                          <span className={`text-[10px] px-2 py-0.5 rounded ${
                            log.event === "PAYMENT_RECEIVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            log.event === "PAYMENT_OVERDUE" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {log.event}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-200">{log.studentName}</td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">{log.invoiceId}</td>
                        <td className="p-3 font-mono font-bold text-slate-200">R$ {log.value},00</td>
                        <td className="p-3 text-emerald-400 font-mono text-[10px]">{log.status}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedWebhook(log)}
                            className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold underline flex items-center justify-end gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspecionar JSON
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CONTAS A PAGAR E RECEBER */}
      {activeSubTab === "accounts" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div>
              <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                Contas a Pagar (Despesas Operacionais)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gestão completa de fornecedores, aluguel, luz, salários e contas a pagar da academia.
              </p>
            </div>

            <button
              onClick={() => setShowAddPayableModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Registrar Nova Despesa
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Descrição da Despesa</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Fornecedor</th>
                    <th className="p-4">Vencimento</th>
                    <th className="p-4">Valor (R$)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPayables.map((ap) => (
                    <tr key={ap.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 font-semibold text-white">{ap.description}</td>
                      <td className="p-4">
                        <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                          {ap.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{ap.supplier}</td>
                      <td className="p-4 text-slate-400 font-mono">{ap.dueDate}</td>
                      <td className="p-4 font-mono font-bold text-rose-400">
                        {ap.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded font-bold ${
                          ap.status === "PAID" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          ap.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {ap.status === "PAID" ? "PAGO" : ap.status === "PENDING" ? "A VENCER" : "ATRASADO"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {ap.status !== "PAID" && (
                          <button
                            onClick={() => {
                              setAccountsPayable(prev => prev.map(item => item.id === ap.id ? { ...item, status: "PAID", paymentDate: new Date().toISOString().split("T")[0] } : item));
                              triggerToast(`Pagamento da conta "${ap.description}" baixado!`);
                            }}
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-1 rounded font-semibold"
                          >
                            Dar Baixa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: AUDITORIA COMPLETA (AUDIT LOGS) */}
      {activeSubTab === "audit" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                Trilha de Auditoria Imutável (Audit Trail)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Registro de segurança de todas as operações financeiras, alterações de gateway e conciliações de mensalidades.
              </p>
            </div>

            <span className="text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full font-bold">
              {auditLogs.length} logs capturados
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Data / Hora</th>
                    <th className="p-4">Usuário / Perfil</th>
                    <th className="p-4">Operação</th>
                    <th className="p-4">Entidade / ID</th>
                    <th className="p-4">Detalhes da Ação</th>
                    <th className="p-4">IP Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="p-4">
                        <span className="font-semibold text-white block">{log.userName}</span>
                        <span className="text-[9px] text-purple-400 font-mono">{log.userRole}</span>
                      </td>
                      <td className="p-4 font-mono font-bold">
                        <span className="bg-slate-950 border border-slate-800 text-indigo-300 text-[10px] px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-300 text-[11px]">
                        {log.entity} (#{log.entityId})
                      </td>
                      <td className="p-4 text-slate-300 leading-relaxed text-[11px]">
                        {log.details}
                      </td>
                      <td className="p-4 font-mono text-slate-500 text-[10px]">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: API REST & PRISMA SCHEMA */}
      {activeSubTab === "api-docs" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-display">Especificação API REST NestJS & Prisma Schema</h2>
                <p className="text-xs text-slate-400">Documentação interativa OpenAPI/Swagger do módulo financeiro multi-tenant.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {/* REST Endpoints Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <span className="text-indigo-400 font-bold uppercase text-[10px] block">OpenAPI / Swagger Endpoints</span>
                
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">POST</span>
                    <span className="text-slate-200 text-[11px]">/api/v1/finance/asaas/webhook</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Recebe notificações de pagamento e executa conciliação automática.</p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded">POST</span>
                    <span className="text-slate-200 text-[11px]">/api/v1/subscriptions</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Cria uma nova assinatura recorrente no Asaas (PIX/Boleto/Cartão).</p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded">PATCH</span>
                    <span className="text-slate-200 text-[11px]">/api/v1/subscriptions/:id/pause</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Pausa ou cancela a recorrência da mensalidade.</p>
                </div>
              </div>

              {/* Prisma Schema Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs text-slate-300">
                <span className="text-amber-400 font-bold uppercase text-[10px] block">Prisma PostgreSQL Schema (`prisma/schema.prisma`)</span>
                <pre className="p-3 bg-slate-900 rounded-lg text-[10px] text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
{`model Academy {
  id               String   @id @default(uuid())
  name             String
  asaasApiKey      String?
  asaasWebhookTok  String?
  students         Student[]
  subscriptions    Subscription[]
}

model Subscription {
  id               String   @id @default(uuid())
  studentId        String
  academyId        String
  asaasSubId       String   @unique
  planValue        Decimal
  cycle            String   // MONTHLY, YEARLY
  status           String   // ACTIVE, OVERDUE
  createdAt        DateTime @default(now())
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: LICENÇAS BJJ ACADEMY (SAAS PLATFORM MASTER) */}
      {activeSubTab === "saas" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Banner Explicativo Arquitetura Dupla */}
          <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  Gestão de Licenciamento SaaS • BJJ Academy Platform
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    B2B RECURRING BILLING
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Cobrança de assinaturas do software cobradas das <strong>academias contratantes</strong> (Gracie Barra, Alliance, Atos, etc.).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-blue-400 font-bold block text-[11px] font-mono">⚡ 1. Cobrança do Software BJJ Academy (Plataforma Master)</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Esta tela gerencia as <strong>mensalidades de uso do software</strong> que cada academia contratante paga à BJJ Academy Corp (ex: R$ 350/mês). Os pagamentos caem na conta Master da BJJ Academy.
                </p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold block text-[11px] font-mono">🥋 2. Cobrança dos Alunos (Financeiro das Academias)</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  As abas de <em>Fluxo de Caixa, Assinaturas e Gateways</em> gerenciam as <strong>mensalidades dos alunos de Jiu-Jitsu</strong> de cada academia. O dinheiro do aluno vai direto para a conta Asaas/Mercado Pago da própria academia!
                </p>
              </div>
            </div>
          </div>

          {/* SaaS KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs text-slate-400 font-mono block">MRR do Software SaaS</span>
              <div className="text-2xl font-bold text-white font-display">
                {saasInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-[10px] text-blue-400 font-mono">3 Academias Contratantes</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs text-slate-400 font-mono block">Receita Licenças Quitadas</span>
              <div className="text-2xl font-bold text-emerald-400 font-display">
                {saasInvoices.filter(i => i.status === "PAID").reduce((sum, inv) => sum + inv.amount, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-[10px] text-emerald-400 font-mono">100% Baixa via PIX/Asaas</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs text-slate-400 font-mono block">Licenças a Vencer / Pendentes</span>
              <div className="text-2xl font-bold text-amber-400 font-display">
                {saasInvoices.filter(i => i.status === "PENDING").reduce((sum, inv) => sum + inv.amount, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-[10px] text-amber-400 font-mono">1 Fatura em Aberto</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs text-slate-400 font-mono block">Inadimplência Licenças</span>
              <div className="text-2xl font-bold text-rose-400 font-display">
                {saasInvoices.filter(i => i.status === "OVERDUE").reduce((sum, inv) => sum + inv.amount, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-[10px] text-rose-400 font-mono">1 Academia com atraso</p>
            </div>
          </div>

          {/* Tabela de Faturas das Academias Contratantes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  Faturas de Mensalidade do Software BJJ Academy
                </h3>
                <p className="text-xs text-slate-400">
                  Controle de licenciamento cobrado das academias parceiras.
                </p>
              </div>

              <button
                onClick={() => setShowCreateSaasModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Emitir Fatura de Licença</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-3">Academia Contratante</th>
                    <th className="py-3 px-3">Plano SaaS</th>
                    <th className="py-3 px-3">Valor Licença</th>
                    <th className="py-3 px-3">Vencimento</th>
                    <th className="py-3 px-3">Forma Cobrança</th>
                    <th className="py-3 px-3">Status Fatura</th>
                    <th className="py-3 px-3 text-right">Ações BJJ Master</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {saasInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <strong className="text-white block text-xs">{inv.academyName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{inv.unit}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-blue-400 font-mono font-semibold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          {inv.planName}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-white">
                        {inv.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        {inv.dueDate}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded">
                          {inv.billingType}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {inv.status === "PAID" && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" /> QUITADA
                          </span>
                        )}
                        {inv.status === "PENDING" && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> EM ABERTO
                          </span>
                        )}
                        {inv.status === "OVERDUE" && (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> EM ATRASO
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.pixCopiaECola && (
                            <button
                              onClick={async () => {
                                await copyToClipboard(inv.pixCopiaECola || "");
                                triggerToast(`PIX da licença BJJ Academy para ${inv.academyName} copiado!`);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1"
                              title="Copiar PIX"
                            >
                              <Copy className="w-3 h-3 text-blue-400" /> Copiar PIX
                            </button>
                          )}
                          {inv.status !== "PAID" && (
                            <button
                              onClick={() => {
                                setSaasInvoices(prev => prev.map(item => item.id === inv.id ? { ...item, status: "PAID", paymentDate: new Date().toISOString().split("T")[0] } : item));
                                triggerToast(`Licença da academia ${inv.academyName} marcada como QUITADA!`);
                              }}
                              className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Dar Baixa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO ALUNO COM ASAAS INTEGRADO */}
      {showNewAsaasStudentModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-6 md:p-8 rounded-2xl max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowNewAsaasStudentModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Matricular Aluno com Asaas API</h3>
                <p className="text-xs text-slate-400">Cria o cliente, gera a assinatura no Asaas e emite a cobrança inicial</p>
              </div>
            </div>

            <form onSubmit={handleRegisterAsaasStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academia Destination</label>
                <select
                  value={newStudentForm.academyId}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, academyId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                >
                  {academies.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo do Aluno</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marcus Buchecha Almeida"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CPF do Aluno</label>
                  <input
                    type="text"
                    placeholder="123.456.789-00"
                    value={newStudentForm.cpf}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, cpf: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    required
                    placeholder="+55 (11) 98888-7777"
                    value={newStudentForm.phone}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Plano de Assinatura</label>
                  <select
                    value={newStudentForm.plan}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, plan: e.target.value as SubscriptionPlan })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Mensal">Mensal (R$ 220)</option>
                    <option value="Trimestral">Trimestral (R$ 210)</option>
                    <option value="Semestral">Semestral (R$ 200)</option>
                    <option value="Anual">Anual (R$ 180)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Cobrança</label>
                  <select
                    value={newStudentForm.billingType}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, billingType: e.target.value as PaymentBillingType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="PIX">PIX (QR Code Dinâmico)</option>
                    <option value="BOLETO">Boleto Bancário Asaas</option>
                    <option value="CREDIT_CARD">Cartão de Crédito Recorrente</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAsaasStudentModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg"
                >
                  Criar Assinatura no Asaas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAÇÃO DE GATEWAY ASAAS */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl relative">
            <button onClick={() => setShowConfigModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" /> Configuração do Gateway Asaas
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Chave de API (API Key Asaas)</label>
                <input
                  type="password"
                  value="$asaas_api_key_live_98123749123847192"
                  readOnly
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Token de Validação do Webhook</label>
                <input
                  type="text"
                  value="wh_tok_bjj_academy_2026_sec"
                  readOnly
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-indigo-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Multa por Atraso (%)</label>
                  <input
                    type="number"
                    defaultValue={2.0}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Juros ao Dia (%)</label>
                  <input
                    type="number"
                    step="0.001"
                    defaultValue={0.033}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowConfigModal(false);
                pushAudit("UPDATE_GATEWAY", "GatewayAdapter", "gw-asaas", "Regras e credenciais do Asaas salvas.");
                triggerToast("Credenciais e regras do Asaas salvas com sucesso!");
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg"
            >
              Salvar Parâmetros
            </button>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CONTAS A PAGAR */}
      {showAddPayableModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl relative">
            <button onClick={() => setShowAddPayableModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-400" /> Registrar Conta a Pagar
            </h3>

            <form onSubmit={handleAddPayable} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Descrição da Despesa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel do Tatame ou Energia"
                  value={newPayableForm.description}
                  onChange={(e) => setNewPayableForm({ ...newPayableForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Categoria</label>
                  <select
                    value={newPayableForm.category}
                    onChange={(e) => setNewPayableForm({ ...newPayableForm, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="Aluguel Tatame">Aluguel Tatame</option>
                    <option value="Luz e Água">Luz e Água</option>
                    <option value="Salários Professores">Salários Professores</option>
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Software SaaS">Software SaaS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    required
                    value={newPayableForm.amount}
                    onChange={(e) => setNewPayableForm({ ...newPayableForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Fornecedor / Favorecido</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Enel Distribuição ou Imobiliária"
                  value={newPayableForm.supplier}
                  onChange={(e) => setNewPayableForm({ ...newPayableForm, supplier: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Data de Vencimento</label>
                <input
                  type="date"
                  required
                  value={newPayableForm.dueDate}
                  onChange={(e) => setNewPayableForm({ ...newPayableForm, dueDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg mt-2"
              >
                Salvar Despesa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAY NOW PIX */}
      {showPayNowModal && selectedStudentForPayNow && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative text-xs">
            <button onClick={() => setShowPayNowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-400" /> Cobrança PIX Asaas Dinâmico
            </h3>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 block text-[10px]">Aluno:</span>
              <strong className="text-white text-sm block">{selectedStudentForPayNow.name}</strong>
              <span className="text-[10px] text-emerald-400 font-mono block">Valor: R$ {pixAmount},00</span>
            </div>

            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center">
              <div className="w-32 h-32 border-2 border-slate-950 bg-slate-900 text-white flex items-center justify-center text-[10px] font-mono text-center font-bold">
                🥋 QR CODE PIX ASAAS<br/>R$ {pixAmount},00
              </div>
            </div>

            <button
              onClick={handleConfirmPayNow}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg"
            >
              Simular Baixa Automática PIX
            </button>
          </div>
        </div>
      )}

      {/* MODAL COMPROVANTE DE RECIBO */}
      {thankYouModalData && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative text-xs">
            <button onClick={() => setThankYouModalData(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <FileCheck className="w-5 h-5" /> Recibo de Quitação Emitido
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Aluno:</span>
                <span className="text-white font-bold">{thankYouModalData.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Academia:</span>
                <span className="text-slate-300">{thankYouModalData.academyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Pago:</span>
                <span className="text-emerald-400 font-bold">R$ {thankYouModalData.amount},00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data Quitação:</span>
                <span className="text-slate-300">{thankYouModalData.date}</span>
              </div>
            </div>

            <button
              onClick={() => setThankYouModalData(null)}
              className="w-full bg-slate-800 text-slate-200 font-bold py-2 rounded-xl"
            >
              Fechar Recibo
            </button>
          </div>
        </div>
      )}

      {/* MODAL INSPECTOR WEBHOOK JSON */}
      {selectedWebhook && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl relative">
            <button onClick={() => setSelectedWebhook(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-400" /> Webhook Event Payload Inspect
            </h3>

            <pre className="bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
              {JSON.stringify(selectedWebhook.payload, null, 2)}
            </pre>

            <button
              onClick={() => setSelectedWebhook(null)}
              className="w-full bg-slate-800 text-slate-200 font-bold py-2 rounded-xl text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR FATURA DE LICENÇA BJJ ACADEMY */}
      {showCreateSaasModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl relative">
            <button onClick={() => setShowCreateSaasModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Emitir Cobrança de Licença BJJ Academy
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const academyObj = academies.find(a => a.id === newSaasForm.academyId) || academies[0];
                const newInv: SaasPlatformInvoice = {
                  id: `saas-inv-${Date.now()}`,
                  academyId: newSaasForm.academyId,
                  academyName: academyObj ? academyObj.name : "Gracie Barra",
                  unit: academyObj ? academyObj.unit : "Barra",
                  planName: newSaasForm.planName,
                  amount: Number(newSaasForm.amount),
                  dueDate: newSaasForm.dueDate,
                  status: "PENDING",
                  billingType: newSaasForm.billingType,
                  pixCopiaECola: `00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/saas_${newSaasForm.academyId}_${newSaasForm.amount}_${Math.floor(Math.random()*10000)}`,
                  asaasInvoiceId: `pay_saas_${Math.floor(Math.random()*900000 + 100000)}`
                };
                setSaasInvoices(prev => [newInv, ...prev]);
                setShowCreateSaasModal(false);
                pushAudit("CREATE_SUBSCRIPTION", "SaasInvoice", newInv.id, `Cobrança de licença BJJ Academy gerada no valor de R$ ${newSaasForm.amount},00 para ${academyObj ? academyObj.name : 'Academia'}.`);
                triggerToast(`Fatura de licença BJJ Academy criada com sucesso para ${academyObj ? academyObj.name : 'Academia'}!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-400 mb-1">Academia Contratante</label>
                <select
                  value={newSaasForm.academyId}
                  onChange={(e) => setNewSaasForm({ ...newSaasForm, academyId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  {academies.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Plano SaaS</label>
                  <select
                    value={newSaasForm.planName}
                    onChange={(e) => setNewSaasForm({ ...newSaasForm, planName: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="Starter SaaS">Starter SaaS (R$ 250)</option>
                    <option value="Pro SaaS">Pro SaaS (R$ 350)</option>
                    <option value="Enterprise SaaS">Enterprise SaaS (R$ 450)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Valor Licença (R$)</label>
                  <input
                    type="number"
                    value={newSaasForm.amount}
                    onChange={(e) => setNewSaasForm({ ...newSaasForm, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Data Vencimento</label>
                  <input
                    type="date"
                    value={newSaasForm.dueDate}
                    onChange={(e) => setNewSaasForm({ ...newSaasForm, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Forma de Pagamento</label>
                  <select
                    value={newSaasForm.billingType}
                    onChange={(e) => setNewSaasForm({ ...newSaasForm, billingType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="PIX">PIX (QR Code)</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg mt-2"
              >
                Gerar Cobrança de Licença
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
