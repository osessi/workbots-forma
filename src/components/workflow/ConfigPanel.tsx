"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Trash2,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  Users,
  Bell,
  Webhook,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  PenTool,
  Database,
  UserPlus,
  ClipboardList,
  Repeat,
  Zap,
  Settings,
  ChevronDown,
} from "lucide-react";
import { WorkflowActionType } from "@prisma/client";
import { WorkflowNode } from "./WorkflowCanvas";

// ===========================================
// TYPES
// ===========================================

interface ConfigPanelProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onSave: (nodeId: string, config: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
}

// ===========================================
// HELPERS
// ===========================================

const getModuleInfo = (type: string) => {
  const modules: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; color: string; nom: string }
  > = {
    ENVOYER_EMAIL: { icon: Mail, color: "#3B82F6", nom: "Email" },
    ENVOYER_SMS: { icon: MessageSquare, color: "#3B82F6", nom: "SMS" },
    GENERER_DOCUMENT: { icon: FileText, color: "#10B981", nom: "Générer PDF" },
    DEMANDER_SIGNATURE: { icon: PenTool, color: "#10B981", nom: "Signature" },
    METTRE_A_JOUR_CHAMP: { icon: Database, color: "#8B5CF6", nom: "Mettre à jour" },
    CREER_APPRENANT: { icon: UserPlus, color: "#8B5CF6", nom: "Créer apprenant" },
    CREER_INSCRIPTION: { icon: ClipboardList, color: "#8B5CF6", nom: "Créer inscription" },
    CREER_RECLAMATION: { icon: AlertTriangle, color: "#EF4444", nom: "Réclamation" },
    CREER_AMELIORATION: { icon: CheckCircle, color: "#EF4444", nom: "Amélioration" },
    CREER_TACHE: { icon: ClipboardList, color: "#EF4444", nom: "Tâche" },
    NOTIFIER_EQUIPE: { icon: Users, color: "#F59E0B", nom: "Notifier équipe" },
    NOTIFIER_UTILISATEUR: { icon: Bell, color: "#F59E0B", nom: "Notifier utilisateur" },
    WEBHOOK: { icon: Webhook, color: "#6366F1", nom: "Webhook" },
    APPEL_API: { icon: Webhook, color: "#6366F1", nom: "Appel API" },
    DELAI: { icon: Clock, color: "#EC4899", nom: "Délai" },
    CONDITION: { icon: GitBranch, color: "#EC4899", nom: "Condition" },
    BOUCLE: { icon: Repeat, color: "#EC4899", nom: "Boucle" },
  };
  return modules[type] || { icon: Zap, color: "#6B7280", nom: type };
};

// ===========================================
// FORMULAIRES DE CONFIG PAR TYPE
// ===========================================

interface ConfigFormProps {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

// Classes communes pour les formulaires (dark mode support)
const inputClasses = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary";
const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

function EmailConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>
          Destinataire
        </label>
        <select
          value={(config.destinataire as string) || "apprenant"}
          onChange={(e) => onChange("destinataire", e.target.value)}
          className={inputClasses}
        >
          <option value="apprenant">Apprenant</option>
          <option value="formateur">Formateur</option>
          <option value="financeur">Financeur</option>
          <option value="entreprise">Entreprise</option>
          <option value="custom">Email personnalisé</option>
        </select>
      </div>

      {config.destinataire === "custom" && (
        <div>
          <label className={labelClasses}>
            Email personnalisé
          </label>
          <input
            type="email"
            value={(config.emailCustom as string) || ""}
            onChange={(e) => onChange("emailCustom", e.target.value)}
            placeholder="email@exemple.com"
            className={inputClasses}
          />
        </div>
      )}

      <div>
        <label className={labelClasses}>
          Modèle d'email
        </label>
        <select
          value={(config.templateId as string) || ""}
          onChange={(e) => onChange("templateId", e.target.value)}
          className={inputClasses}
        >
          <option value="">Sélectionner un modèle</option>
          <option value="confirmation_inscription">Confirmation d'inscription</option>
          <option value="rappel_session">Rappel de session</option>
          <option value="convocation">Convocation</option>
          <option value="attestation">Attestation</option>
          <option value="custom">Email personnalisé</option>
        </select>
      </div>

