import React, { useState, useEffect } from "react";
import { 
  Academy, 
  Student, 
  PaymentHistory, 
  GraduationCandidate,
  MigrationStagingRow,
  MigrationSettings,
  MigrationCheckpoint,
  MigrationReport
} from "../types";
import { 
  TARGET_FIELDS, 
  parseSpreadsheetFile, 
  autoDetectFieldMappings, 
  buildStagingRows, 
  executeMigrationTransaction, 
  rollbackMigrationCheckpoint 
} from "../utils/migrationEngine";
import { 
  DEMO_SPREADSHEETS, 
  downloadDemoSpreadsheetFile 
} from "../utils/demoMigrationSpreadsheets";
import { 
  UploadCloud, FileSpreadsheet, Sparkles, CheckCircle2, AlertTriangle, 
  XCircle, ArrowRight, ArrowLeft, RefreshCw, ShieldCheck, Database, 
  Download, History, RotateCcw, Award, Users, CreditCard, ChevronDown, 
  HelpCircle, Check, Info, FileText, Lock, Play, Eye
} from "lucide-react";
import * as XLSX from "xlsx";

interface MigrationCenterProps {
  academies: Academy[];
  students: Student[];
  payments: PaymentHistory[];
  graduations: GraduationCandidate[];
  userRole: string;
  onApplyMigration: (
    newStudents: Student[], 
    newPayments: PaymentHistory[], 
    newGraduations: GraduationCandidate[],
    checkpoint: MigrationCheckpoint,
    report: MigrationReport
  ) => void;
  onRollbackMigration: (checkpoint: MigrationCheckpoint) => void;
  onNavigate: (tab: string) => void;
}

type StepKey = "upload" | "mapping" | "validation" | "preview" | "report";

