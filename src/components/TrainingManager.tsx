import React, { useState } from "react";
import { Student, ClassSchedule, Technique, GraduationCandidate, BeltColor, Academy } from "../types";
import { 
  Award, Calendar, BookOpen, ClipboardCheck, Check, 
  Trash2, UserPlus, FileText, CheckSquare, Sparkles, Filter, X, Search, Plus, Phone, Users, Camera
} from "lucide-react";
import StudentRegistrationModal from "./StudentRegistrationModal";
import PhotoAttendanceModal from "./PhotoAttendanceModal";

interface TrainingManagerProps {
  students: Student[];
  schedules: ClassSchedule[];
  techniques: Technique[];
  graduations: GraduationCandidate[];
  academies?: Academy[];
  onAddStudent?: (studentData: Omit<Student, "id">) => void;
  onUpdateStudent: (updated: Student) => void;
  onUpdateGraduation: (id: string, status: "Eligible" | "Approved" | "Pending Exam") => void;
  onNavigateToAi: (student: Student) => void;
}

export default function TrainingManager({
  students,
  schedules,
  techniques,
  graduations,
  academies = [],
  onAddStudent,
  onUpdateStudent,
  onUpdateGraduation,
  onNavigateToAi
}: TrainingManagerProps) {
  const [activeTab, setActiveTab] = useState<"attendance" | "students-list" | "techniques" | "graduations">("attendance");
  const [selectedClass, setSelectedClass] = useState<string>(schedules[0]?.id || "");
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  
  // Registration and Photo Attendance modal toggles
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Student directory filters
  const [studentSearch, setStudentSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Adulto" | "Kids">("All");

  // Track selected attendees for the active class session
  const [attendedStudentIds, setAttendedStudentIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Class selection handler
  const currentClass = schedules.find(s => s.id === selectedClass);

  // Toggle attendance state
  const toggleAttendance = (studentId: string) => {
    setAttendedStudentIds(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Submit attendance to increment student count
  const handleSaveAttendance = () => {
    Object.keys(attendedStudentIds).forEach(id => {
      if (attendedStudentIds[id]) {
        const student = students.find(s => s.id === id);
        if (student) {
          onUpdateStudent({
            ...student,
            attendance30Days: student.attendance30Days + 1,
            daysSinceLastClass: 0,
            status: "Active"
          });
        }
      }
    });
    triggerToast("Lista de chamada salva com sucesso! Os históricos e contadores de frequência foram atualizados.");
    setAttendedStudentIds({});
  };

  // Confirm attendance via AI Photo Recognition
  const handleConfirmPhotoAttendance = (studentIds: string[]) => {
    let updatedNames: string[] = [];
    studentIds.forEach(id => {
      const student = students.find(s => s.id === id);
      if (student) {
        onUpdateStudent({
          ...student,
          attendance30Days: student.attendance30Days + 1,
          daysSinceLastClass: 0,
          status: "Active"
        });
        updatedNames.push(student.name);
      }
    });

    triggerToast(`✨ Presença via Foto do Tatame confirmada para ${studentIds.length} alunos (${updatedNames.slice(0, 3).join(", ")}${updatedNames.length > 3 ? "..." : ""})!`);
  };

  // Graduation selection filter
  const [graduationFilter, setGraduationFilter] = useState<string>("All");
  const [academyFilter, setAcademyFilter] = useState<string>("All");

  // Filtered student list for directory
  const filteredStudents = students.filter(st => {
    const matchesSearch = st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          st.phone.includes(studentSearch) ||
                          (st.guardianName && st.guardianName.toLowerCase().includes(studentSearch.toLowerCase()));
    const matchesAcademy = academyFilter === "All" || st.academyId === academyFilter;
    
    if (categoryFilter === "Adulto") return matchesSearch && matchesAcademy && st.category === "Adulto";
    if (categoryFilter === "Kids") return matchesSearch && matchesAcademy && (st.category === "Kids / Infantil" || !!st.guardianName);
    return matchesSearch && matchesAcademy;
  });

  return (
    <div className="space-y-6 relative" id="training-manager-root">
      
      {/* Registration Modal */}
      {isRegisterModalOpen && onAddStudent && (
        <StudentRegistrationModal 
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          academies={academies}
          onAddStudent={(stData) => {
            onAddStudent(stData);
            triggerToast(`Novo aluno ${stData.name} matriculado com sucesso!`);
          }}
        />
      )}

      {/* AI Photo Attendance Modal */}
      <PhotoAttendanceModal 
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        students={students}
        academies={academies}
        selectedAcademyId={academyFilter}
        onConfirmAttendance={handleConfirmPhotoAttendance}
      />

      {/* Dynamic Toast banner if active */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-slate-900 border border-emerald-500/30 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400">✨</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner with Quick Registration Trigger */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 md:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            🥋 Gestão de Alunos, Turmas e Graduações
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre novos praticantes, realize chamadas diárias e controle os exames de faixas da academia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 flex-shrink-0 border border-cyan-400/30"
          >
            <Camera className="w-4 h-4 text-cyan-200" /> Presença por Foto (IA)
          </button>

          {onAddStudent && (
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4 text-blue-400" /> Cadastrar Aluno
            </button>
          )}
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-5 py-3 font-display text-xs md:text-sm font-semibold border-b-2 transition-all flex-shrink-0 ${
            activeTab === "attendance" 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          📋 Lista de Presença / Chamadas
        </button>
        <button
          onClick={() => setActiveTab("students-list")}
          className={`px-5 py-3 font-display text-xs md:text-sm font-semibold border-b-2 transition-all flex-shrink-0 ${
            activeTab === "students-list" 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          👥 Ficha de Alunos ({students.length})
        </button>
        <button
          onClick={() => setActiveTab("techniques")}
          className={`px-5 py-3 font-display text-xs md:text-sm font-semibold border-b-2 transition-all flex-shrink-0 ${
            activeTab === "techniques" 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          📖 Acervo de Técnicas (Posições)
        </button>
        <button
          onClick={() => setActiveTab("graduations")}
          className={`px-5 py-3 font-display text-xs md:text-sm font-semibold border-b-2 transition-all flex-shrink-0 ${
            activeTab === "graduations" 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          🥋 Exames de Faixa / Graduações
        </button>
      </div>

      {/* TAB 1: ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-display">Lançar Presença (Diário de Classe)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Selecione a turma e marque a presença para atualizar os requisitos de exame de faixas automaticamente.</p>
            </div>
            
            {/* Form selectors */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 text-xs">
                <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent text-white border-none py-1.5 focus:outline-none cursor-pointer"
                />
              </div>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                {schedules.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className} ({cls.time})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Class Summary */}
          {currentClass && (
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Turma Selecionada</span>
                <h3 className="font-semibold text-white text-base mt-0.5">{currentClass.className}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Professor: <strong className="text-slate-200">{currentClass.instructorName}</strong> • Dias: {currentClass.daysOfWeek.join(", ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
                >
                  <Camera className="w-4 h-4 text-cyan-200" /> Chamada por Foto (IA)
                </button>
                <button
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    students.forEach(s => { all[s.id] = true; });
                    setAttendedStudentIds(all);
                  }}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs px-3 py-2 rounded-lg font-medium border border-slate-800 transition-all"
                >
                  Marcar Todos
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <ClipboardCheck className="w-4 h-4" /> Registrar Presença
                </button>
              </div>
            </div>
          )}

          {/* Student Grid Selection */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400 font-semibold">
              <span>Filiados Ativos ({students.length})</span>
              <span>Presença nesta Aula</span>
            </div>
            
            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
              {students.map((student) => {
                const isChecked = !!attendedStudentIds[student.id];
                return (
                  <div 
                    key={student.id}
                    onClick={() => toggleAttendance(student.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked ? "bg-blue-950/10 hover:bg-blue-950/15" : "hover:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                        {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-200">{student.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold font-mono ${
                            student.belt === "White" ? "bg-slate-200 text-slate-900" :
                            student.belt === "Blue" ? "bg-blue-600 text-white" :
                            student.belt === "Purple" ? "bg-purple-600 text-white" :
                            student.belt === "Brown" ? "bg-amber-800 text-white" : "bg-zinc-900 text-red-500 border border-red-500"
                          }`}>
                            {student.belt} {student.stripes > 0 ? `${student.stripes}º Grau` : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Frequência nos últimos 30 dias: {student.attendance30Days} treinos • Último treino: {
                            student.daysSinceLastClass === 0 ? "Hoje" : `${student.daysSinceLastClass} dias atrás`
                          }
                        </p>
                      </div>
                    </div>

                    <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center transition-all ${
                      isChecked ? "bg-blue-600 border-blue-500 text-white" : "border-slate-700 bg-slate-950"
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS DIRECTORY / CADASTRO COMPLETO */}
      {activeTab === "students-list" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-display">Ficha de Alunos Cadastrados</h2>
              <p className="text-xs text-slate-500 mt-0.5">Consulte, edite e gerencie o histórico de todos os praticantes da academia.</p>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar aluno, telefone ou responsável..."
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Filter Academy */}
              {academies.length > 0 && (
                <select
                  value={academyFilter}
                  onChange={(e) => setAcademyFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-blue-300 font-semibold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">🏢 Todas as Academias</option>
                  {academies.map(ac => (
                    <option key={ac.id} value={ac.id}>🏢 {ac.name}</option>
                  ))}
                </select>
              )}

              {/* Filter category */}
              <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                {(["All", "Adulto", "Kids"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      categoryFilter === cat 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat === "All" ? "Todos" : cat}
                  </button>
                ))}
              </div>

              {onAddStudent && (
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Novo Aluno
                </button>
              )}
            </div>
          </div>

          {/* Table / Grid of registered students */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="p-4 font-semibold">Atleta</th>
                    <th className="p-4 font-semibold">Categoria / Faixa</th>
                    <th className="p-4 font-semibold">Contato / WhatsApp</th>
                    <th className="p-4 font-semibold">Plano & Valor</th>
                    <th className="p-4 font-semibold text-center">Frequência</th>
                    <th className="p-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                            {st.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-200 text-xs block">{st.name}</span>
                            <span className="text-[10px] text-slate-500 block">
                              {st.guardianName ? `Resp: ${st.guardianName}` : `CPF: ${st.cpf || "123.456.789-00"}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            st.belt === "White" ? "bg-slate-200 text-slate-900" :
                            st.belt === "Blue" ? "bg-blue-600 text-white" :
                            st.belt === "Purple" ? "bg-purple-600 text-white" :
                            st.belt === "Brown" ? "bg-amber-800 text-white" : "bg-zinc-900 text-red-500 border border-red-500"
                          }`}>
                            Faixa {st.belt} ({st.stripes}º Grau)
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {st.category || "Adulto"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{st.phone}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[150px] mt-0.5">{st.email}</span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-emerald-400 block font-mono">
                          R$ {st.planValue || 250}/mês
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Plano {st.plan || "Mensal"} • {st.billingType || "PIX"}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-mono text-white font-bold block">{st.attendance30Days} treinos</span>
                        <span className="text-[9px] text-slate-500 block">Último há {st.daysSinceLastClass} dias</span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => onNavigateToAi(st)}
                          className="bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all"
                        >
                          Ficha IA
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

      {/* TAB 3: TECHNIQUES */}
      {activeTab === "techniques" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white font-display">Técnicas & Plano de Estudo Técnico</h2>
              <p className="text-xs text-slate-500 mt-0.5">Grade curricular estruturada e biblioteca oficial para consultas de posições.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techniques.map((tech) => (
              <div key={tech.id} className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-3 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-slate-800 text-blue-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                    {tech.category}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    tech.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    tech.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {tech.difficulty}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-400" /> {tech.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {tech.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Requisito para faixa correspondente</span>
                  <span className="text-slate-400 hover:underline cursor-pointer flex items-center gap-0.5">
                    Ver vídeo aula
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/20 border border-slate-800 p-5 rounded-xl space-y-3">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> IA Personalizada de Estudos
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Nossa plataforma vem integrada ao Gemini AI para automatizar o plano de estudos baseado no estilo de jogo e biotipo do aluno. Para gerar um plano técnico de 3 semanas, acesse a guia "AI Coach & Loyalty" e escolha o aluno.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: GRADUATIONS */}
      {activeTab === "graduations" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-display">Aprovação & Exames de Faixa</h2>
              <p className="text-xs text-slate-500 mt-0.5">Alunos recomendados para o próximo degrau técnico com base em carência e frequência de treinos.</p>
            </div>
            
            <div className="flex gap-2">
              {["All", "Eligible", "Pending Exam", "Approved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setGraduationFilter(st)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                    graduationFilter === st 
                      ? "bg-blue-600 border-blue-500 text-white" 
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {st === "All" ? "Todos" : 
                   st === "Eligible" ? "Elegíveis" :
                   st === "Pending Exam" ? "Exame Pendente" : "Aprovados"}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/20 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-4 font-semibold">Atleta</th>
                  <th className="p-4 font-semibold">Graduação Atual</th>
                  <th className="p-4 font-semibold text-center">Frequência Total (Aulas)</th>
                  <th className="p-4 font-semibold text-center">Tempo na Faixa</th>
                  <th className="p-4 font-semibold">Status Avaliação</th>
                  <th className="p-4 font-semibold text-right">Ação Mestre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {graduations
                  .filter(c => graduationFilter === "All" || c.status === graduationFilter)
                  .map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="p-4 font-semibold text-slate-200">{candidate.studentName}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            candidate.currentBelt === "White" ? "bg-slate-200 text-slate-900" :
                            candidate.currentBelt === "Blue" ? "bg-blue-600 text-white" :
                            candidate.currentBelt === "Purple" ? "bg-purple-600 text-white" :
                            candidate.currentBelt === "Brown" ? "bg-amber-800 text-white" : "bg-zinc-900 text-red-500 border border-red-500"
                          }`}>
                            {candidate.currentBelt}
                          </span>
                          <span className="text-slate-400 text-xs">+{candidate.currentStripes} graus</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono text-slate-300 font-semibold">{candidate.attendanceCount}</td>
                      <td className="p-4 text-center text-slate-300">{candidate.monthsInCurrentBelt} meses</td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                          candidate.status === "Eligible" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          candidate.status === "Pending Exam" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {candidate.status === "Eligible" ? "Elegível Automático" :
                           candidate.status === "Pending Exam" ? "Exame Agendado" : "Aprovado no Sistema"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {candidate.status === "Eligible" && (
                            <button
                              onClick={() => onUpdateGraduation(candidate.id, "Pending Exam")}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] px-2 py-1 rounded transition-colors"
                            >
                              Agendar Exame
                            </button>
                          )}
                          {candidate.status !== "Approved" ? (
                            <button
                              onClick={() => onUpdateGraduation(candidate.id, "Approved")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1 rounded transition-colors font-medium"
                            >
                              Confirmar Grau/Faixa
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">Histórico atualizado</span>
                          )}
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
