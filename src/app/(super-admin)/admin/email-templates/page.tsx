"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Search,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  GraduationCap,
  FileSignature,
  Video,
  ClipboardCheck,
  UserPlus,
  Bell,
  Calendar,
  Award,
  RefreshCw,
  Code,
  Sparkles,
} from "lucide-react";

// Types
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  variables: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Catégories de templates
const categories = [
  { id: "all", label: "Tous", icon: <Mail className="w-4 h-4" /> },
  { id: "lms", label: "LMS / Formation", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "signature", label: "Signatures", icon: <FileSignature className="w-4 h-4" /> },
  { id: "classe-virtuelle", label: "Classe virtuelle", icon: <Video className="w-4 h-4" /> },
  { id: "emargement", label: "Émargement", icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: "utilisateur", label: "Utilisateurs", icon: <UserPlus className="w-4 h-4" /> },
  { id: "notification", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
];

// Templates par défaut
const defaultTemplates: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[] = [
  // LMS
  {
    name: "Invitation Apprenant LMS",
    subject: "Vous êtes inscrit à la formation : {{formation_titre}}",
    category: "lms",
    isActive: true,
    variables: ["apprenant_prenom", "apprenant_nom", "formation_titre", "formation_description", "lien_acces", "organisation_nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue dans votre formation !</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{apprenant_prenom}}</strong>,</p>
      <p>Vous avez été inscrit(e) à la formation <strong>{{formation_titre}}</strong> par {{organisation_nom}}.</p>
      <p>{{formation_description}}</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_acces}}" class="button">Accéder à ma formation</a>
      </p>
      <p>Bonne formation !</p>
    </div>
    <div class="footer">
      <p>© {{organisation_nom}} - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "Rappel Formation Non Commencée",
    subject: "N'oubliez pas votre formation : {{formation_titre}}",
    category: "lms",
    isActive: true,
    variables: ["apprenant_prenom", "formation_titre", "jours_depuis_inscription", "lien_acces"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Votre formation vous attend !</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{apprenant_prenom}}</strong>,</p>
      <p>Vous êtes inscrit(e) à la formation <strong>{{formation_titre}}</strong> depuis {{jours_depuis_inscription}} jours mais vous n'avez pas encore commencé.</p>
      <p>N'attendez plus pour développer vos compétences !</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_acces}}" class="button">Commencer maintenant</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "Formation Terminée - Félicitations",
    subject: "Félicitations ! Vous avez terminé : {{formation_titre}}",
    category: "lms",
    isActive: true,
    variables: ["apprenant_prenom", "formation_titre", "score_final", "temps_total", "lien_certificat"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
    .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Félicitations !</h1>
      <p>Vous avez terminé votre formation</p>
    </div>
    <div class="content">
      <p>Bravo <strong>{{apprenant_prenom}}</strong> !</p>
      <p>Vous avez complété avec succès la formation <strong>{{formation_titre}}</strong>.</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{{score_final}}%</div>
          <div>Score final</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{temps_total}}</div>
          <div>Temps passé</div>
        </div>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_certificat}}" class="button">Télécharger mon certificat</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  // Signatures
  {
    name: "Demande de Signature",
    subject: "Document à signer : {{document_titre}}",
    category: "signature",
    isActive: true,
    variables: ["destinataire_prenom", "document_titre", "expediteur_nom", "date_limite", "lien_signature"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .document-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Document à signer</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{destinataire_prenom}}</strong>,</p>
      <p><strong>{{expediteur_nom}}</strong> vous a envoyé un document à signer :</p>
      <div class="document-box">
        <strong>{{document_titre}}</strong>
      </div>
      <div class="warning">
        ⚠️ Ce document doit être signé avant le <strong>{{date_limite}}</strong>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_signature}}" class="button">Signer le document</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "Rappel Signature",
    subject: "Rappel : Document en attente de signature",
    category: "signature",
    isActive: true,
    variables: ["destinataire_prenom", "document_titre", "jours_restants", "lien_signature"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Rappel de signature</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{destinataire_prenom}}</strong>,</p>
      <p>Le document <strong>{{document_titre}}</strong> est toujours en attente de votre signature.</p>
      <p>Il vous reste <strong>{{jours_restants}} jours</strong> pour le signer.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_signature}}" class="button">Signer maintenant</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "Signature Confirmée",
    subject: "Document signé : {{document_titre}}",
    category: "signature",
    isActive: true,
    variables: ["destinataire_prenom", "document_titre", "date_signature", "lien_document"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Document signé</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{destinataire_prenom}}</strong>,</p>
      <p>Le document <strong>{{document_titre}}</strong> a été signé avec succès le {{date_signature}}.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_document}}" class="button">Télécharger le document signé</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  // Classe virtuelle
  {
    name: "Convocation Classe Virtuelle",
    subject: "Convocation : {{session_titre}} - {{session_date}}",
    category: "classe-virtuelle",
    isActive: true,
    variables: ["participant_prenom", "session_titre", "session_date", "session_heure", "session_duree", "formateur_nom", "lien_reunion", "plateforme"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .session-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .session-detail { display: flex; align-items: center; margin: 10px 0; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📹 Classe Virtuelle</h1>
      <p>Vous êtes convoqué(e)</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{participant_prenom}}</strong>,</p>
      <p>Vous êtes invité(e) à participer à une classe virtuelle :</p>
      <div class="session-box">
        <h3 style="margin-top: 0;">{{session_titre}}</h3>
        <div class="session-detail">📅 <strong style="margin-left: 10px;">{{session_date}}</strong></div>
        <div class="session-detail">🕐 <strong style="margin-left: 10px;">{{session_heure}}</strong> (durée: {{session_duree}})</div>
        <div class="session-detail">👤 <strong style="margin-left: 10px;">Formateur: {{formateur_nom}}</strong></div>
        <div class="session-detail">💻 <strong style="margin-left: 10px;">Via {{plateforme}}</strong></div>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_reunion}}" class="button">Rejoindre la réunion</a>
      </p>
      <p><small>💡 Conseil : Connectez-vous 5 minutes avant le début de la session.</small></p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "Rappel Classe Virtuelle (1h avant)",
    subject: "Rappel : Votre classe virtuelle commence dans 1 heure",
    category: "classe-virtuelle",
    isActive: true,
    variables: ["participant_prenom", "session_titre", "session_heure", "lien_reunion"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ C'est bientôt l'heure !</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{participant_prenom}}</strong>,</p>
      <p>Votre classe virtuelle <strong>{{session_titre}}</strong> commence dans 1 heure à <strong>{{session_heure}}</strong>.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_reunion}}" class="button">Rejoindre maintenant</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  // Émargement
  {
    name: "Invitation Émargement",
    subject: "Émargement : {{session_titre}} - {{session_date}}",
    category: "emargement",
    isActive: true,
    variables: ["participant_prenom", "session_titre", "session_date", "formation_titre", "lien_emargement"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #06b6d4; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #06b6d4; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✍️ Émargement</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{participant_prenom}}</strong>,</p>
      <p>Merci de confirmer votre présence à la session <strong>{{session_titre}}</strong> du {{session_date}} pour la formation <strong>{{formation_titre}}</strong>.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_emargement}}" class="button">Émarger maintenant</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "Récapitulatif Émargement",
    subject: "Récapitulatif émargement : {{formation_titre}}",
    category: "emargement",
    isActive: true,
    variables: ["formateur_prenom", "formation_titre", "session_date", "nb_presents", "nb_absents", "taux_presence", "lien_feuille"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #06b6d4; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .button { display: inline-block; background: #06b6d4; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Récapitulatif Émargement</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{formateur_prenom}}</strong>,</p>
      <p>Voici le récapitulatif de l'émargement pour la session du <strong>{{session_date}}</strong> de la formation <strong>{{formation_titre}}</strong> :</p>
      <div class="stats">
        <div>
          <div class="stat-value" style="color: #10b981;">{{nb_presents}}</div>
          <div class="stat-label">Présents</div>
        </div>
        <div>
          <div class="stat-value" style="color: #ef4444;">{{nb_absents}}</div>
          <div class="stat-label">Absents</div>
        </div>
        <div>
          <div class="stat-value" style="color: #3b82f6;">{{taux_presence}}%</div>
          <div class="stat-label">Taux de présence</div>
        </div>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_feuille}}" class="button">Voir la feuille d'émargement</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  // Utilisateurs
  {
    name: "Bienvenue Nouvel Utilisateur",
    subject: "Bienvenue sur {{plateforme_nom}} !",
    category: "utilisateur",
    isActive: true,
    variables: ["user_prenom", "user_email", "plateforme_nom", "lien_connexion"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #f97316; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenue !</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{user_prenom}}</strong>,</p>
      <p>Votre compte sur <strong>{{plateforme_nom}}</strong> a été créé avec succès !</p>
      <p>Vous pouvez vous connecter avec l'email : <strong>{{user_email}}</strong></p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_connexion}}" class="button">Se connecter</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "Invitation Organisation",
    subject: "Vous êtes invité(e) à rejoindre {{organisation_nom}}",
    category: "utilisateur",
    isActive: true,
    variables: ["user_prenom", "organisation_nom", "inviteur_nom", "role", "lien_invitation"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8b5cf6; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invitation</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{user_prenom}}</strong>,</p>
      <p><strong>{{inviteur_nom}}</strong> vous invite à rejoindre <strong>{{organisation_nom}}</strong> en tant que <strong>{{role}}</strong>.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{lien_invitation}}" class="button">Accepter l'invitation</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Charger les templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/admin/email-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Erreur chargement templates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder un template
  const saveTemplate = async (template: Partial<EmailTemplate>, isNew: boolean = false) => {
    setSaving(true);
    try {
      // Si c'est un nouveau template, utiliser POST même si l'ID est défini
      const method = isNew ? "POST" : "PUT";
      const res = await fetch("/api/admin/email-templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      if (res.ok) {
        await loadTemplates();
        setSelectedTemplate(null);
        setEditMode(false);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde du template");
    } finally {
      setSaving(false);
    }
  };

  // Supprimer un template
  const deleteTemplate = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) return;

    try {
      await fetch(`/api/admin/email-templates?id=${id}`, {
        method: "DELETE",
      });
      await loadTemplates();
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // Créer les templates par défaut
  const seedDefaultTemplates = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates/seed", {
        method: "POST",
      });
      if (res.ok) {
        await loadTemplates();
      }
    } catch (error) {
      console.error("Erreur seed:", error);
    } finally {
      setSaving(false);
    }
  };

  // Copier les variables
  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
  };

  // Filtrer les templates
  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Mail className="w-7 h-7 text-orange-500" />
            Templates Email
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez les modèles d'emails automatiques de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-3">
          {templates.length === 0 && (
            <button
              onClick={seedDefaultTemplates}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Créer templates par défaut
            </button>
          )}
          <button
            onClick={() => {
              setSelectedTemplate({
                id: "",
                name: "",
                subject: "",
                content: "",
                category: "notification",
                variables: [],
                isActive: true,
              });
              setEditMode(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun template
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {templates.length === 0
              ? "Créez les templates par défaut pour commencer"
              : "Aucun template ne correspond à vos critères"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${template.isActive ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {template.id}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  template.isActive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}>
                  {template.isActive ? "Actif" : "Inactif"}
                </span>
              </div>

              {/* Subject */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                <strong>Sujet:</strong> {template.subject}
              </p>

              {/* Variables */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.variables.slice(0, 3).map(v => (
                  <span
                    key={v}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
                {template.variables.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs rounded">
                    +{template.variables.length - 3}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setPreviewMode(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Aperçu
                </button>
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setEditMode(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editMode && selectedTemplate && (
        <TemplateEditor
          template={selectedTemplate}
          onSave={saveTemplate}
          onClose={() => {
            setSelectedTemplate(null);
            setEditMode(false);
          }}
          saving={saving}
        />
      )}

      {/* Preview Modal */}
      {previewMode && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => {
            setSelectedTemplate(null);
            setPreviewMode(false);
          }}
        />
      )}
    </div>
  );
}

// Composant Éditeur
function TemplateEditor({
  template,
  onSave,
  onClose,
  saving,
}: {
  template: EmailTemplate;
  onSave: (template: Partial<EmailTemplate>, isNew: boolean) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState(template);
  const [newVariable, setNewVariable] = useState("");
  // Si l'ID initial est vide, c'est un nouveau template
  const isNew = !template.id;

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable],
      });
      setNewVariable("");
    }
  };

  const removeVariable = (v: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(x => x !== v),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {template.id ? "Modifier le template" : "Nouveau template"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom du template *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                placeholder="Invitation Apprenant LMS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Identifiant unique *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase() })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                placeholder="lms-invitation"
                disabled={!!template.id}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                {categories.filter(c => c.id !== "all").map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Template actif
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Sujet de l'email *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
              placeholder="Vous êtes inscrit à la formation : {{formation_titre}}"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Variables disponibles
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.variables.map(v => (
                <span
                  key={v}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-lg"
                >
                  {`{{${v}}}`}
                  <button onClick={() => removeVariable(v)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase())}
                onKeyDown={(e) => e.key === "Enter" && addVariable()}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                placeholder="nom_variable"
              />
              <button onClick={addVariable} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contenu HTML *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={15}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm"
              placeholder="<!DOCTYPE html>..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            Annuler
          </button>
          <button
            onClick={() => onSave(formData, isNew)}
            disabled={saving || !formData.name || !formData.id || !formData.subject}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant Aperçu
function TemplatePreview({
  template,
  onClose,
}: {
  template: EmailTemplate;
  onClose: () => void;
}) {
  // Remplacer les variables par des valeurs exemples
  const baseHtml = template.content || "";
  const variables = template.variables || [];
  const previewHtml = variables.reduce((html, v) => {
    return html.replace(new RegExp(`{{${v}}}`, "g"), `[${v}]`);
  }, baseHtml);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Aperçu: {template.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              <strong>Sujet:</strong> {template.subject}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <iframe
              srcDoc={previewHtml}
              className="w-full min-h-[500px] bg-white rounded-lg"
              title="Email Preview"
            />
          </div>
        </div>

        {/* Variables */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Variables utilisées:
          </p>
          <div className="flex flex-wrap gap-2">
            {template.variables.map(v => (
              <code key={v} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs rounded">
                {`{{${v}}}`}
              </code>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
