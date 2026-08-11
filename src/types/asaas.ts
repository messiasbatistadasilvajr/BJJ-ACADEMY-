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
