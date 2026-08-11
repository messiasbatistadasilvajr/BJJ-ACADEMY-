import React, { useState } from "react";
import { Academy, Student, PaymentHistory, Instructor } from "../types";
import { 
  Building2, Users, CreditCard, ShieldAlert, 
  ArrowUpRight, Award, TrendingUp, Calendar, Clock, Activity, CheckCircle2,
  Cake, Gift, MessageSquare, X
} from "lucide-react";

interface DashboardViewProps {
  academies: Academy[];
  students: Student[];
  instructors?: Instructor[];
  payments: PaymentHistory[];
  onNavigate: (tab: string) => void;
  onSelectStudent: (student: Student) => void;
}

export default function DashboardView({ 
  academies, 
  students, 
  instructors = [],
  payments, 
  onNavigate,
  onSelectStudent
}: DashboardViewProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Aggregate KPIs
  const totalStudents = students.length;
  
  // Calculate total revenue from active academies
  const totalRevenue = academies.reduce((acc, curr) => acc + (curr.monthlyRevenue || 0), 0);
  const churnRiskCount = students.filter(s => s.status === "ChurnRisk").length;
  const pendingGrads = students.filter(s => {
    // If student has 4 stripes on a non-black belt, they are candidates
    return s.stripes >= 4 && s.belt !== "Black";
  }).length;

  // Overdue students
  const overdueStudents = students.filter(s => s.paymentStatus === "Overdue");

  // Find if we are in single academy view or super admin view
  const isSingleAcademy = academies.length === 1;
  const activeAcademy = isSingleAcademy ? academies[0] : null;

  // Localized date formatting for Portuguese
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Helper to parse birthdate and check if today/this month
  const getBirthdayStatus = (birthDateStr: string) => {
    if (!birthDateStr) return null;
    const parts = birthDateStr.split("-");
    if (parts.length !== 3) return null;
    const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
    const birthDay = parseInt(parts[2], 10);

    const isToday = birthMonth === today.getMonth() && birthDay === today.getDate();
    const isThisMonth = birthMonth === today.getMonth();

    return {
      isToday,
      isThisMonth,
      birthDay,
      birthMonth,
    };
  };

  const currentMonthName = today.toLocaleDateString("pt-BR", { month: "long" });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // Combine students and instructors for birthdays
  const allBirthdays = [
    ...students.map(s => ({ ...s, type: "student" as const })),
    ...instructors.map(i => ({ ...i, type: "instructor" as const }))
  ].map(person => {
    const bDetails = getBirthdayStatus(person.birthDate);
    return {
      ...person,
      bDetails
    };
  }).filter(person => person.bDetails !== null && person.bDetails.isThisMonth);

  const birthdaysToday = allBirthdays.filter(p => p.bDetails?.isToday);
  const upcomingBirthdays = allBirthdays
    .filter(p => !p.bDetails?.isToday)
    .sort((a, b) => (a.bDetails?.birthDay || 0) - (b.bDetails?.birthDay || 0));

  const handleSendCongrats = (person: any) => {
    const text = person.type === "instructor" 
      ? `Mestre ${person.name}, parabéns pelo seu aniversário! Agradecemos por toda a dedicação e ensinamentos passados no tatame. Feliz aniversário! Oss! 🥋🎂`
      : `Olá ${person.name}, nós da BJJ Academy queremos te desejar um feliz aniversário! Parabéns por mais um ano de vida e de muito tatame! Oss! 🥋🎂`;
    
    const encoded = encodeURIComponent(text);
    const cleanPhone = person.phone.replace(/\D/g, "");
    
    try {
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
    } catch (e) {
      console.warn("Popup blocked.");
    }
    
    setToastMessage(`Mensagem enviada via WhatsApp para ${person.name}! 🎉`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Belt distribution count helper
  const beltCounts = students.reduce((acc, s) => {
    acc[s.belt] = (acc[s.belt] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const beltsOrder: ("White" | "Blue" | "Purple" | "Brown" | "Black")[] = [
    "White", "Blue", "Purple", "Brown", "Black"
  ];

  const beltStyles: Record<string, { label: string; bg: string; text: string; barBg: string }> = {
    White: { label: "Faixa Branca", bg: "bg-slate-100", text: "text-slate-900", barBg: "bg-slate-300" },
    Blue: { label: "Faixa Azul", bg: "bg-blue-600", text: "text-white", barBg: "bg-blue-500" },
    Purple: { label: "Faixa Roxa", bg: "bg-purple-600", text: "text-white", barBg: "bg-purple-500" },
    Brown: { label: "Faixa Marrom", bg: "bg-amber-800", text: "text-white", barBg: "bg-amber-700" },
    Black: { label: "Faixa Preta", bg: "bg-red-600", text: "text-white", barBg: "bg-red-600" },
  };

  return (
    <div className="space-y-6 relative" id="dashboard-view-container">
      {/* Dynamic Toast banner if active */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-slate-900 border border-emerald-500/30 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400">🎉</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      {/* Dynamic Welcoming Header */}
      <div className="bg-slate-900/80 border border-slate-800/90 p-6 md:p-8 rounded-2xl relative overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="absolute right-0 top-0 h-64 w-64 bg-gradient-to-bl from-blue-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 h-40 w-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 font-mono px-3 py-1 rounded-full border border-blue-400/30 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {isSingleAcademy ? "Academia Contratante" : "BJJ Academy • SaaS Global Admin"}
              </span>
              <span className="text-[10px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-full font-mono border border-slate-700/50">v1.2</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white mt-1">
              {activeAcademy ? `🥋 ${activeAcademy.name}` : "🥋 BJJ Academy System"}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {activeAcademy 
                ? `Gestão da academia contratante ${activeAcademy.name} (${activeAcademy.unit}) via plataforma BJJ Academy. Acompanhe treinos, graduações, finanças e engajamento dos atletas.` 
                : "Visão estratégica unificada de todas as academias contratantes do sistema BJJ Academy. Controle de faturamento, evasão e evolução técnica de toda a rede."}
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-800/90 px-4 py-3 rounded-2xl self-start md:self-center shadow-lg backdrop-blur-md">
            <Calendar className="w-4 h-4 text-blue-400" />
            <div className="text-left font-sans">
              <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Data de Hoje</span>
              <span className="text-xs text-slate-200 font-bold block">{capitalizedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Units / Active Academy */}
        <div 
          onClick={() => onNavigate(isSingleAcademy ? "training" : "academies")}
          className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden"
          id="stat-academies"
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl translate-x-8 translate-y-8 group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isSingleAcademy ? "Professores Ativos" : "Academias Ativas"}
            </span>
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-bold tracking-tight text-white">
              {isSingleAcademy ? activeAcademy?.instructorsCount : academies.length}
            </span>
            <span className="text-xs text-blue-400 flex items-center gap-0.5 font-medium">
              {isSingleAcademy ? "Docentes" : "Multi-unid"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 relative z-10">
            {isSingleAcademy ? `Responsáveis por ${activeAcademy?.unit}` : "Controladas por Tenant Principal"}
          </p>
        </div>

        {/* Card 2: Total Students */}
        <div 
          onClick={() => onNavigate("training")}
          className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden"
          id="stat-students"
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl translate-x-8 translate-y-8 group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Alunos</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-bold tracking-tight text-white">{totalStudents}</span>
            <span className="text-xs text-emerald-400 flex items-center gap-0.5 font-medium">
              <TrendingUp className="w-3 h-3" /> Alunos ativos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 relative z-10">Check-ins e frequência monitorados</p>
        </div>

        {/* Card 3: Revenue */}
        <div 
          onClick={() => onNavigate("finance")}
          className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden"
          id="stat-revenue"
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl translate-x-8 translate-y-8 group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isSingleAcademy ? "Receita Projetada" : "Faturamento Consolidado"}
            </span>
            <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-bold tracking-tight text-white">
              {isSingleAcademy && activeAcademy
                ? (activeAcademy.monthlyRevenue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : totalRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 relative z-10">Mensalidades sob controle</p>
        </div>

        {/* Card 4: Churn Risks */}
        <div 
          onClick={() => onNavigate("ai-coach")}
          className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden"
          id="stat-risk"
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl translate-x-8 translate-y-8 group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Risco de Evasão</span>
            <div className="p-2 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-bold tracking-tight text-white">{churnRiskCount}</span>
            <span className="text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
              Alerta Crítico
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 relative z-10">Alunos ausentes há mais de 15 dias</p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Charts and Custom Insights */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue distribution chart (shows comparative if super admin, or monthly history if single academy) */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" /> 
                {isSingleAcademy ? "Aproveitamento Financeiro Mensal" : "Faturamento Mensal por Unidade"}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Julho 2026
              </span>
            </div>

            {!isSingleAcademy ? (
              // SaaS Superadmin: list of multiple academies compared
              <div className="space-y-4">
                {academies.map((ac) => {
                  const maxRevenue = Math.max(...academies.map(a => a.monthlyRevenue), 1);
                  const percent = ((ac.monthlyRevenue || 0) / maxRevenue) * 100;
                  return (
                    <div key={ac.id} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          {ac.name} <span className="text-slate-500 text-[10px]">({ac.unit})</span>
                        </span>
                        <span className="font-mono text-white font-semibold">
                          {(ac.monthlyRevenue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex border border-slate-800/50">
                        <div 
                          style={{ width: `${percent}%` }}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full h-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Single Academy View: show student financial statuses
              <div className="space-y-5">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Status de cobrança de mensalidades para os atletas vinculados a esta unidade. Garanta o recebimento em dia para manter o fluxo de caixa saudável.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-sans">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Mensalidades Pagas</span>
                    <strong className="text-emerald-400 text-lg md:text-xl font-mono block mt-1">
                      {students.filter(s => s.paymentStatus === "Paid").length}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Em dia</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Atrasadas</span>
                    <strong className="text-rose-400 text-lg md:text-xl font-mono block mt-1">
                      {students.filter(s => s.paymentStatus === "Overdue").length}
                    </strong>
                    <span className="text-[9px] text-rose-500/80 block mt-0.5">Vencidas</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Alunos Ativos</span>
                    <strong className="text-blue-400 text-lg md:text-xl font-mono block mt-1">
                      {students.filter(s => s.status === "Active").length}
                    </strong>
                    <span className="text-[9px] text-blue-400 block mt-0.5">Frequentes</span>
                  </div>
                </div>
                
                {/* Visual progression bar for single academy payments */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400 font-semibold">
                    <span>Taxa de Adimplência</span>
                    <span className="text-emerald-400">
                      {Math.round((students.filter(s => s.paymentStatus === "Paid").length / (students.length || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex border border-slate-800/50">
                    <div 
                      style={{ width: `${(students.filter(s => s.paymentStatus === "Paid").length / (students.length || 1)) * 100}%` }}
                      className="bg-emerald-500 rounded-full h-full"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Projeção de novos atletas para este ciclo: <strong className="text-emerald-400">+15%</strong>
              </span>
              <button 
                onClick={() => onNavigate("finance")}
                className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
              >
                Detalhes das transações →
              </button>
            </div>
          </div>

          {/* Brazilian Jiu-Jitsu Belt Distribution Widget (Super relevant!) */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" /> Censo de Faixas da Unidade
                </h3>
                <p className="text-xs text-slate-500 mt-1">Estatística de graduações e tempo de tatame dos alunos.</p>
              </div>
              <span className="text-xs bg-slate-950 text-slate-400 px-3 py-1 rounded-full border border-slate-800/60">
                {students.length} Praticantes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
              {beltsOrder.map((belt) => {
                const count = beltCounts[belt] || 0;
                const total = students.length || 1;
                const percentage = Math.round((count / total) * 100);
                const style = beltStyles[belt];
                
                return (
                  <div 
                    key={belt} 
                    className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{style.label}</span>
                      <span className={`w-3 h-3 rounded-full ${style.bg} border ${style.bg === "bg-slate-100" ? "border-slate-400" : "border-transparent"}`} />
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl font-bold text-white block">{count}</span>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>Frequência</span>
                        <span className="font-mono">{percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          style={{ width: `${percentage}%` }}
                          className={`${style.barBg} h-full rounded-full`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academies Multi-unit Cards (Only visible if super-admin or has multiple) */}
          {!isSingleAcademy && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Unidades sob Supervisão</h3>
                <button 
                  onClick={() => onNavigate("academies")}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Configurar academias <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {academies.map((ac) => (
                  <div key={ac.id} className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-300 hover:bg-slate-900/60">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm">{ac.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{ac.unit}</p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-1.5 py-0.5 rounded font-semibold">
                          Licenciada
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/30 text-center">
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-bold">Atletas</span>
                        <strong className="text-white text-sm">{ac.activeStudents}</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-bold">Grad. Pnd</span>
                        <strong className="text-amber-400 text-sm">{ac.pendingGraduations}</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-bold">Professores</span>
                        <strong className="text-slate-300 text-sm">{ac.instructorsCount}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Churn Alerts and Instant Actions */}
        <div className="space-y-6">
          
          {/* Churn Risk & Engagement Tasks */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" /> Risco de Churn (Inatividade)
              </h3>
              <span className="text-[10px] bg-rose-500/15 text-rose-400 font-mono px-2 py-0.5 rounded-full font-semibold">
                {churnRiskCount} Alunos
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Atletas identificados pela IA com risco iminente de evasão por falta de frequência nos últimos 15 dias.
            </p>

            {students.filter(s => s.status === "ChurnRisk").length === 0 ? (
              <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-slate-800/40">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs text-slate-400 font-medium">Frequência perfeita na unidade!</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Nenhum aluno em risco no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.filter(s => s.status === "ChurnRisk").map(student => (
                  <div 
                    key={student.id} 
                    className="p-3 bg-rose-950/10 hover:bg-rose-950/15 border border-rose-900/25 rounded-xl flex items-center justify-between gap-2 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-200 text-xs truncate max-w-[120px]">{student.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold font-mono ${
                          student.belt === "White" ? "bg-slate-200 text-slate-900" :
                          student.belt === "Blue" ? "bg-blue-600 text-white" :
                          student.belt === "Purple" ? "bg-purple-600 text-white" :
                          student.belt === "Brown" ? "bg-amber-800 text-white" : "bg-zinc-900 text-red-500 border border-red-500"
                        }`}>
                          {student.belt}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Ausente há <strong className="text-rose-400 font-mono">{student.daysSinceLastClass} dias</strong>
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        onNavigate("ai-coach");
                        onSelectStudent(student);
                      }}
                      className="text-[10px] bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 active:scale-95"
                    >
                      Ação IA <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 mt-4">
              <span className="text-[9px] text-blue-400 uppercase font-bold tracking-wider block mb-1">Como funciona?</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                A IA analisa o histórico de graduação e as presenças no tatame para sugerir mensagens de reengajamento altamente personalizadas.
              </p>
            </div>
          </div>

          {/* Pending SaaS Bill Alerts */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Mensalidades Atrasadas
              </h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded-full font-semibold">
                {overdueStudents.length} Débitos
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Alunos com pagamentos vencidos. Envie uma notificação amigável para acerto rápido de débitos.
            </p>

            {overdueStudents.length === 0 ? (
              <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-slate-800/40">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs text-slate-400 font-medium">Adimplência em 100%!</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Sem pendências ou faturas atrasadas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueStudents.slice(0, 4).map(student => (
                  <div key={student.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs hover:border-slate-700 transition-colors">
                    <div>
                      <span className="font-bold text-slate-300 block">{student.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{student.phone}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-400 font-bold block text-[10px] uppercase">Atrasado</span>
                      <button 
                        onClick={() => onNavigate("finance")}
                        className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline mt-0.5 font-semibold block"
                      >
                        Cobrar PIX
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aniversariantes (Alunos & Professores) */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Cake className="w-4 h-4 text-pink-500 animate-bounce" /> Aniversariantes do Mês
              </h3>
              <span className="text-[10px] bg-pink-500/10 text-pink-400 font-mono px-2 py-0.5 rounded-full font-semibold">
                {capitalizedMonth}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Monitore os aniversariantes (professores e alunos) para fortalecer os laços e reter alunos através de campanhas de felicitação rápidas.
            </p>

            {/* HOJE SECTION */}
            <div className="space-y-3 mb-5">
              <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                <span>Hoje 🎂</span>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
              </span>
              {birthdaysToday.length === 0 ? (
                <div className="py-3 px-4 bg-slate-950/40 rounded-xl border border-slate-800/50 text-center text-[11px] text-slate-500">
                  Nenhum aniversariante hoje.
                </div>
              ) : (
                <div className="space-y-2">
                  {birthdaysToday.map((person: any) => (
                    <div 
                      key={person.id} 
                      className="p-3 bg-pink-950/10 border border-pink-500/20 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-bold text-slate-200 text-xs">{person.name}</strong>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase ${
                            person.type === "instructor" 
                              ? "bg-purple-600 text-white" 
                              : "bg-blue-600 text-white"
                          }`}>
                            {person.type === "instructor" ? "Professor" : "Aluno"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <span>Telefone:</span> 
                          <span className="font-mono text-slate-300">{person.phone}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleSendCongrats(person)}
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 flex-shrink-0"
                        title="Enviar parabéns por WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Parabéns</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PROXIMOS DO MES SECTION */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Próximos Dias 🎉</span>
              {upcomingBirthdays.length === 0 ? (
                <div className="py-3 px-4 bg-slate-950/40 rounded-xl border border-slate-800/50 text-center text-[11px] text-slate-500">
                  Sem mais aniversariantes este mês.
                </div>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin pr-1">
                  {upcomingBirthdays.map((person: any) => (
                    <div 
                      key={person.id} 
                      className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between text-xs hover:border-slate-800 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300">{person.name}</span>
                          <span className={`text-[8px] px-1 rounded font-mono font-semibold uppercase ${
                            person.type === "instructor" 
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {person.type === "instructor" ? "Prof" : "Aluno"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Aniversário em {person.bDetails?.birthDay} de {capitalizedMonth}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <button
                          onClick={() => handleSendCongrats(person)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                          title="Enviar parabéns por WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
