"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ===========================================
// TYPES
// ===========================================

interface Message {
  id: string;
  role: "user" | "assistant";
  contenu: string;
  indicateursMentionnes?: number[];
  createdAt: string;
}

interface Conversation {
  id: string;
  titre: string;
  updatedAt: string;
  dernierMessage?: string;
}

interface QuestionCategorie {
  categorie: string;
  questions: string[];
}

// ===========================================
// COMPOSANTS
// ===========================================

function MessageBubble({
  message,
  onCopy,
}: {
  message: Message;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.contenu);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-br from-purple-600 to-blue-600 text-white"
        }`}
      >
        {isUser ? "V" : <Sparkles className="h-4 w-4" />}
      </div>

      {/* Message */}
      <div
        className={`max-w-[80%] ${
          isUser
            ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.contenu}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{message.contenu}</ReactMarkdown>
          </div>
        )}

        {/* Actions pour les messages de l'assistant */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
              title="Copier"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
              title="Utile"
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
              title="Pas utile"
            >
              <ThumbsDown className="h-4 w-4" />
            </button>

            {/* Indicateurs mentionnés */}
            {message.indicateursMentionnes &&
              message.indicateursMentionnes.length > 0 && (
                <div className="ml-auto flex items-center gap-1">
                  {message.indicateursMentionnes.slice(0, 3).map((num) => (
                    <span
                      key={num}
                      className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                    >
                      IND {num}
                    </span>
                  ))}
                  {message.indicateursMentionnes.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{message.indicateursMentionnes.length - 3}
                    </span>
                  )}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestedQuestions({
  categories,
  onSelect,
}: {
  categories: QuestionCategorie[];
  onSelect: (question: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat, index) => (
          <button
            key={cat.categorie}
            onClick={() => setActiveCategory(index)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeCategory === index
                ? "bg-purple-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {cat.categorie}
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="grid gap-2">
        {categories[activeCategory]?.questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelect(question)}
            className="text-left p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {question}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function AgentQualiopiPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionsSuggerees, setQuestionsSuggerees] = useState<
    QuestionCategorie[]
  >([]);

  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/qualiopi/chat");
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setConversations(data.conversations || []);
      setQuestionsSuggerees(data.questionsSuggerees || []);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/qualiopi/chat?conversationId=${conversationId}`
      );
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setCurrentConversationId(conversationId);
      setMessages(data.messages || []);
    } catch (error) {
      toast.error("Erreur lors du chargement de la conversation");
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      contenu: content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/qualiopi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) throw new Error("Erreur d'envoi");
      const data = await response.json();

      // Mettre à jour l'ID de conversation
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
        loadConversations(); // Refresh sidebar
      }

      // Ajouter la réponse de l'assistant
      const assistantMessage: Message = {
        id: `resp-${Date.now()}`,
        role: "assistant",
        contenu: data.message,
        indicateursMentionnes: data.indicateursMentionnes,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
      // Retirer le message utilisateur en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/qualiopi/chat?conversationId=${conversationId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Erreur de suppression");

      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationId)
      );

      if (currentConversationId === conversationId) {
        startNewConversation();
      }

      toast.success("Conversation supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={startNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Nouvelle conversation
            </button>
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conv.id
                    ? "bg-purple-100 dark:bg-purple-900/30"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => loadConversation(conv.id)}
              >
                <MessageSquare className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {conv.titre || "Conversation"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(conv.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>

          {/* Retour */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => router.push("/automate/qualiopi")}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au dashboard
            </button>
          </div>
        </div>
      )}

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Agent IA Qualiopi
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Expert certification Qualiopi
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Comment puis-je vous aider ?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
                Je suis votre assistant expert Qualiopi. Posez-moi vos questions
                sur la certification, les indicateurs ou la préparation à l'audit.
              </p>

              {/* Questions suggérées */}
              <div className="w-full max-w-lg">
                <SuggestedQuestions
                  categories={questionsSuggerees}
                  onSelect={sendMessage}
                />
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCopy={() => toast.success("Copié !")}
                />
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Réflexion en cours...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question sur Qualiopi..."
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={1}
              disabled={sending}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            L'assistant IA peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>
    </div>
  );
}
