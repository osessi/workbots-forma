"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Zap,
  Loader2,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { WorkflowTemplate, TRIGGERS_METADATA } from "@/types/workflow";
import { WorkflowCategory, WorkflowTriggerType } from "@prisma/client";

// ===========================================
// CATEGORIES
// ===========================================

const CATEGORIES = [
  { value: "INSCRIPTION", label: "Inscription" },
  { value: "SESSION", label: "Session" },
  { value: "EVALUATION", label: "Évaluation" },
  { value: "DOCUMENT", label: "Document" },
  { value: "QUALITE", label: "Qualité" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "PERSONNALISE", label: "Personnalisé" },
];

// ===========================================
// COMPOSANTS
// ===========================================

function TemplateCard({
  template,
  onSelect,
  isLoading,
}: {
  template: WorkflowTemplate;
  onSelect: () => void;
  isLoading: boolean;
}) {
  const getCategoryColor = (cat: string) => {
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
    <Card
      className={`cursor-pointer hover:border-primary hover:shadow-md transition-all ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <Zap className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{template.nom}</h3>
              {template.isPopular && (
                <Badge variant="secondary" className="shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Populaire
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {template.description}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className={getCategoryColor(template.categorie)} variant="secondary">
                {template.categorie}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {template.etapes.length} étapes
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function TriggerCard({
  trigger,
  selected,
  onSelect,
}: {
  trigger: typeof TRIGGERS_METADATA[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected
          ? "border-primary bg-primary/5"
          : "hover:border-primary/50"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            selected ? "bg-primary text-white" : "bg-muted"
          }`}
        >
          <Zap className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium">{trigger.nom}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {trigger.description}
          </p>
        </div>
        {selected && <Check className="h-5 w-5 text-primary" />}
      </CardContent>
    </Card>
  );
}

// ===========================================
// PAGE
// ===========================================

export default function NouveauWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [activeTab, setActiveTab] = useState("templates");

  // Formulaire workflow personnalisé
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState<WorkflowCategory>("PERSONNALISE");
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType | null>(null);

  // Charger les templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/automatisations/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Erreur chargement templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Créer depuis un template
  const handleSelectTemplate = async (template: WorkflowTemplate) => {
    if (loading) return;

    try {
      setSelectedTemplateId(template.id);
      setLoading(true);

      const res = await fetch("/api/automatisations/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          actif: false,
        }),
      });

      if (res.ok) {
        const workflow = await res.json();
        toast.success("Workflow créé avec succès");
        router.push(`/automate/automatisations/${workflow.id}`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du workflow");
    } finally {
      setLoading(false);
      setSelectedTemplateId(null);
    }
  };

  // Créer un workflow personnalisé
  const handleCreateCustom = async () => {
    if (!nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    if (!triggerType) {
      toast.error("Sélectionnez un déclencheur");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/automatisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          description,
          categorie,
          triggerType,
          actif: false,
          etapes: [],
        }),
      });

      if (res.ok) {
        const workflow = await res.json();
        toast.success("Workflow créé avec succès");
        router.push(`/automate/automatisations/${workflow.id}`);
      } else {
        throw new Error("Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur lors de la création du workflow");
    } finally {
      setLoading(false);
    }
  };

  // Grouper les triggers par catégorie
  const triggersByCategory = TRIGGERS_METADATA.reduce((acc, trigger) => {
    if (!acc[trigger.categorie]) {
      acc[trigger.categorie] = [];
    }
    acc[trigger.categorie].push(trigger);
    return acc;
  }, {} as Record<string, typeof TRIGGERS_METADATA>);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouveau workflow</h1>
          <p className="text-muted-foreground">
            Créez un nouveau workflow automatisé
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="templates">
            <Sparkles className="h-4 w-4 mr-2" />
            Depuis un template
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Plus className="h-4 w-4 mr-2" />
            Workflow personnalisé
          </TabsTrigger>
        </TabsList>

        {/* Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de workflows</CardTitle>
              <CardDescription>
                Sélectionnez un template pré-configuré pour démarrer rapidement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun template disponible
                </div>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => handleSelectTemplate(template)}
                      isLoading={loading && selectedTemplateId === template.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow personnalisé */}
        <TabsContent value="custom" className="space-y-6">
          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
              <CardDescription>
                Définissez les informations de base du workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du workflow *</Label>
                <Input
                  id="nom"
                  placeholder="Ex: Rappels automatiques session"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez ce que fait ce workflow..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categorie">Catégorie</Label>
                <select
                  id="categorie"
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as WorkflowCategory)}
                  className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Sélection du déclencheur */}
          <Card>
            <CardHeader>
              <CardTitle>Déclencheur *</CardTitle>
              <CardDescription>
                Choisissez l'événement qui déclenchera ce workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(triggersByCategory).map(([category, triggers]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {triggers.map((trigger) => (
                      <TriggerCard
                        key={trigger.type}
                        trigger={trigger}
                        selected={triggerType === trigger.type}
                        onSelect={() => setTriggerType(trigger.type as WorkflowTriggerType)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button onClick={handleCreateCustom} disabled={loading || !nom || !triggerType}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le workflow
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
