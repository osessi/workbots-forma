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
  Eye,
  MessageCircle,
  ChevronRight,
  Bot,
  BookmarkCheck,
  StickyNote,
  X,
  Save,
  ClipboardList,
  Plus,
  Calendar,
  Search,
  Filter,
  FileText,
  Upload,
  Pencil,
  CheckCircle2,
  AlertCircle,
  User,
  Link2,
  Pin,
  PinOff,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type VeilleType = "LEGALE" | "METIER" | "INNOVATION" | "HANDICAP";
type TabType = VeilleType | "FAVORIS" | "EXPLOITATION";
type ActionStatut = "A_TRAITER" | "EN_COURS" | "CLOTUREE";

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
  FAVORIS?: { total: number; nonLus: number };
  EXPLOITATION?: { total: number; nonLus: number };
}

// Corrections 402-407: Types pour l'exploitation de la veille
interface VeilleActionPreuve {
  id: string;
  nom: string;
  url: string;
  type: string;
  taille: number;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string | null;
    email: string;
  };
}

interface VeilleAction {
  id: string;
  articleTitre: string;
  articleUrl: string;
  articleSource: string;
  typeVeille: VeilleType;
  analyse: string | null;
  actionAMettreEnPlace: string | null;
  personnesConcernees: string | null;
  statut: ActionStatut;
  dateCreation: string;
  dateCloture: string | null;
  createdAt: string;
  preuves: VeilleActionPreuve[];
  createdBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface ActionCounts {
  total: number;
  A_TRAITER: number;
  EN_COURS: number;
  CLOTUREE: number;
}

// Correction 409: Interface pour l'historique des conversations
interface VeilleConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface VeilleConversation {
  id: string;
  type: VeilleType;
  titre: string | null;
  isPinned: boolean;
  messages: VeilleConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

// Labels pour les statuts d'action
const ACTION_STATUT_CONFIG: Record<ActionStatut, { label: string; color: string; icon: React.ReactNode }> = {
  A_TRAITER: { label: "À traiter", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: <AlertCircle size={14} /> },
  EN_COURS: { label: "En cours", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Clock size={14} /> },
  CLOTUREE: { label: "Clôturée", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 size={14} /> },
};

// Labels pour les types de veille
const VEILLE_TYPE_LABELS: Record<VeilleType, string> = {
  LEGALE: "Légal & réglementaire",
  METIER: "Métiers & compétences",
  INNOVATION: "Innovation pédagogique",
  HANDICAP: "Handicap & accessibilité",
};

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
    // Correction 415: Description reformulée
    description: "Suivez les évolutions légales et réglementaires qui impactent les organismes de formation.",
  },
  {
    type: "METIER",
    label: "Métiers & Compétences",
    icon: <Briefcase size={20} />,
    color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    indicateur: "IND 24",
    // Correction 416: Description reformulée
    description: "Suivez les évolutions des métiers et des compétences qui influencent les besoins en formation.",
  },
  {
    type: "INNOVATION",
    label: "Innovation Pédagogique",
    icon: <Lightbulb size={20} />,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    indicateur: "IND 24",
    // Correction 417: Description reformulée
    description: "Suivez les innovations pédagogiques qui transforment les pratiques de formation.",
  },
  {
    type: "HANDICAP",
    label: "Handicap & Accessibilité",
    icon: <Accessibility size={20} />,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    indicateur: "IND 25",
    // Correction 418: Description reformulée
    description: "Suivez les actualités sur le handicap et l'accessibilité pour adapter vos formations et vos parcours.",
  },
];

