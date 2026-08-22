import React, { useState, useEffect } from "react";
import { Academy, Instructor, Student, Lead, ClassSchedule, PaymentHistory, Technique, GraduationCandidate, MarketingCampaign } from "./types";
import { 
  initialAcademies, 
  initialInstructors,
  initialStudents, 
  initialLeads, 
  initialClassSchedules, 
  initialPayments, 
  initialTechniques, 
  initialGraduations, 
  initialCampaigns 
} from "./data";

// Background Hero Image (High Resolution Cinematic BJJ Action)
const bjjBackgroundImg = "/src/assets/images/bjj_action_hero_1786063098183.jpg";

// Views
import DashboardView from "./components/DashboardView";
import AcademyManager from "./components/AcademyManager";
import TrainingManager from "./components/TrainingManager";
import FinanceView from "./components/FinanceView";
import CrmMarketingView from "./components/CrmMarketingView";
import MobileSimulator from "./components/MobileSimulator";
import AiCoachView from "./components/AiCoachView";
import ParentsPortal from "./components/ParentsPortal";
import MigrationCenter from "./components/MigrationCenter";
import { MigrationCheckpoint, MigrationReport } from "./types";

// Icons
import { 
  LayoutDashboard, Building2, Award, CreditCard, 
  Target, Smartphone, BrainCircuit, Globe, LogOut, HeartHandshake,
  Database, UploadCloud
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [userRole, setUserRole] = useState<"super" | "ac-1" | "ac-2" | "ac-3">(() => {
    const saved = localStorage.getItem("bjj_user_role");
    return (saved as any) || "super";
  });

  // Global state managers
  const [academies, setAcademies] = useState<Academy[]>(() => {
    const saved = localStorage.getItem("bjj_academies");
    return saved ? JSON.parse(saved) : initialAcademies;
  });

  const [instructors, setInstructors] = useState<Instructor[]>(() => {
    const saved = localStorage.getItem("bjj_instructors");
    return saved ? JSON.parse(saved) : initialInstructors;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem("bjj_students");
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem("bjj_leads");
    return saved ? JSON.parse(saved) : initialLeads;
  });

  const [payments, setPayments] = useState<PaymentHistory[]>(() => {
    const saved = localStorage.getItem("bjj_payments");
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [graduations, setGraduations] = useState<GraduationCandidate[]>(() => {
    const saved = localStorage.getItem("bjj_graduations");
    return saved ? JSON.parse(saved) : initialGraduations;
  });

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => {
    const saved = localStorage.getItem("bjj_campaigns");
    return saved ? JSON.parse(saved) : initialCampaigns;
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filtered lists depending on active tenant (role switcher)
  const visibleStudents = userRole === "super" ? students : students.filter(s => s.academyId === userRole);
  const visibleInstructors = userRole === "super" ? instructors : instructors.filter(i => i.academyId === userRole);
  const visiblePayments = userRole === "super" ? payments : payments.filter(p => p.academyId === userRole);
  const visibleLeads = userRole === "super" ? leads : leads.filter(l => l.academyId === userRole);
  const visibleClassSchedules = userRole === "super" ? initialClassSchedules : initialClassSchedules.filter(s => s.academyId === userRole);
  const visibleGraduations = userRole === "super" ? graduations : graduations.filter(g => g.academyId === userRole);
  const visibleCampaigns = userRole === "super" ? campaigns : campaigns.filter(c => c.academyId === userRole);
  const visibleAcademies = userRole === "super" ? academies : academies.filter(a => a.id === userRole);

  // Sync state to local storage for realistic persistence
  useEffect(() => {
    localStorage.setItem("bjj_user_role", userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem("bjj_academies", JSON.stringify(academies));
  }, [academies]);

  useEffect(() => {
    localStorage.setItem("bjj_instructors", JSON.stringify(instructors));
  }, [instructors]);

  useEffect(() => {
    localStorage.setItem("bjj_students", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem("bjj_leads", JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem("bjj_payments", JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem("bjj_graduations", JSON.stringify(graduations));
  }, [graduations]);

  useEffect(() => {
    localStorage.setItem("bjj_campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  // Handlers
  const handleAddAcademy = (newAc: Omit<Academy, "id">) => {
    const newAcademy: Academy = {
      ...newAc,
      id: `ac-${Date.now()}`
    };
    setAcademies(prev => [...prev, newAcademy]);
  };

  const handleAddStudent = (newStudentData: Omit<Student, "id">) => {
    const studentId = `st-${Date.now()}`;
    const dueDay = newStudentData.paymentDueDay || 10;
    
    // Calculate next month payment date if not already provided
    let nextDate = newStudentData.nextPaymentDate;
    if (!nextDate) {
      const today = new Date();
      let year = today.getFullYear();
      let month = today.getMonth() + 1; // next month
      if (month > 11) {
        month = 0;
        year += 1;
      }
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const day = Math.min(dueDay, lastDayOfMonth);
      const mStr = String(month + 1).padStart(2, "0");
      const dStr = String(day).padStart(2, "0");
      nextDate = `${year}-${mStr}-${dStr}`;
    }

    const newStudent: Student = {
      ...newStudentData,
      id: studentId,
      paymentDueDay: dueDay,
      nextPaymentDate: nextDate,
      asaasCustomerId: newStudentData.asaasCustomerId || `cus_${Math.floor(Math.random() * 900000 + 100000)}`,
      asaasSubscriptionId: newStudentData.asaasSubscriptionId || `sub_${Math.floor(Math.random() * 9000000 + 1000000)}`,
    };

    setStudents(prev => [newStudent, ...prev]);

    // Automatically generate the next month tuition invoice in PaymentHistory
    const planAmount = newStudent.planValue || 250;
    const isGuardianContact = Boolean(newStudent.guardianName && newStudent.guardianPhone);
    const recipientName = isGuardianContact ? (newStudent.guardianName || "Responsável") : newStudent.name;
    const recipientPhone = isGuardianContact ? (newStudent.guardianPhone || newStudent.phone) : newStudent.phone;
    const txId = Math.random().toString(36).substring(2, 12).toUpperCase();

    const newInvoice: PaymentHistory = {
      id: `pay-${Date.now()}`,
      academyId: newStudent.academyId,
      studentId: newStudent.id,
      studentName: newStudent.name,
      amount: planAmount,
      originalAmount: planAmount,
      date: new Date().toISOString().split("T")[0],
      dueDate: nextDate,
      status: "Pending",
      method: newStudent.billingType || "PIX",
      asaasInvoiceId: `pay_${Math.floor(Math.random() * 900000000 + 100000000)}`,
      pixCopiaECola: `00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/pay_${txId}`,
      recipientName,
      recipientPhone,
      recipientType: isGuardianContact ? "GUARDIAN" : "STUDENT",
      fineAmount: 0,
      interestAmount: 0,
      daysOverdue: 0,
      updatedTotalAmount: planAmount,
      notificationCount: 0,
      notes: `Mensalidade automática gerada no ato da matrícula (${newStudent.plan || "Mensal"}). Próximo vencimento: ${nextDate.split("-").reverse().join("/")}`
    };

    setPayments(prev => [newInvoice, ...prev]);
  };

  const handleUpdateStudent = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleUpdateGraduation = (id: string, status: GraduationCandidate["status"]) => {
    setGraduations(prev => prev.map(g => {
      if (g.id === id) {
        // If approved, update student's rank also in student collection
        if (status === "Approved") {
          const student = students.find(s => s.name === g.studentName);
          if (student) {
            let nextBelt = student.belt;
            let nextStripes = student.stripes + 1;
            if (nextStripes > 4) {
              nextStripes = 0;
              const belts: Student["belt"][] = ["White", "Blue", "Purple", "Brown", "Black"];
              const currIdx = belts.indexOf(student.belt);
              if (currIdx !== -1 && currIdx < belts.length - 1) {
                nextBelt = belts[currIdx + 1];
              }
            }
            handleUpdateStudent({
              ...student,
              belt: nextBelt,
              stripes: nextStripes,
              status: "Active"
            });
          }
        }
        return { ...g, status };
      }
      return g;
    }));
  };

  const handleAddPayment = (pay: Omit<PaymentHistory, "id">) => {
    const student = students.find(s => s.id === pay.studentId);
    const targetAcademyId = student ? student.academyId : (userRole === "super" ? "ac-2" : userRole);

    const newPay: PaymentHistory = {
      ...pay,
      id: `pay-${Date.now()}`,
      academyId: targetAcademyId
    };
    setPayments(prev => [newPay, ...prev]);

    // Update student overdue status to Paid if they were Overdue
    if (student) {
      handleUpdateStudent({
        ...student,
        paymentStatus: "Paid",
        status: "Active"
      });
    }
  };

  const handleSendInvoiceAlert = (student: Student) => {
    // Simulated notification trigger
    const newCampaign: MarketingCampaign = {
      id: `cmp-${Date.now()}`,
      academyId: student.academyId,
      name: `Cobrança Manual: ${student.name}`,
      type: "WhatsApp",
      status: "Completed",
      sentCount: 1,
      targetAudience: `Contato único para ${student.name}`
    };
    setCampaigns(prev => [newCampaign, ...prev]);
  };

  const handleAddLead = (ld: Omit<Lead, "id">) => {
    const newLead: Lead = {
      ...ld,
      id: `ld-${Date.now()}`,
      academyId: userRole === "super" ? "ac-2" : userRole
    };
    setLeads(prev => [newLead, ...prev]);
  };

  const handleUpdateLeadPhase = (id: string, phase: Lead["phase"]) => {
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        // If Won, convert lead to active student automatically!
        if (phase === "Won") {
          const newStudent: Student = {
            id: `st-${Date.now()}`,
            academyId: l.academyId,
            name: l.name,
            email: l.email || `${l.name.toLowerCase().replace(/\s+/g, '')}@email.com`,
            phone: l.phone,
            belt: "White",
            stripes: 0,
            attendance30Days: 0,
            daysSinceLastClass: 1,
            status: "Active",
            paymentStatus: "Paid",
            registrationDate: new Date().toISOString().split("T")[0],
            birthDate: "1998-01-01"
          };
          setStudents(prevSt => [newStudent, ...prevSt]);
        }
        return { ...l, phase };
      }
      return l;
    }));
  };

  // Check in student in simulator
  const handleCheckIn = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      handleUpdateStudent({
        ...student,
        attendance30Days: student.attendance30Days + 1,
        daysSinceLastClass: 0,
        status: "Active"
      });
    }
  };

  const handleNavigateToAi = (student: Student) => {
    setSelectedStudent(student);
    setActiveTab("ai-coach");
  };

  // Handler for applying Universal Migration results
  const handleApplyMigration = (
    newStudents: Student[],
    newPayments: PaymentHistory[],
    newGraduations: GraduationCandidate[],
    checkpoint: MigrationCheckpoint,
    report: MigrationReport
  ) => {
    setStudents(newStudents);
    setPayments(newPayments);
    setGraduations(newGraduations);
  };

  // Handler for rolling back migration from snapshot checkpoint
  const handleRollbackMigration = (checkpoint: MigrationCheckpoint) => {
    setStudents(checkpoint.snapshotState.students);
    setPayments(checkpoint.snapshotState.payments);
    setGraduations(checkpoint.snapshotState.graduations);
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-blue-600 selection:text-white" id="app-wrapper">
      
      {/* Background Image of BJJ Fighters Grappling with Dark Gradient Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img 
          src={bjjBackgroundImg} 
          alt="BJJ Fighters Grappling Background" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-40 md:opacity-50 filter brightness-105 contrast-110 saturate-110 scale-100 transform transition-all duration-1000"
        />
        {/* Cinematic Vignette & Gradient Overlays for High Contrast Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060911]/80 via-[#060911]/60 to-[#060911]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060911]/70 via-transparent to-[#060911]/70" />
      </div>

      {/* Top Main Navigation Bar with Glassmorphism */}
      <nav className="bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 p-2.5 rounded-xl font-bold text-white text-base font-display shadow-lg shadow-blue-600/30 flex items-center justify-center">
            🥋 BJJ
          </div>
          <div>
            <span className="font-display font-bold text-white tracking-tight text-base block flex items-center gap-1.5">
              BJJ Academy
              <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.2 rounded font-mono">SAAS</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">Plataforma de Gestão de Jiu-Jitsu</span>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "academies", label: "Cadastrar Academias", icon: Building2 },
            { id: "migration", label: "Central de Migração", icon: Database },
            { id: "training", label: "Jiu-Jitsu / Chamadas", icon: Award },
            { id: "parents-portal", label: "Portal dos Pais (Kids)", icon: HeartHandshake },
            { id: "finance", label: "Financeiro & Recorrência", icon: CreditCard },
            { id: "crm", label: "CRM & Vendas", icon: Target },
            { id: "mobile", label: "Simulador App Aluno", icon: Smartphone },
            { id: "ai-coach", label: "AI BJJ Academy Coach", icon: BrainCircuit },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isSelected 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-blue-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Global actions / Tenant Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
            <span className="text-[9px] text-slate-400 font-mono font-bold uppercase px-2">Unidade:</span>
            <select
              value={userRole}
              onChange={(e) => {
                const val = e.target.value as any;
                setUserRole(val);
                setSelectedStudent(null);
                setActiveTab("dashboard");
              }}
              className="bg-slate-950 border-none text-xs text-blue-400 font-bold focus:outline-none rounded-lg px-2.5 py-1.5 cursor-pointer max-w-[240px] truncate"
            >
              <option value="super">🔑 SaaS Super Admin (BJJ Academy)</option>
              {academies.map(ac => (
                <option key={ac.id} value={ac.id}>🏢 {ac.name} ({ac.unit})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5 border-l border-slate-800/80 pl-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-200 font-bold block truncate max-w-[150px]">
                {userRole === "super" ? "Messias Batista" :
                 (academies.find(a => a.id === userRole)?.name || "Diretor de Academia")}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {userRole === "super" ? "Administrador Geral" : "Gestor da Unidade"}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-600 border border-blue-400/40 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-600/30">
              {userRole === "super" ? "MB" : "AC"}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Tabs Bar */}
      <div className="lg:hidden bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-2 py-2 overflow-x-auto flex gap-1.5 scrollbar-none sticky top-[57px] z-40">
        {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "academies", label: "Cadastrar Academias", icon: Building2 },
          { id: "migration", label: "Migração", icon: Database },
          { id: "training", label: "Chamadas", icon: Award },
          { id: "parents-portal", label: "Portal dos Pais", icon: HeartHandshake },
          { id: "finance", label: "Financeiro", icon: CreditCard },
          { id: "crm", label: "CRM", icon: Target },
          { id: "mobile", label: "App Aluno", icon: Smartphone },
          { id: "ai-coach", label: "AI Coach", icon: BrainCircuit },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                isSelected 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-400/30" 
                  : "text-slate-300 hover:text-white bg-slate-900/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Primary Workspace Stage */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 relative z-10">
        
        {activeTab === "dashboard" && (
          <DashboardView 
            academies={visibleAcademies}
            students={visibleStudents}
            instructors={visibleInstructors}
            payments={visiblePayments}
            onNavigate={(tab) => {
              setActiveTab(tab as any);
            }}
            onSelectStudent={(st) => {
              setSelectedStudent(st);
              setActiveTab("ai-coach");
            }}
            onAddStudent={handleAddStudent}
          />
        )}

        {activeTab === "academies" && (
          <AcademyManager 
            academies={academies}
            students={students}
            onAddAcademy={handleAddAcademy}
            onAddStudent={handleAddStudent}
            onNavigate={(tab) => setActiveTab(tab)}
            onSwitchTenant={(id) => {
              setUserRole(id as any);
              setActiveTab("dashboard");
            }}
          />
        )}

        {activeTab === "migration" && (
          <MigrationCenter 
            academies={academies}
            students={students}
            payments={payments}
            graduations={graduations}
            userRole={userRole}
            onApplyMigration={handleApplyMigration}
            onRollbackMigration={handleRollbackMigration}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "training" && (
          <TrainingManager 
            students={visibleStudents}
            schedules={visibleClassSchedules}
            techniques={initialTechniques}
            graduations={visibleGraduations}
            academies={academies}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onUpdateGraduation={handleUpdateGraduation}
            onNavigateToAi={handleNavigateToAi}
          />
        )}

        {activeTab === "parents-portal" && (
          <ParentsPortal 
            students={visibleStudents}
            academies={visibleAcademies}
          />
        )}

        {activeTab === "finance" && (
          <FinanceView 
            payments={visiblePayments}
            students={visibleStudents}
            academies={visibleAcademies}
            onAddPayment={handleAddPayment}
            onSendInvoiceAlert={handleSendInvoiceAlert}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
          />
        )}

        {activeTab === "crm" && (
          <CrmMarketingView 
            leads={visibleLeads}
            campaigns={visibleCampaigns}
            onAddLead={handleAddLead}
            onUpdateLeadPhase={handleUpdateLeadPhase}
          />
        )}

        {activeTab === "mobile" && (
          <MobileSimulator 
            students={visibleStudents}
            payments={visiblePayments}
            academies={visibleAcademies}
            schedules={visibleClassSchedules}
            onCheckIn={handleCheckIn}
            onUpdateStudent={handleUpdateStudent}
            onAddPayment={handleAddPayment}
          />
        )}

        {activeTab === "ai-coach" && (
          <AiCoachView 
            students={visibleStudents}
            selectedStudent={selectedStudent}
            onSelectStudent={setSelectedStudent}
            onUpdateStudent={handleUpdateStudent}
          />
        )}

      </main>

      {/* Production-grade Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 BJJ Academy Inc. Todos os direitos reservados. Sistema de Gestão BJJ Academy para Academias Contratantes.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Termos de Uso</span>
            <span className="hover:text-slate-400 cursor-pointer">Políticas de Privacidade</span>
            <span className="hover:text-slate-400 cursor-pointer">Whitelabel SDK</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