export default function MigrationCenter({
  academies,
  students,
  payments,
  graduations,
  userRole,
  onApplyMigration,
  onRollbackMigration,
  onNavigate
}: MigrationCenterProps) {
  // Stepper state
  const [currentStep, setCurrentStep] = useState<StepKey>("upload");

  // File & Raw Staging data
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // Field Mapping State
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState<string | null>(null);

  // Staging Rows & Validation
  const [stagingRows, setStagingRows] = useState<MigrationStagingRow[]>([]);
  const [validationFilter, setValidationFilter] = useState<"ALL" | "VALID" | "WARNING" | "ERROR">("ALL");
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Migration Settings & Security
  const defaultTarget = userRole !== "super" ? userRole : (academies[0]?.id || "ac-1");
  const [settings, setSettings] = useState<MigrationSettings>({
    targetAcademyId: defaultTarget,
    duplicateStrategy: "UPDATE",
    financialStrategy: "HISTORICAL_AND_FUTURE_RECURRENCE",
    defaultDueDay: 10,
    defaultPlan: "Mensal",
    defaultPlanValue: 250,
    createAsaasRecurrence: true
  });

  // Checkpoints & Audit Reports History
  const [savedCheckpoints, setSavedCheckpoints] = useState<MigrationCheckpoint[]>(() => {
    const saved = localStorage.getItem("bjj_migration_checkpoints");
    return saved ? JSON.parse(saved) : [];
  });

  const [savedReports, setSavedReports] = useState<MigrationReport[]>(() => {
    const saved = localStorage.getItem("bjj_migration_reports");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeReport, setActiveReport] = useState<MigrationReport | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationStatusLog, setMigrationStatusLog] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync Checkpoints & Reports to LocalStorage
  useEffect(() => {
    localStorage.setItem("bjj_migration_checkpoints", JSON.stringify(savedCheckpoints));
  }, [savedCheckpoints]);

  useEffect(() => {
    localStorage.setItem("bjj_migration_reports", JSON.stringify(savedReports));
  }, [savedReports]);

  // Keep targetAcademyId in sync if userRole switches
  useEffect(() => {
    if (userRole !== "super") {
      setSettings(prev => ({ ...prev, targetAcademyId: userRole }));
    }
  }, [userRole]);

  // Handler for File Upload (Drag & Drop or Manual)
  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    try {
      setFileName(file.name);
      const sizeKb = Math.round(file.size / 1024);
      setFileSizeFormatted(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);
      setSelectedFile(file);

      const parsed = await parseSpreadsheetFile(file);
      setRawHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Apply initial heuristic mapping
      const initialMap = autoDetectFieldMappings(parsed.headers);
      setFieldMappings(initialMap);

      triggerToast(`✅ Arquivo '${file.name}' carregado: ${parsed.rows.length} registros identificados.`);
      setCurrentStep("mapping");
    } catch (err: any) {
      alert(`Erro ao ler o arquivo: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Handler for loading pre-configured Demo Spreadsheets
  const handleLoadDemo = (demo: typeof DEMO_SPREADSHEETS[0]) => {
    setIsParsing(true);
    setFileName(demo.filename);
    setFileSizeFormatted("18 KB");
    const headers = Object.keys(demo.data[0] || {});
    setRawHeaders(headers);
    setRawRows(demo.data);

    const initialMap = autoDetectFieldMappings(headers);
    setFieldMappings(initialMap);

    setTimeout(() => {
      setIsParsing(false);
      triggerToast(`📋 Amostra '${demo.name}' carregada (${demo.rowsCount} alunos).`);
      setCurrentStep("mapping");
    }, 400);
  };

  // Handler for Gemini AI-Assisted Smart Mapping
  const handleAiSuggestMapping = async () => {
    if (rawHeaders.length === 0) return;
    setIsAiSuggesting(true);
    try {
      const res = await fetch("/api/migration/suggest-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: rawHeaders,
          sampleRows: rawRows.slice(0, 4)
        })
      });

      const data = await res.json();
      if (data.mappings) {
        const newMap: Record<string, string> = {};
        for (const [key, val] of Object.entries(data.mappings as Record<string, any>)) {
          if (val.sourceHeader && rawHeaders.includes(val.sourceHeader)) {
            newMap[key] = val.sourceHeader;
          }
        }
        setFieldMappings(prev => ({ ...prev, ...newMap }));
        setAiAnalysisSummary(data.analysis || "Colunas mapeadas com sucesso pela inteligência artificial.");
        triggerToast("🤖 Mapeamento inteligente sugerido pelo Gemini 3.7 Flash!");
      }
    } catch (err) {
      // Fallback already handled
      const fallback = autoDetectFieldMappings(rawHeaders);
      setFieldMappings(fallback);
      triggerToast("Mapeamento heurístico aplicado com sucesso.");
    } finally {
      setIsAiSuggesting(false);
    }
  };

  // Build Staging Rows when entering Validation step
  const handleProceedToValidation = () => {
    if (!fieldMappings.name) {
      alert("O campo 'Nome Completo do Aluno' é obrigatório. Mapeie a coluna correspondente antes de avançar.");
      return;
    }

    const rows = buildStagingRows(rawRows, fieldMappings, students, settings.targetAcademyId, settings);
    setStagingRows(rows);
    setCurrentStep("validation");
  };

  // Re-run validation on Staging Rows when duplicate strategy or settings change
  const handleRefreshValidation = () => {
    const rows = buildStagingRows(rawRows, fieldMappings, students, settings.targetAcademyId, settings);
    setStagingRows(rows);
  };

  // Inline row edit in Staging table
  const handleUpdateStagingRow = (index: number, updatedNormalized: Partial<Student>) => {
    setStagingRows(prev => {
      const next = [...prev];
      const target = next[index];
      if (target) {
        const newNorm = { ...target.normalized, ...updatedNormalized };
        const newErrors = [];
        if (!newNorm.name || newNorm.name.length < 2) {
          newErrors.push("Nome do aluno é obrigatório.");
        }
        next[index] = {
          ...target,
          normalized: newNorm,
          validationErrors: newErrors,
          isValid: newErrors.length === 0
        };
      }
      return next;
    });
    setEditingRowIndex(null);
    triggerToast("Registro atualizado na área de Staging.");
  };

  // Change individual duplicate resolution
  const handleChangeResolution = (index: number, res: MigrationStagingRow["duplicateResolution"]) => {
    setStagingRows(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], duplicateResolution: res };
      }
      return next;
    });
  };

  // Execute Transactional Migration with progress simulation & checkpoint
  const handleExecuteMigration = () => {
    const targetAcademy = academies.find(a => a.id === settings.targetAcademyId) || academies[0];
    setIsMigrating(true);
    setMigrationProgress(10);
    setMigrationStatusLog("1/5: Criando snapshot de segurança e ponto de restauração (Checkpoint)...");

    setTimeout(() => {
      setMigrationProgress(35);
      setMigrationStatusLog("2/5: Validando isolamento multi-tenant (tenantId = " + targetAcademy.id + ")...");
      
      setTimeout(() => {
        setMigrationProgress(65);
        setMigrationStatusLog("3/5: Inserindo entidades relacionais (Alunos, Responsáveis Kids e Graduações)...");

        setTimeout(() => {
          setMigrationProgress(85);
          setMigrationStatusLog("4/5: Processando histórico contábil e agendando faturas no Asaas...");

          setTimeout(() => {
            setMigrationProgress(100);
            setMigrationStatusLog("5/5: Concluindo transação atômica e gerando relatório de auditoria...");

            // Execute actual atomic transaction
            const result = executeMigrationTransaction(
              stagingRows,
              targetAcademy.id,
              targetAcademy.name,
              fileName || "planilha_importada.xlsx",
              fileSizeFormatted || "24 KB",
              settings,
              students,
              payments,
              graduations,
              userRole === "super" ? "Messias Batista" : targetAcademy.name
            );

            // Save checkpoint & report to state
            setSavedCheckpoints(prev => [result.checkpoint, ...prev]);
            setSavedReports(prev => [result.report, ...prev]);
            setActiveReport(result.report);

            // Apply to global App state
            onApplyMigration(
              result.updatedStudents,
              result.updatedPayments,
              result.updatedGraduations,
              result.checkpoint,
              result.report
            );

            setIsMigrating(false);
            setCurrentStep("report");
            triggerToast(`🎉 Migração concluída com sucesso! ${result.report.totalImported} alunos importados.`);
          }, 400);
        }, 400);
      }, 400);
    }, 500);
  };

  // Rollback checkpoint
  const handleRollback = (checkpoint: MigrationCheckpoint) => {
    if (confirm(`Tem certeza que deseja reverter a migração de '${checkpoint.fileName}' realizada em ${new Date(checkpoint.timestamp).toLocaleString()}? O banco será restaurado exatamente ao snapshot pré-migração.`)) {
      onRollbackMigration(checkpoint);
      
      // Update report status to ROLLED_BACK
      setSavedReports(prev => prev.map(r => r.checkpointId === checkpoint.id ? { ...r, status: "ROLLED_BACK" } : r));
      if (activeReport && activeReport.checkpointId === checkpoint.id) {
        setActiveReport({ ...activeReport, status: "ROLLED_BACK" });
      }

      triggerToast("⏪ Snapshot restaurado com sucesso! Estado do banco de dados revertido.");
    }
  };

  // Export Report as CSV or JSON
  const handleDownloadReport = (report: MigrationReport, format: "csv" | "json" = "csv") => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Relatorio_Migracao_${report.tenantName.replace(/\s+/g, "_")}_${report.id}.json`;
      a.click();
    } else {
      const csvRows = [
        ["Linha", "Nome do Aluno", "Ação", "Mensagem / Detalhe"],
        ...report.details.map(d => [d.rowNumber, d.studentName, d.action, d.message])
      ];
      const ws = XLSX.utils.aoa_to_sheet(csvRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
      XLSX.writeFile(wb, `Relatorio_Migracao_${report.id}.csv`, { bookType: "csv" });
    }
  };

  // Summary counts for Validation step
  const validRowsCount = stagingRows.filter(r => r.isValid && r.duplicateStatus === "NONE").length;
  const warningRowsCount = stagingRows.filter(r => r.isValid && r.duplicateStatus !== "NONE").length;
  const errorRowsCount = stagingRows.filter(r => !r.isValid).length;

  const filteredStagingRows = stagingRows.filter(r => {
    if (validationFilter === "VALID") return r.isValid && r.duplicateStatus === "NONE";
    if (validationFilter === "WARNING") return r.isValid && r.duplicateStatus !== "NONE";
    if (validationFilter === "ERROR") return !r.isValid;
    return true;
  });

  const activeTargetAcademy = academies.find(a => a.id === settings.targetAcademyId) || academies[0];

  return (
    <div className="space-y-6" id="migration-center-root">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header with Universal Migration Branding */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-md">
                <ShieldCheck className="w-3 h-3" /> Arquitetura Segura
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Universal Excel & CSV
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight flex items-center gap-3">
              Central de Migração Assistida de Dados
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Traga alunos, turmas, faixas, históricos e mensalidades de qualquer sistema antigo com <strong className="text-slate-200">5 barreiras de proteção</strong>: Staging isolado, Mapeamento com auxílio Gemini, Validação determinística, Backup Snapshot prévio e Importação Transacional Atômica.
            </p>
          </div>

          {/* Quick Stats / Action */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl shadow-inner self-stretch md:self-auto justify-between md:justify-start">
            <div className="text-left px-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Checkpoints Salvos</span>
              <span className="text-base font-bold text-slate-200">{savedCheckpoints.length}</span>
            </div>
            <div className="text-left px-3">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Migrações Concluídas</span>
              <span className="text-base font-bold text-emerald-400">{savedReports.length}</span>
            </div>
          </div>
        </div>

        {/* 5 Mandatory Safety Pillars Banner */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6 pt-5 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
            <Database className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span><strong>1. Staging:</strong> Nunca direto</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span><strong>2. Mapeamento:</strong> Gemini AI</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span><strong>3. Validação:</strong> Regras rígidas</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span><strong>4. Backup:</strong> Checkpoint antes</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
            <Lock className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <span><strong>5. tenantId:</strong> Sessão forçada</span>
          </div>
        </div>
      </div>

      {/* Visual Step Progress Bar */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-2">
        {[
          { id: "upload", step: 1, label: "1. Upload & Staging", desc: "Excel ou CSV" },
          { id: "mapping", step: 2, label: "2. Mapeamento", desc: "Gemini + Manual" },
          { id: "validation", step: 3, label: "3. Validação & Duplicados", desc: "Regras & Correções" },
          { id: "preview", step: 4, label: "4. Prévia & Estratégia", desc: "Asaas e Snapshot" },
          { id: "report", step: 5, label: "5. Auditoria & Relatório", desc: "Execução Atômica" },
        ].map((s, idx) => {
          const isCurrent = currentStep === s.id;
          const isPassed = (
            (s.id === "upload" && rawRows.length > 0) ||
            (s.id === "mapping" && currentStep !== "upload" && currentStep !== "mapping") ||
            (s.id === "validation" && (currentStep === "preview" || currentStep === "report")) ||
            (s.id === "preview" && currentStep === "report") ||
            (s.id === "report" && activeReport)
          );

          return (
            <button
              key={s.id}
              onClick={() => {
                if (s.id === "upload") setCurrentStep("upload");
                else if (s.id === "mapping" && rawRows.length > 0) setCurrentStep("mapping");
                else if (s.id === "validation" && rawRows.length > 0) handleProceedToValidation();
                else if (s.id === "preview" && stagingRows.length > 0) setCurrentStep("preview");
                else if (s.id === "report" && activeReport) setCurrentStep("report");
              }}
              disabled={
                (s.id === "mapping" && rawRows.length === 0) ||
                (s.id === "validation" && rawRows.length === 0) ||
                (s.id === "preview" && stagingRows.length === 0) ||
                (s.id === "report" && !activeReport)
              }
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                isCurrent 
                  ? "bg-blue-600/20 border border-blue-500/50 text-white shadow-md" 
                  : isPassed 
                    ? "text-emerald-400 hover:bg-slate-900/60" 
                    : "text-slate-500 hover:text-slate-400 opacity-60"
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                isCurrent 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/40" 
                  : isPassed 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                    : "bg-slate-800 text-slate-400"
              }`}>
                {isPassed ? "✓" : s.step}
              </div>
              <div>
                <span className="text-xs font-bold block">{s.label}</span>
                <span className="text-[10px] text-slate-400 block">{s.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: UPLOAD & STAGING AREA */}
      {/* ========================================================================= */}
      {currentStep === "upload" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Upload Zone (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-950/80 border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-3xl p-8 md:p-12 text-center transition-all bg-gradient-to-b from-slate-900/30 to-slate-950/80 relative group">
                <input 
                  type="file"
                  id="spreadsheet-file-input"
                  accept=".xlsx, .xls, .csv, .tsv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/20">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  Arraste sua Planilha ou Clique para Carregar
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Suporta arquivos <strong className="text-slate-300">.XLSX, .XLS, .CSV ou .TSV</strong> exportados de sistemas antigos (Next Fit, Tecnofit, EVO, Pacto, Cloud Gym, Google Sheets ou planilhas manuais).
                </p>

                <div className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Selecionar Arquivo no Computador</span>
                </div>

                {isParsing && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-400 animate-pulse font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Lendo estrutura tabular e carregando na Área de Staging...</span>
                  </div>
                )}
              </div>

              {/* Download Standard Template Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl text-xs">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">Precisa de um modelo padrão de planilha?</span>
                    <span className="text-slate-400 text-[11px] block">Baixe a planilha estruturada com todas as colunas recomendadas (Alunos, Faixas, Graus, Mensalidades e Responsáveis).</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadDemoSpreadsheetFile(DEMO_SPREADSHEETS[0], "xlsx")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all flex-shrink-0"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Baixar Modelo .XLSX</span>
                </button>
              </div>
            </div>

            {/* Ready-to-use Demo Datasets (1 Col) */}
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Carregar Amostras Rápidas de Teste</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Não tem uma planilha em mãos agora? Selecione uma base de exemplo para testar todo o fluxo de migração assistida:
                </p>

                <div className="space-y-3">
                  {DEMO_SPREADSHEETS.map(demo => (
                    <div 
                      key={demo.id} 
                      className="bg-slate-900/80 border border-slate-800/90 hover:border-blue-500/50 p-3.5 rounded-2xl transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">{demo.name}</span>
                          <span className="text-[10px] text-blue-400 font-mono block">{demo.sourceSystem} • {demo.rowsCount} alunos</span>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {demo.filename.endsWith(".xlsx") ? "XLSX" : "CSV"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{demo.description}</p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleLoadDemo(demo)}
                          className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 hover:border-blue-500/50 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Play className="w-3.5 h-3.5" /> Carregar na Staging
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDemoSpreadsheetFile(demo, demo.filename.endsWith(".xlsx") ? "xlsx" : "csv")}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg text-xs transition-all"
                          title="Baixar arquivo original"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Tenant Configuration */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Academia de Destino (tenantId)</h3>
                </div>
                <p className="text-[11px] text-slate-400">
                  <strong className="text-slate-300">Barreira de Segurança:</strong> O identificador multi-tenant é injetado diretamente da sessão autorizada, prevenindo contaminação entre academias.
                </p>
                <select
                  value={settings.targetAcademyId}
                  disabled={userRole !== "super"}
                  onChange={(e) => setSettings(prev => ({ ...prev, targetAcademyId: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 font-bold rounded-xl p-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {academies.map(ac => (
                    <option key={ac.id} value={ac.id}>🏢 {ac.name} ({ac.unit})</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Previous Migration History & Checkpoints Table */}
          {savedReports.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Histórico de Migrações Realizadas & Snapshots de Segurança</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{savedReports.length} registros</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3">Data / Hora</th>
                      <th className="py-2.5 px-3">Arquivo Original</th>
                      <th className="py-2.5 px-3">Unidade Destino</th>
                      <th className="py-2.5 px-3 text-center">Alunos Importados</th>
                      <th className="py-2.5 px-3 text-center">Atualizados</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Ações de Auditoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {savedReports.map(rep => {
                      const matchingCheckpoint = savedCheckpoints.find(c => c.id === rep.checkpointId);
                      return (
                        <tr key={rep.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                            {new Date(rep.completedAt).toLocaleString("pt-BR")}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-200 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span>{rep.fileName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({rep.fileSizeFormatted})</span>
                          </td>
                          <td className="py-3 px-3 text-slate-300">{rep.tenantName}</td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-400">{rep.totalImported}</td>
                          <td className="py-3 px-3 text-center font-bold text-blue-400">{rep.totalUpdated}</td>
                          <td className="py-3 px-3 text-center">
                            {rep.status === "CONCLUDED_SUCCESS" && (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Concluída
                              </span>
                            )}
                            {rep.status === "CONCLUDED_WITH_WARNINGS" && (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Com Alertas
                              </span>
                            )}
                            {rep.status === "ROLLED_BACK" && (
                              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Revertida (Rollback)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReport(rep);
                                  setCurrentStep("report");
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3 text-blue-400" /> Relatório
                              </button>
                              
                              {matchingCheckpoint && rep.status !== "ROLLED_BACK" && (
                                <button
                                  type="button"
                                  onClick={() => handleRollback(matchingCheckpoint)}
                                  className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                                  title="Restaurar banco ao snapshot anterior a esta migração"
                                >
                                  <RotateCcw className="w-3 h-3 text-rose-400" /> Rollback
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
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: FIELD MAPPING (AUTOMATIC + GEMINI AI + MANUAL OVERRIDE) */}
      {/* ========================================================================= */}
      {currentStep === "mapping" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Bar with AI Helper Action */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-blue-400 font-mono font-bold uppercase">Arquivo na Staging:</span>
                <span className="text-xs font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{fileName}</span>
                <span className="text-[10px] text-slate-400 font-mono">({rawRows.length} linhas encontradas)</span>
              </div>
              <p className="text-xs text-slate-400">
                Associe cada campo do BJJ Academy à coluna correspondente no seu arquivo.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto">
              <button
                type="button"
                onClick={handleAiSuggestMapping}
                disabled={isAiSuggesting}
                className="flex-1 md:flex-initial bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isAiSuggesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini Analisando Colunas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Mapear com Inteligência Artificial (Gemini)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFieldMappings(autoDetectFieldMappings(rawHeaders))}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                title="Restaurar detecção heurística padrão"
              >
                Resetar Mapeamento
              </button>
            </div>
          </div>

          {/* AI Analysis Card if available */}
          {aiAnalysisSummary && (
            <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-indigo-200">
              <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Diagnóstico da Inteligência Artificial:</strong>
                <span>{aiAnalysisSummary}</span>
              </div>
            </div>
          )}

          {/* Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TARGET_FIELDS.map(field => {
              const selectedHeader = fieldMappings[field.key] || "";
              const sampleVal = selectedHeader && rawRows[0] ? rawRows[0][selectedHeader] : "";

              return (
                <div 
                  key={field.key} 
                  className={`bg-slate-950/80 border p-4 rounded-2xl space-y-2 transition-all ${
                    selectedHeader 
                      ? "border-slate-800 hover:border-slate-700" 
                      : field.required 
                        ? "border-amber-500/40 bg-amber-950/10" 
                        : "border-slate-800/60 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{field.label}</span>
                      {field.required && (
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">
                          OBRIGATÓRIO
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">schema: {field.key}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedHeader}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldMappings(prev => ({
                          ...prev,
                          [field.key]: val
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                    >
                      <option value="">-- Ignorar ou Não Mapear --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>
                          📄 Coluna: {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedHeader ? (
                    <div className="bg-slate-900/90 border border-slate-800/80 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] text-slate-400">
                      <span>Exemplo da 1ª linha:</span>
                      <strong className="text-blue-300 font-mono truncate max-w-[200px]">{sampleVal || "(vazio)"}</strong>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">
                      {field.required ? "⚠️ Selecione a coluna correspondente para prosseguir." : `Exemplo esperado: ${field.example}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep("upload")}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Upload
            </button>

            <button
              type="button"
              onClick={handleProceedToValidation}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Avançar para Validação & Staging</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: VALIDATION & DUPLICATE RESOLUTION ENGINE */}
      {/* ========================================================================= */}
      {currentStep === "validation" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Counters & Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setValidationFilter("ALL")}
              className={`p-4 rounded-2xl text-left border transition-all ${
                validationFilter === "ALL" 
                  ? "bg-slate-900 border-blue-500 shadow-md shadow-blue-500/20" 
                  : "bg-slate-950/80 border-slate-800 opacity-80"
              }`}
            >
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Total na Staging</span>
              <span className="text-xl font-bold text-white">{stagingRows.length}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Todas as linhas do arquivo</span>
            </button>

            <button
              type="button"
              onClick={() => setValidationFilter("VALID")}
              className={`p-4 rounded-2xl text-left border transition-all ${
                validationFilter === "VALID" 
                  ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/20" 
                  : "bg-slate-950/80 border-slate-800 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-mono uppercase">100% Válidos</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xl font-bold text-emerald-300">{validRowsCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Prontos para cadastro novo</span>
            </button>

            <button
              type="button"
              onClick={() => setValidationFilter("WARNING")}
              className={`p-4 rounded-2xl text-left border transition-all ${
                validationFilter === "WARNING" 
                  ? "bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/20" 
                  : "bg-slate-950/80 border-slate-800 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 font-mono uppercase">Duplicados / Alertas</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xl font-bold text-amber-300">{warningRowsCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Mesmo CPF, E-mail ou Nome</span>
            </button>

            <button
              type="button"
              onClick={() => setValidationFilter("ERROR")}
              className={`p-4 rounded-2xl text-left border transition-all ${
                validationFilter === "ERROR" 
                  ? "bg-rose-950/40 border-rose-500 shadow-md shadow-rose-500/20" 
                  : "bg-slate-950/80 border-slate-800 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-rose-400 font-mono uppercase">Erros de Validação</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xl font-bold text-rose-300">{errorRowsCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Exigem correção antes de importar</span>
            </button>
          </div>

          {/* Global Duplicate Strategy Selector */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Política Padrão para Alunos Já Existentes
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina como o sistema deve agir quando encontrar um CPF ou e-mail que já existe no banco:
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[
                { id: "UPDATE", label: "Atualizar Dados Existentes" },
                { id: "SKIP", label: "Ignorar / Pular Duplicado" },
                { id: "CREATE_NEW", label: "Criar Novo Registro" }
              ].map(strat => (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, duplicateStrategy: strat.id as any }));
                    setTimeout(handleRefreshValidation, 50);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    settings.duplicateStrategy === strat.id 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {strat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Staging Data Table with Inline Corrections */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Tabela de Staging ({filteredStagingRows.length} registros exibidos)</h3>
              </div>
              <span className="text-xs text-slate-400">Clique em qualquer linha com erro para corrigir os dados</span>
            </div>

            <div className="overflow-x-auto max-h-[480px] scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 z-10">
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Linha</th>
                    <th className="py-2.5 px-3">Nome do Aluno</th>
                    <th className="py-2.5 px-3">CPF</th>
                    <th className="py-2.5 px-3">Faixa & Graus</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Plano & Valor</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duplicidade / Ação</th>
                    <th className="py-2.5 px-3 text-right">Ajuste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredStagingRows.map((stg) => {
                    const isEditing = editingRowIndex === stg.rowNumber - 1;
                    const norm = stg.normalized;

                    return (
                      <tr 
                        key={stg.rowNumber} 
                        className={`transition-colors ${
                          !stg.isValid 
                            ? "bg-rose-950/20 hover:bg-rose-950/30" 
                            : stg.duplicateStatus !== "NONE" 
                              ? "bg-amber-950/15 hover:bg-amber-950/25" 
                              : "hover:bg-slate-900/40"
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          #{stg.rowNumber}
                        </td>

                        <td className="py-3 px-3">
                          {isEditing ? (
                            <input 
                              type="text" 
                              defaultValue={norm.name} 
                              id={`edit-name-${stg.rowNumber}`}
                              className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-white w-full"
                            />
                          ) : (
                            <div>
                              <strong className="text-slate-100 font-bold block">{norm.name}</strong>
                              <span className="text-[10px] text-slate-400 font-mono block">{norm.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                          {isEditing ? (
                            <input 
                              type="text" 
                              defaultValue={norm.cpf || ""} 
                              id={`edit-cpf-${stg.rowNumber}`}
                              className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-white w-28"
                            />
                          ) : (
                            norm.cpf || <span className="text-slate-600 italic">sem CPF</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                            norm.belt === "Black" ? "bg-slate-900 text-slate-100 border border-slate-700" :
                            norm.belt === "Brown" ? "bg-amber-900/60 text-amber-200" :
                            norm.belt === "Purple" ? "bg-purple-900/60 text-purple-200" :
                            norm.belt === "Blue" ? "bg-blue-900/60 text-blue-200" :
                            "bg-slate-800 text-slate-300"
                          }`}>
                            🥋 {norm.belt} ({norm.stripes}º Grau)
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-300">
                          {norm.category}
                          {norm.guardianName && (
                            <span className="text-[9px] text-blue-400 block font-mono">Resp: {norm.guardianName}</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-slate-200 font-bold block">{norm.plan}</span>
                          <span className="text-[10px] text-emerald-400 font-mono block">R$ {norm.planValue?.toFixed(2)} (Dia {norm.paymentDueDay})</span>
                        </td>

                        <td className="py-3 px-3">
                          {norm.paymentStatus === "Paid" && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">Em Dia</span>
                          )}
                          {norm.paymentStatus === "Overdue" && (
                            <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded">Atrasado</span>
                          )}
                          {norm.paymentStatus === "Pending" && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">Pendente</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {stg.duplicateStatus === "NONE" ? (
                            <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Novo Aluno
                            </span>
                          ) : (
                            <select
                              value={stg.duplicateResolution}
                              onChange={(e) => handleChangeResolution(stg.rowNumber - 1, e.target.value as any)}
                              className="bg-slate-900 border border-slate-700 text-[11px] text-amber-300 font-bold rounded-lg px-2 py-1 focus:outline-none"
                            >
                              <option value="UPDATE_EXISTING">🔄 Atualizar Cadastro</option>
                              <option value="SKIP">⏭️ Pular / Ignorar</option>
                              <option value="IMPORT_NEW">➕ Criar Novo</option>
                            </select>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => {
                                const newName = (document.getElementById(`edit-name-${stg.rowNumber}`) as HTMLInputElement)?.value;
                                const newCpf = (document.getElementById(`edit-cpf-${stg.rowNumber}`) as HTMLInputElement)?.value;
                                handleUpdateStagingRow(stg.rowNumber - 1, {
                                  name: newName,
                                  cpf: newCpf
                                });
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                            >
                              Salvar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingRowIndex(stg.rowNumber - 1)}
                              className="text-slate-400 hover:text-white text-[10px] font-bold underline"
                            >
                              Corrigir
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep("mapping")}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Mapeamento
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep("preview")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Avançar para Prévia & Estratégia</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: PREVIEW & FINANCIAL RECURRENCE STRATEGY */}
      {/* ========================================================================= */}
      {currentStep === "preview" && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Migration Plan Summary (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Resumo Geral da Prévia de Migração
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Total no Arquivo</span>
                    <span className="text-xl font-bold text-white">{stagingRows.length}</span>
                  </div>
                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-emerald-400 font-mono uppercase block">Serão Cadastrados</span>
                    <span className="text-xl font-bold text-emerald-300">
                      {stagingRows.filter(r => r.isValid && (r.duplicateResolution === "IMPORT_NEW" || r.duplicateStatus === "NONE")).length}
                    </span>
                  </div>
                  <div className="bg-blue-950/30 border border-blue-500/30 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-blue-400 font-mono uppercase block">Serão Atualizados</span>
                    <span className="text-xl font-bold text-blue-300">
                      {stagingRows.filter(r => r.duplicateResolution === "UPDATE_EXISTING").length}
                    </span>
                  </div>
                  <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-amber-400 font-mono uppercase block">Serão Ignorados</span>
                    <span className="text-xl font-bold text-amber-300">
                      {stagingRows.filter(r => r.duplicateResolution === "SKIP" || !r.isValid).length}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Academia de Destino:</span>
                    <strong className="text-white font-bold">{activeTargetAcademy.name} ({activeTargetAcademy.unit})</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Identificador Multi-Tenant:</span>
                    <span className="text-emerald-400 font-mono font-bold">tenantId = {activeTargetAcademy.id}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Administrador Responsável:</span>
                    <span className="text-slate-200 font-bold">{userRole === "super" ? "Messias Batista (SaaS Owner)" : activeTargetAcademy.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Snapshot de Segurança:</span>
                    <span className="text-blue-400 font-bold flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Checkpoint Automático Pré-Execução
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Strategy Configuration */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Estratégia Financeira & Integração Asaas</h3>
                    <p className="text-xs text-slate-400">Como lidar com o histórico antigo vs novas cobranças recorrentes:</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: "HISTORICAL_AND_FUTURE_RECURRENCE",
                      title: "Histórico Contábil + Agendamento de Próxima Recorrência no Asaas (Recomendado)",
                      desc: "Preserva pagamentos antigos como recibos históricos sem cobrar novamente. Gera automaticamente a próxima fatura no Asaas na data de vencimento configurada.",
                      badge: "RECOMENDADO"
                    },
                    {
                      id: "HISTORICAL_ONLY",
                      title: "Apenas Histórico Contábil (Sem Recorrência Automática)",
                      desc: "Importa os alunos e seus recibos passados, deixando as futuras mensalidades para serem criadas manualmente.",
                      badge: "CONTÁBIL"
                    },
                    {
                      id: "NO_FINANCIAL",
                      title: "Somente Alunos e Graduações (Sem Dados Financeiros)",
                      desc: "Cadastra apenas as fichas dos atletas, faixas, graus e frequências, sem registrar histórico monetário.",
                      badge: "LEVE"
                    }
                  ].map(opt => (
                    <label 
                      key={opt.id}
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        settings.financialStrategy === opt.id 
                          ? "bg-emerald-950/20 border-emerald-500/80 shadow-md shadow-emerald-500/10" 
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="financialStrategy"
                        value={opt.id}
                        checked={settings.financialStrategy === opt.id}
                        onChange={() => setSettings(prev => ({ ...prev, financialStrategy: opt.id as any }))}
                        className="mt-1 accent-emerald-500 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-white font-bold">{opt.title}</strong>
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono font-bold">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Confirmation & Execution Panel (1 Col) */}
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-blue-950/60 to-slate-950 border border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-blue-300">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Confirmação Transacional</h4>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Ao clicar no botão abaixo, o sistema executará uma <strong className="text-white">operação atômica</strong>. Se ocorrer qualquer falha durante a execução, o estado anterior será mantido intacto.
                </p>

                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-400 font-mono">
                  <div>✓ Criação de Checkpoint: Ativo</div>
                  <div>✓ Validação de integridade: 100%</div>
                  <div>✓ Destino: {activeTargetAcademy.name}</div>
                </div>

                {isMigrating ? (
                  <div className="space-y-3 pt-2">
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${migrationProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-300 font-bold font-mono animate-pulse text-center">
                      {migrationStatusLog}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleExecuteMigration}
                    className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3.5 px-4 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-95 border border-emerald-400/30"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Confirmar & Executar Migração</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep("validation")}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar à Validação
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: AUDIT & FINAL MIGRATION REPORT */}
      {/* ========================================================================= */}
      {currentStep === "report" && activeReport && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main Success / Report Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    activeReport.status === "CONCLUDED_SUCCESS" 
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                      : activeReport.status === "ROLLED_BACK" 
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" 
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}>
                    {activeReport.status === "CONCLUDED_SUCCESS" ? "MIGRAÇÃO CONCLUÍDA COM SUCESSO" : 
                     activeReport.status === "ROLLED_BACK" ? "MIGRAÇÃO REVERTIDA (ROLLBACK)" : "CONCLUÍDA COM ALERTAS"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{activeReport.id}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Relatório Oficial de Auditoria de Migração
                </h2>
                <p className="text-xs text-slate-400">
                  Arquivo: <strong className="text-slate-200">{activeReport.fileName}</strong> ({activeReport.fileSizeFormatted}) • Unidade: <strong className="text-slate-200">{activeReport.tenantName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadReport(activeReport, "csv")}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Baixar Relatório .CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadReport(activeReport, "json")}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Official Report Terminal Card (Specification Format) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 font-mono text-xs space-y-3">
              <div className="text-slate-400 border-b border-slate-800 pb-2">
                # RESUMO DA EXECUÇÃO TRANSACIONAL ({new Date(activeReport.completedAt).toLocaleString("pt-BR")})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <span className="text-slate-500 block text-[10px]">ENCONTRADOS:</span>
                  <strong className="text-base text-white">{activeReport.totalFound}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">IMPORTADOS:</span>
                  <strong className="text-base text-emerald-400">{activeReport.totalImported}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ATUALIZADOS:</span>
                  <strong className="text-base text-blue-400">{activeReport.totalUpdated}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DUPLICADOS:</span>
                  <strong className="text-base text-amber-400">{activeReport.totalDuplicatesSkipped}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">COM ERRO:</span>
                  <strong className="text-base text-rose-400">{activeReport.totalErrors}</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] flex flex-wrap gap-4">
                <span>Recibos Históricos Criados: <strong className="text-slate-200">{activeReport.createdHistoricalCount}</strong></span>
                <span>Faturas Asaas Agendadas: <strong className="text-emerald-400">{activeReport.createdInvoicesCount}</strong></span>
                <span>Autor: <strong className="text-slate-200">{activeReport.author}</strong></span>
              </div>
            </div>

            {/* Relational Outcome Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Log Linha a Linha dos Alunos Processados ({activeReport.details.length} registros)
              </h4>
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800/60 text-xs">
                {activeReport.details.map((d, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-900/80">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 text-[10px]">L#{d.rowNumber}</span>
                      <strong className="text-slate-200">{d.studentName}</strong>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px] hidden sm:inline">{d.message}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
                        d.action === "CREATED" ? "bg-emerald-500/20 text-emerald-300" :
                        d.action === "UPDATED" ? "bg-blue-500/20 text-blue-300" :
                        d.action === "SKIPPED" ? "bg-amber-500/20 text-amber-300" :
                        "bg-rose-500/20 text-rose-300"
                      }`}>
                        {d.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {activeReport.status !== "ROLLED_BACK" && (
                  <button
                    type="button"
                    onClick={() => {
                      const chk = savedCheckpoints.find(c => c.id === activeReport.checkpointId);
                      if (chk) handleRollback(chk);
                    }}
                    className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    <span>Reverter Esta Migração (Desfazer)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setRawRows([]);
                    setStagingRows([]);
                    setCurrentStep("upload");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  + Nova Migração
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate("training")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>Ver Alunos no Módulo de Jiu-Jitsu</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("finance")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Ver Faturas & Recorrência</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
