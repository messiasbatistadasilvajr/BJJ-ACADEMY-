import React, { useState } from "react";
import { Student, PaymentHistory, Academy, ClassSchedule } from "../types";
import { 
  Award, QrCode, ClipboardCheck, Bell, ChevronRight, 
  MapPin, CheckCircle, RefreshCw, AlertTriangle, ShieldCheck, X,
  FileText, CreditCard, Copy, Download, Check, ExternalLink, FileCheck,
  Calendar, Trophy, Send, Smartphone, Maximize2, Minimize2, Clock, Users, Star, MessageSquare, CheckCircle2, Sparkles, Share2
} from "lucide-react";

interface MobileSimulatorProps {
  students: Student[];
  payments: PaymentHistory[];
  academies?: Academy[];
  schedules?: ClassSchedule[];
  onCheckIn: (studentId: string) => void;
  onUpdateStudent?: (updated: Student) => void;
  onAddPayment?: (payment: Omit<PaymentHistory, "id">) => void;
}

export default function MobileSimulator({
  students,
  payments,
  academies = [],
  schedules = [],
  onCheckIn,
  onUpdateStudent,
  onAddPayment
}: MobileSimulatorProps) {
  // Simulator View Mode: Smartphone frame vs Expanded
  const [frameMode, setFrameMode] = useState<"smartphone" | "expanded">("smartphone");

  // Mobile active student selection
  const [activeStudentId, setActiveStudentId] = useState<string>(students[0]?.id || "");
  const [mobileTab, setMobileTab] = useState<"card" | "schedule" | "study" | "payments" | "history">("card");
  
  // Asaas Student Portal Actions State
  const [showPixModal, setShowPixModal] = useState(false);
  const [showBoletoModal, setShowBoletoModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentHistory | null>(null);
  
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedBoleto, setCopiedBoleto] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [cardForm, setCardForm] = useState({
    number: "•••• •••• •••• 4242",
    holder: "",
    expiry: "12/28",
    cvv: "•••"
  });

  const [mobileAlert, setMobileAlert] = useState<{ title: string; body: string; type: "success" | "error" } | null>(null);

  const activeStudent = students.find(s => s.id === activeStudentId) || students[0];
  if (!activeStudent) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
        <p className="text-sm">Nenhum aluno cadastrado para simular no aplicativo móvel.</p>
      </div>
    );
  }

  const activeStudentPayments = payments.filter(p => p.studentId === activeStudent.id);
  const activeStudentAcademy = academies.find(a => a.id === activeStudent.academyId);
  const academySchedules = schedules.filter(s => !activeStudent.academyId || s.academyId === activeStudent.academyId);

  const triggerMobileCheckIn = () => {
    if (activeStudent.paymentStatus === "Overdue") {
      setMobileAlert({
        title: "Check-in Recusado",
        body: "⚠️ ALERTA FINANCEIRO: Check-in recusado por pendência na mensalidade! Regularize via PIX no app.",
        type: "error"
      });
      setTimeout(() => setMobileAlert(null), 5000);
      return;
    }
    
    onCheckIn(activeStudent.id);
    setMobileAlert({
      title: "Check-in Realizado!",
      body: `🥋 Presença confirmada para ${activeStudent.name}. Frequência atualizada para ${activeStudent.attendance30Days + 1} treinos.`,
      type: "success"
    });
    setTimeout(() => setMobileAlert(null), 5000);
  };

  const handleSimulatePaymentSuccess = (methodName: "PIX" | "BOLETO" | "CREDIT_CARD") => {
    if (onUpdateStudent) {
      onUpdateStudent({
        ...activeStudent,
        paymentStatus: "Paid"
      });
    }

    if (onAddPayment) {
      onAddPayment({
        academyId: activeStudent.academyId || "ac1",
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        amount: activeStudent.planValue || 220,
        date: new Date().toLocaleDateString("pt-BR"),
        method: methodName,
        status: "Paid"
      });
    }

    setMobileAlert({
      title: "Pagamento Confirmado!",
      body: `🎉 Pagamento via ${methodName} liquidado com sucesso no Asaas! Sua mensalidade está quitada e o QR Code de check-in foi liberado.`,
      type: "success"
    });
    setTimeout(() => setMobileAlert(null), 6000);

    setShowPixModal(false);
    setShowCardModal(false);
    setShowBoletoModal(false);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getPixCopiaECole = () => {
    return `00020101021226830014br.gov.bcb.pix2561api.asaas.com/v3/pix/qr/pay_${activeStudent.id}_2026`;
  };

  const getBoletoLineDigitavel = () => {
    return "23793.38128 60000.123456 78000.900001 8 98210000022000";
  };

  const shareCardWhatsApp = () => {
    const text = `🥋 *Carteirinha Digital BJJ Academy*\n\n` +
      `• Atleta: ${activeStudent.name}\n` +
      `• Graduação: Faixa ${activeStudent.belt} (${activeStudent.stripes}º Grau)\n` +
      `• Unidade: ${activeStudentAcademy ? activeStudentAcademy.name : "BJJ Academy"}\n` +
      `• Status: ${activeStudent.paymentStatus === "Paid" ? "✅ Adimplente / Liberado" : "⚠️ Vencido"}\n` +
      `• Frequência Mês: ${activeStudent.attendance30Days} treinos cumpridos\n\n` +
      `OSS! 🥋`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    triggerToast("Link da Carteirinha formatado para o WhatsApp!");
  };

  return (
    <div className="space-y-6 relative" id="mobile-simulator-root">

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

      {/* Top Banner & Mode Toggle */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            📱 Simulador de Aplicativo do Aluno & Autoatendimento Asaas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multe-tenant: Selecione um aluno para testar a carteirinha digital, check-in por QR Code, pagamento de mensalidades e grade de treinos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Frame Mode Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFrameMode("smartphone")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                frameMode === "smartphone" 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Moldura iPhone
            </button>
            <button
              onClick={() => setFrameMode("expanded")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                frameMode === "expanded" 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" /> Tela Cheia (Expandida)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Selector & Guide Column */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block font-mono">Seleção de Perfil</span>
            <h3 className="text-sm font-bold text-white mt-1">Logar como Atleta da Academia</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Troque de aluno em tempo real para visualizar como cada carteirinha e status financeiro se comporta na tela do smartphone.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Escolha o Aluno:</label>
            <select
              value={activeStudentId}
              onChange={(e) => {
                setActiveStudentId(e.target.value);
                setMobileTab("card");
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.belt} Belt • {s.paymentStatus === "Paid" ? "Adimplente" : s.paymentStatus === "Overdue" ? "Pendente/Atrasado" : "Pendente"})
                </option>
              ))}
            </select>
          </div>

          {/* Active Student Quick Stats */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Atleta Ativo:</span>
              <strong className="text-white font-bold">{activeStudent.name}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status no Asaas:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                activeStudent.paymentStatus === "Paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {activeStudent.paymentStatus === "Paid" ? "Adimplente (Pago)" : "Atrasado (Cobrar PIX)"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Plano Contratado:</span>
              <span className="text-slate-200 font-mono">R$ {activeStudent.planValue || 220}/mês ({activeStudent.plan || "Mensal"})</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
            <h4 className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">Recursos de Autoatendimento Asaas:</h4>
            <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-[11px]">
              <li><strong className="text-emerald-400">QR Code PIX & Copia e Cole:</strong> Baixa e liberação de check-in instantânea.</li>
              <li><strong className="text-blue-400">2ª via de Boleto Registrado:</strong> Linha digitável com vencimento atualizado.</li>
              <li><strong className="text-indigo-400">Atualizar Cartão Recorrente:</strong> Processamento automático Asaas.</li>
              <li><strong className="text-amber-400">Contrato & Recibos Digitalizados:</strong> Histórico completo do praticante.</li>
            </ul>
          </div>
        </div>

        {/* Smartphone / Expanded Container */}
        <div className="lg:col-span-2 flex justify-center py-2">
          
          <div className={`transition-all duration-300 ${
            frameMode === "smartphone" 
              ? "relative w-full max-w-[340px] h-[640px] bg-slate-950 rounded-[44px] border-[10px] border-slate-900 shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-800/60" 
              : "w-full bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col space-y-4"
          }`}>

            {/* Smartphone Speaker & Camera Notch (Only in smartphone mode) */}
            {frameMode === "smartphone" && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-6 bg-slate-900 rounded-b-2xl z-20 flex items-center justify-center gap-2">
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
                <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
              </div>
            )}

            {/* Screen Header */}
            <div className={`px-5 py-3.5 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-slate-400 ${
              frameMode === "smartphone" ? "pt-8" : "rounded-xl"
            }`}>
              <div>
                <span className="text-[10px] font-bold text-white block tracking-wider font-display">🥋 BJJ ACADEMY APP</span>
                <span className="text-[9px] font-mono flex items-center gap-1 text-slate-400 truncate max-w-[190px]">
                  <MapPin className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" /> {activeStudentAcademy ? activeStudentAcademy.name : "Academia Contratante"}
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
                Área do Aluno
              </span>
            </div>

            {/* Screen Content Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 space-y-4">
              
              {/* Push notification banner simulation */}
              {mobileAlert && (
                <div className={`p-3 rounded-xl border text-xs shadow-xl animate-in slide-in-from-top duration-300 ${
                  mobileAlert.type === "success" 
                    ? "bg-slate-900/95 border-emerald-500/30 text-emerald-400" 
                    : "bg-slate-900/95 border-rose-500/30 text-rose-400"
                }`}>
                  <div className="flex justify-between items-start">
                    <strong className="font-bold block text-white">{mobileAlert.title}</strong>
                    <button onClick={() => setMobileAlert(null)} className="text-slate-500 hover:text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-normal">{mobileAlert.body}</p>
                </div>
              )}

              {/* Warning if Student is unpaid */}
              {activeStudent.paymentStatus === "Overdue" && (
                <div className="p-3 bg-rose-950/20 border border-rose-800/60 rounded-xl flex items-center justify-between gap-2 text-rose-300 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                    <div>
                      <span className="font-bold block text-rose-200">Mensalidade Pendente</span>
                      <span className="text-[10px] text-rose-300/80">R$ {activeStudent.planValue || 220},00 em atraso no Asaas.</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPixModal(true)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex-shrink-0 shadow transition-all"
                  >
                    Pagar PIX
                  </button>
                </div>
              )}

              {/* TAB 1: CARTEIRINHA DIGITAL */}
              {mobileTab === "card" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Carteirinha Digital Graphics */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 p-4 rounded-2xl relative overflow-hidden space-y-4 shadow-lg">
                    <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                      <Award className="w-32 h-32 text-white" />
                    </div>

                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase block">BJJ ACADEMY • CARTEIRINHA DIGITAL</span>
                        <strong className="text-white text-base font-display block mt-0.5">{activeStudent.name}</strong>
                        <span className="text-[10px] text-slate-400 block font-medium font-sans mt-0.5">
                          {activeStudentAcademy ? activeStudentAcademy.name : "Academia Contratante"}
                        </span>
                      </div>
                      <span className="text-[8px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
                        #{activeStudent.id}
                      </span>
                    </div>

                    {/* Belt indicator bar */}
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 uppercase font-semibold">Graduação Oficial</label>
                      <div className="flex items-center gap-2">
                        <div className={`h-4.5 w-36 rounded flex items-center px-2 text-[9px] font-bold ${
                          activeStudent.belt === "White" ? "bg-slate-200 text-slate-900" :
                          activeStudent.belt === "Blue" ? "bg-blue-600 text-white" :
                          activeStudent.belt === "Purple" ? "bg-purple-600 text-white" :
                          activeStudent.belt === "Brown" ? "bg-amber-800 text-white" : "bg-zinc-950 text-red-500 border border-red-500"
                        }`}>
                          FAIXA {activeStudent.belt.toUpperCase()}
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(idx => (
                            <div 
                              key={idx} 
                              className={`w-1.5 h-3.5 rounded-sm ${
                                idx <= activeStudent.stripes ? "bg-amber-400" : "bg-slate-800"
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-2.5 border-t border-slate-800/80">
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-bold">Presenças Mês</span>
                        <strong className="text-white text-xs">{activeStudent.attendance30Days} treinos</strong>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-bold">Acesso Asaas</span>
                        <strong className={`text-xs ${activeStudent.paymentStatus === "Paid" ? "text-emerald-400" : "text-rose-400"}`}>
                          {activeStudent.paymentStatus === "Paid" ? "Ativo (Liberado)" : "Bloqueado"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Share Card & QR Code Check-in Simulator */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="text-[9px] uppercase font-bold text-slate-400">QR Code de Check-in Diário</span>
                      <button
                        onClick={shareCardWhatsApp}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" /> Enviar WhatsApp
                      </button>
                    </div>
                    
                    {activeStudent.paymentStatus === "Paid" ? (
                      <div className="bg-white p-3 rounded-2xl border border-slate-800 shadow-md">
                        <QrCode className="w-24 h-24 text-slate-950" />
                      </div>
                    ) : (
                      <div className="w-28 h-28 bg-slate-950 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 text-xs p-3">
                        <AlertTriangle className="w-6 h-6 text-rose-500/80 mb-1" />
                        Acesso Bloqueado
                      </div>
                    )}

                    <button
                      onClick={triggerMobileCheckIn}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all"
                    >
                      <ClipboardCheck className="w-4 h-4" /> Simular Leitura do QR Code
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: GRADE DE AULAS */}
              {mobileTab === "schedule" && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-400" /> Grade de Treinos & Horários
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Horários disponíveis para sua unidade ({activeStudentAcademy?.name || "BJJ Academy"}).
                    </p>
                  </div>

                  <div className="space-y-2">
                    {academySchedules.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">Nenhuma turma cadastrada no momento.</p>
                    ) : (
                      academySchedules.map((cls) => (
                        <div key={cls.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                          <div className="flex justify-between items-start">
                            <strong className="font-bold text-slate-200">{cls.className}</strong>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                              {cls.time}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Professor: <span className="text-slate-200">{cls.instructorName}</span>
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>Dias: {cls.daysOfWeek.join(", ")}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: EVOLUÇÃO & PLANO IA */}
              {mobileTab === "study" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Seu Plano de Estudos IA
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Personalizado pela nossa IA para consolidar técnicas ideais para seu biotipo e faixa atual ({activeStudent.belt}).
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs space-y-2">
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">Semana 1: Fundamentos</span>
                      <strong className="block text-slate-200 mt-1">Defesa de Meia-Guarda & Postura</strong>
                      <ul className="space-y-1 list-disc pl-4 text-slate-400 text-[11px]">
                        <li>Posicionamento de cotovelos colados</li>
                        <li>Escapes de quadril com frame de ombro</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs space-y-2">
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">Semana 2: Contra-ataques</span>
                      <strong className="block text-slate-200 mt-1">Transição para Z-Guard / Raspagem Tesoura</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: FINANCEIRO ASAAS */}
              {mobileTab === "payments" && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                      Área do Aluno Asaas — Serviços Rápidos
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <button
                        onClick={() => setShowBoletoModal(true)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 font-semibold flex items-center gap-1.5 transition-all text-left"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <div>
                          <span className="block text-[10px] text-white">2ª Via Boleto</span>
                          <span className="text-[8px] text-slate-500">Asaas Registrar</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowPixModal(true)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 font-semibold flex items-center gap-1.5 transition-all text-left"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <span className="block text-[10px] text-white">QR Code PIX</span>
                          <span className="text-[8px] text-slate-500">Copia e Cole</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowCardModal(true)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 font-semibold flex items-center gap-1.5 transition-all text-left"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <div>
                          <span className="block text-[10px] text-white">Cartão Crédito</span>
                          <span className="text-[8px] text-slate-500">Recorrência</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowContractModal(true)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 font-semibold flex items-center gap-1.5 transition-all text-left"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <div>
                          <span className="block text-[10px] text-white">Contrato Digital</span>
                          <span className="text-[8px] text-slate-500">Termos Aluno</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Subscriptions Info */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-mono text-slate-400">Assinatura Ativa</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                        {activeStudent.plan || "Mensal"}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-white font-bold">Valor do Plano</span>
                      <span className="text-emerald-400 font-mono font-bold text-sm">
                        R$ {activeStudent.planValue || 220},00<span className="text-[10px] font-normal text-slate-500">/mês</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between">
                      <span>Asaas Sub ID:</span>
                      <span className="font-mono text-slate-400">{activeStudent.asaasSubscriptionId || "sub_10091823"}</span>
                    </div>
                  </div>

                  {/* Payment History and Receipts */}
                  <span className="text-[9px] uppercase font-bold text-slate-500 block pt-1 font-mono">Histórico de Recibos</span>

                  {activeStudentPayments.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Nenhum recibo no histórico.</p>
                  ) : (
                    activeStudentPayments.map(pay => (
                      <div key={pay.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-slate-200 block">Mensalidade BJJ</span>
                          <span className="text-[10px] text-slate-500">{pay.date} via {pay.method}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <strong className="text-emerald-400 block font-mono">R$ {pay.amount}</strong>
                          <button
                            onClick={() => setSelectedReceipt(pay)}
                            className="text-[9px] text-blue-400 hover:underline block font-semibold"
                          >
                            Ver Recibo
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: CONQUISTAS & FIDELIDADE */}
              {mobileTab === "history" && (
                <div className="space-y-3 animate-in fade-in duration-150 text-xs">
                  <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400" /> Fidelidade & Pontos
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full">
                        {activeStudent.loyaltyPoints || 120} PTS
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Ganhe pontos a cada check-in no tatame para trocar por equipamentos e descontos.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Medalhas Desbloqueadas:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { title: "Guerreiro Frequente", desc: "10 check-ins seguidos", icon: "🥋" },
                        { title: "Graduado de Raça", desc: "Evoluiu de grau", icon: "🏆" },
                        { title: "Pontualidade 100%", desc: "Chegou no horário", icon: "⭐" },
                        { title: "Parceiro de Treino", desc: "Ajudou novatos", icon: "🤝" }
                      ].map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2">
                          <span className="text-lg">{item.icon}</span>
                          <div>
                            <strong className="text-[11px] font-bold text-slate-200 block">{item.title}</strong>
                            <span className="text-[9px] text-slate-500 block">{item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Navigation Tabs */}
            <div className="h-14 bg-slate-900 border-t border-slate-850 grid grid-cols-5 text-center items-center rounded-b-[34px]">
              <button
                onClick={() => setMobileTab("card")}
                className={`flex flex-col items-center justify-center text-slate-400 transition-colors ${
                  mobileTab === "card" ? "text-blue-400" : "hover:text-slate-300"
                }`}
              >
                <Award className="w-4 h-4" />
                <span className="text-[8px] mt-0.5 font-medium">Cartão</span>
              </button>

              <button
                onClick={() => setMobileTab("schedule")}
                className={`flex flex-col items-center justify-center text-slate-400 transition-colors ${
                  mobileTab === "schedule" ? "text-blue-400" : "hover:text-slate-300"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-[8px] mt-0.5 font-medium">Aulas</span>
              </button>

              <button
                onClick={() => setMobileTab("study")}
                className={`flex flex-col items-center justify-center text-slate-400 transition-colors ${
                  mobileTab === "study" ? "text-blue-400" : "hover:text-slate-300"
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="text-[8px] mt-0.5 font-medium">Estudos</span>
              </button>

              <button
                onClick={() => setMobileTab("payments")}
                className={`flex flex-col items-center justify-center text-slate-400 transition-colors ${
                  mobileTab === "payments" ? "text-blue-400" : "hover:text-slate-300"
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span className="text-[8px] mt-0.5 font-medium">Pagar</span>
              </button>

              <button
                onClick={() => setMobileTab("history")}
                className={`flex flex-col items-center justify-center text-slate-400 transition-colors ${
                  mobileTab === "history" ? "text-blue-400" : "hover:text-slate-300"
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span className="text-[8px] mt-0.5 font-medium">Pontos</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* MODAL STUDENT PIX */}
      {showPixModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative text-xs animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowPixModal(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-400" /> QR Code PIX Asaas
            </h3>

            <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center">
              <div className="w-32 h-32 border-2 border-slate-950 bg-slate-900 text-white flex items-center justify-center text-[10px] font-mono text-center font-bold">
                🥋 PIX ASAAS<br/>R$ {activeStudent.planValue || 220},00
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Chave PIX Copia e Cole</label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={getPixCopiaECole()}
                  className="bg-slate-950 text-[10px] text-slate-300 p-2 rounded-l flex-1 border border-slate-800 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getPixCopiaECole());
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2000);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 rounded-r text-[10px] flex items-center gap-1"
                >
                  {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPix ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            {/* SIMULATE PIX PAYMENT SUCCESS BUTTON */}
            <button
              type="button"
              onClick={() => handleSimulatePaymentSuccess("PIX")}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Simular Baixa do PIX no Asaas (Liquidar)
            </button>

            <button
              onClick={() => setShowPixModal(false)}
              className="w-full bg-slate-800 text-slate-300 py-2 rounded-xl font-semibold hover:bg-slate-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL STUDENT BOLETO */}
      {showBoletoModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative text-xs animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowBoletoModal(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" /> Boleto Bancário Asaas
            </h3>

            <div className="p-3 bg-white text-slate-950 rounded-xl space-y-2 text-[10px]">
              <div className="font-bold border-b pb-1 text-blue-900">BANCO ASAAS | 033-7</div>
              <div><strong>Pagador:</strong> {activeStudent.name}</div>
              <div><strong>CPF:</strong> {activeStudent.cpf || "123.456.789-00"}</div>
              <div><strong>Valor:</strong> R$ {activeStudent.planValue || 220},00</div>
              <div><strong>Vencimento:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Linha Digitável do Boleto</label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={getBoletoLineDigitavel()}
                  className="bg-slate-950 text-[10px] text-slate-300 p-2 rounded-l flex-1 border border-slate-800 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getBoletoLineDigitavel());
                    setCopiedBoleto(true);
                    setTimeout(() => setCopiedBoleto(false), 2000);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 rounded-r text-[10px] flex items-center gap-1"
                >
                  {copiedBoleto ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBoleto ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSimulatePaymentSuccess("BOLETO")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Simular Compensação do Boleto
            </button>

            <button
              onClick={() => setShowBoletoModal(false)}
              className="w-full bg-slate-800 text-slate-300 py-2 rounded-xl font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL UPDATE CREDIT CARD */}
      {showCardModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative text-xs animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowCardModal(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-400" /> Cartão para Recorrência Asaas
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Nome no Cartão</label>
                <input
                  type="text"
                  placeholder="MARCUS V BUCHECHA"
                  value={cardForm.holder}
                  onChange={(e) => setCardForm({ ...cardForm, holder: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Número do Cartão</label>
                <input
                  type="text"
                  placeholder="4532 •••• •••• 8812"
                  value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Validade</label>
                  <input
                    type="text"
                    placeholder="11/29"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSimulatePaymentSuccess("CREDIT_CARD")}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Salvar & Cobrar Recorrência no Asaas
            </button>
          </div>
        </div>
      )}

      {/* MODAL CONTRATO DIGITAL */}
      {showContractModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative text-xs animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowContractModal(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Termos do Contrato de Matrícula
            </h3>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-300 space-y-2 max-h-48 overflow-y-auto leading-relaxed">
              <p><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ARTES MARCIAIS (JIU-JITSU)</strong></p>
              <p>Pelo presente instrumento, a academia contratada se compromete a prestar aulas de Jiu-Jitsu para o aluno <strong>{activeStudent.name}</strong>, inscrito no CPF sob nº {activeStudent.cpf || "123.456.789-00"}.</p>
              <p>O aluno concorda com o plano {activeStudent.plan || "Mensal"} no valor de R$ {activeStudent.planValue || 220},00 com vencimento recorrente cobrado via plataforma de pagamentos Asaas.</p>
              <p>Assinado digitalmente em {activeStudent.registrationDate || "15/01/2025"}. Status: VÁLIDO E ATIVO.</p>
            </div>

            <button
              onClick={() => setShowContractModal(false)}
              className="w-full bg-slate-800 text-slate-200 py-2 rounded-xl font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL RECIBO DIGITAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative text-xs animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedReceipt(null)} className="absolute top-3 right-3 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" /> Recibo de Quitação Asaas
            </h3>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Aluno:</span>
                <span className="font-bold text-white">{selectedReceipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor Pago:</span>
                <span className="font-mono text-emerald-400 font-bold">R$ {selectedReceipt.amount},00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data:</span>
                <span className="text-slate-300 font-mono">{selectedReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Método:</span>
                <span className="text-slate-300">{selectedReceipt.method}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full bg-slate-800 text-slate-200 py-2 rounded-xl font-semibold"
            >
              Fechar Recibo
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
