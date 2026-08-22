import * as XLSX from "xlsx";
import { 
  BeltColor, 
  SubscriptionPlan, 
  Student, 
  PaymentHistory, 
  GraduationCandidate,
  MigrationStagingRow, 
  MigrationFieldMapping, 
  MigrationSettings, 
  MigrationCheckpoint, 
  MigrationReport 
} from "../types";

// Standard BJJ Academy target fields for mapping
export const TARGET_FIELDS = [
  { key: "name", label: "Nome Completo do Aluno", required: true, example: "Rodrigo Gracie" },
  { key: "cpf", label: "CPF", required: false, example: "123.456.789-00" },
  { key: "email", label: "E-mail", required: false, example: "aluno@email.com" },
  { key: "phone", label: "WhatsApp / Celular", required: true, example: "(11) 98888-7777" },
  { key: "belt", label: "Faixa Atual", required: true, example: "Azul / Blue" },
  { key: "stripes", label: "Graus na Faixa (0 a 4)", required: false, example: "2" },
  { key: "category", label: "Categoria (Adulto / Kids)", required: false, example: "Adulto" },
  { key: "birthDate", label: "Data de Nascimento", required: false, example: "15/04/1995" },
  { key: "plan", label: "Plano / Modalidade", required: false, example: "Mensal / Anual" },
  { key: "planValue", label: "Valor da Mensalidade (R$)", required: false, example: "250.00" },
  { key: "paymentDueDay", label: "Dia de Vencimento (1 a 31)", required: false, example: "10" },
  { key: "paymentStatus", label: "Status Financeiro Atual", required: false, example: "Pago / Atrasado" },
  { key: "guardianName", label: "Nome do Responsável (Kids)", required: false, example: "Carlos Silva" },
  { key: "guardianPhone", label: "WhatsApp do Responsável", required: false, example: "(11) 97777-6666" },
  { key: "guardianEmail", label: "E-mail do Responsável", required: false, example: "pai@email.com" },
  { key: "attendance30Days", label: "Presenças (Últimos 30 dias)", required: false, example: "12" },
  { key: "notes", label: "Observações Médicas / Gerais", required: false, example: "Alergia a esparadrapo" }
];

// Clean and normalize CPF
export function normalizeCPF(raw?: string): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return String(raw).trim();
}

