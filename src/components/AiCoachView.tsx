import React, { useState } from "react";
import { Student } from "../types";
import { 
  Sparkles, Award, ShieldAlert, BrainCircuit, RefreshCw, 
  Send, Calendar, Clock, ArrowRight, CheckCircle, BookOpen, X
} from "lucide-react";

interface AiCoachViewProps {
  students: Student[];
  selectedStudent: Student | null;
  onSelectStudent: (student: Student) => void;
  onUpdateStudent: (updated: Student) => void;
}

export default function AiCoachView({
  students,
  selectedStudent,
  onSelectStudent,
  onUpdateStudent
}: AiCoachViewProps) {
  const [mode, setMode] = useState<"study-plan" | "loyalty">("study-plan");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preference forms for Study Plan
  const [focusArea, setFocusArea] = useState("Guard Retention");
  const [sparringStyle, setSparringStyle] = useState("Balanced / Counter-fighter");
  const [studentNotes, setStudentNotes] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Result container states
  const [studyPlanResult, setStudyPlanResult] = useState<{
    title: string;
    summary: string;
    weeklyStructure: Array<{
      week: string;
      concepts: string[];
      drills: string[];
      coachTip: string;
    }>;
    loyaltyActionItems: string[];
    isSimulated?: boolean;
  } | null>(null);

  const [loyaltyResult, setLoyaltyResult] = useState<{
    riskLevel: string;
    score: number;
    analysis: string;
    actions: Array<{
      title: string;
      message: string;
      type: string;
    }>;
    isSimulated?: boolean;
  } | null>(null);

  // Quick technical answers states
  const [technicalQuestion, setTechnicalQuestion] = useState("");
  const [technicalAnswer, setTechnicalAnswer] = useState<string | null>(null);

  const activeStudent = selectedStudent || students[0];

  const handleGenerateStudyPlan = async () => {
    if (!activeStudent) return;
    setLoading(true);
    setStudyPlanResult(null);

    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "study-plan",
          studentData: {
            name: activeStudent.name,
            belt: activeStudent.belt,
            stripes: activeStudent.stripes,
            focus: focusArea,
            style: sparringStyle,
            notes: studentNotes
          }
        })
      });

      const data = await response.json();
      setStudyPlanResult(data);

      // Sincronizar estado no student indicando que possui plano ativo
      onUpdateStudent({
        ...activeStudent,
        studyPlanAssigned: true
      });

    } catch (err) {
      console.error("Failed to generate BJJ Study plan:", err);
      triggerToast("Erro de rede ao contatar o servidor. Verifique sua chave de API e a conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLoyaltyAnalysis = async () => {
    if (!activeStudent) return;
    setLoading(true);
    setLoyaltyResult(null);

    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loyalty",
          studentData: {
            name: activeStudent.name,
            belt: activeStudent.belt,
            attendanceCount: activeStudent.attendance30Days,
            daysSinceLastClass: activeStudent.daysSinceLastClass,
            rating: activeStudent.status === "ChurnRisk" ? "Neutral/Low" : "High"
          }
        })
      });

      const data = await response.json();
      setLoyaltyResult(data);
    } catch (err) {
      console.error("Failed to generate Loyalty plan:", err);
      triggerToast("Erro de rede ao contatar o servidor. Verifique sua chave de API e a conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskBjjCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!technicalQuestion) return;
    setLoading(true);
    setTechnicalAnswer(null);

    try {
      const response = await fetch("/api/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "custom",
          studentData: { belt: activeStudent.belt },
          promptInput: technicalQuestion
        })
      });

      // Simple fix if path has extra /api/ or not
      let resData;
      if (response.status === 404) {
        // Retry path
        const altResponse = await fetch("/api/ai/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "custom",
            studentData: { belt: activeStudent.belt },
            promptInput: technicalQuestion
          })
        });
        resData = await altResponse.json();
      } else {
        resData = await response.json();
      }

      setTechnicalAnswer(resData.response);
    } catch (err) {
      console.error("Error asking custom question:", err);
      setTechnicalAnswer("Não foi possível conectar com o Gemini API. Verifique suas conexões.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative" id="ai-coach-root">
      {/* Dynamic Toast banner if active */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-slate-900 border border-emerald-500/30 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-blue-400">🧠</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border border-blue-500/20 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-400" /> BJJ Academy Coach & Copiloto Técnico (IA)
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Sua escola integrada ao poder do **Gemini 3.5 Flash**. Prescreva planos de estudo personalizados, reduza a evasão com análises de inatividade e responda a dúvidas técnicas.
          </p>
        </div>
        <div className="text-xs font-mono bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-400">
          Powered by: <strong className="text-blue-400 font-bold">Gemini API</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Control Column: Student Selection & Action Controls */}
        <div className="space-y-6">
          
          {/* Active Student Card Picker */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Aluno Selecionado</h3>
            
            <div className="space-y-3">
              <select
                value={activeStudent?.id || ""}
                onChange={(e) => {
                  const found = students.find(s => s.id === e.target.value);
                  if (found) {
                    onSelectStudent(found);
                    setStudyPlanResult(null);
                    setLoyaltyResult(null);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.belt} - {s.status === "ChurnRisk" ? "Risco de Evasão" : "Frequente"})
                  </option>
                ))}
              </select>

              {activeStudent && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                      {activeStudent.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong className="text-xs text-white block">{activeStudent.name}</strong>
                      <span className="text-[10px] text-slate-500 block">{activeStudent.email}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-850/60">
                    <div>
                      <span className="text-slate-500 block">Frequência 30d</span>
                      <strong className="text-slate-300">{activeStudent.attendance30Days} treinos</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ausência</span>
                      <strong className={`block ${activeStudent.daysSinceLastClass > 10 ? "text-rose-400" : "text-emerald-400"}`}>
                        {activeStudent.daysSinceLastClass} dias
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Tabs switcher */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setMode("study-plan")}
              className={`w-full text-left p-4 text-xs font-semibold flex items-center justify-between border-b border-slate-800 transition-colors ${
                mode === "study-plan" ? "bg-blue-600/10 text-blue-400 font-bold" : "text-slate-400 hover:bg-slate-900/20"
              }`}
            >
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4" /> 1. Gerador de Plano de Estudos
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMode("loyalty")}
              className={`w-full text-left p-4 text-xs font-semibold flex items-center justify-between transition-colors ${
                mode === "loyalty" ? "bg-blue-600/10 text-blue-400 font-bold" : "text-slate-400 hover:bg-slate-900/20"
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> 2. Loyalty Churn Analyzer
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Additional Preferences Form depending on Mode */}
          {mode === "study-plan" && (
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4 animate-in fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ajustes Técnicos da IA</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Área de Foco Técnico</label>
                  <select
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Guard Retention">Guarda de Retenção (Framing)</option>
                    <option value="Guard Passing">Passagem de Meia Guarda (Pressure Passing)</option>
                    <option value="Submissions Mastery">Finalizações (Kimura & Chaves de Braço)</option>
                    <option value="Escapes & Posture">Saídas de Montada e Lateral (Postura)</option>
                    <option value="Wrestling Takedowns">Quedas & Takedowns (Single/Double Leg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Estilo de Combate</label>
                  <input
                    type="text"
                    value={sparringStyle}
                    onChange={(e) => setSparringStyle(e.target.value)}
                    placeholder="Ex: Passador de pressão, rápido e ágil"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Biotipo / Limitações Físicas</label>
                  <input
                    type="text"
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    placeholder="Ex: Altura 1.85m, pouca flexibilidade de quadril"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleGenerateStudyPlan}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-850 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Processando pelo Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" /> Prescrever com Gemini IA
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === "loyalty" && (
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4 animate-in fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Análise de Fidelidade</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                A IA analisará a frequência de check-in deste aluno contra os dados demográficos para produzir soluções de engajamento e mensagens personalizadas de WhatsApp.
              </p>

              <button
                onClick={handleGenerateLoyaltyAnalysis}
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-850 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Analisando Risco de Churn...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" /> Diagnosticar Saúde do Aluno
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* Right Output Column: Rendering Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {loading && (
            <div className="bg-slate-900/20 border border-slate-800 p-12 rounded-xl text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <div className="relative">
                <BrainCircuit className="w-12 h-12 text-blue-500 animate-pulse" />
                <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-2 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-200">Consultando Mestre Virtual (Gemini)</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Aguarde enquanto os modelos cognitivos do Google desenham o treinamento de combate ou estratégia de fidelização do atleta...
                </p>
              </div>
            </div>
          )}

          {/* Placeholder state before generation */}
          {!loading && !studyPlanResult && !loyaltyResult && (
            <div className="bg-slate-900/20 border border-slate-800 p-12 rounded-xl text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <Sparkles className="w-10 h-10 text-slate-600" />
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-300">Pronto para Diagnóstico</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Selecione os parâmetros técnicos do atleta na coluna à esquerda e clique para acionar o copiloto de inteligência artificial.
                </p>
              </div>
            </div>
          )}

          {/* Render Study Plan Result */}
          {!loading && studyPlanResult && (
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-5 animate-in fade-in duration-200">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider font-semibold">
                    Plano de Estudo Técnico Gerado
                  </span>
                  <h3 className="font-display font-bold text-lg text-white mt-1.5">{studyPlanResult.title}</h3>
                </div>
                {studyPlanResult.isSimulated && (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                    Fallback Mode Active
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sumário e Estratégia Técnica</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-900">
                  {studyPlanResult.summary}
                </p>
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cronograma de Treinos Semanal</span>
                
                <div className="grid grid-cols-1 gap-4">
                  {studyPlanResult.weeklyStructure?.map((week, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                        <h4 className="font-bold text-sm text-blue-400">{week.week}</h4>
                        <span className="text-[10px] text-slate-500">Etapa {idx+1}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <strong className="text-slate-400 block mb-1">Conceitos Chave:</strong>
                          <ul className="space-y-1 list-disc pl-4 text-slate-300">
                            {week.concepts?.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-slate-400 block mb-1">Drills de Repetição:</strong>
                          <ul className="space-y-1 list-disc pl-4 text-slate-300">
                            {week.drills?.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-blue-950/10 border border-blue-900/30 p-2.5 rounded-lg text-[11px] text-slate-300 italic">
                        <strong>🥋 Dica do Mestre:</strong> {week.coachTip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {studyPlanResult.loyaltyActionItems?.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Recomendações Extras para o Professor</span>
                  <ul className="space-y-1 list-disc pl-4 text-xs text-slate-300">
                    {studyPlanResult.loyaltyActionItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => alert("Histórico de estudos exportado para a carteirinha digital do Aluno com sucesso!")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> Enviar para o Celular do Aluno
                </button>
              </div>
            </div>
          )}

          {/* Render Loyalty Analyzer Result */}
          {!loading && loyaltyResult && (
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-5 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider font-semibold">
                    Análise Loyalty Churn
                  </span>
                  <h3 className="font-display font-bold text-lg text-white mt-1.5">Diagnóstico Técnico de Retenção</h3>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400">Score de Risco:</span>
                  <span className={`text-sm font-mono font-bold ${
                    loyaltyResult.score > 70 ? "text-rose-400" :
                    loyaltyResult.score > 40 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {loyaltyResult.score}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Status de Alerta</span>
                  <strong className={`text-base font-bold block mt-1 ${
                    loyaltyResult.riskLevel.includes("High") ? "text-rose-400" :
                    loyaltyResult.riskLevel.includes("Medium") ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {loyaltyResult.riskLevel}
                  </strong>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 md:col-span-2">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold text-left">Resumo do Diagnóstico</span>
                  <p className="text-xs text-slate-300 text-left mt-1 leading-relaxed">
                    {loyaltyResult.analysis}
                  </p>
                </div>
              </div>

              {/* Engagement Actions */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Campanhas Sugeridas via WhatsApp</span>
                
                {loyaltyResult.actions?.map((act, index) => (
                  <div key={index} className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <strong className="text-xs text-slate-200 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          act.type === "urgent" ? "bg-rose-500 animate-ping" : "bg-blue-400"
                        }`} />
                        {act.title}
                      </strong>
                      <span className="text-[10px] uppercase font-mono text-slate-500">{act.type}</span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono bg-slate-900 p-3 rounded border border-slate-800 leading-relaxed whitespace-pre-line">
                      {act.message}
                    </p>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          alert(`Abrindo WhatsApp de ${activeStudent.name} para enviar mensagem...`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                      >
                        <Send className="w-3 h-3" /> Disparar pelo WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Technical QA sandbox */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-blue-400" /> Tire dúvidas de posições rápidas (Gemini Chat)
            </h4>
            <form onSubmit={handleAskBjjCoach} className="flex gap-2">
              <input
                type="text"
                required
                value={technicalQuestion}
                onChange={(e) => setTechnicalQuestion(e.target.value)}
                placeholder="Ex: Como se defender de uma chave Kimura partindo da meia guarda profunda?"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 rounded-lg transition-colors"
              >
                Perguntar
              </button>
            </form>

            {technicalAnswer && (
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2 animate-in fade-in">
                <span className="text-[10px] uppercase font-bold text-slate-500">Mestre Virtual Gemini Responde:</span>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {technicalAnswer}
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