      {config.templateId === "custom" && (
        <>
          <div>
            <label className={labelClasses}>
              Sujet
            </label>
            <input
              type="text"
              value={(config.sujet as string) || ""}
              onChange={(e) => onChange("sujet", e.target.value)}
              placeholder="Sujet de l'email"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>
              Contenu
            </label>
            <textarea
              value={(config.contenu as string) || ""}
              onChange={(e) => onChange("contenu", e.target.value)}
              placeholder="Contenu de l'email..."
              rows={4}
              className={inputClasses}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Variables disponibles: {"{{nom}}"}, {"{{prenom}}"}, {"{{session}}"}, {"{{date}}"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function SMSConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>
          Destinataire
        </label>
        <select
          value={(config.destinataire as string) || "apprenant"}
          onChange={(e) => onChange("destinataire", e.target.value)}
          className={inputClasses}
        >
          <option value="apprenant">Apprenant</option>
          <option value="formateur">Formateur</option>
          <option value="custom">Numéro personnalisé</option>
        </select>
      </div>

      {config.destinataire === "custom" && (
        <div>
          <label className={labelClasses}>
            Numéro de téléphone
          </label>
          <input
            type="tel"
            value={(config.telephone as string) || ""}
            onChange={(e) => onChange("telephone", e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className={inputClasses}
          />
        </div>
      )}

      <div>
        <label className={labelClasses}>
          Message
        </label>
        <textarea
          value={(config.message as string) || ""}
          onChange={(e) => onChange("message", e.target.value)}
          placeholder="Contenu du SMS..."
          rows={3}
          maxLength={160}
          className={inputClasses}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {((config.message as string) || "").length}/160 caractères
        </p>
      </div>
    </div>
  );
}

function DocumentConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>
          Type de document
        </label>
        <select
          value={(config.typeDocument as string) || ""}
          onChange={(e) => onChange("typeDocument", e.target.value)}
          className={inputClasses}
        >
          <option value="">Sélectionner un type</option>
          <option value="convocation">Convocation</option>
          <option value="convention">Convention de formation</option>
          <option value="programme">Programme de formation</option>
          <option value="attestation">Attestation de formation</option>
          <option value="certificat">Certificat</option>
          <option value="facture">Facture</option>
          <option value="devis">Devis</option>
        </select>
      </div>

      <div>
        <label className={labelClasses}>
          Action après génération
        </label>
        <select
          value={(config.action as string) || "enregistrer"}
          onChange={(e) => onChange("action", e.target.value)}
          className={inputClasses}
        >
          <option value="enregistrer">Enregistrer seulement</option>
          <option value="envoyer_email">Envoyer par email</option>
          <option value="signature">Demander signature</option>
        </select>
      </div>
    </div>
  );
}

function SignatureConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>
          Document à signer
        </label>
        <select
          value={(config.document as string) || ""}
          onChange={(e) => onChange("document", e.target.value)}
          className={inputClasses}
        >
          <option value="">Sélectionner un document</option>
          <option value="convention">Convention de formation</option>
          <option value="reglement">Règlement intérieur</option>
          <option value="emargement">Feuille d'émargement</option>
          <option value="attestation">Attestation</option>
        </select>
      </div>

      <div>
        <label className={labelClasses}>
          Signataires
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(config.signataires as string[])?.includes("apprenant") ?? true}
              onChange={(e) => {
                const current = (config.signataires as string[]) || ["apprenant"];
                if (e.target.checked) {
                  onChange("signataires", [...current, "apprenant"]);
                } else {
                  onChange("signataires", current.filter((s) => s !== "apprenant"));
                }
              }}
              className="rounded"
            />
            <span className="text-sm text-gray-900 dark:text-gray-100">Apprenant</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(config.signataires as string[])?.includes("formateur") ?? false}
              onChange={(e) => {
                const current = (config.signataires as string[]) || [];
                if (e.target.checked) {
                  onChange("signataires", [...current, "formateur"]);
                } else {
                  onChange("signataires", current.filter((s) => s !== "formateur"));
                }
              }}
              className="rounded"
            />
            <span className="text-sm text-gray-900 dark:text-gray-100">Formateur</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(config.signataires as string[])?.includes("responsable") ?? false}
              onChange={(e) => {
                const current = (config.signataires as string[]) || [];
                if (e.target.checked) {
                  onChange("signataires", [...current, "responsable"]);
                } else {
                  onChange("signataires", current.filter((s) => s !== "responsable"));
                }
              }}
              className="rounded"
            />
            <span className="text-sm text-gray-900 dark:text-gray-100">Responsable formation</span>
          </label>
        </div>
      </div>

      <div>
        <label className={labelClasses}>
          Délai de signature (jours)
        </label>
        <input
          type="number"
          value={(config.delaiJours as number) || 7}
          onChange={(e) => onChange("delaiJours", parseInt(e.target.value))}
          min={1}
          max={30}
          className={inputClasses}
        />
      </div>
    </div>
  );
}

function DelaiConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>
          Durée
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={(config.duree as number) || 1}
            onChange={(e) => onChange("duree", parseInt(e.target.value))}
            min={1}
            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={(config.unite as string) || "jours"}
            onChange={(e) => onChange("unite", e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="minutes">Minutes</option>
            <option value="heures">Heures</option>
            <option value="jours">Jours</option>
            <option value="semaines">Semaines</option>
          </select>
        </div>
      </div>

      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Le workflow attendra {String(config.duree || 1)} {String(config.unite || "jours")} avant de passer à l'étape suivante.
        </p>
      </div>
    </div>
  );
}

function ConditionConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>
          Champ à vérifier
        </label>
        <select
          value={(config.champ as string) || ""}
          onChange={(e) => onChange("champ", e.target.value)}
          className={inputClasses}
        >
          <option value="">Sélectionner un champ</option>
          <option value="statut_inscription">Statut inscription</option>
          <option value="type_financement">Type de financement</option>
          <option value="document_signe">Document signé</option>
          <option value="paiement_recu">Paiement reçu</option>
          <option value="presence">Présence</option>
        </select>
      </div>

      <div>
        <label className={labelClasses}>
          Opérateur
        </label>
        <select
          value={(config.operateur as string) || "egal"}
          onChange={(e) => onChange("operateur", e.target.value)}
          className={inputClasses}
        >
          <option value="egal">Est égal à</option>
          <option value="different">Est différent de</option>
          <option value="contient">Contient</option>
          <option value="vide">Est vide</option>
          <option value="non_vide">N'est pas vide</option>
        </select>
      </div>

      {!["vide", "non_vide"].includes(config.operateur as string) && (
        <div>
          <label className={labelClasses}>
            Valeur
          </label>
          <input
            type="text"
            value={(config.valeur as string) || ""}
            onChange={(e) => onChange("valeur", e.target.value)}
            placeholder="Valeur à comparer"
            className={inputClasses}
          />
        </div>
      )}

      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Si la condition est vraie, le workflow continue. Sinon, il s'arrête ou passe à une branche alternative.
        </p>
      </div>
    </div>
  );
}

function NotificationConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>
          Destinataires
        </label>
        <select
          value={(config.destinataires as string) || "equipe"}
          onChange={(e) => onChange("destinataires", e.target.value)}
          className={inputClasses}
        >
          <option value="equipe">Toute l'équipe</option>
          <option value="admins">Administrateurs</option>
          <option value="formateurs">Formateurs</option>
          <option value="responsable">Responsable pédagogique</option>
        </select>
      </div>

      <div>
        <label className={labelClasses}>
          Titre
        </label>
        <input
          type="text"
          value={(config.titre as string) || ""}
          onChange={(e) => onChange("titre", e.target.value)}
          placeholder="Titre de la notification"
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>
          Message
        </label>
        <textarea
          value={(config.message as string) || ""}
          onChange={(e) => onChange("message", e.target.value)}
          placeholder="Contenu de la notification..."
          rows={3}
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>
          Priorité
        </label>
        <select
          value={(config.priorite as string) || "normale"}
          onChange={(e) => onChange("priorite", e.target.value)}
          className={inputClasses}
        >
          <option value="basse">Basse</option>
          <option value="normale">Normale</option>
          <option value="haute">Haute</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>
    </div>
  );
}

function WebhookConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>
          URL du webhook
        </label>
        <input
          type="url"
          value={(config.url as string) || ""}
          onChange={(e) => onChange("url", e.target.value)}
          placeholder="https://..."
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>
          Méthode HTTP
        </label>
        <select
          value={(config.methode as string) || "POST"}
          onChange={(e) => onChange("methode", e.target.value)}
          className={inputClasses}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div>
        <label className={labelClasses}>
          Headers (JSON)
        </label>
        <textarea
          value={(config.headers as string) || "{}"}
          onChange={(e) => onChange("headers", e.target.value)}
          placeholder='{"Authorization": "Bearer xxx"}'
          rows={2}
          className={`${inputClasses} font-mono text-sm`}
        />
      </div>

      <div>
        <label className={labelClasses}>
          Body (JSON)
        </label>
        <textarea
          value={(config.body as string) || "{}"}
          onChange={(e) => onChange("body", e.target.value)}
          placeholder='{"data": "..."}'
          rows={3}
          className={`${inputClasses} font-mono text-sm`}
        />
      </div>
    </div>
  );
}

function DefaultConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400">
        <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Configuration avancée disponible prochainement</p>
      </div>
    </div>
  );
}

// ===========================================
// TRIGGER CONFIG (pour le déclencheur)
// ===========================================

function TriggerConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Le déclencheur est configuré au niveau du workflow.
          Retournez aux paramètres généraux pour le modifier.
        </p>
      </div>
    </div>
  );
}

// ===========================================
// COMPOSANT PRINCIPAL
// ===========================================

export default function ConfigPanel({
  node,
  onClose,
  onSave,
  onDelete,
}: ConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (node) {
      setConfig(node.config || {});
      setHasChanges(false);
    }
  }, [node]);

  if (!node) return null;

  const isTrigger = node.type === "trigger";
  const moduleInfo = isTrigger
    ? { icon: Zap, color: "#F59E0B", nom: "Déclencheur" }
    : getModuleInfo(node.actionType || "");

  const Icon = moduleInfo.icon;

  const handleChange = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(node.id, config);
    setHasChanges(false);
  };

  const renderConfigForm = () => {
    if (isTrigger) {
      return <TriggerConfigForm config={config} onChange={handleChange} />;
    }

    switch (node.actionType) {
      case "ENVOYER_EMAIL":
        return <EmailConfigForm config={config} onChange={handleChange} />;
      case "ENVOYER_SMS":
        return <SMSConfigForm config={config} onChange={handleChange} />;
      case "GENERER_DOCUMENT":
        return <DocumentConfigForm config={config} onChange={handleChange} />;
      case "DEMANDER_SIGNATURE":
        return <SignatureConfigForm config={config} onChange={handleChange} />;
      case "DELAI":
        return <DelaiConfigForm config={config} onChange={handleChange} />;
      case "CONDITION":
        return <ConditionConfigForm config={config} onChange={handleChange} />;
      case "NOTIFIER_EQUIPE":
      case "NOTIFIER_UTILISATEUR":
        return <NotificationConfigForm config={config} onChange={handleChange} />;
      case "WEBHOOK":
      case "APPEL_API":
        return <WebhookConfigForm config={config} onChange={handleChange} />;
      default:
        return <DefaultConfigForm config={config} onChange={handleChange} />;
    }
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${moduleInfo.color}15` }}
            >
              <Icon className="h-5 w-5" style={{ color: moduleInfo.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{node.nom || moduleInfo.nom}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isTrigger ? "Déclencheur" : node.actionType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Nom personnalisé */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className={labelClasses}>
          Nom de l'étape
        </label>
        <input
          type="text"
          value={node.nom}
          onChange={(e) => handleChange("_nom", e.target.value)}
          placeholder="Nom de l'étape"
          className={inputClasses}
        />
      </div>

      {/* Configuration */}
      <div className="flex-1 overflow-y-auto p-4">{renderConfigForm()}</div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex gap-2">
          {!isTrigger && (
            <button
              onClick={() => onDelete(node.id)}
              className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              hasChanges
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
