import React, { useState, useEffect } from "react";
import { Lead } from "../types";
import { 
  X, Send, Smartphone, Sparkles, Copy, Check, Code, 
  CheckCheck, RefreshCw, Eye, MessageSquare, Layers, AlertCircle, 
  ExternalLink, Users, ChevronRight, Play
} from "lucide-react";

interface BulkCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  allLeads: Lead[];
  selectedLeadIds: string[];
  onToggleLead: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCampaignDispatched?: (campaignInfo: {
    name: string;
    recipientsCount: number;
    timestamp: string;
    preview: string;
  }) => void;
}

export const CAMPAIGN_PRESET_TEMPLATES = [
  {
    id: "trial_invite",
    name: "🥋 Convite para Aula Experimental Gratuita",
    category: "Aquisição",
    text: "Olá {nome}! Tudo bem? Vimos seu interesse na nossa academia de Jiu-Jitsu. Que tal agendar sua aula experimental gratuita esta semana? Temos kimono cortesia para seu primeiro treino! 🥋"
  },
  {
    id: "trial_reminder",
    name: "⏰ Lembrete de Aula Experimental Agendada",
    category: "Comparecimento",
    text: "Fala {nome}! Confirmando seu treino experimental de Jiu-Jitsu agendado na nossa academia. Chegue com 10 minutos de antecedência e traga uma roupa leve. O tatame está pronto para você!"
  },
  {
    id: "special_offer",
    name: "💎 Condição Especial: Matrícula Grátis + Kimono",
    category: "Conversão",
    text: "Oi {nome}! Liberamos uma condição exclusiva para novos alunos válida até esta sexta-feira: Isenção de Matrícula + Kimono Oficial no Plano Anual. Vamos garantir sua vaga na turma?"
  },
  {
    id: "post_class_followup",
    name: "⭐ Feedback Pós-Treino & Formalização",
    category: "Follow-up",
    text: "Olá {nome}! Esperamos que tenha aproveitado a aula de Jiu-Jitsu hoje no tatame! Ficou com alguma dúvida sobre nossas turmas, horários ou formas de pagamento? Estamos à disposição!"
  },
  {
    id: "reactivation",
    name: "🔄 Reengajamento de Visitantes",
    category: "Retenção",
    text: "Olá {nome}! Sentimos sua falta por aqui. Temos novos horários de Jiu-Jitsu adulto e iniciantes. Que tal passar no dojo esta semana para bater um papo e retomar os treinos?"
  }
];

