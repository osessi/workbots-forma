"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Newspaper,
  Scale,
  Briefcase,
  Lightbulb,
  Accessibility,
  Send,
  Trash2,
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Clock,
  Star,
  StarOff,
  Archive,
  Eye,
  MessageCircle,
  ChevronRight,
  Bot,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type VeilleType = "LEGALE" | "METIER" | "INNOVATION" | "HANDICAP";

interface VeilleArticle {
  id: string;
  type: VeilleType;
  titre: string;
  resume: string | null;
  resumeIA: string | null;
  url: string;
  imageUrl: string | null;
  auteur: string | null;
  datePublication: string;
  tags: string[];
  pointsCles: string[];
  impactQualiopi: string | null;
  source: {
    id: string;
    nom: string;
    logoUrl: string | null;
  };
  lecture: {
    status: "NON_LU" | "LU" | "IMPORTANT" | "ARCHIVE";
    luAt?: string;
    notes?: string;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface VeilleCounts {
  LEGALE: { total: number; nonLus: number };
  METIER: { total: number; nonLus: number };
  INNOVATION: { total: number; nonLus: number };
  HANDICAP: { total: number; nonLus: number };
}

const VEILLE_TYPES: {
  type: VeilleType;
  label: string;
  icon: React.ReactNode;
  color: string;
  indicateur: string;
  description: string;
}[] = [
  {
    type: "LEGALE",
    label: "Légale & Réglementaire",
    icon: <Scale size={20} />,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    indicateur: "IND 23",
    description: "Évolutions législatives, France Compétences, Ministère du Travail",
  },
  {
    type: "METIER",
    label: "Métiers & Compétences",
    icon: <Briefcase size={20} />,
    color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    indicateur: "IND 24",
    description: "OPCO, branches professionnelles, France Travail",
  },
  {
    type: "INNOVATION",
    label: "Innovation Pédagogique",
    icon: <Lightbulb size={20} />,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    indicateur: "IND 24",
    description: "EdTech, nouvelles méthodes, outils pédagogiques",
  },
  {
    type: "HANDICAP",
    label: "Handicap & Accessibilité",
    icon: <Accessibility size={20} />,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    indicateur: "IND 25",
    description: "AGEFIPH, FIPHFP, bonnes pratiques d'accessibilité",
  },
];

export default function VeillePage() {
  // State
  const [activeTab, setActiveTab] = useState<VeilleType>("LEGALE");
  const [viewMode, setViewMode] = useState<"articles" | "chat">("articles");
  const [articles, setArticles] = useState<VeilleArticle[]>([]);
  const [counts, setCounts] = useState<VeilleCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<VeilleArticle | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/outils/veille?type=${activeTab}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setCounts(data.counts || null);
      }
    } catch (error) {
      console.error("Erreur fetch articles:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Refresh sources
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetch("/api/outils/veille/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, forceRefresh: true }),
      });
      await fetchArticles();
    } catch (error) {
      console.error("Erreur refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Mark article status
  const markArticle = async (articleId: string, status: string) => {
    try {
      await fetch("/api/outils/veille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, status }),
      });
      fetchArticles();
    } catch (error) {
      console.error("Erreur mark article:", error);
    }
  };

  // Chat functions
  const sendChatMessage = async (messageText: string) => {
    if (!messageText.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/outils/veille/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          type: activeTab,
          conversationId,
        }),
      });

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message || "Une erreur s'est produite.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur chat:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendChatMessage(chatInput);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage(chatInput);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const activeType = VEILLE_TYPES.find((t) => t.type === activeTab)!;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Veille Réglementaire
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Qualiopi IND 23, 24, 25 - Restez informé des actualités
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
        {VEILLE_TYPES.map((vt) => {
          const count = counts?.[vt.type];
          return (
            <button
              key={vt.type}
              onClick={() => {
                setActiveTab(vt.type);
                setMessages([]);
                setConversationId(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === vt.type
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span className={`p-1.5 rounded-lg ${vt.color}`}>{vt.icon}</span>
              <span className="hidden sm:inline">{vt.label}</span>
              {count && count.nonLus > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {count.nonLus}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-header avec indicateur et toggle */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${activeType.color}`}>
            {activeType.indicateur}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {activeType.description}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("articles")}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === "articles"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <Newspaper size={14} />
            Articles
          </button>
          <button
            onClick={() => setViewMode("chat")}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === "chat"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <MessageCircle size={14} />
            Assistant IA
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "articles" ? (
          /* Articles View */
          <div className="flex h-full">
            {/* Liste des articles */}
            <div className={`${selectedArticle ? "w-1/2 border-r dark:border-gray-700" : "w-full"} overflow-y-auto p-4`}>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun article pour cette catégorie
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    Actualiser les sources
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedArticle?.id === article.id
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                          : article.lecture.status === "NON_LU"
                          ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {article.source.nom}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              {formatDate(article.datePublication)}
                            </span>
                            {article.lecture.status === "IMPORTANT" && (
                              <Star size={14} className="text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <h3
                            className={`font-medium mb-1 line-clamp-2 ${
                              article.lecture.status === "NON_LU"
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {article.titre}
                          </h3>
                          {article.resumeIA && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                              {article.resumeIA}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Détail de l'article */}
            {selectedArticle && (
              <div className="w-1/2 overflow-y-auto p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${activeType.color}`}>
                      {selectedArticle.source.nom}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(selectedArticle.datePublication)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        markArticle(
                          selectedArticle.id,
                          selectedArticle.lecture.status === "IMPORTANT" ? "LU" : "IMPORTANT"
                        )
                      }
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={selectedArticle.lecture.status === "IMPORTANT" ? "Retirer des favoris" : "Marquer comme important"}
                    >
                      {selectedArticle.lecture.status === "IMPORTANT" ? (
                        <Star size={18} className="text-amber-500 fill-amber-500" />
                      ) : (
                        <StarOff size={18} className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => markArticle(selectedArticle.id, "ARCHIVE")}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Archiver"
                    >
                      <Archive size={18} className="text-gray-400" />
                    </button>
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markArticle(selectedArticle.id, "LU")}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Voir l'article original"
                    >
                      <ExternalLink size={18} className="text-gray-400" />
                    </a>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedArticle.titre}
                </h2>

                {selectedArticle.resumeIA && (
                  <div className="mb-6 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-brand-500" />
                      <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                        Résumé IA
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedArticle.resumeIA}
                    </p>
                  </div>
                )}

                {selectedArticle.pointsCles.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Points clés
                    </h3>
                    <ul className="space-y-1">
                      {selectedArticle.pointsCles.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="text-brand-500 mt-0.5">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedArticle.impactQualiopi && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye size={16} className="text-amber-600" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        Impact Qualiopi
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedArticle.impactQualiopi}
                    </p>
                  </div>
                )}

                {selectedArticle.resume && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Extrait
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedArticle.resume}
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t dark:border-gray-700">
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markArticle(selectedArticle.id, "LU")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    Lire l&apos;article complet
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Chat View */
          <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 ? (
                <div className="max-w-3xl mx-auto">
                  {/* Welcome */}
                  <div className="text-center py-8">
                    <div className={`inline-flex p-4 rounded-2xl mb-4 ${activeType.color}`}>
                      <Bot className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Assistant Veille {activeType.label}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                      Posez-moi vos questions sur les actualités de veille {activeType.label.toLowerCase()}.
                      J&apos;ai accès aux derniers articles pour vous aider.
                    </p>
                  </div>

                  {/* Suggested questions */}
                  <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
                    {activeTab === "LEGALE" && (
                      <>
                        <button onClick={() => sendChatMessage("Quels sont les derniers décrets sur la formation professionnelle ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Derniers décrets sur la formation professionnelle ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles sont les nouveautés de France Compétences ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Nouveautés France Compétences ?</p>
                        </button>
                      </>
                    )}
                    {activeTab === "METIER" && (
                      <>
                        <button onClick={() => sendChatMessage("Quelles sont les tendances métiers actuelles ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Tendances métiers actuelles ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles nouvelles compétences sont demandées sur le marché ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Nouvelles compétences demandées ?</p>
                        </button>
                      </>
                    )}
                    {activeTab === "INNOVATION" && (
                      <>
                        <button onClick={() => sendChatMessage("Quelles sont les innovations EdTech récentes ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Innovations EdTech récentes ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Comment intégrer l'IA dans mes formations ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Intégrer l&apos;IA dans mes formations ?</p>
                        </button>
                      </>
                    )}
                    {activeTab === "HANDICAP" && (
                      <>
                        <button onClick={() => sendChatMessage("Quelles sont les obligations d'accessibilité pour les OF ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Obligations d&apos;accessibilité pour les OF ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Comment obtenir des aides AGEFIPH ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Aides AGEFIPH disponibles ?</p>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] ${
                          message.role === "user"
                            ? "bg-brand-500 text-white rounded-2xl rounded-tr-md px-4 py-3"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-md px-4 py-3"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="relative group">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                  li: ({ children }) => <li className="text-sm">{children}</li>,
                                  strong: ({ children }) => <strong className="font-semibold text-brand-600 dark:text-brand-400">{children}</strong>,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                            <button
                              onClick={() => copyMessage(message.content, message.id)}
                              className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-700 rounded-lg shadow border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copier"
                            >
                              {copiedId === message.id ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <Copy size={14} className="text-gray-400" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-sm">Réflexion en cours...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
              <form onSubmit={handleChatSubmit} className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    {articles.length} articles disponibles pour ce thème
                  </span>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={clearChat}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                      Effacer
                    </button>
                  )}
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      placeholder={`Posez votre question sur la veille ${activeType.label.toLowerCase()}...`}
                      rows={1}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                      style={{ minHeight: "48px", maxHeight: "120px" }}
                      disabled={chatLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="p-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {chatLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
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