export default function VeillePage() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>("LEGALE");
  const [viewMode, setViewMode] = useState<"articles" | "chat">("articles");
  const [articles, setArticles] = useState<VeilleArticle[]>([]);
  const [favoriteArticles, setFavoriteArticles] = useState<VeilleArticle[]>([]);
  const [counts, setCounts] = useState<VeilleCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<VeilleArticle | null>(null);

  // Notes modal state
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Corrections 402-407: États pour l'exploitation de la veille
  const [veilleActions, setVeilleActions] = useState<VeilleAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionCounts, setActionCounts] = useState<ActionCounts | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<VeilleAction | null>(null);
  const [savingAction, setSavingAction] = useState(false);
  const [actionFilters, setActionFilters] = useState({
    search: "",
    type: "" as VeilleType | "",
    statut: "" as ActionStatut | "",
    personne: "",
  });
  // Formulaire action
  const [actionForm, setActionForm] = useState({
    articleTitre: "",
    articleUrl: "",
    articleSource: "",
    typeVeille: "LEGALE" as VeilleType,
    analyse: "",
    actionAMettreEnPlace: "",
    personnesConcernees: "",
    statut: "A_TRAITER" as ActionStatut,
    dateCreation: new Date().toISOString().split("T")[0],
    dateCloture: "",
  });
  const [uploadingPreuve, setUploadingPreuve] = useState(false);
  const preuveInputRef = useRef<HTMLInputElement>(null);

  // Correction 409: États pour l'ajout manuel d'article
  const [addArticleModalOpen, setAddArticleModalOpen] = useState(false);
  const [addingArticle, setAddingArticle] = useState(false);
  const [newArticleForm, setNewArticleForm] = useState({
    titre: "",
    source: "",
    url: "",
    type: "LEGALE" as VeilleType,
    datePublication: new Date().toISOString().split("T")[0],
  });

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Correction 409: États pour l'historique des conversations
  const [conversations, setConversations] = useState<VeilleConversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingConversationTitle, setEditingConversationTitle] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all counts on initial load
  const fetchAllCounts = useCallback(async () => {
    try {
      // Fetch counts from main endpoint (returns counts for all types)
      const res = await fetch(`/api/outils/veille?limit=1`);
      if (res.ok) {
        const data = await res.json();
        const newCounts = data.counts || {};

        // Also fetch favorites count
        const favRes = await fetch(`/api/outils/veille?status=IMPORTANT&limit=1`);
        if (favRes.ok) {
          const favData = await favRes.json();
          newCounts.FAVORIS = { total: favData.pagination?.total || 0, nonLus: 0 };
        }

        setCounts(newCounts);
      }
    } catch (error) {
      console.error("Erreur fetch counts:", error);
    }
  }, []);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);

      if (activeTab === "FAVORIS") {
        // Fetch articles importants de tous les types
        const res = await fetch(`/api/outils/veille?status=IMPORTANT&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setFavoriteArticles(data.articles || []);
          // Only update FAVORIS count, preserve others
          setCounts(prev => ({
            ...prev,
            FAVORIS: { total: data.articles?.length || 0, nonLus: 0 }
          } as VeilleCounts));
        }
      } else {
        const res = await fetch(`/api/outils/veille?type=${activeTab}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
          // Merge new counts with existing, preserving FAVORIS
          if (data.counts) {
            setCounts(prev => ({
              ...data.counts,
              FAVORIS: prev?.FAVORIS || { total: 0, nonLus: 0 }
            }));
          }
        }
      }
    } catch (error) {
      console.error("Erreur fetch articles:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);


  // Initial load: fetch all counts
  useEffect(() => {
    fetchAllCounts();
  }, [fetchAllCounts]);

  // Fetch articles when tab changes
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
      await fetchAllCounts(); // Refresh all counts after scraping
    } catch (error) {
      console.error("Erreur refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Mark article status with immediate UI update
  const markArticle = async (articleId: string, status: string) => {
    // Immediate UI update for better responsiveness
    const updateArticleInList = (articlesList: VeilleArticle[]) =>
      articlesList.map(a =>
        a.id === articleId
          ? { ...a, lecture: { ...a.lecture, status: status as VeilleArticle["lecture"]["status"] } }
          : a
      );

    // Update local state immediately
    setArticles(prev => updateArticleInList(prev));
    setFavoriteArticles(prev => updateArticleInList(prev));

    // Update selected article if it's the one being modified
    if (selectedArticle?.id === articleId) {
      setSelectedArticle(prev =>
        prev ? { ...prev, lecture: { ...prev.lecture, status: status as VeilleArticle["lecture"]["status"] } } : prev
      );
    }

    try {
      await fetch("/api/outils/veille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, status }),
      });
      // Refresh to get accurate data from server
      fetchArticles();
      fetchAllCounts();
    } catch (error) {
      console.error("Erreur mark article:", error);
      // Revert on error
      fetchArticles();
    }
  };

  // Save notes for an article
  const saveNotes = async () => {
    if (!selectedArticle) return;

    setSavingNotes(true);
    try {
      await fetch("/api/outils/veille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: selectedArticle.id,
          status: selectedArticle.lecture.status,
          notes: editingNotes,
        }),
      });

      // Update local state
      setSelectedArticle(prev =>
        prev ? { ...prev, lecture: { ...prev.lecture, notes: editingNotes } } : prev
      );
      setArticles(prev =>
        prev.map(a =>
          a.id === selectedArticle.id
            ? { ...a, lecture: { ...a.lecture, notes: editingNotes } }
            : a
        )
      );
      setFavoriteArticles(prev =>
        prev.map(a =>
          a.id === selectedArticle.id
            ? { ...a, lecture: { ...a.lecture, notes: editingNotes } }
            : a
        )
      );

      setNotesModalOpen(false);
    } catch (error) {
      console.error("Erreur sauvegarde notes:", error);
    } finally {
      setSavingNotes(false);
    }
  };

  // Open notes modal
  const openNotesModal = () => {
    if (selectedArticle) {
      setEditingNotes(selectedArticle.lecture.notes || "");
      setNotesModalOpen(true);
    }
  };

  // Get type info for an article
  const getTypeInfo = (type: VeilleType) => {
    return VEILLE_TYPES.find(t => t.type === type) || VEILLE_TYPES[0];
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

  // Correction 409: Fonctions pour l'historique des conversations
  const fetchConversations = useCallback(async () => {
    if (!["LEGALE", "METIER", "INNOVATION", "HANDICAP"].includes(activeTab)) return;

    setLoadingConversations(true);
    try {
      const params = new URLSearchParams();
      params.set("type", activeTab);
      if (historySearch.trim()) {
        params.set("search", historySearch.trim());
      }

      const res = await fetch(`/api/outils/veille/chat?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Erreur chargement conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  }, [activeTab, historySearch]);

  const loadConversation = async (conv: VeilleConversation) => {
    setConversationId(conv.id);
    // Convertir les messages JSON en format ChatMessage
    const loadedMessages: ChatMessage[] = (conv.messages || []).map((m, i) => ({
      id: `${conv.id}-${i}`,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
    }));
    setMessages(loadedMessages);
    setShowHistory(false);
  };

  const togglePinConversation = async (convId: string, currentPinned: boolean) => {
    try {
      const res = await fetch("/api/outils/veille/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          isPinned: !currentPinned,
        }),
      });

      if (res.ok) {
        fetchConversations();
      }
    } catch (error) {
      console.error("Erreur épinglage:", error);
    }
  };

  const renameConversation = async (convId: string, newTitle: string) => {
    try {
      const res = await fetch("/api/outils/veille/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          titre: newTitle,
        }),
      });

      if (res.ok) {
        setEditingConversationId(null);
        fetchConversations();
      }
    } catch (error) {
      console.error("Erreur renommage:", error);
    }
  };

  const deleteConversation = async (convId: string) => {
    if (!confirm("Supprimer cette conversation ?")) return;

    try {
      const res = await fetch(`/api/outils/veille/chat?conversationId=${convId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (conversationId === convId) {
          clearChat();
        }
        fetchConversations();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // Charger les conversations quand on ouvre l'historique
  useEffect(() => {
    if (showHistory && viewMode === "chat") {
      fetchConversations();
    }
  }, [showHistory, viewMode, fetchConversations]);

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

  // Corrections 402-407: Fonctions pour l'exploitation de la veille
  const fetchVeilleActions = useCallback(async () => {
    try {
      setActionsLoading(true);
      const params = new URLSearchParams();
      if (actionFilters.search) params.append("search", actionFilters.search);
      if (actionFilters.type) params.append("type", actionFilters.type);
      if (actionFilters.statut) params.append("statut", actionFilters.statut);
      if (actionFilters.personne) params.append("personne", actionFilters.personne);

      const res = await fetch(`/api/outils/veille/actions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVeilleActions(data.actions || []);
        setActionCounts(data.counts || null);
      }
    } catch (error) {
      console.error("Erreur fetch actions:", error);
    } finally {
      setActionsLoading(false);
    }
  }, [actionFilters]);

  // Fetch actions quand on passe sur l'onglet exploitation
  useEffect(() => {
    if (activeTab === "EXPLOITATION") {
      fetchVeilleActions();
    }
  }, [activeTab, fetchVeilleActions]);

  // Ouvrir modal création d'action depuis un article
  const openActionModalFromArticle = (article: VeilleArticle) => {
    setEditingAction(null);
    setActionForm({
      articleTitre: article.titre,
      articleUrl: article.url,
      articleSource: article.source.nom,
      typeVeille: article.type,
      analyse: "",
      actionAMettreEnPlace: "",
      personnesConcernees: "",
      statut: "A_TRAITER",
      dateCreation: new Date().toISOString().split("T")[0],
      dateCloture: "",
    });
    setActionModalOpen(true);
  };

  // Ouvrir modal édition d'action
  const openActionModalForEdit = (action: VeilleAction) => {
    setEditingAction(action);
    setActionForm({
      articleTitre: action.articleTitre,
      articleUrl: action.articleUrl,
      articleSource: action.articleSource,
      typeVeille: action.typeVeille,
      analyse: action.analyse || "",
      actionAMettreEnPlace: action.actionAMettreEnPlace || "",
      personnesConcernees: action.personnesConcernees || "",
      statut: action.statut,
      dateCreation: action.dateCreation.split("T")[0],
      dateCloture: action.dateCloture ? action.dateCloture.split("T")[0] : "",
    });
    setActionModalOpen(true);
  };

  // Sauvegarder action (création ou modification)
  const saveAction = async () => {
    if (!selectedArticle && !editingAction) return;

    setSavingAction(true);
    try {
      const url = editingAction
        ? `/api/outils/veille/actions/${editingAction.id}`
        : "/api/outils/veille/actions";
      const method = editingAction ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        ...actionForm,
        dateCreation: actionForm.dateCreation || new Date().toISOString(),
        dateCloture: actionForm.dateCloture || null,
      };

      // Pour création, ajouter l'ID de l'article
      if (!editingAction && selectedArticle) {
        body.veilleArticleId = selectedArticle.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setActionModalOpen(false);
        // Rafraîchir la liste si on est sur l'onglet exploitation
        if (activeTab === "EXPLOITATION") {
          fetchVeilleActions();
        }
        // Mettre à jour le compteur
        const countRes = await fetch("/api/outils/veille/actions?limit=1");
        if (countRes.ok) {
          const countData = await countRes.json();
          setActionCounts(countData.counts);
        }
      }
    } catch (error) {
      console.error("Erreur sauvegarde action:", error);
    } finally {
      setSavingAction(false);
    }
  };

  // Supprimer action
  const deleteAction = async (actionId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette action ?")) return;

    try {
      const res = await fetch(`/api/outils/veille/actions/${actionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchVeilleActions();
      }
    } catch (error) {
      console.error("Erreur suppression action:", error);
    }
  };

  // Upload preuve
  const handleUploadPreuve = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingAction || !e.target.files?.length) return;

    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Fichier trop volumineux (max 10 MB)");
      return;
    }

    setUploadingPreuve(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/outils/veille/actions/${editingAction.id}/preuves`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newPreuve = await res.json();
        setEditingAction((prev) =>
          prev ? { ...prev, preuves: [newPreuve, ...prev.preuves] } : prev
        );
        // Aussi mettre à jour dans la liste
        setVeilleActions((prev) =>
          prev.map((a) =>
            a.id === editingAction.id
              ? { ...a, preuves: [newPreuve, ...a.preuves] }
              : a
          )
        );
      }
    } catch (error) {
      console.error("Erreur upload preuve:", error);
    } finally {
      setUploadingPreuve(false);
      if (preuveInputRef.current) {
        preuveInputRef.current.value = "";
      }
    }
  };

  // Supprimer preuve
  const deletePreuve = async (preuveId: string) => {
    if (!editingAction) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette preuve ?")) return;

    try {
      const res = await fetch(`/api/outils/veille/actions/${editingAction.id}/preuves`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preuveId }),
      });

      if (res.ok) {
        setEditingAction((prev) =>
          prev ? { ...prev, preuves: prev.preuves.filter((p) => p.id !== preuveId) } : prev
        );
        setVeilleActions((prev) =>
          prev.map((a) =>
            a.id === editingAction.id
              ? { ...a, preuves: a.preuves.filter((p) => p.id !== preuveId) }
              : a
          )
        );
      }
    } catch (error) {
      console.error("Erreur suppression preuve:", error);
    }
  };

  // Correction 409: Ouvrir modal d'ajout d'article
  const openAddArticleModal = () => {
    setNewArticleForm({
      titre: "",
      source: "",
      url: "",
      type: (activeTab !== "FAVORIS" && activeTab !== "EXPLOITATION" ? activeTab : "LEGALE") as VeilleType,
      datePublication: new Date().toISOString().split("T")[0],
    });
    setAddArticleModalOpen(true);
  };

  // Correction 409: Ajouter un article manuellement
  const handleAddArticle = async () => {
    if (!newArticleForm.titre.trim() || !newArticleForm.source.trim() || !newArticleForm.url.trim()) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setAddingArticle(true);
    try {
      const res = await fetch("/api/outils/veille/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArticleForm),
      });

      if (res.ok) {
        const newArticle = await res.json();
        // Ajouter l'article en tête de liste si on est sur le bon onglet
        if (activeTab === newArticle.type) {
          setArticles((prev) => [newArticle, ...prev]);
        }
        // Rafraîchir les compteurs
        fetchAllCounts();
        setAddArticleModalOpen(false);
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'ajout de l'article");
      }
    } catch (error) {
      console.error("Erreur ajout article:", error);
      alert("Erreur lors de l'ajout de l'article");
    } finally {
      setAddingArticle(false);
    }
  };

  // Format taille fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Correction 408: Décoder les entités HTML dans les titres d'articles
  const decodeHtmlEntities = (text: string | null | undefined): string => {
    if (!text) return "";
    // Décoder les entités numériques (&#039; &#34; etc.) et nommées (&amp; &quot; etc.)
    const textarea = typeof document !== "undefined" ? document.createElement("textarea") : null;
    if (textarea) {
      textarea.innerHTML = text;
      return textarea.value;
    }
    // Fallback côté serveur ou si document n'existe pas
    return text
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#034;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
  };

  const activeType = VEILLE_TYPES.find((t) => t.type === activeTab) || VEILLE_TYPES[0];

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
                setSelectedArticle(null);
                setMessages([]);
                setConversationId(null);
              }}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === vt.type
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span className={`p-1 rounded-lg ${vt.color}`}>{vt.icon}</span>
              <span className="hidden sm:inline text-xs">{vt.label}</span>
              {/* Toujours afficher le nombre total d'articles */}
              {count && count.total > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  count.nonLus > 0
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                }`}>
                  {count.total}
                </span>
              )}
            </button>
          );
        })}
        {/* Onglet Favoris */}
        <button
          onClick={() => {
            setActiveTab("FAVORIS");
            setSelectedArticle(null);
            setMessages([]);
            setConversationId(null);
          }}
          className={`flex items-center gap-2 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "FAVORIS"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <span className="p-1 rounded-lg text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
            <BookmarkCheck size={20} />
          </span>
          <span className="hidden sm:inline text-xs">Favoris</span>
          {counts?.FAVORIS && counts.FAVORIS.total > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
              {counts.FAVORIS.total}
            </span>
          )}
        </button>
        {/* Correction 402: Onglet Exploitation de la veille */}
        <button
          onClick={() => {
            setActiveTab("EXPLOITATION");
            setSelectedArticle(null);
            setMessages([]);
            setConversationId(null);
          }}
          className={`flex items-center gap-2 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "EXPLOITATION"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <span className="p-1 rounded-lg text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400">
            <ClipboardList size={20} />
          </span>
          <span className="hidden sm:inline text-xs">Exploitation</span>
          {actionCounts && actionCounts.total > 0 && (
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
              actionCounts.A_TRAITER > 0
                ? "bg-orange-500 text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
            }`}>
              {actionCounts.total}
            </span>
          )}
        </button>
      </div>

      {/* Sub-header avec indicateur et toggle */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          {activeTab === "EXPLOITATION" ? (
            <>
              <span className="px-2 py-0.5 text-xs font-medium rounded text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400">
                <ClipboardList size={12} className="inline mr-1" />
                Exploitation
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Vos actions créées à partir des articles de veille (traçabilité Qualiopi)
              </span>
            </>
          ) : activeTab === "FAVORIS" ? (
            <>
              <span className="px-2 py-0.5 text-xs font-medium rounded text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                <Star size={12} className="inline mr-1" />
                Favoris
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Vos articles importants avec notes personnelles
              </span>
            </>
          ) : (
            <>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${activeType.color}`}>
                {activeType.indicateur}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {activeType.description}
              </span>
              {/* Correction 411: Notice pour la veille Métiers */}
              {activeTab === "METIER" && (
                <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                  Cette veille doit être configurée par votre organisme, car les sources &quot;métiers et compétences&quot; varient selon votre secteur d&apos;activité.
                </span>
              )}
            </>
          )}
        </div>
        {activeTab !== "FAVORIS" && activeTab !== "EXPLOITATION" && (
          <div className="flex items-center gap-3">
            {/* Correction 409: Bouton Ajouter un article */}
            <button
              onClick={openAddArticleModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
            >
              <Plus size={14} />
              Ajouter un article
            </button>
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
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {(viewMode === "articles" || activeTab === "FAVORIS") ? (
          /* Articles View */
          <div className="flex h-full">
            {/* Liste des articles */}
            <div className={`${selectedArticle ? "w-1/2 border-r dark:border-gray-700" : "w-full"} overflow-y-auto p-4`}>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
              ) : (activeTab === "FAVORIS" ? favoriteArticles : articles).length === 0 ? (
                <div className="text-center py-12">
                  {activeTab === "FAVORIS" ? (
                    <>
                      <BookmarkCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Aucun article favori
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Marquez des articles comme importants pour les retrouver ici
                      </p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {(activeTab === "FAVORIS" ? favoriteArticles : articles).map((article) => {
                    const typeInfo = getTypeInfo(article.type);
                    return (
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
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {/* Badge de type pour les favoris */}
                              {activeTab === "FAVORIS" && (
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${typeInfo.color}`}>
                                  {typeInfo.label.split(" ")[0]}
                                </span>
                              )}
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
                              {/* Indicateur de notes */}
                              {article.lecture.notes && (
                                <span title="Notes disponibles">
                                  <StickyNote size={14} className="text-blue-500" />
                                </span>
                              )}
                            </div>
                            <h3
                              className={`font-medium mb-1 line-clamp-2 ${
                                article.lecture.status === "NON_LU"
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {decodeHtmlEntities(article.titre)}
                            </h3>
                            {article.resumeIA && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {decodeHtmlEntities(article.resumeIA)}
                              </p>
                            )}
                            {/* Aperçu des notes dans les favoris */}
                            {activeTab === "FAVORIS" && article.lecture.notes && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">
                                  <StickyNote size={10} className="inline mr-1" />
                                  {article.lecture.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Détail de l'article */}
            {selectedArticle && (
              <div className="w-1/2 overflow-y-auto p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Badge de type si on est dans les favoris */}
                    {activeTab === "FAVORIS" && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeInfo(selectedArticle.type).color}`}>
                        {getTypeInfo(selectedArticle.type).label}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${activeTab === "FAVORIS" ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" : activeType.color}`}>
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
                    {/* Bouton Notes - visible seulement si article important */}
                    {selectedArticle.lecture.status === "IMPORTANT" && (
                      <button
                        onClick={openNotesModal}
                        className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                          selectedArticle.lecture.notes ? "text-blue-500" : "text-gray-400"
                        }`}
                        title={selectedArticle.lecture.notes ? "Modifier les notes" : "Ajouter une note"}
                      >
                        <StickyNote size={18} />
                      </button>
                    )}
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
                  {decodeHtmlEntities(selectedArticle.titre)}
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
                      {decodeHtmlEntities(selectedArticle.resumeIA)}
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
                          {decodeHtmlEntities(point)}
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
                      {decodeHtmlEntities(selectedArticle.impactQualiopi)}
                    </p>
                  </div>
                )}

                {selectedArticle.resume && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Extrait
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {decodeHtmlEntities(selectedArticle.resume)}
                    </p>
                  </div>
                )}

                {/* Section Notes personnelles */}
                {selectedArticle.lecture.status === "IMPORTANT" && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StickyNote size={16} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Notes personnelles
                        </span>
                      </div>
                      <button
                        onClick={openNotesModal}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {selectedArticle.lecture.notes ? "Modifier" : "Ajouter"}
                      </button>
                    </div>
                    {selectedArticle.lecture.notes ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedArticle.lecture.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                        Cliquez pour ajouter une note expliquant pourquoi cet article est important
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t dark:border-gray-700 flex items-center gap-3">
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
                  {/* Correction 403: Bouton Créer une action */}
                  <button
                    onClick={() => openActionModalFromArticle(selectedArticle)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    <Plus size={16} />
                    Créer une action
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "EXPLOITATION" ? (
          /* Correction 402/405/406/407: Vue Exploitation de la veille */
          <div className="flex-1 overflow-y-auto p-4">
            {/* Filtres et recherche */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {/* Recherche */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={actionFilters.search}
                  onChange={(e) => setActionFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="Rechercher (titre, source...)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              {/* Filtre type */}
              <select
                value={actionFilters.type}
                onChange={(e) => setActionFilters((prev) => ({ ...prev, type: e.target.value as VeilleType | "" }))}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Tous les types</option>
                {VEILLE_TYPES.map((vt) => (
                  <option key={vt.type} value={vt.type}>{vt.label}</option>
                ))}
              </select>
              {/* Filtre statut */}
              <select
                value={actionFilters.statut}
                onChange={(e) => setActionFilters((prev) => ({ ...prev, statut: e.target.value as ActionStatut | "" }))}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(ACTION_STATUT_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              {/* Filtre personne */}
              <input
                type="text"
                value={actionFilters.personne}
                onChange={(e) => setActionFilters((prev) => ({ ...prev, personne: e.target.value }))}
                placeholder="Personne concernée"
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Compteurs */}
            {actionCounts && (
              <div className="mb-4 flex items-center gap-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {actionCounts.total} action(s)
                </span>
                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <AlertCircle size={14} />
                  {actionCounts.A_TRAITER} à traiter
                </span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Clock size={14} />
                  {actionCounts.EN_COURS} en cours
                </span>
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 size={14} />
                  {actionCounts.CLOTUREE} clôturée(s)
                </span>
              </div>
            )}

            {/* Liste des actions */}
            {actionsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
              </div>
            ) : veilleActions.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune action d&apos;exploitation
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Créez des actions depuis les articles de veille pour prouver l&apos;exploitation de votre veille (Qualiopi)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {veilleActions.map((action) => {
                  const statutConfig = ACTION_STATUT_CONFIG[action.statut];
                  const typeInfo = VEILLE_TYPES.find((t) => t.type === action.typeVeille);
                  return (
                    <div
                      key={action.id}
                      onClick={() => openActionModalForEdit(action)}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1 ${statutConfig.color}`}>
                              {statutConfig.icon}
                              {statutConfig.label}
                            </span>
                            {typeInfo && (
                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${typeInfo.color}`}>
                                {typeInfo.label.split(" ")[0]}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {action.articleSource}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(action.dateCreation)}
                            </span>
                            {action.preuves.length > 0 && (
                              <span className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                <FileText size={10} />
                                {action.preuves.length} preuve(s)
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                            {decodeHtmlEntities(action.articleTitre)}
                          </h3>
                          {action.actionAMettreEnPlace && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                              <strong>Action :</strong> {action.actionAMettreEnPlace}
                            </p>
                          )}
                          {action.personnesConcernees && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <User size={10} />
                              {action.personnesConcernees}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Chat View - Correction 406, 409, 413: Avec historique des conversations, barre remontée */
          <div className="flex h-full max-h-[calc(100vh-180px)]">
            {/* Correction 409: Panneau historique des conversations */}
            {showHistory && (
              <div className="w-72 border-r dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
                <div className="p-3 border-b dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <History size={16} />
                      Historique
                    </h3>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <PanelLeftClose size={16} />
                    </button>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={20} className="animate-spin text-gray-400" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-400">
                      Aucune conversation
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`group relative p-2 rounded-lg cursor-pointer transition-colors ${
                            conversationId === conv.id
                              ? "bg-brand-100 dark:bg-brand-900/30"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {editingConversationId === conv.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingConversationTitle}
                                onChange={(e) => setEditingConversationTitle(e.target.value)}
                                className="flex-1 px-2 py-1 text-xs border rounded bg-white dark:bg-gray-600 dark:border-gray-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    renameConversation(conv.id, editingConversationTitle);
                                  } else if (e.key === "Escape") {
                                    setEditingConversationId(null);
                                  }
                                }}
                              />
                              <button
                                onClick={() => renameConversation(conv.id, editingConversationTitle)}
                                className="p-1 text-green-500 hover:text-green-600"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingConversationId(null)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div onClick={() => loadConversation(conv)} className="pr-16">
                                <div className="flex items-center gap-1">
                                  {conv.isPinned && <Pin size={10} className="text-brand-500" />}
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {conv.titre || "Sans titre"}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {formatDate(conv.updatedAt)}
                                </p>
                              </div>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePinConversation(conv.id, conv.isPinned);
                                  }}
                                  className="p-1 text-gray-400 hover:text-brand-500"
                                  title={conv.isPinned ? "Désépingler" : "Épingler"}
                                >
                                  {conv.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingConversationId(conv.id);
                                    setEditingConversationTitle(conv.titre || "");
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-500"
                                  title="Renommer"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConversation(conv.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                  title="Supprimer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-2 border-t dark:border-gray-700">
                  <button
                    onClick={() => {
                      clearChat();
                      setShowHistory(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                  >
                    <Plus size={14} />
                    Nouvelle conversation
                  </button>
                </div>
              </div>
            )}

            {/* Zone principale du chat */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Bouton pour afficher l'historique */}
              {!showHistory && (
                <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <PanelLeftOpen size={16} />
                    <span className="hidden sm:inline">Historique</span>
                  </button>
                  {conversationId && (
                    <span className="text-xs text-gray-400 truncate max-w-[200px]">
                      {conversations.find(c => c.id === conversationId)?.titre || "Conversation en cours"}
                    </span>
                  )}
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-0">
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
                    {/* Correction 410: Sous-titre reformulé */}
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                      Posez-moi vos questions sur l&apos;actualité de la veille {activeType.label.toLowerCase()}.
                      Je m&apos;appuie sur les articles les plus récents de votre veille pour vous répondre.
                    </p>
                  </div>

                  {/* Suggested questions - Correction 405: 4 questions par onglet */}
                  <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
                    {activeTab === "LEGALE" && (
                      <>
                        <button onClick={() => sendChatMessage("Quelles sont les dernières actualités légales et réglementaires ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Dernières actualités légales et réglementaires ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles évolutions récentes concernent la certification Qualiopi ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Évolutions récentes certification Qualiopi ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles actualités CPF / France compétences faut-il retenir ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Actualités CPF / France Compétences ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles obligations récentes s'appliquent aux organismes de formation ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Obligations récentes pour les OF ?</p>
                        </button>
                      </>
                    )}
                    {/* Correction 409 (Métiers): Questions suggérées reformulées */}
                    {activeTab === "METIER" && (
                      <>
                        <button onClick={() => sendChatMessage("Quels changements dans les métiers peuvent impacter nos formations ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Changements métiers impactant nos formations ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles compétences faut-il renforcer dans les parcours de formation ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Compétences à renforcer ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quels besoins en compétences ressortent le plus côté entreprises et emploi ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Besoins en compétences entreprises ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles évolutions des référentiels (RS/RNCP) faut-il anticiper ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Évolutions référentiels RS/RNCP ?</p>
                        </button>
                      </>
                    )}
                    {/* Correction 411: 4 nouvelles questions pour Innovation Pédagogique */}
                    {activeTab === "INNOVATION" && (
                      <>
                        <button onClick={() => sendChatMessage("Quelles innovations pédagogiques sont les plus utilisées en formation actuellement ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Quelles innovations pédagogiques sont les plus utilisées en formation actuellement ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles pratiques pédagogiques renforcent l'engagement des apprenants ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Quelles pratiques pédagogiques renforcent l&apos;engagement des apprenants ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles tendances et outils digitaux améliorent vraiment l'apprentissage en formation ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Quelles tendances et outils digitaux améliorent vraiment l&apos;apprentissage en formation ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Comment intégrer l'IA en pédagogie sans perdre en qualité et en conformité ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Comment intégrer l&apos;IA en pédagogie sans perdre en qualité et en conformité ?</p>
                        </button>
                      </>
                    )}
                    {/* Correction 411: 4 nouvelles questions pour Handicap & Accessibilité */}
                    {activeTab === "HANDICAP" && (
                      <>
                        <button onClick={() => sendChatMessage("Quelles nouveautés récentes impactent l'accueil des PSH en formation ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Quelles nouveautés récentes impactent l&apos;accueil des PSH en formation ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles évolutions ou bonnes pratiques ressortent en ce moment sur l'accessibilité des parcours ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Quelles évolutions ou bonnes pratiques ressortent sur l&apos;accessibilité des parcours ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Quelles aides ou dispositifs sont actuellement mobilisables pour financer des aménagements ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Quelles aides ou dispositifs sont mobilisables pour financer des aménagements ?</p>
                        </button>
                        <button onClick={() => sendChatMessage("Qu'est-ce qui change récemment côté Qualiopi sur l'accessibilité et l'accompagnement des PSH ?")} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 transition-all text-left">
                          <p className="text-sm text-gray-700 dark:text-gray-300">Qu&apos;est-ce qui change côté Qualiopi sur l&apos;accessibilité et l&apos;accompagnement des PSH ?</p>
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

            {/* Chat Input - Correction 406: sticky pour être toujours visible */}
            <div className="sticky bottom-0 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <form onSubmit={handleChatSubmit} className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  {/* Correction 409b: Avertissement IA au lieu du compteur d'articles */}
                  <span className="text-xs text-gray-400 italic">
                    Les réponses de l&apos;assistant sont générées par IA et peuvent contenir des erreurs. Vérifiez toujours les informations.
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
                {/* Correction 413: Alignement parfait bouton/champ */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      placeholder={`Posez votre question sur la veille ${activeType.label.toLowerCase()}...`}
                      rows={1}
                      className="w-full h-12 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                      style={{ maxHeight: "120px" }}
                      disabled={chatLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="h-12 w-12 flex items-center justify-center bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
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
            </div>{/* Fin zone principale chat */}
          </div>
        )}
      </div>

      {/* Modal Notes */}
      {notesModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <StickyNote size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notes personnelles
                </h3>
              </div>
              <button
                onClick={() => setNotesModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                Article : {decodeHtmlEntities(selectedArticle.titre)}
              </p>
              <textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Pourquoi cet article est-il important ?"
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t dark:border-gray-700">
              <button
                onClick={() => setNotesModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {savingNotes ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction 404: Modal Créer/Modifier une action */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ClipboardList size={20} className="text-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingAction ? "Modifier l'action" : "Créer une action"}
                </h3>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* Section A: Informations de l'article (pré-remplies) */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Informations de l&apos;article
                </h4>

                {/* Titre de l'article */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Titre de l&apos;article
                  </label>
                  <input
                    type="text"
                    value={actionForm.articleTitre}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, articleTitre: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Type de veille (non modifiable) */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Type de veille
                  </label>
                  <div className={`px-3 py-2 text-sm rounded-lg ${VEILLE_TYPES.find((t) => t.type === actionForm.typeVeille)?.color || "bg-gray-100"}`}>
                    {VEILLE_TYPE_LABELS[actionForm.typeVeille]}
                  </div>
                </div>

                {/* Source (non modifiable) */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Source
                  </label>
                  <div className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300">
                    {actionForm.articleSource}
                  </div>
                </div>

                {/* Lien de l'article */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Lien de l&apos;article
                  </label>
                  <a
                    href={actionForm.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                  >
                    <Link2 size={14} />
                    Ouvrir l&apos;article
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Date de création */}
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Date de création de l&apos;action
                  </label>
                  <input
                    type="date"
                    value={actionForm.dateCreation}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, dateCreation: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Section B: Exploitation (champs à remplir) */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Exploitation
                </h4>

                {/* Analyse / impact */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Analyse / impact
                  </label>
                  <textarea
                    value={actionForm.analyse}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, analyse: e.target.value }))}
                    placeholder="Qu'est-ce que cet article change pour votre organisme ?"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                {/* Action à mettre en place */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Action à mettre en place
                  </label>
                  <textarea
                    value={actionForm.actionAMettreEnPlace}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, actionAMettreEnPlace: e.target.value }))}
                    placeholder="Qu'est-ce que votre organisme décide de faire concrètement ?"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                {/* Personne(s) concernée(s) */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Personne(s) concernée(s)
                  </label>
                  <input
                    type="text"
                    value={actionForm.personnesConcernees}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, personnesConcernees: e.target.value }))}
                    placeholder="Qui est concerné par cette action dans votre organisme ?"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Statut */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Statut de l&apos;action
                  </label>
                  <select
                    value={actionForm.statut}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, statut: e.target.value as ActionStatut }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {Object.entries(ACTION_STATUT_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date de clôture (visible si statut = CLOTUREE) */}
                {actionForm.statut === "CLOTUREE" && (
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Action clôturée le
                    </label>
                    <input
                      type="date"
                      value={actionForm.dateCloture}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, dateCloture: e.target.value }))}
                      className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* Section C: Preuves / justificatifs (visible en édition) */}
              {editingAction && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preuves / justificatifs
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                    Ajoutez les fichiers prouvant les actions mises en place par l&apos;organisme.
                  </p>

                  {/* Liste des preuves existantes */}
                  {editingAction.preuves.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {editingAction.preuves.map((preuve) => (
                        <div
                          key={preuve.id}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={16} className="text-teal-500 flex-shrink-0" />
                            <a
                              href={preuve.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 truncate"
                            >
                              {preuve.nom}
                            </a>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              ({formatFileSize(preuve.taille)})
                            </span>
                          </div>
                          <button
                            onClick={() => deletePreuve(preuve.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bouton upload */}
                  <input
                    ref={preuveInputRef}
                    type="file"
                    onChange={handleUploadPreuve}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                  />
                  <button
                    type="button"
                    onClick={() => preuveInputRef.current?.click()}
                    disabled={uploadingPreuve}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    {uploadingPreuve ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    Ajouter des fichiers
                  </button>
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
              <div>
                {editingAction && (
                  <button
                    onClick={() => deleteAction(editingAction.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActionModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveAction}
                  disabled={savingAction}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
                >
                  {savingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {editingAction ? "Enregistrer" : "Créer l'action"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correction 409: Modal Ajouter un article manuellement */}
      {addArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Plus size={20} className="text-brand-600 dark:text-brand-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ajouter un article
                </h3>
              </div>
              <button
                onClick={() => setAddArticleModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre de l&apos;article <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newArticleForm.titre}
                  onChange={(e) => setNewArticleForm((prev) => ({ ...prev, titre: e.target.value }))}
                  placeholder="Ex. : Qualiopi : nouvelles exigences sur l'indicateur 2"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newArticleForm.source}
                  onChange={(e) => setNewArticleForm((prev) => ({ ...prev, source: e.target.value }))}
                  placeholder="Ex. : Digiformag / Centre Inffo"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lien URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={newArticleForm.url}
                  onChange={(e) => setNewArticleForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="Ex. : https://www.digiformag.com/qualiopi/mon-article"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Type de veille */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type de veille
                </label>
                <select
                  value={newArticleForm.type}
                  onChange={(e) => setNewArticleForm((prev) => ({ ...prev, type: e.target.value as VeilleType }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {VEILLE_TYPES.map((vt) => (
                    <option key={vt.type} value={vt.type}>
                      {vt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date d'ajout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date d&apos;ajout
                </label>
                <input
                  type="date"
                  value={newArticleForm.datePublication}
                  onChange={(e) => setNewArticleForm((prev) => ({ ...prev, datePublication: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t dark:border-gray-700">
              <button
                onClick={() => setAddArticleModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddArticle}
                disabled={addingArticle || !newArticleForm.titre.trim() || !newArticleForm.source.trim() || !newArticleForm.url.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {addingArticle ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Ajouter l&apos;article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
