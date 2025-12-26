"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  FileText,
  HelpCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  {
    icon: <BookOpen size={16} />,
    question: "Quels sont les 7 critères du RNQ Qualiopi ?",
    category: "Bases",
  },
  {
    icon: <CheckCircle size={16} />,
    question: "Quelles preuves fournir pour l'indicateur 1 ?",
    category: "Indicateurs",
  },
  {
    icon: <AlertTriangle size={16} />,
    question: "Quelles sont les non-conformités les plus fréquentes ?",
    category: "Audit",
  },
  {
    icon: <FileText size={16} />,
    question: "Comment gérer les réclamations pour Qualiopi ?",
    category: "Processus",
  },
  {
    icon: <HelpCircle size={16} />,
    question: "Différence entre audit initial et surveillance ?",
    category: "Audit",
  },
  {
    icon: <Sparkles size={16} />,
    question: "Comment préparer mon premier audit Qualiopi ?",
    category: "Préparation",
  },
];

export default function AgentQualiopiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent-qualiopi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "Une erreur s'est produite.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Agent Qualiopi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Assistant IA pour la certification Qualiopi
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Effacer
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto">
            {/* Welcome */}
            <div className="text-center py-8">
              <div className="inline-flex p-4 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Bienvenue sur l&apos;Agent Qualiopi
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                Je suis votre assistant expert en certification Qualiopi. Posez-moi
                vos questions sur le RNQ, les indicateurs, ou la préparation de
                votre audit.
              </p>
            </div>

            {/* Suggested Questions */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SUGGESTED_QUESTIONS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(item.question)}
                  className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all text-left group"
                >
                  <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg text-brand-500 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-xs text-brand-500 font-medium">
                      {item.category}
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                      {item.question}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
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
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-bold mt-3 mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-bold mt-2 mb-1">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 mb-2 space-y-1">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-4 mb-2 space-y-1">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm">{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-brand-600 dark:text-brand-400">
                                {children}
                              </strong>
                            ),
                            code: ({ children }) => (
                              <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
                                {children}
                              </code>
                            ),
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
            {loading && (
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

      {/* Input Area */}
      <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question sur Qualiopi..."
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                style={{ minHeight: "48px", maxHeight: "120px" }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            L&apos;agent peut faire des erreurs. Vérifiez toujours les
            informations importantes.
          </p>
        </form>
      </div>
    </div>
  );
}