export default function BulkCampaignModal({
  isOpen,
  onClose,
  allLeads,
  selectedLeadIds,
  onToggleLead,
  onSelectAll,
  onDeselectAll,
  onCampaignDispatched
}: BulkCampaignModalProps) {
  if (!isOpen) return null;

  const [campaignName, setCampaignName] = useState<string>("Campanha de Engajamento de Leads");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("trial_invite");
  const [messageTemplate, setMessageTemplate] = useState<string>(
    CAMPAIGN_PRESET_TEMPLATES[0].text
  );
  
  const [activeTab, setActiveTab] = useState<"whatsapp_preview" | "api_payload" | "dispatch_status">("whatsapp_preview");
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Dispatch simulation state
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [dispatchCompleted, setDispatchCompleted] = useState<boolean>(false);
  const [dispatchedLeads, setDispatchedLeads] = useState<{
    id: string;
    name: string;
    phone: string;
    status: "PENDING" | "SENT" | "DELIVERED" | "READ";
    timestamp: string;
  }[]>([]);

  // Selected leads list
  const targetLeads = allLeads.filter(l => selectedLeadIds.includes(l.id));

  // Helper to render template text with lead variables
  const renderMessageForLead = (template: string, lead?: Lead) => {
    if (!lead) return template;
    return template
      .replace(/{nome}/g, lead.name)
      .replace(/{telefone}/g, lead.phone)
      .replace(/{fase}/g, lead.phase)
      .replace(/{email}/g, lead.email || "contato@academia.com")
      .replace(/{data}/g, new Date().toLocaleDateString("pt-BR"));
  };

  const handleSelectTemplate = (tId: string) => {
    setSelectedTemplateId(tId);
    const found = CAMPAIGN_PRESET_TEMPLATES.find(t => t.id === tId);
    if (found) {
      setMessageTemplate(found.text);
    }
  };

  const insertVariable = (varTag: string) => {
    setMessageTemplate(prev => prev + " " + varTag);
  };

  // Generate simulated WhatsApp API webhook payload
  const generateSimulatedPayload = () => {
    const timestampIso = new Date().toISOString();
    return {
      event: "whatsapp.bulk_campaign.dispatch",
      campaign: {
        id: `camp_bulk_${Date.now()}`,
        name: campaignName,
        type: "MARKETING_BROADCAST",
        channel: "WHATSAPP_OFFICIAL_CLOUD_API",
        apiVersion: "v19.0",
        rateLimit: "80_msgs_per_second",
        totalRecipients: targetLeads.length,
        createdAt: timestampIso,
      },
      templateConfiguration: {
        templateId: selectedTemplateId || "custom_broadcast_v1",
        rawTemplate: messageTemplate,
        allowedVariables: ["nome", "telefone", "fase", "data", "email"]
      },
      recipients: targetLeads.map((lead, idx) => ({
        recipientIndex: idx + 1,
        leadId: lead.id,
        name: lead.name,
        phone: lead.phone.replace(/\D/g, "").startsWith("55") 
          ? `+${lead.phone.replace(/\D/g, "")}` 
          : `+55${lead.phone.replace(/\D/g, "")}`,
        leadPhase: lead.phase,
        renderedPayload: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: lead.phone.replace(/\D/g, ""),
          type: "text",
          text: {
            preview_url: false,
            body: renderMessageForLead(messageTemplate, lead)
          }
        },
        metadata: {
          notes: lead.notes,
          leadCreated: lead.dateCreated
        },
        dispatchStatus: dispatchCompleted ? "DELIVERED" : (isDispatching ? "IN_PROGRESS" : "QUEUED")
      })),
      webhookResponseEndpoints: {
        deliveryReceiptsUrl: "https://api.bjjacademy.app.br/webhooks/whatsapp/delivery-receipts",
        inboundRepliesUrl: "https://api.bjjacademy.app.br/webhooks/whatsapp/inbound-messages"
      }
    };
  };

  const jsonPayloadString = JSON.stringify(generateSimulatedPayload(), null, 2);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(jsonPayloadString);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handleStartSimulatedDispatch = () => {
    if (targetLeads.length === 0) return;
    setIsDispatching(true);
    setDispatchProgress(0);
    setDispatchCompleted(false);
    setActiveTab("dispatch_status");

    // Initialize list
    const initialList = targetLeads.map(l => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      status: "PENDING" as const,
      timestamp: new Date().toLocaleTimeString("pt-BR")
    }));
    setDispatchedLeads(initialList);

    // Progressive simulated dispatch
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      const progressPercent = Math.min(100, Math.round((current / targetLeads.length) * 100));
      setDispatchProgress(progressPercent);

      setDispatchedLeads(prev => prev.map((item, idx) => {
        if (idx < current) {
          return {
            ...item,
            status: idx === current - 1 ? "DELIVERED" : "READ",
            timestamp: new Date().toLocaleTimeString("pt-BR")
          };
        }
        return item;
      }));

      if (current >= targetLeads.length) {
        clearInterval(interval);
        setIsDispatching(false);
        setDispatchCompleted(true);
        if (onCampaignDispatched) {
          onCampaignDispatched({
            name: campaignName,
            recipientsCount: targetLeads.length,
            timestamp: new Date().toLocaleString("pt-BR"),
            preview: renderMessageForLead(messageTemplate, targetLeads[0])
          });
        }
      }
    }, 450);
  };

  const activePreviewLead = targetLeads[selectedPreviewIndex] || targetLeads[0];

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border-slate-700/70">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 rounded-2xl font-bold shadow-lg shadow-emerald-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">Disparo em Massa de WhatsApp (Send Bulk Campaign)</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  API Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selecione os contatos do funil CRM, personalize a mensagem e visualize o payload da API antes do disparo.
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Configuration & Recipients (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col">
            
            {/* Campaign Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nome da Campanha</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Ex: Aquecimento de Leads - Março 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            {/* Recipient Selector Summary */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white font-display">Destinatários Selecionados</span>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {targetLeads.length} de {allLeads.length} leads
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-200 font-medium py-1.5 rounded-lg transition-colors text-center"
                >
                  Selecionar Todos ({allLeads.length})
                </button>
                <button
                  type="button"
                  onClick={onDeselectAll}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Limpar
                </button>
              </div>

              {/* Leads Mini Checklist */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-900">
                {allLeads.map((lead) => {
                  const isChecked = selectedLeadIds.includes(lead.id);
                  return (
                    <div 
                      key={lead.id}
                      onClick={() => onToggleLead(lead.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        isChecked 
                          ? "bg-emerald-950/30 border border-emerald-500/40 text-white" 
                          : "bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleLead(lead.id)}
                          className="w-3.5 h-3.5 rounded accent-emerald-500 pointer-events-none"
                        />
                        <div className="truncate">
                          <span className="text-xs font-semibold block truncate">{lead.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{lead.phone}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex-shrink-0 ml-2">
                        {lead.phase}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Modelos Prontos de WhatsApp</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
              >
                {CAMPAIGN_PRESET_TEMPLATES.map(tmpl => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Template Textarea */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Corpo da Mensagem (Editável)</label>
                <span className="text-[10px] text-slate-400 font-mono">Variáveis dinâmicas</span>
              </div>
              
              {/* Insert Tags */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: "{nome}", label: "+ {nome}" },
                  { tag: "{telefone}", label: "+ {telefone}" },
                  { tag: "{fase}", label: "+ {fase}" },
                  { tag: "{data}", label: "+ {data}" }
                ].map(v => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => insertVariable(v.tag)}
                    className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 px-2 py-0.5 rounded-md font-mono transition-colors"
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-emerald-500"
                placeholder="Escreva a mensagem aqui..."
              />
            </div>

          </div>

          {/* Right Column: Interactive Tabs - WhatsApp Simulator / API Payload / Execution (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4 bg-slate-950/60 border border-slate-800/90 rounded-2xl p-5">
            
            {/* Tab Controls */}
            <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("whatsapp_preview")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === "whatsapp_preview"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Visualização WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("api_payload")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === "api_payload"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" /> Payload Técnico (JSON)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("dispatch_status")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === "dispatch_status"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Fila de Envio & Status
                </button>
              </div>

              {activeTab === "api_payload" && (
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono transition-all"
                >
                  {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedPayload ? "Copiado!" : "Copiar JSON"}
                </button>
              )}
            </div>

            {/* TAB 1: WhatsApp Smartphone Visual Mockup */}
            {activeTab === "whatsapp_preview" && (
              <div className="flex-1 flex flex-col space-y-3 animate-in fade-in duration-200">
                {targetLeads.length > 0 ? (
                  <>
                    {/* Lead Switcher */}
                    <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-medium">Prévia do Destinatário:</span>
                      <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-xs">
                        {targetLeads.map((lead, idx) => (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() => setSelectedPreviewIndex(idx)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                              selectedPreviewIndex === idx
                                ? "bg-emerald-500 text-slate-950 shadow-md"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {lead.name.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Smartphone Mockup */}
                    <div className="flex-1 bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-slate-800 rounded-3xl p-4 shadow-2xl relative flex flex-col justify-between max-w-sm mx-auto w-full">
                      {/* Top Bar of phone */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                            🥋
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block leading-tight">BJJ Academy Official</span>
                            <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> WhatsApp Oficial
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">Hoje</span>
                      </div>

                      {/* Message Bubble Container */}
                      <div className="py-4 space-y-3 flex-1 flex flex-col justify-end">
                        <div className="bg-[#054c44] border border-[#0d6e63] text-emerald-50 p-3.5 rounded-2xl rounded-tr-sm shadow-md text-xs leading-relaxed max-w-[90%] self-end">
                          <p className="whitespace-pre-wrap">
                            {renderMessageForLead(messageTemplate, activePreviewLead)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-emerald-300/80 font-mono">
                            <span>{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        </div>
                      </div>

                      {/* Recipient Footer */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Para: <strong>{activePreviewLead?.name}</strong></span>
                        <span>{activePreviewLead?.phone}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    <p className="text-sm font-bold text-white">Nenhum lead selecionado</p>
                    <p className="text-xs text-slate-400 max-w-xs">Selecione pelo menos um lead na coluna à esquerda para visualizar a simulação e gerar o payload.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Simulated Webhook / API Payload JSON */}
            {activeTab === "api_payload" && (
              <div className="flex-1 flex flex-col space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">POST /v19.0/bjj-academy/messages/bulk-broadcast</span>
                  <span className="text-emerald-400 font-bold font-mono">Content-Type: application/json</span>
                </div>
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 overflow-y-auto max-h-[380px] font-mono text-[11px] text-emerald-300 leading-relaxed shadow-inner">
                  <pre>{jsonPayloadString}</pre>
                </div>
                <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span>🚀 Payload pronto para integração com Evolution API, Z-API ou Meta Cloud API oficial.</span>
                  <span className="text-slate-300 font-mono">{targetLeads.length} payloads em lote</span>
                </div>
              </div>
            )}

            {/* TAB 3: Execution Progress & Live Status */}
            {activeTab === "dispatch_status" && (
              <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-200">
                
                {/* Progress Card */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white font-display">Progresso da Campanha</h4>
                      <p className="text-[11px] text-slate-400">
                        {isDispatching ? "Enviando mensagens em lote..." : dispatchCompleted ? "✅ Todos os disparos concluídos com sucesso!" : "Aguardando início do disparo."}
                      </p>
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-400">{dispatchProgress}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                      style={{ width: `${dispatchProgress}%` }}
                    />
                  </div>

                  {dispatchCompleted && (
                    <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Total Enviados</span>
                        <strong className="text-white font-mono">{targetLeads.length}</strong>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Taxa de Sucesso</span>
                        <strong className="text-emerald-400 font-mono">100%</strong>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Canal</span>
                        <strong className="text-blue-400 font-mono">WhatsApp Cloud</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-time Status Table */}
                <div className="flex-1 overflow-y-auto max-h-52 bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-900">
                  {(dispatchedLeads.length > 0 ? dispatchedLeads : targetLeads.map(l => ({
                    id: l.id,
                    name: l.name,
                    phone: l.phone,
                    status: "PENDING" as const,
                    timestamp: "--:--"
                  }))).map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          item.status === "READ" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                          item.status === "DELIVERED" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" :
                          item.status === "SENT" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {item.status === "READ" ? "Lido ✓✓" :
                           item.status === "DELIVERED" ? "Entregue ✓✓" :
                           item.status === "SENT" ? "Enviado ✓" : "Na Fila ⏳"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                <span>{targetLeads.length} leads prontos para envio.</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  Fechar
                </button>
                
                <button
                  type="button"
                  disabled={targetLeads.length === 0 || isDispatching}
                  onClick={handleStartSimulatedDispatch}
                  className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {isDispatching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Disparando ({dispatchProgress}%)
                    </>
                  ) : dispatchCompleted ? (
                    <>
                      <CheckCheck className="w-4 h-4" /> Disparar Novamente
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-950" /> Iniciar Disparo em Massa
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
