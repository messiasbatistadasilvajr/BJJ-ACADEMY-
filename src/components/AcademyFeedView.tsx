import React, { useState } from "react";
import { Academy, AcademyPost, PostCategory, Student } from "../types";
import { 
  Trophy, Megaphone, Calendar, MapPin, DollarSign, ExternalLink, 
  Upload, Image as ImageIcon, Plus, CheckCircle, Share2, Eye, Users, 
  Trash2, Pin, Sparkles, Filter, Search, Download, X, AlertCircle, 
  MessageCircle, Send, Flame, Award, ChevronRight, Check
} from "lucide-react";

interface AcademyFeedViewProps {
  posts: AcademyPost[];
  academies: Academy[];
  students: Student[];
  currentAcademyId: string;
  onAddPost: (post: Omit<AcademyPost, "id" | "createdAt" | "interestedStudentIds" | "viewsCount">) => void;
  onDeletePost: (postId: string) => void;
  onTogglePin: (postId: string) => void;
  onToggleInterest?: (postId: string, studentId: string) => void;
}

export default function AcademyFeedView({
  posts,
  academies,
  students,
  currentAcademyId,
  onAddPost,
  onDeletePost,
  onTogglePin,
  onToggleInterest
}: AcademyFeedViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlyerModal, setSelectedFlyerModal] = useState<AcademyPost | null>(null);
  const [showInterestModal, setShowInterestModal] = useState<AcademyPost | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preset high-res flyer posters for quick 1-click selection
  const presetFlyers = [
    {
      name: "🏆 Campeonato Oficial Gi & No-Gi",
      url: "/src/assets/images/bjj_championship_flyer_1787353673856.jpg",
      category: "Campeonato" as PostCategory,
      title: "Copa Layout Jiu-Jitsu & Open BJJ 2026"
    },
    {
      name: "🥋 Seminário Técnico Internacional",
      url: "/src/assets/images/bjj_seminar_flyer_1787353688432.jpg",
      category: "Seminário" as PostCategory,
      title: "Seminário de Passagem & Guarda Moderna"
    },
    {
      name: "🔥 Treino Geral de Equipe & Graduação",
      url: "/src/assets/images/bjj_action_hero_1786063098183.jpg",
      category: "Graduação" as PostCategory,
      title: "Grande Treinão de Graduação & Confraternização"
    }
  ];

  // New Post Form State
  const [formData, setFormData] = useState({
    academyId: currentAcademyId === "super" ? (academies[0]?.id || "ac-4") : currentAcademyId,
    title: "",
    category: "Campeonato" as PostCategory,
    description: "",
    flyerImageUrl: "/src/assets/images/bjj_championship_flyer_1787353673856.jpg",
    eventDate: "2026-10-25",
    eventTime: "09:00",
    location: "Ginásio Municipal / Tatame Central",
    registrationFee: 120,
    registrationDeadline: "2026-10-20",
    externalRegistrationUrl: "https://soucompetidor.com.br/evento/layout-bjj-2026",
    targetAudience: "Todos os Alunos" as "Todos os Alunos" | "Equipe de Competição" | "Kids / Infantil" | "Adultos",
    pinned: true,
    notifyWhatsApp: true
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Image Upload handler (File Reader to base64 or URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, flyerImageUrl: reader.result as string }));
        showToast("Panfleto carregado com sucesso!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNewPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Por favor, preencha o título e a descrição da publicação.");
      return;
    }

    const academy = academies.find(a => a.id === formData.academyId) || academies[0];

    onAddPost({
      academyId: formData.academyId,
      academyName: academy?.name || "Layout Jiu-Jitsu",
      authorName: academy?.name.includes("Layout") ? "Prof. Roberto Mendes" : "Mestre da Academia",
      authorRole: "Professor",
      title: formData.title,
      category: formData.category,
      description: formData.description,
      flyerImageUrl: formData.flyerImageUrl,
      eventDate: formData.eventDate,
      eventTime: formData.eventTime,
      location: formData.location,
      registrationFee: Number(formData.registrationFee) || 0,
      registrationDeadline: formData.registrationDeadline,
      externalRegistrationUrl: formData.externalRegistrationUrl,
      targetAudience: formData.targetAudience,
      pinned: formData.pinned
    });

    setShowCreateModal(false);
    showToast(`🎉 Panfleto publicado com sucesso para os alunos da ${academy?.name || "academia"}!`);
    
    // Reset form
    setFormData(prev => ({
      ...prev,
      title: "",
      description: ""
    }));
  };

  const handleShareWhatsApp = (post: AcademyPost) => {
    const text = `🥋 *${post.title}*\n\n📅 Data: ${post.eventDate || "A confirmar"} às ${post.eventTime || "Horário a definir"}\n📍 Local: ${post.location || "Tatame da Academia"}\n💰 Inscrição: ${post.registrationFee ? `R$ ${post.registrationFee.toFixed(2)}` : "Gratuita"}\n\n${post.description}\n\n📲 *Confirme sua presença no App do Aluno BJJ Academy!*${post.externalRegistrationUrl ? `\n🔗 Inscrição oficial: ${post.externalRegistrationUrl}` : ""}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "TODOS" || post.category.toUpperCase() === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.academyName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeAcademy = academies.find(a => a.id === currentAcademyId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-400/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/80 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-mono font-bold">
              <Megaphone className="w-3.5 h-3.5 text-blue-400" />
              Mural da Academia & Panfletos de Campeonatos
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-display tracking-tight">
              Mural de Avisos & Torneios da Unidade
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Publique panfletos de campeonatos, seminários técnicos, exames de graduação e comunicados oficiais. Seus alunos visualizam os cartazes no celular em tempo real com opção de confirmar participação.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Postar Panfleto / Campeonato
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono block">Publicações Ativas</span>
            <span className="text-xl font-bold text-white font-display">{posts.length} Eventos</span>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono block">Panfletos de Campeonatos</span>
            <span className="text-xl font-bold text-amber-400 font-display">
              {posts.filter(p => p.category === "Campeonato").length} Campeonatos
            </span>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono block">Alunos com Interesse</span>
            <span className="text-xl font-bold text-emerald-400 font-display">
              {posts.reduce((acc, p) => acc + (p.interestedStudentIds?.length || 0), 0)} Atletas
            </span>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono block">Visualizações no App</span>
            <span className="text-xl font-bold text-indigo-400 font-display">
              {posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0)} Views
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          {[
            { id: "TODOS", label: "Todos os Posts" },
            { id: "CAMPEONATO", label: "🏆 Campeonatos" },
            { id: "SEMINÁRIO", label: "🥋 Seminários" },
            { id: "GRADUAÇÃO", label: "🎓 Graduações" },
            { id: "AVISO GERAL", label: "📢 Comunicados" },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar evento, torneio ou comunicado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Posts Cards Grid */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-blue-400 mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white font-display">Nenhuma publicação encontrada</h3>
            <p className="text-xs text-slate-400">
              O professor da unidade ainda não publicou panfletos ou avisos nesta categoria. Clique no botão acima para adicionar!
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
          >
            Postar Primeiro Panfleto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => {
            const interestedStudents = students.filter(s => post.interestedStudentIds?.includes(s.id));

            return (
              <div
                key={post.id}
                className={`group bg-slate-900/80 rounded-3xl border transition-all duration-300 hover:shadow-2xl flex flex-col overflow-hidden ${
                  post.pinned 
                    ? "border-amber-500/50 shadow-lg shadow-amber-500/5 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/10" 
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Flyer Poster Preview Header */}
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setSelectedFlyerModal(post)}>
                  {post.flyerImageUrl ? (
                    <img
                      src={post.flyerImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2 bg-gradient-to-tr from-slate-950 to-slate-900">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-xs font-mono">Panfleto da Academia</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider backdrop-blur-md border font-mono ${
                      post.category === "Campeonato"
                        ? "bg-amber-500/90 text-slate-950 border-amber-400/50"
                        : post.category === "Seminário"
                        ? "bg-purple-500/90 text-white border-purple-400/50"
                        : post.category === "Graduação"
                        ? "bg-emerald-500/90 text-white border-emerald-400/50"
                        : "bg-blue-500/90 text-white border-blue-400/50"
                    }`}>
                      {post.category}
                    </span>

                    {post.pinned && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 backdrop-blur-md flex items-center gap-1 font-mono">
                        <Pin className="w-3 h-3 fill-amber-400" /> Fixado
                      </span>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(post.id);
                      }}
                      title={post.pinned ? "Desafixar do topo" : "Fixar no topo do app"}
                      className="w-8 h-8 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-amber-400 flex items-center justify-center backdrop-blur-md transition-colors"
                    >
                      <Pin className={`w-3.5 h-3.5 ${post.pinned ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja remover a publicação "${post.title}"?`)) {
                          onDeletePost(post.id);
                        }
                      }}
                      title="Excluir publicação"
                      className="w-8 h-8 rounded-xl bg-slate-950/80 hover:bg-red-950/80 border border-slate-700/80 text-slate-300 hover:text-red-400 flex items-center justify-center backdrop-blur-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price Tag if applicable */}
                  {post.registrationFee !== undefined && post.registrationFee > 0 && (
                    <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-xl text-xs font-mono font-bold backdrop-blur-md flex items-center gap-1">
                      <span>R$ {post.registrationFee.toFixed(2)}</span>
                    </div>
                  )}
                  {post.registrationFee === 0 && (
                    <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-blue-500/40 text-blue-400 px-3 py-1 rounded-xl text-xs font-mono font-bold backdrop-blur-md">
                      Gratuito / Incluso
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Academy and Author Info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-blue-400 flex items-center gap-1">
                        🥋 {post.academyName}
                      </span>
                      <span className="font-mono text-slate-500">
                        {post.authorName} ({post.authorRole})
                      </span>
                    </div>

                    {/* Title */}
                    <h3 
                      onClick={() => setSelectedFlyerModal(post)}
                      className="text-base font-bold text-white font-display hover:text-blue-400 cursor-pointer transition-colors line-clamp-2"
                    >
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>
                  </div>

                  {/* Event Details Grid */}
                  <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 space-y-2 text-xs text-slate-300 font-mono">
                    {post.eventDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">
                          {new Date(post.eventDate).toLocaleDateString('pt-BR')} {post.eventTime ? `às ${post.eventTime}` : ""}
                        </span>
                      </div>
                    )}

                    {post.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{post.location}</span>
                      </div>
                    )}

                    {post.registrationDeadline && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>Inscrições até: {new Date(post.registrationDeadline).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>

                  {/* Interested Students Mini Section */}
                  <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                    <button
                      onClick={() => setShowInterestModal(post)}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      <div className="flex -space-x-2">
                        {interestedStudents.slice(0, 3).map((st, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                          >
                            {st.name.substring(0, 2).toUpperCase()}
                          </div>
                        ))}
                        {interestedStudents.length === 0 && (
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                            <Users className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-bold font-mono">
                        {interestedStudents.length} Alunos Confirmaram
                      </span>
                    </button>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <Eye className="w-3 h-3" />
                      <span>{post.viewsCount || 0}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setSelectedFlyerModal(post)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      Ver Panfleto
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(post)}
                      className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Publicar Panfleto / Campeonato no Mural
                  </h3>
                  <p className="text-xs text-slate-400">
                    O cartaz aparecerá diretamente no app de todos os alunos da sua academia.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPost} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Academy Selector (Multi-tenant) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Academia / Unidade Emissora:</span>
                </label>
                <select
                  value={formData.academyId}
                  onChange={(e) => setFormData({ ...formData, academyId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {academies.map(ac => (
                    <option key={ac.id} value={ac.id}>
                      {ac.name} ({ac.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-300">Categoria:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as PostCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Campeonato">🏆 Campeonato & Torneio</option>
                    <option value="Seminário">🥋 Seminário Técnico</option>
                    <option value="Graduação">🎓 Exame de Graduação</option>
                    <option value="Aviso Geral">📢 Comunicado Geral</option>
                    <option value="Promoção">🏷️ Promoção / Kimonos</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Título do Evento / Panfleto:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 🏆 Copa Layout Jiu-Jitsu 2026 - Gi & No-Gi"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Descrição & Detalhes do Evento:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva as regras, premiação em dinheiro ou medalhas, cronograma das lutas, divisões de peso e requisitos..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
                />
              </div>

              {/* Flyer Selection / Upload */}
              <div className="space-y-3 p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    Panfleto / Imagem do Cartaz Oficial:
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Upload próprio ou modelos rápidos</span>
                </div>

                {/* Upload from Computer Button */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <label className="w-full sm:w-auto px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Enviar Arquivo do Computador (JPG/PNG)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <span className="text-xs text-slate-500">ou escolha um modelo abaixo:</span>
                </div>

                {/* Preset Flyers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {presetFlyers.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        flyerImageUrl: preset.url,
                        category: preset.category,
                        title: prev.title ? prev.title : preset.title
                      }))}
                      className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
                        formData.flyerImageUrl === preset.url
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-md"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <img src={preset.url} alt="Preset" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="text-[11px] truncate font-medium">{preset.name}</div>
                    </div>
                  ))}
                </div>

                {/* Current Flyer Preview */}
                {formData.flyerImageUrl && (
                  <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-slate-700 mt-2">
                    <img src={formData.flyerImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-slate-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
                      Panfleto Selecionado
                    </div>
                  </div>
                )}
              </div>

              {/* Event Date, Time, Location & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" /> Data do Evento:
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Horário:</label>
                  <input
                    type="text"
                    placeholder="Ex: 09:00 às 18:00"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Local / Endereço:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ginásio Ibirapuera ou Tatame Central"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor da Inscrição (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0 para Gratuito"
                    value={formData.registrationFee}
                    onChange={(e) => setFormData({ ...formData, registrationFee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Registration Link & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Link Externo de Inscrições:</label>
                  <input
                    type="url"
                    placeholder="https://soucompetidor.com.br/..."
                    value={formData.externalRegistrationUrl}
                    onChange={(e) => setFormData({ ...formData, externalRegistrationUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Prazo Limite de Inscrição:</label>
                  <input
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Pin & Target Options */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                  />
                  <span>📌 Fixar como destaque no topo do App do Aluno</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifyWhatsApp}
                    onChange={(e) => setFormData({ ...formData, notifyWhatsApp: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                  />
                  <span>📲 Notificar todos os alunos via WhatsApp & Push</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publicar no Feed da Academia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLYER HIGH-RES ZOOM MODAL */}
      {selectedFlyerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {selectedFlyerModal.category}
                </span>
                <span className="text-sm font-bold text-white truncate max-w-md">
                  {selectedFlyerModal.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedFlyerModal(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Poster Image */}
            <div className="relative bg-slate-950 max-h-[60vh] flex items-center justify-center overflow-hidden">
              <img
                src={selectedFlyerModal.flyerImageUrl || "/src/assets/images/bjj_championship_flyer_1787353673856.jpg"}
                alt={selectedFlyerModal.title}
                className="max-h-[60vh] w-auto object-contain shadow-2xl"
              />
            </div>

            {/* Details & Actions */}
            <div className="p-6 space-y-4 bg-slate-900">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white font-display">
                  {selectedFlyerModal.title}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedFlyerModal.description}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">Data</span>
                  <strong className="text-white">{selectedFlyerModal.eventDate || "A definir"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Local</span>
                  <strong className="text-white truncate block">{selectedFlyerModal.location || "Tatame"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Inscrição</span>
                  <strong className="text-emerald-400">
                    {selectedFlyerModal.registrationFee ? `R$ ${selectedFlyerModal.registrationFee.toFixed(2)}` : "Gratuito"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Confirmados</span>
                  <strong className="text-blue-400">{selectedFlyerModal.interestedStudentIds?.length || 0} Atletas</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => handleShareWhatsApp(selectedFlyerModal)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Divulgar no WhatsApp da Academia
                </button>

                {selectedFlyerModal.externalRegistrationUrl && (
                  <a
                    href={selectedFlyerModal.externalRegistrationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Página Oficial de Inscrição
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMED / INTERESTED STUDENTS MODAL */}
      {showInterestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    Atletas Confirmados no Evento
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-xs">
                    {showInterestModal.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInterestModal(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
              {students
                .filter(s => showInterestModal.interestedStudentIds?.includes(s.id))
                .map(st => (
                  <div key={st.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {st.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong className="text-xs text-white block">{st.name}</strong>
                        <span className="text-[10px] text-blue-400 font-mono">
                          Faixa {st.belt} ({st.stripes}º Grau)
                        </span>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${st.phone.replace(/\D/g, '')}?text=Olá ${st.name}, tudo bem? Vi que você confirmou interesse no evento ${showInterestModal.title}!`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition-colors"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                ))}

              {students.filter(s => showInterestModal.interestedStudentIds?.includes(s.id)).length === 0 && (
                <p className="text-center text-xs text-slate-500 py-6">
                  Nenhum aluno confirmou interesse ainda. Compartilhe o panfleto no grupo do WhatsApp para engajar a equipe!
                </p>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setShowInterestModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
