import React, { useState } from "react";
import { Academy, Student } from "../types";
import { 
  Building2, Plus, Shield, ShieldCheck, UserCheck, 
  MapPin, Check, Save, UserX, ToggleLeft, ToggleRight, ListFilter,
  Search, Phone, Mail, ArrowRight, Sparkles, CheckCircle2, DollarSign, Users, Smartphone, X,
  UserPlus, Award, Calendar, CreditCard, ChevronRight, Filter, Eye
} from "lucide-react";
import StudentRegistrationModal from "./StudentRegistrationModal";

interface AcademyManagerProps {
  academies: Academy[];
  students?: Student[];
  onAddAcademy: (newAc: Omit<Academy, "id">) => void;
  onAddStudent?: (studentData: Omit<Student, "id">) => void;
  onSwitchTenant?: (tenantId: string) => void;
}

export default function AcademyManager({ 
  academies, 
  students = [], 
  onAddAcademy, 
  onAddStudent, 
  onSwitchTenant 
}: AcademyManagerProps) {
  const [activeTab, setActiveTab] = useState<"units" | "students" | "permissions">("units");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedAcademyForRegister, setSelectedAcademyForRegister] = useState<string>("");

  // Viewing academy student list modal
  const [viewingAcademy, setViewingAcademy] = useState<Academy | null>(null);

  // Filter student list by academy state
  const [selectedAcademyTab, setSelectedAcademyTab] = useState<string>("all");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  // Form states for new academy
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [respMaster, setRespMaster] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [plan, setPlan] = useState("Plano Black Belt SaaS (R$ 890/mês)");
  const [activeStudents, setActiveStudents] = useState(120);
  const [monthlyRevenue, setMonthlyRevenue] = useState(890);
  const [instructorsCount, setInstructorsCount] = useState(3);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleOpenRegisterForAcademy = (academyId: string) => {
    setSelectedAcademyForRegister(academyId);
    setIsRegisterModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unit) return;

    let revenueVal = Number(monthlyRevenue);
    if (plan.includes("890")) revenueVal = 890;
    else if (plan.includes("490")) revenueVal = 490;
    else if (plan.includes("290")) revenueVal = 290;

    onAddAcademy({
      name,
      unit: unit.includes(" - ") ? unit : `${unit} - BR`,
      activeStudents: Number(activeStudents),
      monthlyRevenue: revenueVal,
      pendingGraduations: 0,
      instructorsCount: Number(instructorsCount),
    });

    triggerToast(`🎉 Academia "${name}" cadastrada com sucesso! Novo contrato SaaS ativo e liberado no sistema.`);

    // Reset
    setName("");
    setUnit("");
    setRespMaster("");
    setPhone("");
    setEmail("");
    setCnpj("");
    setShowForm(false);
  };

  // Filtered academies
  const filteredAcademies = academies.filter(ac => 
    ac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ac.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ac.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Total KPIs
  const totalStudentsCount = students.length;
  const totalMrr = academies.reduce((acc, curr) => acc + curr.monthlyRevenue, 0);

  // Filter students for the dedicated student tab
  const displayedStudents = students.filter(st => {
    const matchesAcademy = selectedAcademyTab === "all" || st.academyId === selectedAcademyTab;
    const matchesSearch = st.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                          st.phone.includes(studentSearchTerm) ||
                          st.email.toLowerCase().includes(studentSearchTerm.toLowerCase());
    return matchesAcademy && matchesSearch;
  });

  // Mock roles and permissions configuration
  const [roles, setRoles] = useState([
    {
      id: "rl-1",
      name: "Administrador Geral (SaaS Owner)",
      description: "Acesso total irrestrito a todas as unidades, relatórios financeiros consolidados e gerenciamento de faturas.",
      permissions: { writeFinance: true, editGraduations: true, attendanceAccess: true, deleteStudents: true }
    },
    {
      id: "rl-2",
      name: "Professor / Mestre (Head Instructor)",
      description: "Lança presenças, prescreve planos de estudos, avalia técnicas e aprova candidatos nos exames de graduação.",
      permissions: { writeFinance: false, editGraduations: true, attendanceAccess: true, deleteStudents: false }
    },
    {
      id: "rl-3",
      name: "Secretaria / Recepcionista",
      description: "Gerencia cadastros de alunos, emite cobranças por PIX, valida carteirinhas e controla leads do CRM.",
      permissions: { writeFinance: true, editGraduations: false, attendanceAccess: true, deleteStudents: false }
    }
  ]);

  const togglePermission = (roleId: string, permissionKey: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id === roleId) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [permissionKey]: !((r.permissions as any)[permissionKey])
          }
        };
      }
      return r;
    }));
  };

  return (
    <div className="space-y-6" id="academy-manager-root">
      
      {/* Registration Modal triggered for a specific academy */}
      {isRegisterModalOpen && onAddStudent && (
        <StudentRegistrationModal 
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          academies={academies}
          selectedAcademyId={selectedAcademyForRegister}
          onAddStudent={(stData) => {
            onAddStudent(stData);
            const targetAc = academies.find(a => a.id === stData.academyId);
            triggerToast(`🎉 Aluno ${stData.name} cadastrado com sucesso na academia ${targetAc ? targetAc.name : "selecionada"}!`);
          }}
        />
      )}

      {/* Modal for viewing academy roster */}
      {viewingAcademy && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-blue-500/50 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 relative my-8 max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setViewingAcademy(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Alunos da Unidade: {viewingAcademy.name}</h3>
                <p className="text-xs text-slate-400">{viewingAcademy.unit} • Total de {students.filter(s => s.academyId === viewingAcademy.id).length} alunos cadastrados nesta página.</p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300 font-semibold">Deseja matricular um novo atleta nesta unidade?</span>
              {onAddStudent && (
                <button
                  onClick={() => {
                    setViewingAcademy(null);
                    handleOpenRegisterForAcademy(viewingAcademy.id);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Cadastrar Novo Aluno Aqui
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {students.filter(s => s.academyId === viewingAcademy.id).length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum aluno cadastrado para esta academia ainda. Clique no botão acima para realizar a primeira matrícula.
                </div>
              ) : (
                students.filter(s => s.academyId === viewingAcademy.id).map(st => (
                  <div key={st.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        st.belt === "White" ? "bg-slate-200 text-slate-900" :
                        st.belt === "Blue" ? "bg-blue-600 text-white" :
                        st.belt === "Purple" ? "bg-purple-600 text-white" :
                        st.belt === "Brown" ? "bg-amber-800 text-white" : "bg-zinc-950 text-red-500 border border-red-500"
                      }`}>
                        🥋
                      </div>
                      <div>
                        <strong className="text-white block font-bold">{st.name}</strong>
                        <span className="text-[10px] text-slate-400">
                          {st.category} • Faixa {st.belt} ({st.stripes}º Grau) • {st.phone}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        st.paymentStatus === "Paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {st.paymentStatus === "Paid" ? "Adimplente" : "Pendente"}
                      </span>
                      <span className="text-[10px] text-slate-400 block">R$ {st.planValue || 220}/mês</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button 
                onClick={() => setViewingAcademy(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-emerald-950 border-2 border-emerald-500 text-emerald-200 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">{toastMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("units")}
          className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "units" 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Building2 className="w-4 h-4" /> Cadastro & Gestão de Academias ({academies.length})
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "students" 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Users className="w-4 h-4" /> 🎓 Alunos Cadastrados por Academia ({students.length})
        </button>

        <button
          onClick={() => setActiveTab("permissions")}
          className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "permissions" 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Perfis & Permissões (RBAC)
        </button>
      </div>

      {activeTab === "units" && (
        <div className="space-y-6">
          
          {/* Header Action & Top Summary */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono px-2.5 py-0.5 rounded-full font-bold uppercase">
                  Multi-Tenant BJJ SaaS
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {academies.length} Academias Ativas
                </span>
              </div>
              <h2 className="text-lg font-bold text-white font-display">Cadastro & Gerenciamento de Academias</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Cadastre novas escolas de Jiu-Jitsu ou filiais. Cada academia conta com ambiente isolado e cadastro próprio de alunos.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onAddStudent && (
                <button
                  onClick={() => {
                    setSelectedAcademyForRegister(academies[0]?.id || "ac-1");
                    setIsRegisterModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Cadastrar Novo Aluno
                </button>
              )}

              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nova Academia
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/15 text-blue-400 rounded-xl border border-blue-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase block">Academias Contratantes</span>
                <span className="text-xl font-bold text-white font-mono">{academies.length} Unidades</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase block">Total de Alunos Matriculados</span>
                <span className="text-xl font-bold text-white font-mono">{totalStudentsCount} Atletas</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase block">Receita Recorrente SaaS (MRR)</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {totalMrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                </span>
              </div>
            </div>
          </div>

          {/* New Academy Registration Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-900 border-2 border-blue-500/60 p-6 rounded-2xl space-y-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Formulário de Cadastro de Nova Academia / Filial</h3>
                  <p className="text-xs text-slate-400">Preencha os dados do novo contrato para liberar a unidade na plataforma BJJ Academy.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Fantasia da Academia *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: CheckMat Curitiba"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade e Estado (Unidade) *</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Ex: Curitiba - PR"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mestre / Professor Responsável</label>
                  <input
                    type="text"
                    value={respMaster}
                    onChange={(e) => setRespMaster(e.target.value)}
                    placeholder="Ex: Prof. Sebastian"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp de Contato Direto</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: (41) 99988-7766"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: contato@checkmatcuritiba.com.br"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CNPJ / CPF do Responsável</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="Ex: 12.345.678/0001-90"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Plano SaaS Contratado</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Plano Black Belt SaaS (R$ 890/mês)">Plano Black Belt SaaS (R$ 890/mês - Ilimitado)</option>
                    <option value="Plano Ouro SaaS (R$ 490/mês)">Plano Ouro SaaS (R$ 490/mês - Até 150 alunos)</option>
                    <option value="Plano Prata SaaS (R$ 290/mês)">Plano Prata SaaS (R$ 290/mês - Até 60 alunos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Estimativa de Alunos Iniciais</label>
                  <input
                    type="number"
                    value={activeStudents}
                    onChange={(e) => setActiveStudents(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade de Professores</label>
                  <input
                    type="number"
                    value={instructorsCount}
                    onChange={(e) => setInstructorsCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 justify-end border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-transparent hover:bg-slate-800 text-slate-400 text-xs px-4 py-2.5 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                >
                  <Save className="w-4 h-4" /> Efetivar Cadastro da Academia
                </button>
              </div>
            </form>
          )}

          {/* Search Bar & List Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, cidade ou ID..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Exibindo {filteredAcademies.length} de {academies.length} academias
            </span>
          </div>

          {/* List of Academies */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAcademies.map((ac) => {
              const academyStudentsList = students.filter(s => s.academyId === ac.id);
              const countForThisAcademy = academyStudentsList.length || ac.activeStudents;

              return (
                <div key={ac.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between group">
                  <div className="p-5 border-b border-slate-800/80 bg-gradient-to-br from-slate-950/40 via-slate-900/40 to-blue-950/20">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-blue-500/15 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/25 transition-all">
                        <Building2 className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                          🟢 Contrato Ativo
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          ID: {ac.id}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-base mt-4 text-white group-hover:text-blue-300 transition-colors">{ac.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" /> {ac.unit}
                    </p>
                  </div>

                  <div className="p-5 bg-slate-950/30 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Atletas Cadastrados:</span>
                      <strong className="text-white font-mono">{countForThisAcademy} alunos</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Faturamento SaaS:</span>
                      <strong className="text-emerald-400 font-mono font-bold">
                        {ac.monthlyRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Corpo Docente:</span>
                      <strong className="text-slate-200">{ac.instructorsCount} Professores</strong>
                    </div>
                  </div>

                  {/* Quick Action Buttons per Academy */}
                  <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleOpenRegisterForAcademy(ac.id)}
                        className="text-center bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] py-2 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> + Aluno
                      </button>

                      <button 
                        onClick={() => setViewingAcademy(ac)}
                        className="text-center bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" /> Alunos ({academyStudentsList.length})
                      </button>
                    </div>

                    {onSwitchTenant && (
                      <button 
                        onClick={() => {
                          onSwitchTenant(ac.id);
                          triggerToast(`Alternado para o ambiente da academia: ${ac.name}`);
                        }}
                        className="w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs py-2 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-1.5 mt-1"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Acessar Painel Desta Academia
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS LIST BY ACADEMY */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                🎓 Relação de Alunos Cadastrados por Academia
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Selecione uma academia para visualizar, filtrar e matricular novos atletas salvos individualmente em cada página de unidade.
              </p>
            </div>

            {onAddStudent && (
              <button
                onClick={() => {
                  setSelectedAcademyForRegister(selectedAcademyTab !== "all" ? selectedAcademyTab : (academies[0]?.id || "ac-1"));
                  setIsRegisterModalOpen(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 flex-shrink-0"
              >
                <UserPlus className="w-4 h-4" /> Cadastrar Aluno Para Esta Academia
              </button>
            )}
          </div>

          {/* Academy Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-400" /> Filtrar por Academia:
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSelectedAcademyTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedAcademyTab === "all" 
                      ? "bg-blue-600 text-white shadow" 
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  Todas as Academias ({students.length})
                </button>
                {academies.map(ac => (
                  <button
                    key={ac.id}
                    onClick={() => setSelectedAcademyTab(ac.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      selectedAcademyTab === ac.id 
                        ? "bg-blue-600 text-white shadow" 
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    🏢 {ac.name} ({students.filter(s => s.academyId === ac.id).length})
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                placeholder="Buscar por nome, telefone..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Display Students Grid/Table */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-300">
              <span>
                Exibindo <strong className="text-white">{displayedStudents.length}</strong> alunos salvos na página selecionada
              </span>
              {selectedAcademyTab !== "all" && (
                <span className="text-blue-400 font-mono">
                  Unidade: {academies.find(a => a.id === selectedAcademyTab)?.name}
                </span>
              )}
            </div>

            {displayedStudents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-400">Nenhum aluno encontrado para esta academia.</p>
                <button
                  onClick={() => {
                    setSelectedAcademyForRegister(selectedAcademyTab !== "all" ? selectedAcademyTab : (academies[0]?.id || "ac-1"));
                    setIsRegisterModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow"
                >
                  Cadastrar Primeiro Aluno Nesta Academia
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {displayedStudents.map(st => {
                  const studentAcademy = academies.find(a => a.id === st.academyId);

                  return (
                    <div key={st.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/40 transition-all text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow ${
                          st.belt === "White" ? "bg-slate-200 text-slate-900" :
                          st.belt === "Blue" ? "bg-blue-600 text-white" :
                          st.belt === "Purple" ? "bg-purple-600 text-white" :
                          st.belt === "Brown" ? "bg-amber-800 text-white" : "bg-zinc-950 text-red-500 border border-red-500"
                        }`}>
                          🥋
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-white text-sm font-bold">{st.name}</strong>
                            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                              {st.category}
                            </span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                              🏢 {studentAcademy ? studentAcademy.name : "BJJ Academy"}
                            </span>
                          </div>
                          <span className="text-slate-400 text-[11px] block mt-0.5">
                            Faixa {st.belt} ({st.stripes}º Grau) • Tel: {st.phone} • Matrícula: {st.registrationDate || "15/01/2025"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between md:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Plano Contratado</span>
                          <span className="font-bold text-slate-200 font-mono">{st.plan} (R$ {st.planValue || 220}/mês)</span>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border ${
                            st.paymentStatus === "Paid" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {st.paymentStatus === "Paid" ? "Adimplente" : "Pendente"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "permissions" && (
        <div className="space-y-6">
          <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5 font-display">
                <ShieldCheck className="w-5 h-5 text-blue-400" /> Controle de Acesso Baseado em Perfis (RBAC)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize quais telas, relatórios e permissões financeiras cada tipo de usuário da academia possui acesso.
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 text-[11px] font-mono p-2 rounded text-slate-400">
              Audit Logs: <strong className="text-emerald-400">ATIVO</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-500" /> {role.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Políticas de Permissões</h4>
                  
                  {/* Permission item */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-300 font-medium">Lançamento de Cobrança / Pix</span>
                    <button 
                      type="button"
                      onClick={() => togglePermission(role.id, "writeFinance")}
                      className="text-slate-400 hover:text-white transition-all"
                    >
                      {role.permissions.writeFinance ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Permission item */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-300 font-medium">Aprovação de Faixas e Graus</span>
                    <button 
                      type="button"
                      onClick={() => togglePermission(role.id, "editGraduations")}
                      className="text-slate-400 hover:text-white transition-all"
                    >
                      {role.permissions.editGraduations ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Permission item */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-300 font-medium">Controle de Chamadas (Presença)</span>
                    <button 
                      type="button"
                      onClick={() => togglePermission(role.id, "attendanceAccess")}
                      className="text-slate-400 hover:text-white transition-all"
                    >
                      {role.permissions.attendanceAccess ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Permission item */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-300 font-medium">Excluir Alunos e Históricos</span>
                    <button 
                      type="button"
                      onClick={() => togglePermission(role.id, "deleteStudents")}
                      className="text-slate-400 hover:text-white transition-all"
                    >
                      {role.permissions.deleteStudents ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 text-right">
                  <span className="text-[10px] text-slate-500 font-mono block">Atualizado por último: hoje às 14:22</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">Log de Auditoria RBAC Recente</h4>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-500">
              <p><span className="text-slate-400">[2026-07-08 19:10]</span> Mestre Marcelo alterou permissão <strong className="text-slate-300">"editGraduations"</strong> para <strong className="text-amber-500">"Monitor"</strong>.</p>
              <p><span className="text-slate-400">[2026-07-08 16:04]</span> Tenant System revalidou chaves JWT de segurança de todos os secretários.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
