export type BeltColor = "White" | "Grey" | "Yellow" | "Orange" | "Green" | "Blue" | "Purple" | "Brown" | "Black";

export interface Academy {
  id: string;
  name: string;
  unit: string;
  activeStudents: number;
  monthlyRevenue: number;
  pendingGraduations: number;
  instructorsCount: number;
  subdomain?: string; // e.g. "gracie", "alliance", "atos"
  customDomain?: string; // e.g. "gracie.bjjacademy.app.br"
  asaasWalletId?: string; // Asaas Subaccount Wallet ID e.g. "wal_098231902"
  asaasSubaccountId?: string; // e.g. "subacc_8819203"
  splitRatePercentage?: number; // e.g. 95 (Academy gets 95%, Platform retains 5%)
  platformFeeFixed?: number; // e.g. 0.00 or R$ 2.90
  status?: "Active" | "Pending_KYC" | "Suspended";
}

export interface Instructor {
  id: string;
  academyId: string;
  name: string;
  email: string;
  phone: string;
  belt: BeltColor;
  birthDate: string;
  status: "Active" | "Inactive";
}

export type SubscriptionPlan = "Mensal" | "Trimestral" | "Semestral" | "Anual";
export type PaymentBillingType = "PIX" | "BOLETO" | "CREDIT_CARD" | "CASH";

export interface Student {
  id: string;
  academyId: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  plan?: SubscriptionPlan;
  planValue?: number;
  belt: BeltColor;
  stripes: number; // 0 to 4
  attendance30Days: number;
  daysSinceLastClass: number;
  status: "Active" | "Inactive" | "ChurnRisk";
  paymentStatus: "Paid" | "Overdue" | "Pending";
  registrationDate: string;
  birthDate: string;
  category?: "Adulto" | "Kids / Infantil";
  guardianName?: string;
  guardianPhone?: string;
  guardianNotes?: string;
  studyPlanAssigned?: boolean;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  billingType?: PaymentBillingType;
  loyaltyPoints?: number;
  loyaltyTier?: "Bronze" | "Prata" | "Ouro" | "Black Belt VIP";
  referralCode?: string;
  badges?: string[];
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: "Desconto" | "Equipamento" | "Experiência" | "Graduação";
  stock: number;
  iconName: string;
}

export interface LoyaltyTransaction {
  id: string;
  studentId: string;
  studentName: string;
  points: number;
  type: "EARN_CHECKIN" | "EARN_STREAK" | "EARN_REFERRAL" | "REDEEM_REWARD";
  description: string;
  date: string;
}

export interface Lead {
  id: string;
  academyId: string;
  name: string;
  email: string;
  phone: string;
  phase: "Capture" | "Trial Scheduled" | "Trial Attended" | "Proposal" | "Won" | "Lost";
  notes: string;
  dateCreated: string;
}

export interface ClassSchedule {
  id: string;
  academyId: string;
  className: string;
  instructorName: string;
  time: string;
  daysOfWeek: string[];
  activeCount: number;
}

export interface PaymentHistory {
  id: string;
  academyId: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Failed" | "Overdue";
  method: PaymentBillingType;
  asaasInvoiceId?: string;
  pixCopiaECola?: string;
  bankSlipUrl?: string;
  dueDate?: string;
  fineAmount?: number;
  interestAmount?: number;
}

// ASAAS & MULTI-PROVIDER DATABASE SCHEMAS
export type UserRole = "ADMIN_MASTER" | "GESTOR_ACADEMIA" | "FINANCEIRO" | "PROFESSOR" | "ALUNO";

export interface AccountsPayable {
  id: string;
  academyId: string;
  description: string;
  category: "Aluguel Tatame" | "Luz e Água" | "Salários Professores" | "Equipamentos" | "Marketing" | "Software SaaS" | "Outros";
  supplier: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  notes?: string;
}

export interface AccountsReceivable {
  id: string;
  academyId: string;
  studentId: string;
  studentName: string;
  description: string;
  amount: number;
  dueDate: string;
  receivedDate?: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  billingType: PaymentBillingType;
  asaasInvoiceId?: string;
}

export interface AuditLog {
  id: string;
  academyId: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: "CREATE_CUSTOMER" | "CREATE_SUBSCRIPTION" | "PAUSE_SUBSCRIPTION" | "REACTIVATE_SUBSCRIPTION" | "CANCEL_SUBSCRIPTION" | "PROCESS_WEBHOOK" | "UPDATE_GATEWAY" | "ADD_ACCOUNT_PAYABLE" | "MANUAL_BAIXA" | "EMIT_RECEIPT";
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
}

export interface GatewayAdapterConfig {
  id: string;
  provider: "Asaas" | "Mercado Pago" | "Stripe" | "Pagar.me";
  name: string;
  isActive: boolean;
  adapterClass: string;
  supportedMethods: PaymentBillingType[];
  environment: "sandbox" | "production";
  apiKey: string;
  webhookSecret: string;
  autoReconcile: boolean;
  multaPercent: number;
  jurosPercent: number;
  discountEarlyPercent: number;
}