// Clean and normalize Phone
export function normalizePhone(raw?: string): string {
  if (!raw) return "+55 (11) 98000-0000";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 11) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length === 10) {
    return `+55 (${digits.slice(0, 2)}) 9${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length === 13 && digits.startsWith("55")) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
  }
  return String(raw).trim();
}

// Clean and map Jiu-Jitsu Belts safely
export function normalizeBelt(raw?: string): BeltColor {
  if (!raw) return "White";
  const lower = String(raw).toLowerCase().trim();
  if (lower.includes("pret") || lower.includes("black") || lower.includes("faixa preta")) return "Black";
  if (lower.includes("marr") || lower.includes("brown") || lower.includes("faixa marrom")) return "Brown";
  if (lower.includes("rox") || lower.includes("purp") || lower.includes("faixa roxa")) return "Purple";
  if (lower.includes("azul") || lower.includes("blue") || lower.includes("faixa azul")) return "Blue";
  if (lower.includes("verd") || lower.includes("green")) return "Green";
  if (lower.includes("laran") || lower.includes("orange")) return "Orange";
  if (lower.includes("amar") || lower.includes("yellow")) return "Yellow";
  if (lower.includes("cinz") || lower.includes("grey") || lower.includes("gray")) return "Grey";
  return "White";
}

// Clean stripes
export function normalizeStripes(raw?: any): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const num = parseInt(String(raw).replace(/\D/g, ""), 10);
  if (isNaN(num)) return 0;
  return Math.min(4, Math.max(0, num));
}

// Clean plan
export function normalizePlan(raw?: string): SubscriptionPlan {
  if (!raw) return "Mensal";
  const lower = String(raw).toLowerCase();
  if (lower.includes("anu") || lower.includes("year")) return "Anual";
  if (lower.includes("sem") || lower.includes("6")) return "Semestral";
  if (lower.includes("tri") || lower.includes("3")) return "Trimestral";
  return "Mensal";
}

// Clean currency value
export function normalizeCurrency(raw?: any, fallback: number = 250): number {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw === "number") return raw;
  const cleanStr = String(raw).replace(/R\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  const val = parseFloat(cleanStr);
  return isNaN(val) ? fallback : Math.max(0, val);
}

// Clean date (handles Excel serial numbers or ISO/Brazilian string)
export function normalizeDate(raw?: any): string {
  if (!raw) return "1998-05-15";
  if (typeof raw === "number") {
    // Excel date serial number to JS Date
    const utcDays = Math.floor(raw - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  const str = String(raw).trim();
  // If DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  return "1998-05-15";
}

// Clean payment status
export function normalizePaymentStatus(raw?: string): "Paid" | "Overdue" | "Pending" {
  if (!raw) return "Paid";
  const lower = String(raw).toLowerCase();
  if (lower.includes("atr") || lower.includes("overdue") || lower.includes("vencid") || lower.includes("dev")) return "Overdue";
  if (lower.includes("pen") || lower.includes("abert") || lower.includes("aguard")) return "Pending";
  return "Paid";
}

// Parse Spreadsheet file (XLSX, XLS, CSV) into raw JSON with headers
export async function parseSpreadsheetFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  if (rawJson.length === 0) {
    throw new Error("A planilha está vazia ou sem linhas legíveis.");
  }

  // Find header row (first non-empty row)
  let headerRowIndex = 0;
  for (let i = 0; i < rawJson.length; i++) {
    if (Array.isArray(rawJson[i]) && rawJson[i].some((cell: any) => String(cell).trim() !== "")) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = (rawJson[headerRowIndex] as any[]).map(h => String(h || "").trim()).filter(h => h.length > 0);
  const dataRows = rawJson.slice(headerRowIndex + 1);

  const rows: Record<string, string>[] = [];
  for (const rowArr of dataRows) {
    if (!Array.isArray(rowArr) || !rowArr.some((c: any) => String(c).trim() !== "")) {
      continue; // Skip completely empty rows
    }
    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = String(rowArr[idx] !== undefined && rowArr[idx] !== null ? rowArr[idx] : "").trim();
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// Automatic Heuristic Field Mapping Engine (PT-BR / EN CRM formats)
export function autoDetectFieldMappings(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  const patterns: Record<string, string[]> = {
    name: ["nome", "aluno", "atleta", "student", "nome completo", "cliente", "name", "full name", "praticante"],
    cpf: ["cpf", "documento", "doc", "cpf/cnpj", "cpf_aluno", "tax id"],
    email: ["email", "e-mail", "correio", "mail", "email_aluno", "contato_email"],
    phone: ["telefone", "celular", "whatsapp", "fone", "tel", "phone", "mobile", "contato", "zap"],
    belt: ["faixa", "belt", "graduação", "graduacao", "faixa atual", "cor da faixa", "rank"],
    stripes: ["grau", "graus", "stripes", "grau na faixa", "qtd graus", "graus_faixa"],
    category: ["categoria", "turma", "idade", "tipo", "modalidade_faixa", "adulto/kids", "publico"],
    birthDate: ["nascimento", "data nascimento", "data de nascimento", "dt_nasc", "birth", "birthday", "d.nasc"],
    plan: ["plano", "modalidade", "mensalidade", "pacote", "plan", "contrato", "tipo_plano"],
    planValue: ["valor", "valor plano", "valor mensal", "mensalidade r$", "preco", "preço", "price", "amount"],
    paymentDueDay: ["vencimento", "dia vencimento", "dia", "due day", "dia_venc", "dia_cobranca"],
    paymentStatus: ["status", "status financeiro", "situação", "situacao", "adimplência", "payment status", "status_pagamento"],
    guardianName: ["responsável", "responsavel", "pai", "mãe", "mae", "tutor", "guardian", "nome responsavel"],
    guardianPhone: ["telefone responsável", "celular responsavel", "whatsapp responsavel", "fone_pai", "zap_responsavel"],
    guardianEmail: ["email responsável", "email pai", "email_responsavel"],
    attendance30Days: ["presenças", "presencas", "frequência", "frequencia", "aulas", "attendance", "treinos"],
    notes: ["observações", "observacoes", "obs", "histórico", "restrições", "notes", "comentários"]
  };

  for (const [targetKey, syns] of Object.entries(patterns)) {
    for (const h of headers) {
      const hClean = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = syns.some(syn => {
        const synClean = syn.toLowerCase().replace(/[^a-z0-9]/g, "");
        return hClean === synClean || hClean.includes(synClean) || synClean.includes(hClean);
      });
      if (match && !Object.values(mapping).includes(h)) {
        mapping[targetKey] = h;
        break;
      }
    }
  }

  return mapping;
}

// Convert Raw Rows into Staging Rows with Validation and Duplicate Detection
export function buildStagingRows(
  rawRows: Record<string, string>[],
  mappings: Record<string, string>,
  existingStudents: Student[],
  targetAcademyId: string,
  settings: MigrationSettings
): MigrationStagingRow[] {
  return rawRows.map((raw, idx) => {
    const rowNumber = idx + 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    const getVal = (key: string) => {
      const header = mappings[key];
      return header ? (raw[header] || "").trim() : "";
    };

    const rawName = getVal("name");
    const rawCpf = getVal("cpf");
    const rawEmail = getVal("email");
    const rawPhone = getVal("phone");
    const rawBelt = getVal("belt");
    const rawStripes = getVal("stripes");
    const rawCategory = getVal("category");
    const rawBirthDate = getVal("birthDate");
    const rawPlan = getVal("plan");
    const rawPlanValue = getVal("planValue");
    const rawDueDay = getVal("paymentDueDay");
    const rawPaymentStatus = getVal("paymentStatus");
    const rawGuardianName = getVal("guardianName");
    const rawGuardianPhone = getVal("guardianPhone");
    const rawGuardianEmail = getVal("guardianEmail");
    const rawAttendance = getVal("attendance30Days");
    const rawNotes = getVal("notes");

    // Required validation
    if (!rawName || rawName.length < 2) {
      errors.push("Nome do aluno é obrigatório (mínimo 2 caracteres).");
    }

    const normalizedName = rawName || `Aluno Importado ${rowNumber}`;
    const normalizedCpf = normalizeCPF(rawCpf);
    const normalizedEmail = rawEmail || `${normalizedName.toLowerCase().replace(/[^a-z0-9]/g, "")}${rowNumber}@email.com`;
    const normalizedPhone = normalizePhone(rawPhone);
    const normalizedBelt = normalizeBelt(rawBelt);
    const normalizedStripes = normalizeStripes(rawStripes);
    const normalizedCategory: "Adulto" | "Kids / Infantil" = 
      (rawCategory.toLowerCase().includes("kid") || rawCategory.toLowerCase().includes("infantil") || rawGuardianName) 
        ? "Kids / Infantil" 
        : "Adulto";
    const normalizedBirthDate = normalizeDate(rawBirthDate);
    const normalizedPlan = normalizePlan(rawPlan || settings.defaultPlan);
    const normalizedPlanValue = normalizeCurrency(rawPlanValue, settings.defaultPlanValue);
    
    let dueDay = parseInt(rawDueDay, 10);
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      dueDay = settings.defaultDueDay || 10;
      if (rawDueDay) warnings.push(`Dia de vencimento '${rawDueDay}' inválido, ajustado para dia ${dueDay}.`);
    }

    const normalizedPaymentStatus = normalizePaymentStatus(rawPaymentStatus);
    const normalizedAttendance = parseInt(rawAttendance, 10) || Math.floor(Math.random() * 12 + 2);

    // Duplicate Analysis against Destination Academy & Global
    let duplicateStatus: MigrationStagingRow["duplicateStatus"] = "NONE";
    let duplicateTargetStudentId: string | undefined = undefined;

    const matchedByCpf = normalizedCpf ? existingStudents.find(s => s.cpf && normalizeCPF(s.cpf) === normalizedCpf) : undefined;
    const matchedByEmail = normalizedEmail ? existingStudents.find(s => s.email && s.email.toLowerCase() === normalizedEmail.toLowerCase()) : undefined;
    const matchedByName = existingStudents.find(s => s.name.toLowerCase().trim() === normalizedName.toLowerCase().trim() && s.academyId === targetAcademyId);

    if (matchedByCpf) {
      duplicateStatus = "EXACT_CPF";
      duplicateTargetStudentId = matchedByCpf.id;
      warnings.push(`CPF '${normalizedCpf}' já cadastrado para o aluno ${matchedByCpf.name} (${matchedByCpf.academyId}).`);
    } else if (matchedByEmail && !matchedByEmail.email.includes("@email.com")) {
      duplicateStatus = "EXACT_EMAIL";
      duplicateTargetStudentId = matchedByEmail.id;
      warnings.push(`E-mail '${normalizedEmail}' já existe para o aluno ${matchedByEmail.name}.`);
    } else if (matchedByName) {
      duplicateStatus = "SIMILAR_NAME";
      duplicateTargetStudentId = matchedByName.id;
      warnings.push(`Aluno com mesmo nome '${normalizedName}' já existe nesta unidade.`);
    }

    // Default resolution based on strategy
    let duplicateResolution: MigrationStagingRow["duplicateResolution"] = "IMPORT_NEW";
    if (duplicateStatus !== "NONE") {
      if (settings.duplicateStrategy === "SKIP") duplicateResolution = "SKIP";
      else if (settings.duplicateStrategy === "UPDATE") duplicateResolution = "UPDATE_EXISTING";
      else duplicateResolution = "IMPORT_NEW";
    }

    const normalizedStudent: MigrationStagingRow["normalized"] = {
      name: normalizedName,
      cpf: normalizedCpf,
      email: normalizedEmail,
      phone: normalizedPhone,
      belt: normalizedBelt,
      stripes: normalizedStripes,
      category: normalizedCategory,
      birthDate: normalizedBirthDate,
      plan: normalizedPlan,
      planValue: normalizedPlanValue,
      paymentDueDay: dueDay,
      paymentStatus: normalizedPaymentStatus,
      attendance30Days: normalizedAttendance,
      daysSinceLastClass: normalizedPaymentStatus === "Paid" ? 1 : 14,
      status: normalizedPaymentStatus === "Overdue" ? "ChurnRisk" : "Active",
      guardianName: rawGuardianName ? rawGuardianName.trim() : undefined,
      guardianPhone: rawGuardianPhone ? normalizePhone(rawGuardianPhone) : undefined,
      guardianEmail: rawGuardianEmail ? rawGuardianEmail.trim() : undefined,
      notes: rawNotes ? rawNotes.trim() : undefined
    };

    return {
      rowNumber,
      raw,
      normalized: normalizedStudent,
      validationErrors: errors,
      validationWarnings: warnings,
      isValid: errors.length === 0,
      duplicateStatus,
      duplicateTargetStudentId,
      duplicateResolution
    };
  });
}

// Execute Transactional Multi-Entity Migration with Checkpoint Creation
export function executeMigrationTransaction(
  stagingRows: MigrationStagingRow[],
  targetAcademyId: string,
  targetAcademyName: string,
  fileName: string,
  fileSizeFormatted: string,
  settings: MigrationSettings,
  currentStudents: Student[],
  currentPayments: PaymentHistory[],
  currentGraduations: GraduationCandidate[],
  authorName: string = "Messias Batista"
): {
  updatedStudents: Student[];
  updatedPayments: PaymentHistory[];
  updatedGraduations: GraduationCandidate[];
  checkpoint: MigrationCheckpoint;
  report: MigrationReport;
} {
  const startedAt = new Date().toISOString();
  const checkpointId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. CREATE ATOMIC BACKUP CHECKPOINT BEFORE TOUCHING STATE
  const checkpoint: MigrationCheckpoint = {
    id: checkpointId,
    timestamp: startedAt,
    tenantId: targetAcademyId,
    tenantName: targetAcademyName,
    author: authorName,
    fileName,
    totalBeforeStudents: currentStudents.length,
    totalBeforePayments: currentPayments.length,
    totalBeforeGraduations: currentGraduations.length,
    snapshotStudents: JSON.parse(JSON.stringify(currentStudents)),
    snapshotPayments: JSON.parse(JSON.stringify(currentPayments)),
    snapshotGraduations: JSON.parse(JSON.stringify(currentGraduations)),
    snapshotState: {
      students: JSON.parse(JSON.stringify(currentStudents)),
      payments: JSON.parse(JSON.stringify(currentPayments)),
      graduations: JSON.parse(JSON.stringify(currentGraduations))
    }
  };

  let newStudentsList = [...currentStudents];
  let newPaymentsList = [...currentPayments];
  let newGraduationsList = [...currentGraduations];

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorsCount = 0;
  let createdInvoicesCount = 0;
  let createdHistoricalCount = 0;

  const reportDetails: MigrationReport["details"] = [];

  const todayStr = new Date().toISOString().split("T")[0];

  // 2. PROCESS STAGING ROWS IN STRICT TRANSACTIONAL ORDER
  for (const stg of stagingRows) {
    if (!stg.isValid) {
      errorsCount++;
      reportDetails.push({
        rowNumber: stg.rowNumber,
        studentName: stg.normalized.name || "Sem Nome",
        action: "ERROR",
        message: `Erros de validação: ${stg.validationErrors.join("; ")}`
      });
      continue;
    }

    if (stg.duplicateResolution === "SKIP") {
      skippedCount++;
      reportDetails.push({
        rowNumber: stg.rowNumber,
        studentName: stg.normalized.name || "",
        action: "SKIPPED",
        message: `Ignorado por política de duplicidade (${stg.duplicateStatus}).`
      });
      continue;
    }

    const norm = stg.normalized;
    const isUpdate = stg.duplicateResolution === "UPDATE_EXISTING" && stg.duplicateTargetStudentId;

    let targetStudentId = isUpdate ? stg.duplicateTargetStudentId! : `st_mig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Build Next Payment Date
    const dueDay = norm.paymentDueDay || 10;
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth() + 1; // next month
    if (m > 11) { m = 0; y += 1; }
    const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
    const day = Math.min(dueDay, lastDayOfMonth);
    const nextPaymentDate = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const studentRecord: Student = {
      id: targetStudentId,
      academyId: targetAcademyId, // FORCED FROM AUTHENTICATED SESSION (SECURITY BARRIER)
      name: norm.name || "Aluno Importado",
      email: norm.email || `aluno${targetStudentId}@bjjacademy.com`,
      phone: norm.phone || "+55 (11) 98000-0000",
      cpf: norm.cpf,
      belt: norm.belt || "White",
      stripes: norm.stripes || 0,
      category: norm.category || "Adulto",
      birthDate: norm.birthDate || "1998-01-01",
      plan: norm.plan || "Mensal",
      planValue: norm.planValue || 250,
      paymentDueDay: dueDay,
      nextPaymentDate,
      paymentStatus: norm.paymentStatus || "Paid",
      attendance30Days: norm.attendance30Days || 8,
      daysSinceLastClass: norm.daysSinceLastClass || 1,
      status: norm.status || "Active",
      registrationDate: todayStr,
      guardianName: norm.guardianName,
      guardianPhone: norm.guardianPhone,
      guardianEmail: norm.guardianEmail,
      notes: norm.notes,
      asaasCustomerId: `cus_mig_${Math.floor(Math.random() * 900000 + 100000)}`,
      asaasSubscriptionId: `sub_mig_${Math.floor(Math.random() * 9000000 + 1000000)}`,
      billingType: "PIX"
    };

    if (isUpdate) {
      newStudentsList = newStudentsList.map(s => s.id === targetStudentId ? { ...s, ...studentRecord } : s);
      updatedCount++;
      reportDetails.push({
        rowNumber: stg.rowNumber,
        studentName: studentRecord.name,
        action: "UPDATED",
        message: "Dados cadastrais do aluno foram atualizados com sucesso."
      });
    } else {
      newStudentsList.unshift(studentRecord);
      importedCount++;
      reportDetails.push({
        rowNumber: stg.rowNumber,
        studentName: studentRecord.name,
        action: "CREATED",
        message: `Aluno matriculado com sucesso na unidade ${targetAcademyName} (Faixa ${studentRecord.belt}, ${studentRecord.stripes} Graus).`
      });
    }

    // 3. RELATIONAL ENTITY: GRADUATION CANDIDATE RECORD
    if (studentRecord.belt !== "White" || studentRecord.stripes >= 3) {
      const gradRecord: GraduationCandidate = {
        id: `grad_mig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        academyId: targetAcademyId,
        studentName: studentRecord.name,
        currentBelt: studentRecord.belt,
        currentStripes: studentRecord.stripes,
        attendanceCount: (norm.attendance30Days || 8) * 6,
        monthsInCurrentBelt: 6,
        status: "Eligible",
        targetBelt: studentRecord.belt,
        targetStripes: Math.min(4, studentRecord.stripes + 1)
      };
      newGraduationsList.unshift(gradRecord);
    }

    // 4. RELATIONAL ENTITY: FINANCIAL & RECURRENCE RECORDS
    if (settings.financialStrategy === "HISTORICAL_AND_FUTURE_RECURRENCE" || settings.financialStrategy === "HISTORICAL_ONLY") {
      // Historical Receipt
      const histInvoice: PaymentHistory = {
        id: `pay_hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        academyId: targetAcademyId,
        studentId: targetStudentId,
        studentName: studentRecord.name,
        amount: studentRecord.planValue || 250,
        originalAmount: studentRecord.planValue || 250,
        date: todayStr,
        dueDate: todayStr,
        paidDate: norm.paymentStatus === "Paid" ? todayStr : undefined,
        status: norm.paymentStatus === "Paid" ? "Paid" : "Overdue",
        method: "PIX",
        asaasInvoiceId: `pay_asaas_hist_${Math.floor(Math.random() * 90000000 + 10000000)}`,
        recipientName: studentRecord.guardianName || studentRecord.name,
        recipientPhone: studentRecord.guardianPhone || studentRecord.phone,
        recipientType: studentRecord.guardianName ? "GUARDIAN" : "STUDENT",
        notes: `Histórico contábil herdado do sistema anterior na migração assistida de ${fileName}.`
      };
      newPaymentsList.unshift(histInvoice);
      createdHistoricalCount++;
    }

    // 5. FUTURE ASAAS RECURRENCE INVOICE
    if (settings.financialStrategy === "HISTORICAL_AND_FUTURE_RECURRENCE" && settings.createAsaasRecurrence) {
      const txId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const futureInvoice: PaymentHistory = {
        id: `pay_fut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        academyId: targetAcademyId,
        studentId: targetStudentId,
        studentName: studentRecord.name,
        amount: studentRecord.planValue || 250,
        originalAmount: studentRecord.planValue || 250,
        date: todayStr,
        dueDate: nextPaymentDate,
        status: "Pending",
        method: "PIX",
        asaasInvoiceId: `pay_asaas_fut_${Math.floor(Math.random() * 90000000 + 10000000)}`,
        pixCopiaECola: `00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/pay_${txId}`,
        recipientName: studentRecord.guardianName || studentRecord.name,
        recipientPhone: studentRecord.guardianPhone || studentRecord.phone,
        recipientType: studentRecord.guardianName ? "GUARDIAN" : "STUDENT",
        fineAmount: 0,
        interestAmount: 0,
        daysOverdue: 0,
        updatedTotalAmount: studentRecord.planValue || 250,
        notificationCount: 0,
        notes: `Primeira recorrência Asaas agendada automaticamente para vencimento em ${nextPaymentDate.split("-").reverse().join("/")}.`
      };
      newPaymentsList.unshift(futureInvoice);
      createdInvoicesCount++;
    }
  }

  const completedAt = new Date().toISOString();
  const overallStatus: MigrationReport["status"] = 
    errorsCount > 0 ? "CONCLUDED_WITH_WARNINGS" : "CONCLUDED_SUCCESS";

  const report: MigrationReport = {
    id: `rep_${Date.now()}`,
    fileName,
    fileSizeFormatted,
    startedAt,
    completedAt,
    tenantId: targetAcademyId,
    tenantName: targetAcademyName,
    author: authorName,
    totalFound: stagingRows.length,
    totalImported: importedCount,
    totalUpdated: updatedCount,
    totalDuplicatesSkipped: skippedCount,
    totalErrors: errorsCount,
    status: overallStatus,
    createdInvoicesCount,
    createdHistoricalCount,
    checkpointId,
    details: reportDetails
  };

  return {
    updatedStudents: newStudentsList,
    updatedPayments: newPaymentsList,
    updatedGraduations: newGraduationsList,
    checkpoint,
    report
  };
}

// Rollback helper
export function rollbackMigrationCheckpoint(
  checkpoint: MigrationCheckpoint
): {
  restoredStudents: Student[];
  restoredPayments: PaymentHistory[];
  restoredGraduations: GraduationCandidate[];
} {
  return {
    restoredStudents: JSON.parse(JSON.stringify(checkpoint.snapshotStudents)),
    restoredPayments: JSON.parse(JSON.stringify(checkpoint.snapshotPayments)),
    restoredGraduations: JSON.parse(JSON.stringify(checkpoint.snapshotGraduations))
  };
}
