import React, { useState } from "react";
import { Student, Academy } from "../types";
import { 
  HeartHandshake, Search, Award, Calendar, CheckCircle2, 
  MessageSquare, Sparkles, Shield, User, QrCode, Phone,
  ChevronRight, Star, Trophy, BookOpen, Send, Clock
} from "lucide-react";

interface ParentsPortalProps {
  students: Student[];
  academies: Academy[];
}

export default function ParentsPortal({ students, academies }: ParentsPortalProps) {
  // Filter students to get kids or students with guardian
  const kidsStudents = students.filter(s => s.category === "Kids / Infantil" || !!s.guardianName || s.birthDate > "2008-01-01");
  const displayStudents = kidsStudents.length > 0 ? kidsStudents : students;

  const [selectedStudentId, setSelectedStudentId] = useState<string>(displayStudents[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeStudent = students.find(s => s.id === selectedStudentId) || displayStudents[0];
  const activeAcademy = academies.find(a => a.id === activeStudent?.academyId) || academies[0];

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const filteredList = displayStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.guardianName && s.guardianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.phone && s.phone.includes(searchTerm))
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeStudent) return;

    const professorPhone = activeStudent.phone || "(85) 98174-2686";
    const text = `Olá Professor! Sou responsável pelo aluno(a) ${activeStudent.name}. ${messageInput}`;
    
    const digits = professorPhone.replace(/\D/g, "");
    const fullNum = digits.startsWith("55") ? digits : `55${digits}`;
    const url = `https://wa.me/${fullNum}?text=${encodeURIComponent(text)}`;
    
    window.open(url, "_blank");
    triggerToast(`Mensagem enviada com sucesso para a academia do(a) ${activeStudent.name}!`);
    setMessageInput("");
  };

  // Belt badge style mapper
  const getBeltBadge = (beltStr: string) => {
    switch (beltStr) {
      case "Grey":
        return { name: "Faixa Cinza (Kids)", bg: "bg-slate-400 text-slate-950", border: "border-slate-300" };
      case "Yellow":
        return { name: "Faixa Amarela (Kids)", bg: "bg-amber-400 text-slate-950", border: "border-amber-300" };
      case "Orange":
        return { name: "Faixa Laranja (Kids)", bg: "bg-orange-500 text-white", border: "border-orange-400" };
      case "Green":
        return { name: "Faixa Verde (Kids)", bg: "bg-emerald-600 text-white", border: "border-emerald-400" };
      case "White":
        return { name: "Faixa Branca (Kids)", bg: "bg-slate-100 text-slate-950", border: "border-slate-300" };
      case "Blue":
        return { name: "Faixa Azul", bg: "bg-blue-600 text-white", border: "border-blue-400" };
      default:
        return { name: `Faixa ${beltStr}`, bg: "bg-indigo-600 text-white", border: "border-indigo-400" };
    }
  };

  return (
    <div className="space-y-6 relative" id="parents-portal-root">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-[9999] bg-emerald-950 border-2 border-emerald-500 text-emerald-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Hero Welcome Header */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-blue-950/80 border border-amber-500/30 p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute right-0 top-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5" /> Portal dos Pais & Responsáveis
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                Acompanhamento Kids BJJ
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-white">
              Evolução e Desenvolvimento do Atleta Mirim
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Área exclusiva para mães, pais e responsáveis acompanharem o progresso das aulas de Jiu-Jitsu, frequência no tatame, evolução das faixas, notas de disciplina dos mestres e medalhas do seu filho.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 self-start md:self-center shadow-lg">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Alunos Cadastrados</span>
              <span className="text-lg font-bold text-white font-mono">{displayStudents.length} Filhos/Atletas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Student Selector & Evolution Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Child Selection List */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Selecione o seu Filho(a)</span>
              <span className="text-[10px] text-amber-400 font-mono">BJJ Kids</span>
            </h3>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome do aluno ou pai..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Student Cards */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredList.map((st) => {
                const isSelected = st.id === activeStudent?.id;
                const badge = getBeltBadge(st.belt);
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/60 shadow-lg" 
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-md">
                          {st.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">{st.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {st.guardianName ? `Resp: ${st.guardianName}` : `Unidade: ${activeAcademy?.name}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold border ${badge.bg} ${badge.border}`}>
                          {st.belt}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                          {st.stripes}º Grau
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info Box for Parents */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" /> Dica para os Pais
            </div>
            <p className="leading-relaxed">
              Incentive a frequência constante nas aulas. O Jiu-Jitsu estimula a autoconfiança, o respeito, a paciência e a disciplina do seu filho tanto no tatame quanto na escola!
            </p>
          </div>
        </div>

        {/* Right Col: Child Evolution Dashboard (2 Cols Wide) */}
        {activeStudent && (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Student Profile Card */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 border-2 border-amber-300">
                    {activeStudent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white font-display">{activeStudent.name}</h2>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                        {activeStudent.category || "Kids BJJ"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Matriculado em: <strong className="text-slate-200">{activeAcademy?.name}</strong> • Responsável: <strong className="text-amber-400">{activeStudent.guardianName || "Mãe / Pai Cadastrado"}</strong>
                    </p>
                  </div>
                </div>

                {/* Belt Status Card */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Graduação Atual</span>
                    <span className={`inline-block text-xs px-3 py-1 rounded-full font-bold mt-1 shadow-md ${getBeltBadge(activeStudent.belt).bg}`}>
                      {getBeltBadge(activeStudent.belt).name}
                    </span>
                  </div>
                  <div className="border-l border-slate-800 pl-3 text-center">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Graus</span>
                    <span className="text-xl font-bold text-amber-400 font-mono block mt-0.5">{activeStudent.stripes}º Grau</span>
                  </div>
                </div>
              </div>

              {/* KPI Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Frequência Mensal</span>
                  <strong className="text-xl font-bold text-emerald-400 font-mono block mt-1">
                    {activeStudent.attendance30Days} Treinos
                  </strong>
                  <span className="text-[9px] text-emerald-400/80 block mt-0.5">⭐ Alta Assiduidade</span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Último Treino</span>
                  <strong className="text-xl font-bold text-white font-mono block mt-1">
                    {activeStudent.daysSinceLastClass === 0 ? "Hoje! 🥋" : `${activeStudent.daysSinceLastClass} dias`}
                  </strong>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Ativo no Tatame</span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Pontos de Fidelidade</span>
                  <strong className="text-xl font-bold text-amber-400 font-mono block mt-1">
                    {activeStudent.loyaltyPoints || 150} pts
                  </strong>
                  <span className="text-[9px] text-amber-300 block mt-0.5">Categoria {activeStudent.loyaltyTier || "Bronze"}</span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Mensalidade</span>
                  <strong className="text-xl font-bold text-emerald-400 block mt-1">
                    {activeStudent.paymentStatus === "Paid" ? "Paga ✓" : "Pendente"}
                  </strong>
                  <span className="text-[9px] text-emerald-400 block mt-0.5">Plano {activeStudent.plan || "Mensal"}</span>
                </div>
              </div>

              {/* Professor Notes for Parents */}
              <div className="bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border border-amber-500/30 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <h3 className="text-sm font-bold text-white font-display">Anotações Pedagógicas do Professor</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `🥋 *Boletim de Evolução BJJ Kids - ${activeStudent.name}*\n\n` +
                        `• Faixa Atual: ${getBeltBadge(activeStudent.belt).name} (${activeStudent.stripes}º Grau)\n` +
                        `• Treinos no Mês: ${activeStudent.attendance30Days} aulas cumpridas\n` +
                        `• Avaliação do Mestre: "${activeStudent.guardianNotes || "Aluno nota 10 em disciplina e companheirismo!"}"\n\n` +
                        `Orgulho do nosso pequeno campeão! 🏆 OSS!`;
                      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                      window.open(url, "_blank");
                      triggerToast("Boletim formatado enviado para compartilhamento no WhatsApp!");
                    }}
                    className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Send className="w-3 h-3" /> Compartilhar Boletim no WhatsApp
                  </button>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  "{activeStudent.guardianNotes || "O aluno vem demonstrando excelente evolução técnica, pontualidade e respeito com todos os colegas de tatame. Nota 10 em disciplina e companheirismo!"}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Professor Responsável: <strong className="text-slate-200">Prof. Sebastian / Mestre Marcelo</strong></span>
                  <span className="font-mono text-emerald-400">Próximo Exame: Previsto para o próximo mês</span>
                </div>
              </div>

              {/* Development Radar Skills Bar */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" /> Indicadores Pedagógicos & Sociais
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Média do Período: 9.6 / 10</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: "Respeito ao Mestre & Colegas", pct: 100, color: "bg-emerald-500" },
                    { label: "Disciplina & Pontualidade", pct: 95, color: "bg-blue-500" },
                    { label: "Foco & Atenção nos Golpes", pct: 90, color: "bg-amber-500" },
                    { label: "Espírito de Equipe & Ajuda", pct: 98, color: "bg-indigo-500" },
                    { label: "Coordenação Motora & Agilidade", pct: 92, color: "bg-purple-500" }
                  ].map((skill, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-300">{skill.label}</span>
                        <span className="text-slate-400 font-mono">{skill.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className={`h-full ${skill.color} rounded-full transition-all duration-500`} style={{ width: `${skill.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Home Challenges (Gamification for Kids at Home) */}
              <div className="bg-gradient-to-r from-blue-950/40 via-slate-950 to-indigo-950/40 border border-blue-500/30 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Desafios do Mestre em Casa (Tarefa dos Pais)</h3>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    Ganhe Pontos BJJ
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Valide abaixo as tarefas que o aluno cumpriu em casa para somar +50 pontos de fidelidade na carteirinha!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { title: "Dobrou o Kimono sozinho", pts: "+15 pts" },
                    { title: "Boa alimentação pré-treino", pts: "+15 pts" },
                    { title: "Lição de casa da escola em dia", pts: "+20 pts" }
                  ].map((task, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => triggerToast(`🎉 Parabéns! Tarefa "${task.title}" concluída! ${task.pts} adicionados ao histórico de ${activeStudent.name}.`)}
                      className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200 group-hover:text-amber-300">
                        <span>{task.title}</span>
                        <span className="text-[10px] text-amber-400 font-mono">{task.pts}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium block mt-1">Clique para marcar ✓</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PIX Quick Monthly Dues Payment Section */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Pagamento Rápido de Mensalidade via PIX</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Plano {activeStudent.plan || "Mensal"} • Valor: <strong className="text-emerald-400 font-mono">R$ {activeStudent.planValue || 250},00</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText("00020126580014BR.GOV.BCB.PIX0136bjj-academy-kids-pix-code-5204000053039865405250.005802BR5915BJJ ACADEMY SAAS6009FORTALEZA620705031236304E07B");
                      triggerToast("Código PIX Copia e Cola copiado para a área de transferência! Cole no app do seu banco.");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" /> Copiar Código PIX
                  </button>
                </div>
              </div>

              {/* Badges & Medals Earned */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Insígnias & Conquistas do Atleta
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(activeStudent.badges && activeStudent.badges.length > 0 
                    ? activeStudent.badges 
                    : ["Primeiro Kimono", "Super Disciplina", "Espírito de Equipe"]
                  ).map((badge, idx) => (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                        {idx === 0 ? "🥋" : idx === 1 ? "⭐" : "🏆"}
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">{badge}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Conquistado no Tatame</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digital Kids Membership Card */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Carteirinha Digital do Atleta Mirim</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Apresente este código na recepção da academia para acesso liberado às aulas de Jiu-Jitsu.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-center font-mono text-xs">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Matrícula ID</span>
                  <span className="text-emerald-400 font-bold block">{activeStudent.id.toUpperCase()}</span>
                </div>
              </div>

              {/* Contact Professor Form */}
              <form onSubmit={handleSendMessage} className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> Falar com o Professor / Academia via WhatsApp
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Escreva sua dúvida ou recado para o mestre (ex: Não poderá ir hoje ao treino)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar Mensagem
                  </button>
                </div>
              </form>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
