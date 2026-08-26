import React, { useState, useEffect } from "react";
import { 
  PaymentHistory, Student, Academy, AsaasWebhookEvent, PaymentProvider, 
  PaymentBillingType, SubscriptionPlan, AccountsPayable, AccountsReceivable, 
  AuditLog, GatewayAdapterConfig, UserRole, SaasPlatformInvoice,
  RedisWebhookJob, RedisQueueStats, PixConfig
} from "../types";
import { 
  CreditCard, TrendingUp, DollarSign, ArrowUpRight, 
  Clock, ShieldAlert, Sparkles, Send, Copy, Check, Users, X,
  QrCode, CheckCircle, Building2, Heart, FileText, RefreshCw, Settings,
  Link as LinkIcon, AlertTriangle, Zap, Calendar, Sliders, Eye, UserPlus, FileCheck,
  PauseCircle, PlayCircle, Ban, Layers, ShieldCheck, Database, Code, FileSpreadsheet,
  Download, ArrowDownRight, Tag, Shield, Terminal, CheckSquare, PlusCircle,
  Activity, Cpu, RotateCcw, Server, Inbox, Play, CheckCheck, Globe,
  Cloud, Lock, Workflow, ArrowRight, Coins, Percent, MessageSquare
} from "lucide-react";
import { 
  initialSubaccounts, calculateAsaasSplit, generateAsaasPaymentLink,
  copyToClipboard 
} from "../services/asaasService";
import { AsaasSubaccountInfo } from "../types/asaas";
import SaasBillingView from "./SaasBillingView";
import MyAcademySubscription from "./MyAcademySubscription";

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
    "dashboard" | "subscriptions" | "subaccounts" | "asaas-gateway" | "redis-queue" | "accounts" | "audit" | "api-docs" | "saas"
  >("dashboard");

  // Multi-Tenant Academy Filter
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>("ALL");

  // User Role (RBAC Simulator)
  const [currentRole, setCurrentRole] = useState<UserRole>("GESTOR_ACADEMIA");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ==========================================
  // REDIS WEBHOOK QUEUE & WORKER MONITOR STATE
  // ==========================================
  const [redisStats, setRedisStats] = useState<RedisQueueStats>({
    connected: false,
    redisHost: "127.0.0.1:6379",
    mode: "in_memory_fallback",
    waiting: 0,
    active: 0,
    completed: 18,
    failed: 0,
    deadLetter: 0,
    avgLatencyMs: 78,
    uptimeSeconds: 342,
    processedPerMinute: 14.5
  });

  const [redisJobs, setRedisJobs] = useState<RedisWebhookJob[]>([
    {
      id: "job_init_01",
      queue: "bjj:queue:webhooks:completed",
      provider: "Asaas",
      eventId: "evt_asaas_88192301",
      eventType: "PAYMENT_RECEIVED",
      payload: { value: 180, studentName: "Lucas Mendes", billingType: "PIX" },
      status: "completed",
      attempts: 1,
      maxAttempts: 3,
      enqueuedAt: new Date(Date.now() - 120000).toISOString(),
      processedAt: new Date(Date.now() - 118000).toISOString(),
      tenantId: "ac-1",
      actionTaken: "SPLIT_APPLIED: Asaas Repasse R$ 171,00 para Gracie Barra. Aluno liberado na catraca.",
      executionTimeMs: 72
    },
    {
      id: "job_init_02",
      queue: "bjj:queue:webhooks:completed",
      provider: "Asaas",
      eventId: "evt_asaas_88192302",
      eventType: "PAYMENT_CONFIRMED",
      payload: { value: 250, studentName: "Beatriz Lima", billingType: "CREDIT_CARD" },
      status: "completed",
      attempts: 1,
      maxAttempts: 3,
      enqueuedAt: new Date(Date.now() - 340000).toISOString(),
      processedAt: new Date(Date.now() - 338000).toISOString(),
      tenantId: "ac-2",
      actionTaken: "SPLIT_APPLIED: Asaas Repasse R$ 237,50 para Alliance SP. Mensalidade quitada.",
      executionTimeMs: 84
    },
    {
      id: "job_init_03",
      queue: "bjj:queue:webhooks:completed",
      provider: "Asaas",
      eventId: "evt_asaas_88192303",
      eventType: "PAYMENT_OVERDUE",
      payload: { value: 150, studentName: "Rodrigo Gracie", billingType: "BOLETO" },
      status: "completed",
      attempts: 1,
      maxAttempts: 3,
      enqueuedAt: new Date(Date.now() - 600000).toISOString(),
      processedAt: new Date(Date.now() - 598000).toISOString(),
      tenantId: "ac-1",
      actionTaken: "INADIMPLENCIA_AUTOMATICA: Mensalidade vencida. Juros de 0.033%/dia aplicados.",
      executionTimeMs: 65
    }
  ]);

  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);

  // Fetch real-time Redis queue data from server API
  const fetchRedisQueueData = async () => {
    try {
      setIsRefreshingQueue(true);
      const [statsRes, jobsRes] = await Promise.all([
        fetch("/api/webhooks/queue/stats"),
        fetch("/api/webhooks/queue/jobs?limit=35")
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setRedisStats(statsData);
      }
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (jobsData.jobs && jobsData.jobs.length > 0) {
          setRedisJobs(jobsData.jobs);
        }
      }
    } catch (err) {
      console.warn("Could not reach /api/webhooks/queue endpoints:", err);
    } finally {
      setIsRefreshingQueue(false);
    }
  };

  // Poll Redis queue every 4 seconds when tab is active
  useEffect(() => {
    fetchRedisQueueData();
    const interval = setInterval(() => {
      if (activeSubTab === "redis-queue") {
        fetchRedisQueueData();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  // Simulate webhook into Redis queue
  const handleSimulateRedisWebhook = async (eventType: string, studentName = "Gabriel Tatame", amount = 180) => {
    try {
      setIsSimulatingWebhook(true);
      const res = await fetch("/api/webhooks/queue/test-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          studentName,
          amount,
          academyId: selectedAcademyId === "ALL" ? "ac-1" : selectedAcademyId
        })
      });
      const data = await res.json();
      triggerToast(`⚡ Webhook [${eventType}] enfileirado no Redis! Job ID: ${data.jobId}`);
      // Refresh list after brief moment
      setTimeout(fetchRedisQueueData, 450);
    } catch (err) {
      triggerToast("Erro ao enfileirar webhook no Redis.");
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  // Batch trigger simulated webhooks
  const handleSimulateBatch = async () => {
    setIsSimulatingWebhook(true);
    const events = [
      { type: "PAYMENT_RECEIVED", name: "Rafael Mendes", val: 220 },
      { type: "PAYMENT_CONFIRMED", name: "Camila Jiu-Jitsu", val: 190 },
      { type: "PAYMENT_OVERDUE", name: "Marcos Faixa Azul", val: 150 },
      { type: "PAYMENT_REFUNDED", name: "Felipe Nogueira", val: 200 }
    ];

    for (const item of events) {
      await fetch("/api/webhooks/queue/test-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: item.type,
          studentName: item.name,
          amount: item.val,
          academyId: "ac-1"
        })
      });
      await new Promise(r => setTimeout(r, 120));
    }
    triggerToast("⚡ Lote de 4 Webhooks enfileirados simultaneamente no Redis!");
    setTimeout(fetchRedisQueueData, 600);
    setIsSimulatingWebhook(false);
  };

  // Retry DLQ Job
  const handleRetryDlqJob = async (jobId: string) => {
    try {
      const res = await fetch("/api/webhooks/queue/retry-dlq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      triggerToast(data.message || "Job reenfileirado.");
      fetchRedisQueueData();
    } catch (e) {
      triggerToast("Erro ao reprocessar job.");
    }
  };

  // Clear Queues
  const handleClearQueues = async () => {
    try {
      await fetch("/api/webhooks/queue/clear", { method: "POST" });
      triggerToast("Filas e histórico de jobs limpos com sucesso.");
      fetchRedisQueueData();
    } catch (e) {
      triggerToast("Erro ao limpar filas.");
    }
  };

  // Asaas Subaccounts per Tenant Academy (Multi-Tenant Financial Isolation)
  const [subaccounts, setSubaccounts] = useState<AsaasSubaccountInfo[]>(initialSubaccounts);
  const [splitSimAmount, setSplitSimAmount] = useState("220");
  const [splitSimAcademyPercent, setSplitSimAcademyPercent] = useState(95);
  const [selectedSubaccountForModal, setSelectedSubaccountForModal] = useState<AsaasSubaccountInfo | null>(null);
  const [showCreateSubaccountModal, setShowCreateSubaccountModal] = useState(false);

  // BJJ Academy SaaS Platform Master Invoices (Licenciamento do Software cobrado das Academias Contratantes)
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

  // Late Fee & Notification Modal States
  const [showSendNotificationModal, setShowSendNotificationModal] = useState(false);
  const [selectedPaymentForNotification, setSelectedPaymentForNotification] = useState<PaymentHistory | null>(null);
  const [notificationStudent, setNotificationStudent] = useState<Student | null>(null);
  const [notificationRecipientName, setNotificationRecipientName] = useState("");
  const [notificationRecipientPhone, setNotificationRecipientPhone] = useState("");
  const [notificationRecipientType, setNotificationRecipientType] = useState<"STUDENT" | "GUARDIAN">("STUDENT");
  const [notificationMessageText, setNotificationMessageText] = useState("");
  const [notificationOverdueDays, setNotificationOverdueDays] = useState(0);
  const [notificationFineAmount, setNotificationFineAmount] = useState(0);
  const [notificationInterestAmount, setNotificationInterestAmount] = useState(0);
  const [notificationUpdatedTotal, setNotificationUpdatedTotal] = useState(0);
  const [notificationPixCode, setNotificationPixCode] = useState("");

  // New Student Form State
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    cpf: "",
    phone: "",
    email: "",
    plan: "Mensal" as SubscriptionPlan,
    planValue: 220,
    paymentDueDay: 10,
    category: "Adulto" as "Adulto" | "Kids / Infantil",
    guardianName: "",
    guardianPhone: "",
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

  // PIX Platform / Billing Configuration State with LocalStorage Persistence
  const defaultPixConfig: PixConfig = {
    pixKeyType: "CPF_CNPJ",
    pixKey: "58087630378",
    receiverName: "Messias B. Junior - BJJ Academy",
    receiverCity: "São Paulo",
    bankName: "Asaas / Nu Pagamentos",
    description: "Fatura de Mensalidade BJJ Academy",
    autoIncludeInInvoices: true,
    autoIncludeInWhatsApp: true
  };

  const [pixConfig, setPixConfig] = useState<PixConfig>(() => {
    try {
      const saved = localStorage.getItem("bjj_custom_pix_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        // If it was the placeholder email, automatically update to user's registered CPF
        if (parsed.pixKey === "messiasbjunior76@gmail.com" || !parsed.pixKey) {
          return defaultPixConfig;
        }
        return parsed;
      }
      return defaultPixConfig;
    } catch {
      return defaultPixConfig;
    }
  });

  const [showPixConfigModal, setShowPixConfigModal] = useState(false);
  const [pixConfigForm, setPixConfigForm] = useState<PixConfig>(pixConfig);

  // Sync PIX config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bjj_custom_pix_config", JSON.stringify(pixConfig));
    } catch (e) {
      console.error("Failed to save pix config to localStorage", e);
    }
  }, [pixConfig]);

  const handleSavePixConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setPixConfig(pixConfigForm);
    setShowPixConfigModal(false);
    pushAudit(
      "UPDATE_PIX_CONFIG",
      "PixBillingConfig",
      pixConfigForm.pixKey,
      `Chave PIX atualizada para: [${pixConfigForm.pixKeyType}] ${pixConfigForm.pixKey} - Titular: ${pixConfigForm.receiverName} (${pixConfigForm.bankName})`
    );
    triggerToast(`✅ Chave PIX (${pixConfigForm.pixKey}) salva com sucesso na área de cobrança!`);
  };

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

  // Helper: Calculate Late Fee (2%) & Interest (0.033%/day)
  const calculatePaymentDetails = (payment: PaymentHistory, student?: Student) => {
    const today = new Date();
    const dueDateStr = payment.dueDate || student?.nextPaymentDate || payment.date;
    const dueDateObj = new Date(dueDateStr);
    
    // Calculate difference in days
    const diffTime = today.getTime() - dueDateObj.getTime();
    const rawDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = (payment.status === "Pending" || payment.status === "Overdue" || student?.paymentStatus === "Overdue") && rawDays > 0;
    const daysOverdue = isOverdue ? Math.max(1, rawDays) : (payment.daysOverdue || 0);

    const baseAmount = payment.amount || student?.planValue || 220;
    // 2.0% Fine (Multa)
    const fineRate = 0.02;
    const fineAmount = isOverdue ? Number((baseAmount * fineRate).toFixed(2)) : (payment.fineAmount || 0);
    // 0.033% Daily Interest (Juros de Mora ~1% ao mês)
    const dailyInterestRate = 0.00033;
    const interestAmount = isOverdue ? Number((baseAmount * dailyInterestRate * daysOverdue).toFixed(2)) : (payment.interestAmount || 0);
    const updatedTotal = Number((baseAmount + fineAmount + interestAmount).toFixed(2));

    // Determine Recipient (Student vs Guardian/Parents)
    const hasGuardian = Boolean(student?.guardianName && student?.guardianPhone) || (student?.category === "Kids / Infantil");
    const recipientName = hasGuardian ? (student?.guardianName || "Responsável Legal") : (student?.name || payment.studentName);
    const recipientPhone = hasGuardian ? (student?.guardianPhone || student?.phone || "") : (student?.phone || "");
    const recipientType: "STUDENT" | "GUARDIAN" = hasGuardian ? "GUARDIAN" : "STUDENT";

    const dueDateFormatted = dueDateObj.toLocaleDateString("pt-BR", { timeZone: "UTC" });

    return {
      isOverdue,
      daysOverdue,
      baseAmount,
      fineAmount,
      interestAmount,
      updatedTotal,
      dueDateFormatted,
      recipientName,
      recipientPhone,
      recipientType,
      dueDateStr
    };
  };

  // Recalculate and Regenerate Dynamic PIX with Interest
  const handleRecalculateOverdueWithInterest = (payment: PaymentHistory, student?: Student) => {
    const details = calculatePaymentDetails(payment, student);
    const updatedPix = `00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/pay_${payment.id}_tot_${details.updatedTotal.toFixed(2).replace('.', '')}_${Math.floor(Math.random()*10000)}`;

    const updatedPayment: PaymentHistory = {
      ...payment,
      status: "Overdue",
      daysOverdue: details.daysOverdue,
      fineAmount: details.fineAmount,
      interestAmount: details.interestAmount,
      updatedTotalAmount: details.updatedTotal,
      pixCopiaECola: updatedPix,
      recipientName: details.recipientName,
      recipientPhone: details.recipientPhone,
      recipientType: details.recipientType
    };

    onAddPayment(updatedPayment);

    if (student && onUpdateStudent) {
      onUpdateStudent({
        ...student,
        paymentStatus: "Overdue"
      });
    }

    pushAudit(
      "UPDATE_SUBSCRIPTION",
      "PaymentHistory",
      payment.id,
      `Cobrança recalculada com juros de mora: Aluno ${payment.studentName}. Valor original: R$ ${details.baseAmount}, Multa (2%): R$ ${details.fineAmount}, Juros (${details.daysOverdue} dias): R$ ${details.interestAmount}. Total: R$ ${details.updatedTotal.toFixed(2)}.`
    );

    triggerToast(`⚡ Cobrança de ${payment.studentName} recalculada com juros! Novo total: R$ ${details.updatedTotal.toFixed(2)} (Multa R$ ${details.fineAmount.toFixed(2)} + Juros R$ ${details.interestAmount.toFixed(2)})`);
  };

  // Open Send Notification / WhatsApp Modal
  const handleOpenNotificationModal = (payment: PaymentHistory, student?: Student) => {
    const details = calculatePaymentDetails(payment, student);
    setSelectedPaymentForNotification(payment);
    setNotificationStudent(student || null);
    setNotificationRecipientName(details.recipientName);
    setNotificationRecipientPhone(details.recipientPhone);
    setNotificationRecipientType(details.recipientType);
    setNotificationOverdueDays(details.daysOverdue);
    setNotificationFineAmount(details.fineAmount);
    setNotificationInterestAmount(details.interestAmount);
    setNotificationUpdatedTotal(details.updatedTotal);

    const pixCode = payment.pixCopiaECola || `00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/pay_${payment.id}_${Math.floor(Math.random()*900000+100000)}`;
    setNotificationPixCode(pixCode);

    const academyObj = academies.find(a => a.id === (student?.academyId || selectedAcademyId)) || academies[0];
    const academyName = academyObj ? `${academyObj.name} (${academyObj.unit})` : "BJJ Academy";

    // Format Default WhatsApp Message
    const defaultMsg = `🥋 *${academyName.toUpperCase()} - AVISO DE COBRANÇA*

Olá, *${details.recipientName}*! Tudo bem?

Consta em nosso sistema que a mensalidade de Jiu-Jitsu do atleta *${payment.studentName}* referente ao vencimento *${details.dueDateFormatted}* encontra-se pendente com *${details.daysOverdue} dia(s) de atraso*.

📊 *Demonstrativo de Valores Atualizados:*
• Valor Original: R$ ${details.baseAmount.toFixed(2)}
• Multa por Atraso (2.0%): R$ ${details.fineAmount.toFixed(2)}
• Juros de Mora (${details.daysOverdue} dias a 0,033%/dia): R$ ${details.interestAmount.toFixed(2)}
• *VALOR TOTAL ATUALIZADO: R$ ${details.updatedTotal.toFixed(2)}*

⚡ *Pague via PIX Copia e Cola:*
${pixCode}

📱 *Chave PIX da BJJ Academy / Titular:*
Chave (${pixConfig.pixKeyType}): ${pixConfig.pixKey}
Titular: ${pixConfig.receiverName} (${pixConfig.bankName})

_Caso o pagamento já tenha sido efetuado nas últimas horas, por favor desconsidere este aviso ou nos envie o comprovante. Agradecemos a compreensão e bons treinos! OSS!_ 🥋`;

    setNotificationMessageText(defaultMsg);
    setShowSendNotificationModal(true);
  };

  // Send Direct via WhatsApp Web / App
  const handleSendViaWhatsApp = () => {
    if (!notificationRecipientPhone) {
      triggerToast("Telefone do destinatário não cadastrado.");
      return;
    }

    const cleanPhone = notificationRecipientPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const encodedText = encodeURIComponent(notificationMessageText);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    // Register Notification in CRM and Payment History
    if (selectedPaymentForNotification) {
      const updatedPayment: PaymentHistory = {
        ...selectedPaymentForNotification,
        notificationCount: (selectedPaymentForNotification.notificationCount || 0) + 1,
        lastNotifiedAt: new Date().toLocaleDateString("pt-BR")
      };
      onAddPayment(updatedPayment);
    }

    if (notificationStudent && onSendInvoiceAlert) {
      onSendInvoiceAlert(notificationStudent);
    }

    pushAudit(
      "DISPARO_WHATSAPP",
      "PaymentNotification",
      selectedPaymentForNotification?.id || "notif-01",
      `Notificação de cobrança com juros disparada via WhatsApp para ${notificationRecipientName} (${notificationRecipientPhone}). Total: R$ ${notificationUpdatedTotal.toFixed(2)}.`
    );

    // Open WhatsApp
    window.open(whatsappUrl, "_blank");
    setShowSendNotificationModal(false);
    triggerToast(`📲 WhatsApp aberto para envio da cobrança com juros a ${notificationRecipientName}!`);
  };

  // Send via Central de Mensagens / CRM
  const handleSendViaCentralMessages = () => {
    if (notificationStudent && onSendInvoiceAlert) {
      onSendInvoiceAlert(notificationStudent);
    }

    if (selectedPaymentForNotification) {
      const updatedPayment: PaymentHistory = {
        ...selectedPaymentForNotification,
        notificationCount: (selectedPaymentForNotification.notificationCount || 0) + 1,
        lastNotifiedAt: new Date().toLocaleDateString("pt-BR")
      };
      onAddPayment(updatedPayment);
    }

    pushAudit(
      "DISPARO_CRM",
      "CrmCampaign",
      selectedPaymentForNotification?.id || "crm-01",
      `Cobrança de mensalidade com juros registrada e enviada pela Central de Mensagens para ${notificationRecipientName}.`
    );

    setShowSendNotificationModal(false);
    triggerToast(`💬 Cobrança com juros enviada com sucesso pela Central de Mensagens para ${notificationRecipientName}!`);
  };

  // Register Asaas Student with Next Month Due Date and Immediate Invoice
  const handleRegisterAsaasStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name || !newStudentForm.phone) {
      triggerToast("Preencha ao menos o nome e o telefone do aluno.");
      return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const dueDay = Number(newStudentForm.paymentDueDay) || 10;
    
    // Next month calculation
    const nextDateObj = new Date(currentYear, currentMonth + 1, dueDay);
    const nextPaymentDateStr = nextDateObj.toISOString().split("T")[0];

    const generatedCustomerId = `cus_00000${Math.floor(Math.random() * 900000 + 100000)}`;
    const generatedSubId = `sub_${Math.floor(Math.random() * 9000000 + 1000000)}`;
    const studentId = `st-${Date.now()}`;

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
      paymentDueDay: dueDay,
      nextPaymentDate: nextPaymentDateStr,
      category: newStudentForm.category,
      guardianName: newStudentForm.guardianName,
      guardianPhone: newStudentForm.guardianPhone,
      registrationDate: today.toISOString().split("T")[0],
      birthDate: newStudentForm.category === "Kids / Infantil" ? "2015-06-15" : "1998-05-10",
      asaasCustomerId: generatedCustomerId,
      asaasSubscriptionId: generatedSubId,
      billingType: newStudentForm.billingType
    };

    if (onAddStudent) {
      onAddStudent(newStudentData);
    }

    // 1. Immediate payment for registration / first cycle
    onAddPayment({
      studentId: studentId,
      studentName: newStudentForm.name,
      amount: Number(newStudentForm.planValue),
      date: today.toISOString().split("T")[0],
      status: "Paid",
      method: newStudentForm.billingType,
      recipientName: newStudentForm.category === "Kids / Infantil" && newStudentForm.guardianName ? newStudentForm.guardianName : newStudentForm.name,
      recipientPhone: newStudentForm.category === "Kids / Infantil" && newStudentForm.guardianPhone ? newStudentForm.guardianPhone : newStudentForm.phone,
      recipientType: newStudentForm.category === "Kids / Infantil" && newStudentForm.guardianName ? "GUARDIAN" : "STUDENT"
    });

    // 2. Next month recurring invoice scheduled automatically
    const nextInvoiceTxId = Math.random().toString(36).substring(2, 12).toUpperCase();
    const nextInvoicePix = `00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/pay_${nextInvoiceTxId}`;
    
    onAddPayment({
      studentId: studentId,
      studentName: newStudentForm.name,
      amount: Number(newStudentForm.planValue),
      date: today.toISOString().split("T")[0],
      dueDate: nextPaymentDateStr,
      status: "Pending",
      method: newStudentForm.billingType,
      pixCopiaECola: nextInvoicePix,
      recipientName: newStudentForm.category === "Kids / Infantil" && newStudentForm.guardianName ? newStudentForm.guardianName : newStudentForm.name,
      recipientPhone: newStudentForm.category === "Kids / Infantil" && newStudentForm.guardianPhone ? newStudentForm.guardianPhone : newStudentForm.phone,
      recipientType: newStudentForm.category === "Kids / Infantil" && newStudentForm.guardianName ? "GUARDIAN" : "STUDENT"
    });

    pushAudit(
      "CREATE_CUSTOMER",
      "AsaasCustomer",
      generatedCustomerId,
      `Aluno ${newStudentForm.name} matriculado. Dia de vencimento: todo dia ${dueDay}. Próxima cobrança programada para ${nextPaymentDateStr} (R$ ${newStudentForm.planValue},00).`
    );

    setShowNewAsaasStudentModal(false);
    triggerToast(`Aluno ${newStudentForm.name} matriculado com sucesso! Vencimento programado para todo dia ${dueDay} (Próximo: ${nextDateObj.toLocaleDateString("pt-BR")}).`);
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
          {/* Quick PIX Config Button */}
          <button
            onClick={() => {
              setPixConfigForm(pixConfig);
              setShowPixConfigModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/60 px-3 py-1.5 rounded-xl text-xs text-emerald-400 font-semibold transition-all shadow cursor-pointer"
            title="Clique para gerenciar e salvar sua chave PIX de recebimento"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-slate-300">Chave PIX:</span>
            <span className="font-mono text-[11px] text-emerald-300 font-bold truncate max-w-[130px]">{pixConfig.pixKey}</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold uppercase">
              Salva
            </span>
          </button>

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
          <span>Assinaturas Recorrentes</span>
          <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-mono">
            {filteredStudents.length} ativas
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("subaccounts")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "subaccounts"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Coins className="w-4 h-4 text-emerald-400" />
          <span>Subcontas Asaas & Split</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-mono font-bold">
            Split 95/5
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
          <span>Gateways & Adapters</span>
        </button>

        <button
          onClick={() => setActiveSubTab("redis-queue")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "redis-queue"
              ? "border-red-500 text-red-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Cpu className="w-4 h-4 text-red-400" />
          <span>Fila Redis & Workers</span>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
            redisStats.connected ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}>
            {redisStats.waiting > 0 ? `${redisStats.waiting} em fila` : (redisStats.connected ? "Redis Online" : "Worker Ativo")}
          </span>
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
          <span>Contas a Pagar</span>
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
          <span>Auditoria (Logs)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("api-docs")}
          className={`px-4 py-3 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "api-docs"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>Cloudflare & Infraestrutura</span>
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

          {/* SEÇÃO ESPECIAL: MENSALIDADES EM ATRASO & CÁLCULO DE JUROS DE MORA */}
          {(() => {
            const overduePayments = filteredPayments.filter(p => {
              const student = students.find(s => s.id === p.studentId);
              const details = calculatePaymentDetails(p, student);
              return details.isOverdue || p.status === "Overdue";
            });

            if (overduePayments.length === 0) return null;

            return (
              <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/60 border border-rose-500/40 p-5 rounded-2xl shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-rose-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                        Gestão de Cobranças em Atraso & Recálculo de Juros
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                          {overduePayments.length} EM ATRASO
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        Multa automática de <strong>2,0%</strong> + Juros de mora de <strong>0,033%/dia</strong> (~1%/mês). Envio de cobrança direta para o WhatsApp ou Central CRM.
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-400 uppercase block">Total Corrigido em Atraso:</span>
                    <span className="text-sm font-bold text-rose-400">
                      {overduePayments.reduce((sum, p) => {
                        const student = students.find(s => s.id === p.studentId);
                        const details = calculatePaymentDetails(p, student);
                        return sum + details.updatedTotal;
                      }, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>

                {/* Overdue Items Grid / Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {overduePayments.map((p) => {
                    const student = students.find(s => s.id === p.studentId);
                    const details = calculatePaymentDetails(p, student);

                    return (
                      <div key={p.id} className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/30 space-y-3 shadow-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-white block">{p.studentName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {details.recipientType === "GUARDIAN" ? `👨‍👩‍👧 Resp: ${details.recipientName} (${details.recipientPhone})` : `🥋 Contato: ${details.recipientPhone || "Não cadastrado"}`}
                            </span>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                              {details.daysOverdue} dias de atraso
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Venc: {details.dueDateFormatted}</span>
                          </div>
                        </div>

                        {/* Discriminativo dos Valores */}
                        <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[10px]">
                          <div>
                            <span className="text-slate-500 block">Original</span>
                            <span className="text-slate-200 font-bold">R$ {details.baseAmount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-amber-400 block">Multa 2%</span>
                            <span className="text-amber-300 font-bold">+ R$ {details.fineAmount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-rose-400 block">Juros {details.daysOverdue}d</span>
                            <span className="text-rose-300 font-bold">+ R$ {details.interestAmount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-emerald-400 block">Total Refeito</span>
                            <span className="text-emerald-300 font-bold text-[11px]">R$ {details.updatedTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleRecalculateOverdueWithInterest(p, student)}
                            className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[10px] px-2.5 py-1.5 rounded-lg font-mono font-semibold flex items-center gap-1 transition-all"
                            title="Recalcular valor e regerar código PIX com juros"
                          >
                            <Zap className="w-3 h-3" /> Recalcular Juros
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenNotificationModal(p, student)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow transition-all"
                          >
                            <Send className="w-3 h-3" /> Enviar Cobrança / WhatsApp
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
                    <th className="p-4">Data / Vencimento</th>
                    <th className="p-4">Forma Cobrança</th>
                    <th className="p-4">Valor Original / Refeito</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações & Notificação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredPayments.map((p) => {
                    const student = students.find(s => s.id === p.studentId);
                    const details = calculatePaymentDetails(p, student);

                    return (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4">
                          <span className="font-semibold text-slate-200 block">{p.studentName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {details.recipientType === "GUARDIAN" ? `👨‍👩‍👧 Resp: ${details.recipientName}` : `ID: ${p.studentId}`} | Asaas Pay: {p.asaasInvoiceId || "pay_8812"}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-mono">
                          <span className="block text-slate-300">{p.date}</span>
                          {p.dueDate && (
                            <span className="text-[10px] text-slate-500">Venc: {p.dueDate}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                            {p.method}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-200">
                          {details.isOverdue ? (
                            <div>
                              <span className="text-emerald-400 block text-xs">
                                {details.updatedTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                              <span className="text-[10px] text-slate-500 line-through">
                                {p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            </div>
                          ) : (
                            p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold ${
                            p.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            details.isOverdue || p.status === "Overdue" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {p.status === "Paid" ? "Compensado" : details.isOverdue ? `Atrasado (${details.daysOverdue}d)` : "Aguardando PIX"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status === "Paid" ? (
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
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenNotificationModal(p, student)}
                                  className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-1 rounded font-semibold flex items-center gap-1"
                                  title="Notificar cobrança com juros via WhatsApp ou Central de Mensagens"
                                >
                                  <MessageSquare className="w-3 h-3" /> Notificar
                                </button>
                                
                                {details.isOverdue && (
                                  <button
                                    type="button"
                                    onClick={() => handleRecalculateOverdueWithInterest(p, student)}
                                    className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-1 rounded font-semibold flex items-center gap-1"
                                    title="Recalcular juros de mora"
                                  >
                                    <Zap className="w-3 h-3" /> Juros
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                    <th className="p-4">Aluno / CPF / Responsável</th>
                    <th className="p-4">Plano / Ciclo</th>
                    <th className="p-4">Dia do Vencimento & Próximo Ciclo</th>
                    <th className="p-4">Valor Recorrente</th>
                    <th className="p-4">Forma Pagamento</th>
                    <th className="p-4">Status Financeiro</th>
                    <th className="p-4 text-right">Ações & Notificação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((st) => {
                    const today = new Date();
                    const dueDay = st.paymentDueDay || 10;
                    const nextDueDate = new Date(today.getFullYear(), today.getMonth() + (st.paymentStatus === "Paid" ? 1 : 0), dueDay);
                    const matchingOverduePayment = filteredPayments.find(p => p.studentId === st.id && (p.status === "Overdue" || p.status === "Pending"));

                    return (
                      <tr key={st.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4">
                          <span className="font-semibold text-white block">{st.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            CPF: {st.cpf || "123.456.789-00"} | Asaas ID: {st.asaasCustomerId || "cus_001"}
                          </span>
                          {st.category === "Kids / Infantil" && st.guardianName && (
                            <span className="text-[10px] text-indigo-400 font-mono block">
                              👨‍👩‍👧 Pais: {st.guardianName} ({st.guardianPhone || "Sem tel"})
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          <span className="font-bold text-slate-100 block">{st.plan || "Mensal"}</span>
                          <span className="text-[10px] text-slate-500">Sub: {st.asaasSubscriptionId || "sub_10091823"}</span>
                        </td>
                        <td className="p-4 font-mono text-xs">
                          <span className="text-emerald-400 font-bold block">Todo dia {dueDay.toString().padStart(2, "0")}</span>
                          <span className="text-[10px] text-slate-400">
                            Próx: {nextDueDate.toLocaleDateString("pt-BR")}
                          </span>
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
                          <div className="flex justify-end items-center gap-1.5 flex-wrap">
                            {st.paymentStatus !== "Paid" && (
                              <button
                                onClick={() => {
                                  const pay = matchingOverduePayment || {
                                    id: `pay_temp_${st.id}`,
                                    studentId: st.id,
                                    studentName: st.name,
                                    amount: st.planValue || 220,
                                    date: new Date().toISOString().split("T")[0],
                                    dueDate: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
                                    method: st.billingType || "PIX",
                                    status: "Overdue" as const,
                                    academyId: st.academyId || selectedAcademyId
                                  };
                                  handleOpenNotificationModal(pay, st);
                                }}
                                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-1 rounded font-semibold flex items-center gap-1"
                                title="Enviar lembrete de cobrança com juros via WhatsApp ou Central de Mensagens"
                              >
                                <Send className="w-3 h-3" /> Notificar
                              </button>
                            )}

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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: SUBCONTAS ASAAS & SPLIT DE PAGAMENTOS (MULTI-TENANT ISOLATION) */}
      {activeSubTab === "subaccounts" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    Subcontas Asaas & Split Automático por Academia
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      MULTI-TENANT WALLETS
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Cada academia possui uma <strong>subconta dedicada no Asaas</strong>. O dinheiro do aluno vai direto para a carteira da academia e o SaaS retém a comissão automaticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateSubaccountModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Nova Subconta Asaas
                </button>
              </div>
            </div>

            {/* Architecture Comparison Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold block text-[11px] font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 1. Sem Risco Fiscal (BACEN)
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  A plataforma SaaS <strong>não faz custódia de dinheiro</strong> de terceiros. O Asaas faz a divisão (Split) direto na liquidação da cobrança.
                </p>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-blue-400 font-bold block text-[11px] font-mono flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> 2. Split Automático (95% / 5%)
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  95% do valor da mensalidade cai instantaneamente na carteira da academia contratante e 5% na carteira Master do BJJ Academy SaaS.
                </p>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block text-[11px] font-mono flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> 3. Transferência Automática
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  A academia cadastra sua conta bancária na subconta e recebe o saldo líquido via TED/PIX diário sem intervenção manual.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Split Simulator */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  Simulador de Split de Pagamento em Tempo Real
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calcule a divisão exata de qualquer mensalidade entre Gateway Asaas, Taxa do SaaS BJJ Academy e Repasse Líquido da Academia.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Valor da Mensalidade:</span>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                  <span className="text-xs text-slate-500 font-bold mr-1">R$</span>
                  <input
                    type="number"
                    value={splitSimAmount}
                    onChange={(e) => setSplitSimAmount(e.target.value)}
                    className="w-20 bg-transparent text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Split Math Cards */}
            {(() => {
              const splitResult = calculateAsaasSplit(Number(splitSimAmount) || 0, splitSimAcademyPercent);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-400 font-mono block">Valor Bruto (Aluno Paga)</span>
                    <div className="text-xl font-bold text-white font-display font-mono">
                      {splitResult.grossAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-[10px] text-slate-500">100% Cobrança via PIX/Cartão</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-400 font-mono block">Taxa Gateway Asaas (PIX)</span>
                    <div className="text-xl font-bold text-slate-300 font-display font-mono">
                      {splitResult.asaasGatewayFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-[10px] text-slate-500">Tarifa fixa do Asaas por PIX recebido</p>
                  </div>

                  <div className="bg-slate-950 border border-blue-500/30 p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-blue-300 font-mono block">Comissão SaaS BJJ Academy</span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 font-mono font-bold px-1.5 py-0.5 rounded">
                        {splitResult.platformPercent}%
                      </span>
                    </div>
                    <div className="text-xl font-bold text-blue-400 font-display font-mono">
                      {splitResult.platformFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-[10px] text-blue-300/80">Retido para a carteira Master da plataforma</p>
                  </div>

                  <div className="bg-slate-950 border border-emerald-500/30 p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-300 font-mono block">Líquido na Subconta Academia</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded">
                        {splitResult.academyPercent}%
                      </span>
                    </div>
                    <div className="text-xl font-bold text-emerald-400 font-display font-mono">
                      {splitResult.academyNet.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-[10px] text-emerald-300/80">Disponível para saque bancário da academia</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Subaccounts Cards Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Subcontas Ativas por Academia (Isolamento Financeiro)</span>
              <span className="text-[10px] text-slate-500 font-normal">{subaccounts.length} subcontas vinculadas</span>
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {subaccounts.map((sub) => {
                const academy = academies.find(a => a.id === sub.academyId);
                return (
                  <div
                    key={sub.id}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all rounded-2xl p-5 space-y-4 shadow-xl relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">
                          {sub.academyName}
                        </span>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          CNPJ: <strong className="text-slate-300">{sub.cnpjOrCpf}</strong>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                        {sub.status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Asaas Wallet ID:</span>
                        <span className="text-indigo-400 font-bold text-[11px]">{sub.walletId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Subdomínio:</span>
                        <span className="text-blue-400 text-[11px]">{academy?.subdomain || `${sub.academyId}.bjjacademy.app.br`}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">API Key Dedicada:</span>
                        <span className="text-slate-400 text-[11px]">{sub.apiKeyMasked}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Regra de Split:</span>
                        <span className="text-emerald-400 font-bold text-[11px]">
                          {sub.splitPercentageAcademy}% Academia / {sub.splitPercentagePlatform}% SaaS
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 block font-mono">Saldo Total</span>
                        <span className="text-xs font-bold text-white font-mono">
                          {sub.balanceTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[9px] text-emerald-400 block font-mono">Disponível</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {sub.balanceAvailable.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[9px] text-amber-400 block font-mono">A Liberar</span>
                        <span className="text-xs font-bold text-amber-400 font-mono">
                          {sub.balancePending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const link = generateAsaasPaymentLink(sub.walletId, 220, "Matricula BJJ", sub.academyName);
                          copyToClipboard(link);
                          triggerToast(`Link de pagamento com Split copiado para ${sub.academyName}!`);
                        }}
                        className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Gerar Link Split
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSubaccountForModal(sub);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold p-2 rounded-xl border border-slate-700 transition-all"
                        title="Ver Detalhes da Subconta"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
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

      {/* SUB-TAB: REDIS WEBHOOK QUEUE & ASYNC WORKERS */}
      {activeSubTab === "redis-queue" && (
        <div className="space-y-6 animate-in fade-in duration-200" id="redis-queue-panel">
          {/* Header & Quick Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                  <Cpu className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                    Redis Webhook Queue & Background Worker Engine
                    <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      REDIS + WORKER
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fila assíncrona de webhooks com idempotência contra duplicidade, retries com backoff exponencial e Dead Letter Queue (DLQ).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={fetchRedisQueueData}
                disabled={isRefreshingQueue}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQueue ? "animate-spin text-emerald-400" : ""}`} />
                Atualizar Fila
              </button>

              <button
                onClick={handleClearQueues}
                className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700/60 flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar Histórico
              </button>
            </div>
          </div>

          {/* Engine Status Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-slate-200">
                  {redisStats.connected ? "Conectado ao Redis Server" : "Worker Concorrente Ativo (Modo Resiliente)"}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="font-mono text-slate-400 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>Host: <strong className="text-slate-300">{redisStats.redisHost}</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] text-slate-400">
              <div>
                <span>Throughput: </span>
                <strong className="text-emerald-400">{redisStats.processedPerMinute} jobs/min</strong>
              </div>
              <span className="text-slate-700">•</span>
              <div>
                <span>Latência Média: </span>
                <strong className="text-blue-400">{redisStats.avgLatencyMs}ms</strong>
              </div>
              <span className="text-slate-700">•</span>
              <div>
                <span>Uptime Worker: </span>
                <strong className="text-slate-300">{Math.floor(redisStats.uptimeSeconds / 60)}m {redisStats.uptimeSeconds % 60}s</strong>
              </div>
            </div>
          </div>

          {/* 4 Live Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Fila de Espera (Pending)</span>
                <Inbox className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400 font-display">
                {redisStats.waiting}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {redisStats.waiting > 0 ? "Aguardando consumo pelo Worker" : "Fila limpa, sem atrasos"}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Em Execução (Active)</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 font-display">
                {redisStats.active}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Concorrência de processamento ativa
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Concluídos com Idempotência</span>
                <CheckCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-display">
                {redisStats.completed}
              </div>
              <p className="text-[10px] text-emerald-400/80 font-mono">
                100% livres de duplicidade
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Dead Letter Queue (DLQ)</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-rose-400 font-display">
                {redisStats.deadLetter}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Falhas após 3 tentativas
              </p>
            </div>
          </div>

          {/* Interactive Simulation & Test Suite */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-400 fill-red-400" />
                  Simulador de Ingestão de Webhooks no Redis
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dispare eventos simulados do gateway Asaas para testar o enfileiramento, conciliação e idempotência.
                </p>
              </div>

              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                POST /api/webhooks/asaas → Redis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => handleSimulateRedisWebhook("PAYMENT_RECEIVED", "Matheus Tatame", 180)}
                disabled={isSimulatingWebhook}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 p-3 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>PAYMENT_RECEIVED</span>
                  <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  PIX Confirmado R$ 180 (Aplica Split e libera aluno na catraca).
                </p>
              </button>

              <button
                onClick={() => handleSimulateRedisWebhook("PAYMENT_CONFIRMED", "Juliana Silva", 240)}
                disabled={isSimulatingWebhook}
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 p-3 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>PAYMENT_CONFIRMED</span>
                  <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cartão Aprovado R$ 240 (Baixa automática no financeiro da unidade).
                </p>
              </button>

              <button
                onClick={() => handleSimulateRedisWebhook("PAYMENT_OVERDUE", "Thiago Gracie", 150)}
                disabled={isSimulatingWebhook}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 p-3 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>PAYMENT_OVERDUE</span>
                  <span className="text-rose-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Fatura Vencida (Calcula juros/multa e bloqueia catraca).
                </p>
              </button>

              <button
                onClick={handleSimulateBatch}
                disabled={isSimulatingWebhook}
                className="bg-gradient-to-r from-red-600/30 to-amber-600/30 hover:from-red-600/40 hover:to-amber-600/40 text-white border border-red-500/40 p-3 rounded-xl text-left transition-all shadow-md group"
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    DISPARAR LOTE CONCORRENTE
                  </span>
                  <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform">⚡</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Enfileira 4 webhooks de uma vez para testar consumo paralelo do Worker.
                </p>
              </button>
            </div>
          </div>

          {/* Real-time Jobs Stream Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Database className="w-4 h-4 text-red-400" />
                  Stream de Jobs no Redis (Últimos Processamentos)
                </h3>
                <p className="text-xs text-slate-400">
                  Visualização em tempo real das mensagens enfileiradas e tratadas pelo background worker.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Total registrado: <strong className="text-white">{redisJobs.length} jobs</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Job ID & Horário</th>
                    <th className="p-3">Provedor & Evento</th>
                    <th className="p-3">Status Fila</th>
                    <th className="p-3">Tentativas</th>
                    <th className="p-3">Tempo Execução</th>
                    <th className="p-3">Ação Executada / Idempotência</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {redisJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono text-slate-400 text-[11px]">
                        <div className="font-semibold text-slate-200">{job.id}</div>
                        <div className="text-[10px] text-slate-500">{new Date(job.enqueuedAt).toLocaleTimeString()}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-white">{job.provider}</div>
                        <div className="font-mono text-[10px] text-slate-400">{job.eventType}</div>
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold ${
                          job.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : job.status === "processing"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                            : job.status === "dead_letter"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        }`}>
                          {job.status === "completed" && "✅ COMPLETED"}
                          {job.status === "processing" && "⚙️ PROCESSING"}
                          {job.status === "queued" && "📥 QUEUED"}
                          {job.status === "dead_letter" && "🚨 DEAD LETTER"}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-slate-300">
                        {job.attempts} / {job.maxAttempts}
                      </td>

                      <td className="p-3 font-mono text-slate-300">
                        {job.executionTimeMs ? `${job.executionTimeMs}ms` : "-"}
                      </td>

                      <td className="p-3 text-slate-300 text-[11px] max-w-xs truncate" title={job.actionTaken || job.error}>
                        {job.actionTaken || job.error || "Enfileirado na lista Redis..."}
                      </td>

                      <td className="p-3 text-right">
                        {job.status === "dead_letter" ? (
                          <button
                            onClick={() => handleRetryDlqJob(job.id)}
                            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[10px] px-2.5 py-1 rounded font-semibold transition-all"
                          >
                            Reprocessar DLQ
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">Idempotent</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Technical Architecture Explanation Box */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2 uppercase tracking-wider">
              <Code className="w-4 h-4 text-emerald-400" />
              Fluxo da Arquitetura Redis de Alta Confiabilidade
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <strong className="text-white block font-sans">1. Produtor & Resposta Rápida</strong>
                <p className="text-[11px] leading-relaxed">
                  O endpoint <code className="text-emerald-400 font-mono">/api/webhooks/asaas</code> recebe o evento, valida o cabeçalho de assinatura, gera a chave de idempotência e empurra para a fila Redis com <code className="text-blue-300 font-mono">LPUSH</code>, retornando HTTP 200 em menos de 10ms.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <strong className="text-white block font-sans">2. Worker & Idempotência Atômica</strong>
                <p className="text-[11px] leading-relaxed">
                  O Background Worker consome via <code className="text-amber-400 font-mono">RPOP</code>, verifica a chave <code className="text-amber-300 font-mono">bjj:idempotency:*</code> com TTL de 7 dias e aplica a lógica de Split da academia no banco de dados.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <strong className="text-white block font-sans">3. Retry Backoff & Dead Letter Queue</strong>
                <p className="text-[11px] leading-relaxed">
                  Falhas transitórias de rede sofrem retry automático com backoff exponencial. Se atingir 3 tentativas sem sucesso, o job é movido com segurança para <code className="text-rose-400 font-mono">bjj:queue:webhooks:dlq</code> para auditoria e replay manual.
                </p>
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

      {/* SUB-TAB 6: ARQUITETURA CLOUDFLARE, CLOUD RUN, POSTGRESQL & REDIS */}
      {activeSubTab === "api-docs" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Architecture Visual Topology Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-indigo-500/30 p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                    Topologia de Produção Enterprise
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      CLOUDFLARE + CLOUD RUN + POSTGRESQL
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    Infraestrutura resiliente de alto rendimento configurada para o domínio oficial <strong>bjjacademy.app.br</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Sistema Operando 100%
                </span>
              </div>
            </div>

            {/* Visual Node Flow */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs">
              {/* Node 1 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-2 shadow-lg flex flex-col items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-display">1. Cloudflare DNS</strong>
                  <span className="text-[10px] text-amber-400 font-mono">bjjacademy.app.br</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">WAF, DDoS Shield, Edge SSL Full Strict & CDN</p>
              </div>

              {/* Node 2 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 space-y-2 shadow-lg flex flex-col items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-display">2. GCP Cloud Run</strong>
                  <span className="text-[10px] text-blue-400 font-mono">Auto-Scaling Serverless</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Containers Node 20 / Express + React 19 SPA</p>
              </div>

              {/* Node 3 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-red-500/30 space-y-2 shadow-lg flex flex-col items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-display">3. Redis Queue</strong>
                  <span className="text-[10px] text-red-400 font-mono">Async Webhooks</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Idempotência atômica e Dead Letter Queue (DLQ)</p>
              </div>

              {/* Node 4 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-2 shadow-lg flex flex-col items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-display">4. PostgreSQL 16</strong>
                  <span className="text-[10px] text-emerald-400 font-mono">Row-Level Security</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Índices B-Tree compostos em tenant_id</p>
              </div>

              {/* Node 5 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-teal-500/30 space-y-2 shadow-lg flex flex-col items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-display">5. Asaas Subcontas</strong>
                  <span className="text-[10px] text-teal-400 font-mono">Split Automático 95/5</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Carteiras isoladas por academia com repasse direto</p>
              </div>
            </div>
          </div>

          {/* DNS & Cloudflare Setup Card */}
          <div className="p-5 bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950 rounded-2xl border border-blue-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                    Tabela de Apontamentos DNS: <span className="text-blue-400 font-mono">bjjacademy.app.br</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Delegação do Registro.br para a Cloudflare e roteamento para o GCP Cloud Run</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                SSL / Edge Certificates Ativo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[10px] text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase">
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3">Nome / Host</th>
                    <th className="py-2 px-3">Valor / Destino</th>
                    <th className="py-2 px-3">Proxy Cloudflare</th>
                    <th className="py-2 px-3">Propósito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  <tr>
                    <td className="py-2 px-3 text-blue-400 font-bold">A</td>
                    <td className="py-2 px-3 text-slate-200">@</td>
                    <td className="py-2 px-3 text-emerald-400">216.239.32.21 / 216.239.34.21</td>
                    <td className="py-2 px-3 text-amber-400 font-bold">Proxied (Laranja)</td>
                    <td className="py-2 px-3 text-slate-400">Roteamento Raiz (bjjacademy.app.br)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-indigo-400 font-bold">CNAME</td>
                    <td className="py-2 px-3 text-slate-200">www</td>
                    <td className="py-2 px-3 text-emerald-400">ghs.googlehosted.com.</td>
                    <td className="py-2 px-3 text-amber-400 font-bold">Proxied (Laranja)</td>
                    <td className="py-2 px-3 text-slate-400">Subdomínio Web Oficial</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-purple-400 font-bold">CNAME</td>
                    <td className="py-2 px-3 text-slate-200">api</td>
                    <td className="py-2 px-3 text-emerald-400">ghs.googlehosted.com.</td>
                    <td className="py-2 px-3 text-amber-400 font-bold">Proxied (Laranja)</td>
                    <td className="py-2 px-3 text-slate-400">API REST & Webhook Ingestion</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-emerald-400 font-bold">CNAME</td>
                    <td className="py-2 px-3 text-slate-200">* (Wildcard)</td>
                    <td className="py-2 px-3 text-emerald-400">ghs.googlehosted.com.</td>
                    <td className="py-2 px-3 text-amber-400 font-bold">Proxied (Laranja)</td>
                    <td className="py-2 px-3 text-slate-400">Subdomínios Multi-Tenant (*.bjjacademy.app.br)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Database Security & Indexing Section */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                    Banco de Dados PostgreSQL & Indexação Multi-Tenant
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      100% INDEXED (tenant_id)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Arquitetura de isolamento estrito de dados por academia para evitar vazamento entre clientes (Data Leak Prevention + RLS).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  RLS + B-Tree Indexes Ativos
                </span>
              </div>
            </div>

            {/* Matrix of Indexes */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-slate-200 font-display flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Matriz de Auditoria de Índices Multi-Tenant no PostgreSQL
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Arquivo de Migração: <code>/src/db/indexes.sql</code>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-mono">students</strong>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">RLS ACTIVE</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>• <code>idx_students_tenant_id (tenant_id)</code></div>
                    <div>• <code>idx_students_tenant_status (tenant_id, status)</code></div>
                    <div>• <code>unique_students_tenant_cpf (tenant_id, cpf)</code></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-mono">payments_history</strong>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">RLS ACTIVE</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>• <code>idx_payments_tenant_id (tenant_id)</code></div>
                    <div>• <code>idx_payments_tenant_status (tenant_id, status)</code></div>
                    <div>• <code>idx_payments_tenant_due_date (tenant_id, due_date)</code></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-mono">subscriptions</strong>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">RLS ACTIVE</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>• <code>idx_subscriptions_tenant_id (tenant_id)</code></div>
                    <div>• <code>idx_subscriptions_tenant_status (tenant_id, status)</code></div>
                    <div>• <code>idx_subscriptions_tenant_due (tenant_id, next_due_date)</code></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-mono">attendances</strong>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">RLS ACTIVE</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>• <code>idx_attendances_tenant_id (tenant_id)</code></div>
                    <div>• <code>idx_attendances_tenant_date (tenant_id, date DESC)</code></div>
                    <div>• <code>idx_attendances_tenant_ai (tenant_id, verified_by_ai)</code></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-mono">leads (CRM)</strong>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">RLS ACTIVE</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>• <code>idx_leads_tenant_id (tenant_id)</code></div>
                    <div>• <code>idx_leads_tenant_stage (tenant_id, stage)</code></div>
                    <div>• <code>idx_leads_tenant_created (tenant_id, created_at DESC)</code></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-mono">webhook_jobs (Redis DLQ)</strong>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">RLS ACTIVE</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>• <code>idx_webhook_jobs_tenant_id (tenant_id)</code></div>
                    <div>• <code>idx_webhook_jobs_tenant_status (tenant_id, status)</code></div>
                    <div>• <code>unique_webhook_jobs_provider_event (provider, event_id)</code></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Code / Schema View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {/* REST Endpoints Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <span className="text-indigo-400 font-bold uppercase text-[10px] block">OpenAPI / Swagger Endpoints</span>
                
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">POST</span>
                    <span className="text-slate-200 text-[11px]">/api/webhooks/asaas</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Ingestão assíncrona de webhooks com enfileiramento no Redis e conciliação por tenant.</p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded">GET</span>
                    <span className="text-slate-200 text-[11px]">/api/database/tenant-index-audit</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Auditoria automatizada dos índices PostgreSQL e integridade de isolamento.</p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-teal-500/20 text-teal-400 text-[10px] font-bold px-1.5 py-0.5 rounded">GET</span>
                    <span className="text-slate-200 text-[11px]">/api/infrastructure/architecture-status</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Status em tempo real da arquitetura Cloudflare, Cloud Run e Subcontas Asaas.</p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded">GET</span>
                    <span className="text-slate-200 text-[11px]">/api/webhooks/queue/stats</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Telemetria em tempo real do Worker Redis e Dead Letter Queue.</p>
                </div>
              </div>

              {/* Prisma Schema Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs text-slate-300">
                <span className="text-amber-400 font-bold uppercase text-[10px] block">Prisma PostgreSQL Schema (`prisma/schema.prisma`)</span>
                <pre className="p-3 bg-slate-900 rounded-lg text-[10px] text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800 max-h-56">
{`// Model Student com Índices B-Tree e RLS
model Student {
  id                    String            @id @default(uuid())
  tenantId              String            @map("tenant_id")
  academy               Academy           @relation(fields: [tenantId], references: [id])
  name                  String
  cpf                   String?
  status                StudentStatus     @default(ACTIVE)
  planValue             Decimal           @db.Decimal(10, 2)
  billingType           BillingType       @default(PIX)
  asaasCustomerId       String?
  asaasSubscriptionId   String?

  @@unique([tenantId, cpf], name: "unique_tenant_student_cpf")
  @@index([tenantId], name: "idx_students_tenant_id")
  @@index([tenantId, status], name: "idx_students_tenant_status")
  @@index([tenantId, asaasCustomerId], name: "idx_students_tenant_asaas_cust")
  @@index([tenantId, belt], name: "idx_students_tenant_belt")
  @@map("students")
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: LICENÇAS BJJ ACADEMY (SAAS PLATFORM MASTER OU ASSINATURA DA UNIDADE) */}
      {activeSubTab === "saas" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {currentRole === "ADMIN_MASTER" || selectedAcademyId === "ALL" ? (
            <SaasBillingView 
              academies={academies} 
              students={students} 
            />
          ) : (
            <MyAcademySubscription
              academy={academies.find(a => a.id === selectedAcademyId) || academies[0]}
              students={students}
            />
          )}
        </div>
      )}

      {/* MODAL: NOVO ALUNO COM ASAAS INTEGRADO */}
      {showNewAsaasStudentModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-6 md:p-8 rounded-2xl max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
                <p className="text-xs text-slate-400">Cria o cliente, agenda vencimento no mês seguinte e gera cobrança automática</p>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria de Treino</label>
                  <select
                    value={newStudentForm.category}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Adulto">Adulto (+18)</option>
                    <option value="Kids / Infantil">Kids / Infantil (Menor de Idade)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Graduação / Faixa</label>
                  <select
                    value={newStudentForm.belt}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, belt: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="White">Branca</option>
                    <option value="Grey">Cinza (Kids)</option>
                    <option value="Yellow">Amarela (Kids)</option>
                    <option value="Orange">Laranja (Kids)</option>
                    <option value="Green">Verde (Kids)</option>
                    <option value="Blue">Azul</option>
                    <option value="Purple">Roxa</option>
                    <option value="Brown">Marrom</option>
                    <option value="Black">Preta</option>
                  </select>
                </div>
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

              {/* Se for Kids: Campos de Responsável Legal */}
              {newStudentForm.category === "Kids / Infantil" && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-3">
                  <span className="text-[11px] font-bold text-indigo-300 block font-mono">
                    👨‍👩‍👧 DADOS DOS PAIS / RESPONSÁVEL LEGAL (NOTIFICAÇÕES DE COBRANÇA)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nome do Pai / Mãe / Responsável</label>
                      <input
                        type="text"
                        required={newStudentForm.category === "Kids / Infantil"}
                        placeholder="Ex: Renata Alencar (Mãe)"
                        value={newStudentForm.guardianName}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, guardianName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">WhatsApp do Responsável</label>
                      <input
                        type="text"
                        required={newStudentForm.category === "Kids / Infantil"}
                        placeholder="(11) 97711-2233"
                        value={newStudentForm.guardianPhone}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, guardianPhone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CPF do Aluno / Responsável</label>
                  <input
                    type="text"
                    placeholder="123.456.789-00"
                    value={newStudentForm.cpf}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, cpf: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Telefone Contato</label>
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
                    onChange={(e) => {
                      const p = e.target.value as SubscriptionPlan;
                      const val = p === "Mensal" ? 220 : p === "Trimestral" ? 210 : p === "Semestral" ? 200 : 180;
                      setNewStudentForm({ ...newStudentForm, plan: p, planValue: val });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Mensal">Mensal (R$ 220)</option>
                    <option value="Trimestral">Trimestral (R$ 210)</option>
                    <option value="Semestral">Semestral (R$ 200)</option>
                    <option value="Anual">Anual (R$ 180)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dia do Vencimento Mensal</label>
                  <select
                    value={newStudentForm.paymentDueDay}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, paymentDueDay: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-emerald-400 font-bold font-mono focus:outline-none"
                  >
                    <option value={5}>Todo dia 05</option>
                    <option value={10}>Todo dia 10</option>
                    <option value={15}>Todo dia 15</option>
                    <option value={20}>Todo dia 20</option>
                    <option value={25}>Todo dia 25</option>
                    <option value={28}>Todo dia 28</option>
                  </select>
                </div>
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

              {/* Banner Informativo de Geração Automática */}
              {(() => {
                const today = new Date();
                const nextM = new Date(today.getFullYear(), today.getMonth() + 1, Number(newStudentForm.paymentDueDay) || 10);
                return (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Automação de Matrícula e Próxima Mensalidade:
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      • <strong>1º Ciclo (Hoje):</strong> R$ {newStudentForm.planValue},00 gerado e liquidado no ato da matrícula.<br/>
                      • <strong>Próximo Vencimento:</strong> {nextM.toLocaleDateString("pt-BR")} (R$ {newStudentForm.planValue},00 gerado automaticamente).
                    </p>
                  </div>
                );
              })()}

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
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar Matrícula & Gerar Mensalidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPARO DE COBRANÇA COM JUROS (WHATSAPP & CENTRAL DE MENSAGENS) */}
      {showSendNotificationModal && selectedPaymentForNotification && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 p-6 md:p-7 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSendNotificationModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  Enviar Cobrança com Juros de Mora
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    {notificationOverdueDays} DIAS ATRASO
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Notifique o contato salvo ({notificationRecipientType === "GUARDIAN" ? "Pais / Responsável" : "Atleta"}) via WhatsApp ou Central de Mensagens.
                </p>
              </div>
            </div>

            {/* Cartão de Detalhes do Destinatário & Discriminação Financeira */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-850">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">
                    {notificationRecipientType === "GUARDIAN" ? "👨‍👩‍👧 Contato dos Pais / Responsável" : "🥋 Contato do Aluno"}
                  </span>
                  <strong className="text-sm text-white block">{notificationRecipientName}</strong>
                </div>
                <div className="font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 w-fit">
                  📞 {notificationRecipientPhone || "Sem telefone cadastrado"}
                </div>
              </div>

              {/* Tabela de Cálculo de Multa e Juros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Valor Original</span>
                  <span className="text-white font-bold">
                    R$ {(selectedPaymentForNotification.amount || 220).toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-amber-400 block text-[10px]">Multa (2.0%)</span>
                  <span className="text-amber-300 font-bold">
                    + R$ {notificationFineAmount.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-rose-400 block text-[10px]">Juros ({notificationOverdueDays}d)</span>
                  <span className="text-rose-300 font-bold">
                    + R$ {notificationInterestAmount.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-emerald-950/80 rounded-lg border border-emerald-500/30">
                  <span className="text-emerald-400 block text-[10px]">Total Refeito</span>
                  <span className="text-emerald-300 font-bold text-xs">
                    R$ {notificationUpdatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Editor de Texto da Mensagem (WhatsApp / CRM) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" /> Prévia da Mensagem (Editável)
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    await copyToClipboard(notificationMessageText);
                    triggerToast("Texto da mensagem copiado para a área de transferência!");
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline font-mono"
                >
                  Copiar Texto
                </button>
              </div>
              <textarea
                rows={7}
                value={notificationMessageText}
                onChange={(e) => setNotificationMessageText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500/50 leading-relaxed"
              />
            </div>

            {/* Linha Digitável PIX Copia e Cola */}
            {notificationPixCode && (
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
                <div className="overflow-hidden">
                  <span className="text-[10px] text-slate-400 block">PIX Copia e Cola com Valor Atualizado:</span>
                  <span className="text-emerald-400 truncate block text-[11px]">{notificationPixCode}</span>
                </div>
                <button
                  onClick={async () => {
                    await copyToClipboard(notificationPixCode);
                    triggerToast("Código PIX com juros copiado com sucesso!");
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1 flex-shrink-0"
                >
                  <Copy className="w-3 h-3 text-emerald-400" /> Copiar
                </button>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendViaWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" /> Disparar via WhatsApp
              </button>

              <button
                type="button"
                onClick={handleSendViaCentralMessages}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4" /> Enviar pela Central CRM
              </button>
            </div>
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

            <div className="p-2.5 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px]">Chave PIX da Plataforma:</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase">SALVA</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-emerald-400 font-bold select-all truncate">{pixConfig.pixKey}</strong>
                <button
                  type="button"
                  onClick={async () => {
                    await copyToClipboard(pixConfig.pixKey);
                    triggerToast(`Chave PIX (${pixConfig.pixKey}) copiada!`);
                  }}
                  className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-2.5 h-2.5 text-emerald-400" /> Copiar
                </button>
              </div>
              <p className="text-slate-500 text-[10px]">Titular: {pixConfig.receiverName} ({pixConfig.bankName})</p>
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
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-500">Chave PIX Usada:</span>
                <span className="text-emerald-400 font-bold">{pixConfig.pixKey}</span>
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

      {/* MODAL: CONFIGURAR E SALVAR CHAVE PIX DA PLATAFORMA */}
      {showPixConfigModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-6 rounded-2xl max-w-lg w-full space-y-5 shadow-2xl relative text-xs animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPixConfigModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  Configurar Chave PIX da BJJ Academy
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                    ÁREA DE COBRANÇA
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Salve sua chave PIX para recebimento direto de mensalidades, faturas de licença e cobranças automáticas via WhatsApp.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePixConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tipo de Chave */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Chave PIX</label>
                  <select
                    value={pixConfigForm.pixKeyType}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, pixKeyType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="EMAIL">E-mail</option>
                    <option value="CPF_CNPJ">CPF ou CNPJ</option>
                    <option value="PHONE">Telefone Celular</option>
                    <option value="RANDOM_EVP">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                {/* Valor da Chave */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sua Chave PIX</label>
                  <input
                    type="text"
                    required
                    value={pixConfigForm.pixKey}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, pixKey: e.target.value })}
                    placeholder="ex: messiasbjunior76@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nome do Titular */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Titular / Razão Social</label>
                  <input
                    type="text"
                    required
                    value={pixConfigForm.receiverName}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, receiverName: e.target.value })}
                    placeholder="ex: Messias B. Junior"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Instituição / Banco */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Banco / Instituição Financeira</label>
                  <input
                    type="text"
                    required
                    value={pixConfigForm.bankName}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, bankName: e.target.value })}
                    placeholder="ex: Asaas / Nu Pagamentos / Banco Inter"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cidade */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cidade do Titular</label>
                  <input
                    type="text"
                    value={pixConfigForm.receiverCity}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, receiverCity: e.target.value })}
                    placeholder="ex: São Paulo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Descrição Padrão */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Descrição / Identificador</label>
                  <input
                    type="text"
                    value={pixConfigForm.description}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, description: e.target.value })}
                    placeholder="ex: Fatura de Mensalidade BJJ Academy"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Opções de Automação */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixConfigForm.autoIncludeInInvoices}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, autoIncludeInInvoices: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                  />
                  <span className="text-slate-300 font-medium">Incluir automaticamente esta Chave PIX em todas as Faturas de Licença SaaS</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixConfigForm.autoIncludeInWhatsApp}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, autoIncludeInWhatsApp: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                  />
                  <span className="text-slate-300 font-medium">Incluir dados desta Chave PIX nos avisos de cobrança disparados via WhatsApp</span>
                </label>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-1">
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase block">Preview da Chave Salva:</span>
                <div className="font-mono text-xs text-white">
                  Chave ({pixConfigForm.pixKeyType}): <strong className="text-emerald-300">{pixConfigForm.pixKey || "---"}</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Beneficiário: <strong className="text-slate-300">{pixConfigForm.receiverName || "---"}</strong> • Banco: <strong className="text-slate-300">{pixConfigForm.bankName || "---"}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await copyToClipboard(pixConfigForm.pixKey);
                    triggerToast(`Chave (${pixConfigForm.pixKey}) copiada para teste!`);
                  }}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4 text-emerald-400" /> Copiar para Teste
                </button>

                <button
                  type="submit"
                  className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Salvar Minha Chave PIX na Plataforma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
