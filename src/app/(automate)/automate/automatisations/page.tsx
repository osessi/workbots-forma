"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Play,
  Pause,
  Settings,
  MoreVertical,
  Zap,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { WorkflowDashboardData, WorkflowResponse } from "@/types/workflow";
import { WorkflowCategory, WorkflowTriggerType } from "@prisma/client";

// ===========================================
// COMPOSANTS
// ===========================================

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={`flex items-center text-xs mt-1 ${
              trend.positive ? "text-green-500" : "text-red-500"
            }`}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend.positive ? "+" : "-"}
            {trend.value}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkflowCard({
  workflow,
  onToggle,
  onTrigger,
  onEdit,
  onDelete,
}: {
  workflow: WorkflowResponse;
  onToggle: () => void;
  onTrigger: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getTriggerLabel = (type: WorkflowTriggerType) => {
    const labels: Record<string, string> = {
      PRE_INSCRIPTION: "Pré-inscription",
      INSCRIPTION_SESSION: "Inscription session",
      SESSION_J_MOINS_7: "J-7 session",
      SESSION_J_MOINS_1: "J-1 session",
      SESSION_DEBUT: "Début session",
      SESSION_FIN: "Fin session",
      EVALUATION_COMPLETEE: "Évaluation complétée",
      SCORE_INFERIEUR_SEUIL: "Score faible",
      DOCUMENT_NON_SIGNE: "Document non signé",
      RECLAMATION_RECUE: "Réclamation",
      CRON: "Planifié",
      MANUEL: "Manuel",
    };
    return labels[type] || type;
  };

  const getCategoryColor = (cat: WorkflowCategory) => {
    const colors: Record<string, string> = {
      INSCRIPTION: "bg-blue-100 text-blue-700",
      SESSION: "bg-green-100 text-green-700",
      EVALUATION: "bg-purple-100 text-purple-700",
      DOCUMENT: "bg-orange-100 text-orange-700",
      QUALITE: "bg-red-100 text-red-700",
      COMMUNICATION: "bg-cyan-100 text-cyan-700",
      PERSONNALISE: "bg-gray-100 text-gray-700",
    };
    return colors[cat] || colors.PERSONNALISE;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                workflow.actif ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Zap
                className={`h-5 w-5 ${
                  workflow.actif ? "text-green-600" : "text-gray-400"
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {workflow.nom}
                {workflow.actif ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-400">
                    Inactif
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {workflow.description || "Pas de description"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getCategoryColor(workflow.categorie)} variant="secondary">
                  {workflow.categorie}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Trigger: {getTriggerLabel(workflow.triggerType)}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Settings className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTrigger}>
                <Play className="h-4 w-4 mr-2" />
                Déclencher
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>
                {workflow.actif ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            {workflow.nombreExecutions} exécutions
          </div>
          {workflow.derniereDeclenchement && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(workflow.derniereDeclenchement).toLocaleDateString("fr-FR")}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            {workflow.etapes?.length || 0} étapes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutionRow({
  execution,
}: {
  execution: WorkflowDashboardData["executionsRecentes"][0];
}) {
  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case "TERMINEE":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "ERREUR":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "EN_COURS":
      case "EN_ATTENTE":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "PAUSE":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = {
      TERMINEE: "Terminée",
      ERREUR: "Erreur",
      EN_COURS: "En cours",
      EN_ATTENTE: "En attente",
      PAUSE: "En pause",
      ANNULEE: "Annulée",
    };
    return labels[statut] || statut;
  };

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        {getStatusIcon(execution.statut)}
        <div>
          <p className="font-medium text-sm">{execution.workflowNom}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(execution.debutAt).toLocaleString("fr-FR")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{getStatusLabel(execution.statut)}</Badge>
        {execution.duree && (
          <span className="text-xs text-muted-foreground">
            {execution.duree}s
          </span>
        )}
      </div>
    </div>
  );
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function AutomatisationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<WorkflowDashboardData | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("workflows");

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les stats et les workflows en parallèle
      const [statsRes, workflowsRes] = await Promise.all([
        fetch("/api/automatisations/stats"),
        fetch("/api/automatisations"),
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setDashboardData(stats);
      }

      if (workflowsRes.ok) {
        const data = await workflowsRes.json();
        setWorkflows(data.workflows);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Actions sur les workflows
  const handleToggleWorkflow = async (workflow: WorkflowResponse) => {
    try {
      const res = await fetch(`/api/automatisations/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !workflow.actif }),
      });

      if (res.ok) {
        toast.success(
          workflow.actif ? "Workflow désactivé" : "Workflow activé"
        );
        loadData();
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du workflow");
    }
  };

  const handleTriggerWorkflow = async (workflow: WorkflowResponse) => {
    try {
      const res = await fetch(`/api/automatisations/${workflow.id}/trigger`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Workflow déclenché avec succès");
        loadData();
      } else {
        throw new Error("Erreur lors du déclenchement");
      }
    } catch (error) {
      toast.error("Erreur lors du déclenchement du workflow");
    }
  };

  const handleDeleteWorkflow = async (workflow: WorkflowResponse) => {
    if (!confirm(`Supprimer le workflow "${workflow.nom}" ?`)) return;

    try {
      const res = await fetch(`/api/automatisations/${workflow.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Workflow supprimé");
        loadData();
      } else {
        throw new Error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression du workflow");
    }
  };

  // Filtrer les workflows
  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || w.categorie === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automatisations</h1>
          <p className="text-muted-foreground">
            Gérez vos workflows et automatisations
          </p>
        </div>
        <Button onClick={() => router.push("/automate/automatisations/nouveau")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau workflow
        </Button>
      </div>

      {/* Stats Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Workflows actifs"
            value={`${dashboardData.stats.workflowsActifs}/${dashboardData.stats.totalWorkflows}`}
            icon={Zap}
            description="Automatisations configurées"
          />
          <StatCard
            title="Exécutions"
            value={dashboardData.stats.totalExecutions}
            icon={Activity}
            description="Total des exécutions"
          />
          <StatCard
            title="Taux de réussite"
            value={`${dashboardData.stats.tauxReussite}%`}
            icon={CheckCircle}
            description="Exécutions réussies"
          />
          <StatCard
            title="Temps moyen"
            value={`${dashboardData.stats.tempsExecutionMoyen}s`}
            icon={Clock}
            description="Durée moyenne d'exécution"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Exécutions récentes</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {/* Filtres */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="INSCRIPTION">Inscription</SelectItem>
                <SelectItem value="SESSION">Session</SelectItem>
                <SelectItem value="EVALUATION">Évaluation</SelectItem>
                <SelectItem value="DOCUMENT">Document</SelectItem>
                <SelectItem value="QUALITE">Qualité</SelectItem>
                <SelectItem value="COMMUNICATION">Communication</SelectItem>
                <SelectItem value="PERSONNALISE">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des workflows */}
          {filteredWorkflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Aucun workflow</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-2">
                  Créez votre premier workflow pour automatiser vos processus
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push("/automate/automatisations/nouveau")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onToggle={() => handleToggleWorkflow(workflow)}
                  onTrigger={() => handleTriggerWorkflow(workflow)}
                  onEdit={() => router.push(`/automate/automatisations/${workflow.id}`)}
                  onDelete={() => handleDeleteWorkflow(workflow)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Exécutions récentes</CardTitle>
              <CardDescription>
                Historique des dernières exécutions de workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.executionsRecentes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune exécution récente
                </p>
              ) : (
                <div className="space-y-1">
                  {dashboardData?.executionsRecentes.map((exec) => (
                    <ExecutionRow key={exec.id} execution={exec} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
