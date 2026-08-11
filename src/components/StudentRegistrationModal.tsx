import React, { useState, useEffect } from "react";
import { Student, Academy, BeltColor, SubscriptionPlan, PaymentBillingType } from "../types";
import { UserPlus, X, Check, ShieldCheck, HeartHandshake, Sparkles, Building2, CreditCard, Award, Calendar } from "lucide-react";

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  academies: Academy[];
  selectedAcademyId?: string;
  onAddStudent: (studentData: Omit<Student, "id">) => void;
}

export default function StudentRegistrationModal({
  isOpen,
  onClose,
  academies,
  selectedAcademyId,
  onAddStudent
}: StudentRegistrationModalProps) {
  if (!isOpen) return null;

  const defaultAcademy = selectedAcademyId && selectedAcademyId !== "super" 
    ? selectedAcademyId 
    : (academies[0]?.id || "ac-1");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("2012-05-10");
  const [category, setCategory] = useState<"Adulto" | "Kids / Infantil">("Kids / Infantil");
  
  // Guardian details if kids
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianNotes, setGuardianNotes] = useState("Demonstra grande disciplina e entusiasmo nas aulas!");

  // Academy & Jiu-Jitsu Rank
  const [targetAcademyId, setTargetAcademyId] = useState(defaultAcademy);

  useEffect(() => {
    if (selectedAcademyId && selectedAcademyId !== "super") {
      setTargetAcademyId(selectedAcademyId);
    }
  }, [selectedAcademyId]);
  const [belt, setBelt] = useState<BeltColor>("White");
  const [stripes, setStripes] = useState(1);

  // Financial & Subscription
  const [plan, setPlan] = useState<SubscriptionPlan>("Mensal");
  const [planValue, setPlanValue] = useState(250);
  const [billingType, setBillingType] = useState<PaymentBillingType>("PIX");

  const [toastSuccess, setToastSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddStudent({
      academyId: targetAcademyId,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@bjjacademy.com`,
      phone: phone || "(85) 99888-7766",
      cpf: cpf || "123.456.789-00",
      birthDate,
      category,
      guardianName: category === "Kids / Infantil" ? guardianName : undefined,
      guardianPhone: category === "Kids / Infantil" ? (guardianPhone || phone) : undefined,
      guardianNotes: category === "Kids / Infantil" ? guardianNotes : undefined,
      belt,
      stripes: Number(stripes),
      plan,
      planValue: Number(planValue),
      billingType,
      attendance30Days: 12,
      daysSinceLastClass: 0,
      status: "Active",
      paymentStatus: "Paid",
      registrationDate: new Date().toISOString().split("T")[0],
      loyaltyPoints: 150,
      loyaltyTier: "Bronze",
      badges: category === "Kids / Infantil" ? ["Primeiro Kimono", "Super Disciplina", "Espírito de Equipe"] : ["Primeiro Armlock", "Guerreiro do Tatame"]
    });

    setToastSuccess(true);
    setTimeout(() => {
      setToastSuccess(false);
      onClose();
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setCpf("");
      setGuardianName("");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-blue-500/50 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/30">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Matrícula & Cadastro de Novo Aluno</h2>
              <p className="text-xs text-slate-400">Cadastre atletas adultos e infantis diretamente no sistema da academia.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {toastSuccess ? (
          <div className="py-12 text-center space-y-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl animate-bounce">
              ✓
            </div>
            <h3 className="text-lg font-bold text-emerald-300">Aluno Cadastrado com Sucesso!</h3>
            <p className="text-xs text-slate-300">A ficha foi salva, a mensalidade foi gerada e o acesso do aluno foi liberado.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Category selection & Target Academy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" /> Academia Contratante / Unidade *
                </label>
                <select
                  value={targetAcademyId}
                  onChange={(e) => setTargetAcademyId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-blue-300 font-bold focus:outline-none focus:border-blue-500"
                >
                  {academies.map(a => (
                    <option key={a.id} value={a.id}>🏢 {a.name} ({a.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" /> Categoria do Atleta *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("Kids / Infantil");
                      setBelt("White");
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      category === "Kids / Infantil" 
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md" 
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    👦 Kids / Infantil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("Adulto");
                      setBelt("White");
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      category === "Adulto" 
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-md" 
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    🥋 Adulto
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Dados Pessoais do Atleta</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo do Aluno *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={category === "Kids / Infantil" ? "Ex: Miguel Silva (Kids)" : "Ex: Gabriel Medeiros"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Telefone de Contato *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(85) 98174-2686"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CPF do Aluno ou Responsável</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.111.222-33"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* If Kids / Infantil: Guardian Section */}
            {category === "Kids / Infantil" && (
              <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Acesso dos Pais & Responsáveis</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Pai / Mãe ou Responsável</label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="Ex: Carlos Silva (Pai)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp do Responsável</label>
                    <input
                      type="text"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="Ex: (85) 98174-2686"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Anotações Iniciais do Professor para os Pais</label>
                  <input
                    type="text"
                    value={guardianNotes}
                    onChange={(e) => setGuardianNotes(e.target.value)}
                    placeholder="Ex: Excelente coordenação e respeito com os colegas no tatame."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Belt Rank & Subscription */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Graduação de Faixa Inicial</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Faixa</label>
                    <select
                      value={belt}
                      onChange={(e) => setBelt(e.target.value as BeltColor)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    >
                      <option value="White">Faixa Branca</option>
                      {category === "Kids / Infantil" && (
                        <>
                          <option value="Grey">Faixa Cinza (Kids)</option>
                          <option value="Yellow">Faixa Amarela (Kids)</option>
                          <option value="Orange">Faixa Laranja (Kids)</option>
                          <option value="Green">Faixa Verde (Kids)</option>
                        </>
                      )}
                      <option value="Blue">Faixa Azul</option>
                      <option value="Purple">Faixa Roxa</option>
                      <option value="Brown">Faixa Marrom</option>
                      <option value="Black">Faixa Preta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Graus (0 a 4)</label>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      value={stripes}
                      onChange={(e) => setStripes(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Plano de Mensalidade</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Periodicidade</label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    >
                      <option value="Mensal">Plano Mensal</option>
                      <option value="Trimestral">Plano Trimestral</option>
                      <option value="Semestral">Plano Semestral</option>
                      <option value="Anual">Plano Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Valor Mensal (R$)</label>
                    <input
                      type="number"
                      value={planValue}
                      onChange={(e) => setPlanValue(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Concluir Matrícula do Aluno
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
