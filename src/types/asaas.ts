import { BeltColor, SubscriptionPlan, PaymentBillingType } from "../types";

export interface AsaasConfig {
  id: string;
  academyId: string;
  apiKey: string;
  environment: "sandbox" | "production";
  webhookSecret: string;
  autoReconcile: boolean;
  finePercentage: number; // e.g. 2.0%
  dailyInterestPercentage: number; // e.g. 0.033%
  earlyDiscountPercentage: number; // e.g. 5.0%
  notifyWhatsappOnDueDate: boolean;
  notifyEmailOnDueDate: boolean;
}

export interface AsaasCustomer {
  id: string; // e.g. cus_0000058291
  studentId: string;
  academyId: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  postalCode?: string;
  addressNumber?: string;
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
  status: "ACTIVE" | "OVERDUE" | "CANCELLED" | "PAUSED";
  nextDueDate: string;
  createdAt: string;
}

export interface AsaasInvoice {
  id: string; // e.g. pay_982138910
  subscriptionId?: string;
  studentId: string;
  studentName: string;
  academyId: string;
  value: number;
  netValue: number; // Value after Asaas fee
  fineValue: number;
  interestValue: number;
  billingType: PaymentBillingType;
  status: "PENDING" | "CONFIRMED" | "RECEIVED" | "OVERDUE" | "REFUNDED" | "DELETED";
  dueDate: string;
  paymentDate?: string;
  pixQrCodeUrl?: string;
  pixCopiaECola: string;
  bankSlipUrl?: string;
  bankSlipBarCode?: string;
  invoiceUrl?: string;
  description: string;
}

export interface AsaasFinancialMetrics {
  adimplenciaRate: number; // e.g. 92.5%
  totalReceivedMonth: number;
  totalOverdueAmount: number;
  totalPendingFuture: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  activeSubscriptionsCount: number;
  overdueCount: number;
}

export interface AsaasWebhookEvent {
  id: string;
  event: "PAYMENT_RECEIVED" | "PAYMENT_OVERDUE" | "PAYMENT_DUEDATE_WARNING" | "PAYMENT_CREATED" | "PAYMENT_DELETED" | "TRANSFER_DONE";
  timestamp: string;
  invoiceId: string;
  studentName: string;
  academyName: string;
  value: number;
  billingType: PaymentBillingType;
  payload: any;
  status: "PROCESSED" | "FAILED";
}

export interface AsaasSubaccountInfo {
  id: string; // e.g. "subacc_gracie_01"
  academyId: string;
  academyName: string;
  cnpjOrCpf: string;
  walletId: string; // e.g. "wal_889210041"
  apiKeyMasked: string;
  status: "ACTIVE" | "PENDING_DOCUMENTATION" | "SUSPENDED";
  balanceTotal: number;
  balanceAvailable: number;
  balancePending: number;
  splitPercentageAcademy: number; // e.g. 95%
  splitPercentagePlatform: number; // e.g. 5%
  autoTransferDaily: boolean;
  bankAccount: {
    bankName: string;
    agency: string;
    accountNumber: string;
    accountType: "CONTA_CORRENTE" | "CONTA_POUPANCA";
    pixKey?: string;
  };
}

export interface AsaasSplitDetail {
  invoiceId: string;
  totalGrossAmount: number;
  academyNetAmount: number; // 95%
  platformFeeAmount: number; // 5%
  gatewayFeeAsaas: number; // R$ 0.99 or 1.99%
  recipientWalletId: string;
  platformWalletId: string;
  status: "DONE" | "PENDING_SETTLEMENT";
}

export interface CloudflareArchitectureStatus {
  domain: string; // "bjjacademy.app.br"
  apiDomain: string; // "api.bjjacademy.app.br"
  cloudflareStatus: "Active" | "Proxied" | "DNS_Only";
  sslMode: "Full (Strict)";
  wafStatus: "Active - OWASP & Rate Limiting";
  cloudRunService: "bjj-academy-production (us-east1)";
  redisConnection: "Upstash / Cloud MemoryStore (Active)";
  postgresqlStatus: "PostgreSQL 16 with RLS Enabled";
  activeTenantsCount: number;
  subdomainsCount: number;
}

