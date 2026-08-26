import React, { useState } from "react";
import { Lead, MarketingCampaign } from "../types";
import { 
  Users, UserPlus, Phone, Mail, FileText, ArrowRight, 
  Send, Smartphone, Play, Plus, Trash2, Calendar, CheckSquare, X,
  BellRing, Building2, CheckCircle2, MessageSquare, ShieldAlert, Zap, Bell, Check,
  Square, Sparkles, Layers, RefreshCw, Filter, Search
} from "lucide-react";
import BulkCampaignModal from "./BulkCampaignModal";

interface CrmMarketingViewProps {
  leads: Lead[];
  campaigns: MarketingCampaign[];
  onAddLead: (lead: Omit<Lead, "id" | "academyId">) => void;
  onUpdateLeadPhase: (id: string, phase: Lead["phase"]) => void;
}

// Helper to format ISO YYYY-MM-DD dates to Brazilian DD/MM/YYYY
const formatDateBR = (dateStr?: string) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export default function CrmMarketingView({
  leads,
  campaigns,
  onAddLead,
  onUpdateLeadPhase
}: CrmMarketingViewProps) {
  const [activeTab, setActiveTab] = useState<"crm" | "marketing">("marketing");
  
  // New Lead state
  const [showAddLead, setShowAddLead] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Campaign templates
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState<string>("");
  const [campaignPreview, setCampaignPreview] = useState<string>("");

  // Bulk Campaign & Lead Multi-Select State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>(() => leads.map(l => l.id));
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState<string>("");
  const [crmPhaseFilter, setCrmPhaseFilter] = useState<string>("ALL");
  const [customBulkLogs, setCustomBulkLogs] = useState<{
    id: string;
    name: string;
    recipientsCount: number;
    timestamp: string;
    preview: string;
  }[]>([]);

  const handleToggleLead = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedLeadIds(leads.map(l => l.id));
  };

  const handleDeselectAll = () => {
    setSelectedLeadIds([]);
  };

  const handleSelectByPhase = (phase: Lead["phase"]) => {
    const phaseLeadIds = leads.filter(l => l.phase === phase).map(l => l.id);
    setSelectedLeadIds(prev => Array.from(new Set([...prev, ...phaseLeadIds])));
    triggerToast(`Selecionados todos os leads da fase "${getPhaseName(phase)}".`);
  };

  const handleCampaignDispatched = (campaignInfo: {
    name: string;
    recipientsCount: number;
    timestamp: string;
    preview: string;
  }) => {
    const newLog = {
      id: `bulk-${Date.now()}`,
      ...campaignInfo
    };
    setCustomBulkLogs(prev => [newLog, ...prev]);
    triggerToast(`🚀 Campanha em massa "${campaignInfo.name}" disparada com sucesso para ${campaignInfo.recipientsCount} leads via WhatsApp!`);
  };

  // B2B Contract Alert Automation States
  const [adminPhone, setAdminPhone] = useState<string>("+55 (85) 98174-2686");
  const [b2bAlertEnabled, setB2bAlertEnabled] = useState<boolean>(true);
  const [b2bAlertTemplate, setB2bAlertTemplate] = useState<string>(
    "🚨 ALERTA B2B BJJ ACADEMY: A academia {nome_academia} (Resp: {responsavel_nome}, Tel: {telefone_contato}) solicitou um novo contrato do {plano_saas}! Cidade: {cidade_unidade} | Est. Alunos: {qtd_alunos}. Valor: R$ {valor_mensal}/mês. Entre em contato para assinar!"
  );

  const sendDirectWhatsApp = (phoneStr: string, messageText: string) => {
    const digits = phoneStr.replace(/\D/g, "");
    const fullNum = digits.startsWith("55") ? digits : `55${digits}`;
    const url = `https://wa.me/${fullNum}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank");
  };

  // B2B Contract Simulator Form States
  const [showB2bSimulator, setShowB2bSimulator] = useState<boolean>(false);
  const [simAcademyName, setSimAcademyName] = useState<string>("");
  const [simRespName, setSimRespName] = useState<string>("");
  const [simPhone, setSimPhone] = useState<string>("");
  const [simCity, setSimCity] = useState<string>("");
  const [simStudents, setSimStudents] = useState<number>(120);
  const [simPlan, setSimPlan] = useState<string>("Plano Black Belt SaaS (R$ 890/mês)");

  // B2B Notifications History Log
  const [b2bLogs, setB2bLogs] = useState([
    {
      id: "b2b-1",
      academyName: "Alliance Jiu-Jitsu Jardins",
      respName: "Mestre Fabio Gurgel",
      phone: "(11) 99111-2222",
      city: "São Paulo - SP",
      plan: "Plano Black Belt SaaS (R$ 890/mês)",
      students: 220,
      dateBR: "06/08/2026 14:30",
      status: "Enviado para seu WhatsApp (" + adminPhone + ")"
    },
    {
      id: "b2b-2",
      academyName: "CheckMat Vila Olímpia",
      respName: "Prof. Lucas Leite",
      phone: "(11) 98765-4321",
      city: "São Paulo - SP",
      plan: "Plano Ouro SaaS (R$ 490/mês)",
      students: 110,
      dateBR: "05/08/2026 09:15",
      status: "Enviado para seu WhatsApp (" + adminPhone + ")"
    }
  ]);

  const [whatsappPopupMessage, setWhatsappPopupMessage] = useState<string | null>(null);

  const handleSimulateB2bContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAcademyName || !simRespName || !simPhone) return;

    const nowBR = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const formattedMessage = b2bAlertTemplate
      .replace("{nome_academia}", simAcademyName)
      .replace("{responsavel_nome}", simRespName)
      .replace("{telefone_contato}", simPhone)
      .replace("{cidade_unidade}", simCity || "Brasil")
      .replace("{qtd_alunos}", String(simStudents))
      .replace("{plano_saas}", simPlan)
      .replace("{valor_mensal}", simPlan.includes("Black Belt") ? "890" : "490");

    const newLog = {
      id: `b2b-${Date.now()}`,
      academyName: simAcademyName,
      respName: simRespName,
      phone: simPhone,
      city: simCity || "Brasil",
      plan: simPlan,
      students: simStudents,
      dateBR: nowBR,
      status: `Enviado para seu WhatsApp (${adminPhone})`
    };

    setB2bLogs([newLog, ...b2bLogs]);
    setWhatsappPopupMessage(formattedMessage);
    setShowB2bSimulator(false);

    // Reset simulator form
    setSimAcademyName("");
    setSimRespName("");
    setSimPhone("");
    setSimCity("");

    triggerToast(`🚨 ALERTA B2B DISPARADO! Notificação de novo contrato enviada para o seu celular (${adminPhone}) via WhatsApp.`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;

    const todayISO = new Date().toISOString().split("T")[0];

    onAddLead({
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      phase: "Capture",
      notes: leadNotes,
      dateCreated: todayISO
    });

    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadNotes("");
    setShowAddLead(false);
    triggerToast("Lead capturado com sucesso! Encaminhado para o funil de vendas.");
  };

  const phases: Lead["phase"][] = ["Capture", "Trial Scheduled", "Trial Attended", "Proposal", "Won"];

  const getPhaseName = (phase: Lead["phase"]) => {
    switch (phase) {
      case "Capture": return "📥 Captura / Contato";
      case "Trial Scheduled": return "📅 Treino Experimental Agendado";
      case "Trial Attended": return "🥋 Treinou / Compareceu";
      case "Proposal": return "💬 Proposta Enviada";
      case "Won": return "🎉 Matriculado!";
      default: return phase;
    }
  };

  const triggerWhatsappCampaign = (campaignName: string) => {
    triggerToast(`Campanha "${campaignName}" disparada! 47 contatos receberam a mensagem automática via WhatsApp.`);
  };

  return (
    <div className="space-y-6 relative" id="crm-marketing-view-root">
      {/* Dynamic Toast banner if active */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-slate-900 border border-emerald-500/30 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400">🎯</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("marketing")}
          className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all ${
            activeTab === "marketing" 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          📢 Automações de Marketing & WhatsApp
        </button>
        <button
          onClick={() => setActiveTab("crm")}
          className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all ${
            activeTab === "crm" 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          🎯 Funil de Vendas CRM
        </button>
      </div>

      {/* WhatsApp Push Alert Notification Banner (Simulated Admin Device Receive) */}
      {whatsappPopupMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] max-w-md w-full bg-slate-900 border-2 border-emerald-500 text-white rounded-2xl p-4 shadow-2xl shadow-emerald-500/20 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                💬
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 block leading-none">WhatsApp Business • Alerta B2B</span>
                <span className="text-[10px] text-slate-400">Enviado para seu número: {adminPhone}</span>
              </div>
            </div>
            <button 
              onClick={() => setWhatsappPopupMessage(null)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
            {whatsappPopupMessage}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                if (whatsappPopupMessage) {
                  sendDirectWhatsApp(adminPhone, whatsappPopupMessage);
                  triggerToast("Abrindo conversa no WhatsApp com a notificação do contrato...");
                  setWhatsappPopupMessage(null);
                }
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md"
            >
              <Send className="w-3.5 h-3.5" /> Abrir Direto no WhatsApp
            </button>
            <button
              onClick={() => setWhatsappPopupMessage(null)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl"
            >
              Dispensar
            </button>
          </div>
        </div>
      )}

      {/* Simulator Modal for New Academy B2B Contract Proposal */}
      {showB2bSimulator && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowB2bSimulator(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Simular Nova Solicitação de Contrato B2B</h3>
                <p className="text-xs text-slate-400">Preencha os dados da academia interessada em contratar o sistema BJJ Academy.</p>
              </div>
            </div>

            <form onSubmit={handleSimulateB2bContract} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Academia</label>
                <input
                  type="text"
                  required
                  value={simAcademyName}
                  onChange={(e) => setSimAcademyName(e.target.value)}
                  placeholder="Ex: Gracie Barra Barra da Tijuca"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Mestre / Responsável</label>
                  <input
                    type="text"
                    required
                    value={simRespName}
                    onChange={(e) => setSimRespName(e.target.value)}
                    placeholder="Ex: Prof. Jefferson"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp de Contato</label>
                  <input
                    type="text"
                    required
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    placeholder="Ex: (21) 98888-7777"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade / Estado</label>
                  <input
                    type="text"
                    value={simCity}
                    onChange={(e) => setSimCity(e.target.value)}
                    placeholder="Ex: Rio de Janeiro - RJ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Qtd Estimada de Alunos</label>
                  <input
                    type="number"
                    value={simStudents}
                    onChange={(e) => setSimStudents(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Plano SaaS Desejado</label>
                <select
                  value={simPlan}
                  onChange={(e) => setSimPlan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Plano Ouro SaaS (R$ 490/mês)">Plano Ouro SaaS (R$ 490/mês - Até 150 alunos)</option>
                  <option value="Plano Black Belt SaaS (R$ 890/mês)">Plano Black Belt SaaS (R$ 890/mês - Alunos ilimitados)</option>
                  <option value="Plano Franchising / Rede (R$ 1.490/mês)">Plano Franchising / Rede (R$ 1.490/mês)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowB2bSimulator(false)}
                  className="bg-transparent text-slate-400 hover:bg-slate-800 text-xs px-4 py-2.5 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                  <BellRing className="w-4 h-4" /> Disparar Alerta WhatsApp para o Gestor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "marketing" && (
        <div className="space-y-6">
          
          {/* Main Top Header */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  WhatsApp API Oficial
                </span>
                <span className="text-[10px] bg-blue-500/10 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/20">
                  Disparos Programados & Alertas B2B
                </span>
              </div>
              <h2 className="text-lg font-bold text-white font-display">Automações de Marketing & WhatsApp</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Crie réguas de relacionamento instantâneas e personalizadas. O BJJ Academy permite enviar notificações automáticas via WhatsApp para alunos e também <strong>alertar você instantaneamente quando uma nova academia quiser fechar contrato</strong>!
              </p>
            </div>
          </div>

          {/* NEW: Dedicated B2B SaaS Contract Alert Card for the Admin/Owner */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-blue-950/60 border border-emerald-500/40 p-6 rounded-2xl shadow-2xl relative overflow-hidden space-y-5">
            <div className="absolute right-0 top-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 rounded-2xl font-bold shadow-lg shadow-emerald-500/30">
                  <BellRing className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    Alerta em Tempo Real: Novos Contratos de Academias (B2B)
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono">
                      PARA O GESTOR
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Receba uma mensagem automática no seu celular via WhatsApp toda vez que uma nova escola de Jiu-Jitsu solicitar adesão à sua plataforma BJJ Academy.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowB2bSimulator(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 self-start md:self-center"
              >
                <Plus className="w-4 h-4" /> Simular Pedido de Novo Contrato B2B
              </button>
            </div>

            {/* Config options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" /> Seu WhatsApp para Receber Alertas
                </label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const sampleMsg = b2bAlertTemplate
                      .replace("{nome_academia}", "Gracie Barra Fortaleza")
                      .replace("{responsavel_nome}", "Mestre Messias")
                      .replace("{telefone_contato}", adminPhone)
                      .replace("{cidade_unidade}", "Fortaleza - CE")
                      .replace("{qtd_alunos}", "180")
                      .replace("{plano_saas}", "Plano Black Belt SaaS (R$ 890/mês)")
                      .replace("{valor_mensal}", "890");

                    sendDirectWhatsApp(adminPhone, sampleMsg);
                    triggerToast(`🧪 Disparando mensagem de teste de contrato B2B diretamente para seu WhatsApp: ${adminPhone}`);
                  }}
                  className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all mt-1"
                >
                  <Send className="w-3 h-3" /> Testar Disparo no Meu WhatsApp Agora
                </button>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" /> Status do Disparo Automático
                  </label>
                  <button
                    onClick={() => setB2bAlertEnabled(!b2bAlertEnabled)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                      b2bAlertEnabled ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {b2bAlertEnabled ? "🟢 HABILITADO" : "🔴 PAUSADO"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {b2bAlertEnabled 
                    ? "Envio instantâneo ativo. Toda nova solicitação no formulário do site SaaS gera notificação imediata."
                    : "Notificações pausadas. Ative para não perder novas oportunidades de expansão de academias."}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Contratos Processados Hoje
                </label>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">{b2bLogs.length}</span>
                  <span className="text-xs text-slate-400">solicitações registradas</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium block">
                  100% de entregabilidade via WhatsApp API Oficial.
                </span>
              </div>
            </div>

            {/* B2B Template Editing */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Modelo do Alerta B2B enviado para seu WhatsApp (Editável em Português)</span>
                <span className="text-[10px] text-slate-400 font-mono">Variáveis: &#123;nome_academia&#125;, &#123;responsavel_nome&#125;, &#123;telefone_contato&#125;, &#123;plano_saas&#125;</span>
              </label>
              <textarea
                rows={3}
                value={b2bAlertTemplate}
                onChange={(e) => setB2bAlertTemplate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* B2B Logs */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Últimas Notificações de Contratos Recebidos (Formato BR)</span>
                <span className="text-[10px] text-slate-400 font-mono">{b2bLogs.length} contratos no histórico</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {b2bLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2 shadow-sm hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                          🏢 {log.academyName}
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">Resp: {log.respName} ({log.phone})</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                        {log.plan.split(" (")[0]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px]">
                      <span className="font-mono text-slate-300">📅 {log.dateBR}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const msg = b2bAlertTemplate
                            .replace("{nome_academia}", log.academyName)
                            .replace("{responsavel_nome}", log.respName)
                            .replace("{telefone_contato}", log.phone)
                            .replace("{cidade_unidade}", log.city)
                            .replace("{qtd_alunos}", String(log.students))
                            .replace("{plano_saas}", log.plan)
                            .replace("{valor_mensal}", log.plan.includes("Black Belt") ? "890" : "490");

                          sendDirectWhatsApp(adminPhone, msg);
                          triggerToast(`Enviando notificação do contrato para o seu WhatsApp: ${adminPhone}`);
                        }}
                        className="bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                      >
                        <Send className="w-2.5 h-2.5" /> Enviar no WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* NEW: Dedicated Bulk Campaign Launcher Card in Marketing Tab */}
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/90 to-emerald-950/40 border border-blue-500/30 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-display">Disparo em Massa para Leads (Send Bulk Campaign)</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    {leads.length} Leads no CRM
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  Envie mensagens automáticas personalizadas via WhatsApp Cloud API para múltiplos visitantes e acelere a conversão de novas matrículas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
              <button
                type="button"
                onClick={() => {
                  handleSelectAll();
                  setShowBulkModal(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <Send className="w-4 h-4 fill-slate-950" /> Disparar para Todos ({leads.length})
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const captureIds = leads.filter(l => l.phase === "Capture").map(l => l.id);
                  setSelectedLeadIds(captureIds);
                  setShowBulkModal(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" /> Apenas em Captura ({leads.filter(l => l.phase === "Capture").length})
              </button>
            </div>
          </div>

          {/* History of Dispatched Bulk Campaigns (if any) */}
          {customBulkLogs.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Histórico Recente de Disparos em Massa</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Entregue via WhatsApp API</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customBulkLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{log.name}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                        {log.recipientsCount} leads
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate font-mono">
                      "{log.preview}"
                    </p>
                    <div className="pt-1.5 border-t border-slate-900 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>📅 {log.timestamp}</span>
                      <span className="text-emerald-400 font-medium">✓ Entregue com Sucesso</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Campaigns */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Suas Campanhas Recorrentes com Alunos</h3>
                <span className="text-[11px] text-slate-500 font-mono">Formato das Datas: BR (DD/MM/AAAA)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-3 hover:border-slate-700 transition-colors shadow-lg">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold ${
                        camp.type === "WhatsApp" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      }`}>
                        {camp.type === "WhatsApp" ? "WhatsApp API" : "E-mail Marketing"}
                      </span>
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                        camp.status === "Running" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse" :
                        camp.status === "Completed" ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "bg-slate-800 text-slate-400"
                      }`}>
                        {camp.status === "Running" ? "Ativo / Disparando" : camp.status === "Completed" ? "Concluído" : "Rascunho"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{camp.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">Público-Alvo: {camp.targetAudience}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{camp.sentCount} mensagens enviadas</span>
                      {camp.status === "Running" ? (
                        <button 
                          onClick={() => triggerWhatsappCampaign(camp.name)}
                          className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
                        >
                          Refazer Disparo <Play className="w-3 h-3 fill-emerald-400" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-semibold">Concluído</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick WhatsApp Template Sandbox */}
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" /> Simulador Copiloto WhatsApp
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Escolher Template Rápido em Português</label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCampaignTemplate(val);
                    if (val === "onboard") {
                      setCampaignPreview("Olá {nome_aluno}! Seja muito bem-vindo à nossa academia de Jiu-Jitsu. Seu cadastro foi concluído com sucesso no plano {plano}. Baixe nossa carteirinha digital e faça seu primeiro check-in por QR Code hoje mesmo no treino!");
                    } else if (val === "absent") {
                      setCampaignPreview("Olá {nome_aluno}, aqui é o Mestre Marcelo. Notamos que você ficou fora do tatame nos últimos {dias} dias. O treino de hoje está sensacional e focado em raspagens e passagem de guarda. Te esperamos na academia!");
                    } else if (val === "trial") {
                      setCampaignPreview("Olá {nome_visitante}! Confirmamos a sua Aula Experimental Gratuita de Jiu-Jitsu para o dia {data_treino} às {horario}. Traga uma roupa confortável e garrafa de água. Nos vemos no tatame!");
                    } else if (val === "billing") {
                      setCampaignPreview("Olá {nome_aluno}! Lembramos que a sua mensalidade da academia vence no dia {data_vencimento}. Utilize o código Pix Copia e Cola para pagamento instantâneo e liberação do seu check-in.");
                    } else if (val === "b2b") {
                      setCampaignPreview(b2bAlertTemplate);
                    } else {
                      setCampaignPreview("");
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="">Selecione um modelo de mensagem...</option>
                  <option value="b2b">Modelo 01: Notificação de Novo Contrato B2B (Para o Gestor)</option>
                  <option value="onboard">Modelo 02: Boas-Vindas & Onboarding de Novo Aluno</option>
                  <option value="absent">Modelo 03: Reengajamento de Alunos Inativos</option>
                  <option value="trial">Modelo 04: Confirmação de Aula Experimental</option>
                  <option value="billing">Modelo 05: Lembrete Amigável de Fatura / Pix</option>
                </select>
              </div>

              {campaignPreview && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-slate-400">Corpo da Mensagem em Português (Editável)</label>
                  <textarea
                    rows={5}
                    value={campaignPreview}
                    onChange={(e) => setCampaignPreview(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500/50"
                  />
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-emerald-400 font-medium leading-relaxed shadow-inner">
                    💡 <strong>Automação Inteligente:</strong> O BJJ Academy substitui as variáveis dinamicamente no momento do envio via WhatsApp. Data no formato brasileiro: <strong>{new Date().toLocaleDateString("pt-BR")}</strong>.
                  </div>
                  <button
                    onClick={() => {
                      triggerToast("Modelo salvo com sucesso! Disparos programados configurados para WhatsApp.");
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                  >
                    Salvar Modelo & Testar Envio
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {activeTab === "crm" && (
        <div className="space-y-6">
          
          {/* CRM Top Controls & Bulk Campaign Bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">CRM de Leads & Matrículas</h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  {leads.length} Contatos
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Selecione os contatos com o checkbox para disparar campanhas automáticas em massa via WhatsApp Oficial.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Send Bulk Campaign Button */}
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <Send className="w-4 h-4 fill-slate-950" />
                <span>Disparo em Massa WhatsApp</span>
                <span className="bg-slate-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  {selectedLeadIds.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddLead(!showAddLead)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
              >
                <UserPlus className="w-4 h-4" /> Cadastrar Lead
              </button>
            </div>
          </div>

          {/* Search & Phase Filters Toolbar */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={leadSearchQuery}
                  onChange={(e) => setLeadSearchQuery(e.target.value)}
                  placeholder="Buscar lead por nome ou tel..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
              >
                Marcar Todos ({leads.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
              >
                Desmarcar
              </button>
            </div>
          </div>

          {/* New Lead Form */}
          {showAddLead && (
            <form onSubmit={handleCreateLead} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-xl animate-in fade-in slide-in-from-top-4 duration-200 shadow-2xl">
              <h3 className="text-sm font-bold text-white">Cadastrar Visitante Interessado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Ex: João Roberto"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    required
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-8888"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Ex: joao.roberto@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Histórico / Observações Iniciais</label>
                  <textarea
                    rows={2}
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Ex: Viu anúncio no Instagram. Quer agendar aula experimental na quinta de noite."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="bg-transparent text-slate-400 text-xs px-3 py-2 hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Salvar Contato
                </button>
              </div>
            </form>
          )}

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {phases.map((phase) => {
              const phaseLeads = leads
                .filter(l => l.phase === phase)
                .filter(l => {
                  if (!leadSearchQuery) return true;
                  const query = leadSearchQuery.toLowerCase();
                  return l.name.toLowerCase().includes(query) || l.phone.includes(query);
                });

              const allPhaseSelected = phaseLeads.length > 0 && phaseLeads.every(l => selectedLeadIds.includes(l.id));

              return (
                <div key={phase} className="bg-slate-900/40 border border-slate-800/90 rounded-2xl p-3 min-w-[220px] space-y-3 flex flex-col shadow-md">
                  {/* Phase Title & Multi-Select Column Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-200 tracking-wide">
                        {getPhaseName(phase)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectByPhase(phase)}
                        title="Marcar todos desta fase"
                        className="text-[9px] bg-slate-800 hover:bg-slate-700 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold transition-colors"
                      >
                        +Fase
                      </button>
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full font-mono">
                        {phaseLeads.length}
                      </span>
                    </div>
                  </div>

                  {/* Phase Cards */}
                  <div className="space-y-2.5 flex-1 max-h-[440px] overflow-y-auto pr-0.5">
                    {phaseLeads.length === 0 ? (
                      <div className="text-center py-8 text-slate-600 text-[11px] border border-dashed border-slate-800/60 rounded-xl">
                        Nenhum contato
                      </div>
                    ) : (
                      phaseLeads.map((lead) => {
                        const isSelected = selectedLeadIds.includes(lead.id);
                        return (
                          <div 
                            key={lead.id} 
                            className={`p-3 rounded-xl space-y-2 transition-all shadow-sm relative ${
                              isSelected 
                                ? "bg-slate-950 border-2 border-emerald-500/70 shadow-emerald-500/10 shadow-md" 
                                : "bg-slate-950 border border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleLead(lead.id)}
                                  className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? "bg-emerald-500 text-slate-950" 
                                      : "border border-slate-700 hover:border-emerald-400 bg-slate-900"
                                  }`}
                                  title={isSelected ? "Desmarcar para campanha" : "Selecionar para disparo em massa"}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                                <h4 className="font-bold text-slate-200 text-xs truncate max-w-[130px]">{lead.name}</h4>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLeadIds([lead.id]);
                                  setShowBulkModal(true);
                                }}
                                title="Disparar mensagem no WhatsApp"
                                className="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-slate-900"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-relaxed font-normal line-clamp-2">
                              {lead.notes}
                            </p>

                            <div className="pt-2 border-t border-slate-900 flex justify-between items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400 font-medium">
                                📅 {formatDateBR(lead.dateCreated)}
                              </span>
                              
                              {/* Phase transitions switcher */}
                              <div className="flex gap-1">
                                {phase !== "Won" && (
                                  <button
                                    onClick={() => {
                                      const nextPhaseMap: Record<Lead["phase"], Lead["phase"]> = {
                                        "Capture": "Trial Scheduled",
                                        "Trial Scheduled": "Trial Attended",
                                        "Trial Attended": "Proposal",
                                        "Proposal": "Won",
                                        "Won": "Won",
                                        "Lost": "Lost"
                                      };
                                      onUpdateLeadPhase(lead.id, nextPhaseMap[phase]);
                                    }}
                                    className="text-[9px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 px-2 py-1 rounded-lg flex items-center gap-0.5 font-bold"
                                    title="Avançar fase no funil"
                                  >
                                    Avançar <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Floating Action Bar when Leads are selected */}
          {selectedLeadIds.length > 0 && (
            <div className="sticky bottom-4 z-40 bg-slate-900/95 border-2 border-emerald-500/60 p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white font-display block">
                    {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? "s" : ""} selecionado{selectedLeadIds.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-slate-400">
                    Prontos para envio em lote de notificação via WhatsApp Cloud API
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3 py-2 rounded-xl transition-all"
                >
                  Desmarcar Todos
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <Send className="w-4 h-4 fill-slate-950" /> Iniciar Disparo em Massa
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Bulk Campaign & WhatsApp Notification Payload Modal */}
      <BulkCampaignModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        allLeads={leads}
        selectedLeadIds={selectedLeadIds}
        onToggleLead={handleToggleLead}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onCampaignDispatched={handleCampaignDispatched}
      />
    </div>
  );
}