export interface PaymentProvider {
  id: string;
  name: "Asaas" | "Mercado Pago" | "Pagar.me" | "Iugu";
  isActive: boolean;
  apiKey: string;
  environment: "sandbox" | "production";
  webhookToken: string;
  autoWhatsappNotify: boolean;
  autoEmailNotify: boolean;
  autoSmsNotify: boolean;
  lateFeePercentage: number; // e.g. 2.0%
  dailyInterestPercentage: number; // e.g. 0.033%
}

export interface AsaasCustomer {
  id: string; // e.g. cus_0000058291
  studentId: string;
  academyId: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface AsaasSubscription {
  id: string; // e.g. sub_8839210041
  studentId: string;
  studentName: string;
  academyId: string;
  asaasCustomerId: string;
  planName: SubscriptionPlan;
  value: number;
  cycle: "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY";
  billingType: PaymentBillingType;
  status: "ACTIVE" | "OVERDUE" | "CANCELLED" | "INACTIVE";
  nextDueDate: string;
}

export interface AsaasInvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  value: number;
}

export interface AsaasInvoice {
  id: string; // e.g. pay_982138910
  subscriptionId?: string;
  studentId: string;
  studentName: string;
  academyId: string;
  value: number;
  netValue: number; // After fee
  fineValue: number;
  interestValue: number;
  billingType: PaymentBillingType;
  status: "PENDING" | "CONFIRMED" | "RECEIVED" | "OVERDUE" | "REFUNDED" | "DELETED";
  dueDate: string;
  paymentDate?: string;
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  bankSlipUrl?: string;
  bankSlipBarCode?: string;
  invoiceUrl?: string;
}

export interface AsaasWebhookEvent {
  id: string;
  event: "PAYMENT_RECEIVED" | "PAYMENT_OVERDUE" | "PAYMENT_DUEDATE_WARNING" | "PAYMENT_CREATED" | "PAYMENT_DELETED";
  timestamp: string;
  invoiceId: string;
  studentName: string;
  academyName: string;
  value: number;
  billingType: PaymentBillingType;
  payload: any;
  status: "PROCESSED" | "FAILED";
}

export interface AsaasRefund {
  id: string;
  invoiceId: string;
  studentName: string;
  amount: number;
  reason: string;
  date: string;
  status: "COMPLETED" | "PENDING";
}

export interface PaymentLog {
  id: string;
  timestamp: string;
  studentName: string;
  action: string;
  details: string;
  channel: "Asaas Webhook" | "WhatsApp Bot" | "Email Trigger" | "Manual";
}

export interface Technique {
  id: string;
  name: string;
  category: "Guard Passing" | "Guard Retention" | "Submissions" | "Escapes" | "Takedowns";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
}

export interface GraduationCandidate {
  id: string;
  academyId: string;
  studentName: string;
  currentBelt: BeltColor;
  currentStripes: number;
  attendanceCount: number;
  monthsInCurrentBelt: number;
  status: "Eligible" | "Approved" | "Pending Exam";
}

export interface MarketingCampaign {
  id: string;
  academyId: string;
  name: string;
  type: "WhatsApp" | "Email";
  status: "Draft" | "Running" | "Paused" | "Completed";
  sentCount: number;
  openRate?: number;
  clickRate?: number;
  targetAudience: string;
}

export interface SaasPlatformInvoice {
  id: string;
  academyId: string;
  academyName: string;
  unit: string;
  planName: "Starter SaaS" | "Pro SaaS" | "Enterprise SaaS";
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  billingType: PaymentBillingType;
  pixCopiaECola?: string;
  pdfUrl?: string;
  asaasInvoiceId?: string;
}

export interface RedisWebhookJob {
  id: string;
  queue: string;
  provider: "Asaas" | "MercadoPago" | "Stripe" | "Pagarme" | "Generic";
  eventId: string;
  eventType: string;
  payload: any;
  status: "queued" | "processing" | "completed" | "failed" | "dead_letter";
  attempts: number;
  maxAttempts: number;
  enqueuedAt: string;
  processedAt?: string;
  error?: string;
  tenantId?: string;
  actionTaken?: string;
  executionTimeMs?: number;
}

export interface RedisQueueStats {
  connected: boolean;
  redisHost: string;
  mode: "redis" | "in_memory_fallback";
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  deadLetter: number;
  avgLatencyMs: number;
  uptimeSeconds: number;
  processedPerMinute: number;
}

export type PostCategory = "Campeonato" | "Seminário" | "Graduação" | "Aviso Geral" | "Promoção";

export interface AcademyPost {
  id: string;
  academyId: string;
  academyName: string;
  authorName: string;
  authorRole: "Professor" | "Mestre" | "Gestor";
  title: string;
  category: PostCategory;
  description: string;
  flyerImageUrl?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  registrationFee?: number;
  registrationDeadline?: string;
  externalRegistrationUrl?: string;
  targetAudience: "Todos os Alunos" | "Equipe de Competição" | "Kids / Infantil" | "Adultos";
  pinned: boolean;
  createdAt: string;
  interestedStudentIds: string[];
  viewsCount: number;
}


