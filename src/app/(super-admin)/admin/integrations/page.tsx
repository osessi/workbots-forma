"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plug,
  Video,
  FileSignature,
  GraduationCap,
  Mail,
  CreditCard,
  Cloud,
  Check,
  X,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Settings,
  Webhook,
  Key,
  Globe,
  MessageSquare,
  Bot,
  Calendar,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

// Component for logo with fallback
function IntegrationLogo({
  integration,
  size = 40
}: {
  integration: Integration;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  // Multiple sources for each logo - try in order
  const logoSources = integration.logoSources || [integration.logo];

  const handleError = useCallback(() => {
    if (currentSrcIndex < logoSources.length - 1) {
      setCurrentSrcIndex(prev => prev + 1);
    } else {
      setImgError(true);
    }
  }, [currentSrcIndex, logoSources.length]);

  // Reset when integration changes
  useEffect(() => {
    setImgError(false);
    setCurrentSrcIndex(0);
  }, [integration.id]);

  if (imgError) {
    // Fallback to category icon
    const categoryIcons: Record<string, LucideIcon> = {
      signature: FileSignature,
      video: Video,
      lms: GraduationCap,
      email: Mail,
      sms: MessageSquare,
      payment: CreditCard,
      storage: Cloud,
      ai: Bot,
      calendar: Calendar,
      analytics: BarChart3,
    };
    const IconComponent = categoryIcons[integration.category] || Plug;

    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: size,
          height: size,
          backgroundColor: integration.color || '#6B7280',
        }}
      >
        <IconComponent className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSources[currentSrcIndex]}
      alt={integration.name}
      width={size}
      height={size}
      className="rounded-lg object-contain"
      onError={handleError}
      style={{ width: size, height: size }}
    />
  );
}

// Types
interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string; // URL du logo principal
  logoSources?: string[]; // URLs alternatives pour fallback
  category: "signature" | "video" | "lms" | "email" | "payment" | "storage" | "ai" | "calendar" | "sms" | "analytics";
  status: "connected" | "disconnected" | "error";
  fields: IntegrationField[];
  docsUrl?: string;
  webhookUrl?: string;
  color?: string; // Couleur de marque
}

interface IntegrationField {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
}

interface IntegrationConfig {
  [key: string]: string;
}

// Définition des intégrations avec logos SVG (multiple sources pour fallback)
const integrations: Integration[] = [
  // ========== SIGNATURE ÉLECTRONIQUE ==========
  {
    id: "yousign",
    name: "Yousign",
    description: "Signature électronique conforme eIDAS pour vos documents de formation",
    logo: "https://cdn.brandfetch.io/idHQCLmrQ2/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idHQCLmrQ2/w/512/h/512/theme/dark/icon.png",
      "https://yousign.com/favicon.ico",
    ],
    category: "signature",
    status: "disconnected",
    color: "#0066FF",
    docsUrl: "https://developers.yousign.com/docs",
    webhookUrl: "/api/webhooks/yousign",
    fields: [
      { key: "apiKey", label: "Clé API", type: "password", required: true, placeholder: "ys_prod_..." },
      { key: "environment", label: "Environnement", type: "select", required: true, options: [
        { value: "sandbox", label: "Sandbox (Test)" },
        { value: "production", label: "Production" },
      ]},
      { key: "webhookSecret", label: "Secret Webhook", type: "password", placeholder: "whsec_..." },
    ],
  },
  {
    id: "docusign",
    name: "DocuSign",
    description: "Leader mondial de la signature électronique",
    logo: "https://cdn.brandfetch.io/idWBIqXiCU/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idWBIqXiCU/w/512/h/512/theme/dark/icon.png",
      "https://www.docusign.com/favicon.ico",
    ],
    category: "signature",
    status: "disconnected",
    color: "#FFCC00",
    docsUrl: "https://developers.docusign.com/",
    fields: [
      { key: "integrationKey", label: "Integration Key", type: "password", required: true },
      { key: "userId", label: "User ID (GUID)", type: "text", required: true },
      { key: "accountId", label: "Account ID", type: "text", required: true },
      { key: "rsaPrivateKey", label: "RSA Private Key", type: "password", required: true },
      { key: "environment", label: "Environnement", type: "select", required: true, options: [
        { value: "demo", label: "Demo (Test)" },
        { value: "production", label: "Production" },
      ]},
    ],
  },
  // ========== VISIOCONFÉRENCE ==========
  {
    id: "zoom",
    name: "Zoom",
    description: "Classes virtuelles Zoom avec enregistrement automatique",
    logo: "https://svgl.app/library/zoom.svg",
    logoSources: [
      "https://svgl.app/library/zoom.svg",
      "https://cdn.brandfetch.io/idtRSG-8tA/w/512/h/512/theme/dark/icon.png",
    ],
    category: "video",
    status: "disconnected",
    color: "#2D8CFF",
    docsUrl: "https://developers.zoom.us/docs/",
    webhookUrl: "/api/webhooks/zoom",
    fields: [
      { key: "accountId", label: "Account ID", type: "text", required: true },
      { key: "clientId", label: "Client ID", type: "text", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
      { key: "secretToken", label: "Secret Token (Webhook)", type: "password" },
    ],
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Réunions et classes virtuelles via Microsoft 365",
    logo: "https://cdn.brandfetch.io/id2aVNp0xz/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/id2aVNp0xz/w/512/h/512/theme/dark/icon.png",
      "https://svgl.app/library/microsoft-teams.svg",
    ],
    category: "video",
    status: "disconnected",
    color: "#6264A7",
    docsUrl: "https://learn.microsoft.com/en-us/graph/api/resources/onlinemeeting",
    fields: [
      { key: "tenantId", label: "Tenant ID", type: "text", required: true },
      { key: "clientId", label: "Client ID (App)", type: "text", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
  },
  {
    id: "google-meet",
    name: "Google Meet",
    description: "Créez des réunions Google Meet pour vos formations",
    logo: "https://cdn.brandfetch.io/idMp7BPNC3/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idMp7BPNC3/w/512/h/512/theme/dark/icon.png",
      "https://svgl.app/library/google-meet.svg",
    ],
    category: "video",
    status: "disconnected",
    color: "#00897B",
    docsUrl: "https://developers.google.com/calendar/api",
    fields: [
      { key: "clientId", label: "Client ID", type: "text", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
      { key: "refreshToken", label: "Refresh Token", type: "password", helpText: "Obtenu après OAuth" },
    ],
  },
  {
    id: "whereby",
    name: "Whereby",
    description: "Salles de réunion virtuelles sans téléchargement",
    logo: "https://cdn.brandfetch.io/idiH_P6wrO/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idiH_P6wrO/w/512/h/512/theme/dark/icon.png",
      "https://whereby.com/favicon.ico",
    ],
    category: "video",
    status: "disconnected",
    color: "#6B4EFF",
    docsUrl: "https://docs.whereby.com/",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },
  // ========== LMS / xAPI ==========
  {
    id: "xapi-lrs",
    name: "xAPI / LRS",
    description: "Learning Record Store pour le tracking avancé SCORM/xAPI",
    logo: "https://xapi.com/wp-content/uploads/2014/06/xapi-logo-color.png",
    logoSources: [
      "https://xapi.com/wp-content/uploads/2014/06/xapi-logo-color.png",
    ],
    category: "lms",
    status: "disconnected",
    color: "#E91E63",
    docsUrl: "https://xapi.com/overview/",
    fields: [
      { key: "endpoint", label: "Endpoint LRS", type: "url", required: true, placeholder: "https://lrs.example.com/xapi/" },
      { key: "username", label: "Username / Key", type: "text", required: true },
      { key: "password", label: "Password / Secret", type: "password", required: true },
      { key: "version", label: "Version xAPI", type: "select", options: [
        { value: "1.0.3", label: "1.0.3 (Recommandé)" },
        { value: "1.0.2", label: "1.0.2" },
        { value: "1.0.1", label: "1.0.1" },
      ]},
    ],
  },
  {
    id: "moodle",
    name: "Moodle",
    description: "Connexion avec votre LMS Moodle existant",
    logo: "https://cdn.brandfetch.io/idvQ6mhAqz/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idvQ6mhAqz/w/512/h/512/theme/dark/icon.png",
      "https://moodle.org/theme/moodleorg/pix/moodle_logo_small.svg",
    ],
    category: "lms",
    status: "disconnected",
    color: "#F98012",
    docsUrl: "https://docs.moodle.org/dev/Web_services",
    fields: [
      { key: "siteUrl", label: "URL du site Moodle", type: "url", required: true, placeholder: "https://moodle.example.com" },
      { key: "token", label: "Token Web Service", type: "password", required: true },
    ],
  },
  // ========== EMAIL ==========
  {
    id: "resend",
    name: "Resend",
    description: "Service d'envoi d'emails transactionnels moderne",
    logo: "https://resend.com/static/brand/resend-icon-black.svg",
    logoSources: [
      "https://resend.com/static/brand/resend-icon-black.svg",
      "https://cdn.brandfetch.io/idL-OQxnWO/w/512/h/512/theme/dark/icon.png",
    ],
    category: "email",
    status: "disconnected",
    color: "#000000",
    docsUrl: "https://resend.com/docs",
    fields: [
      { key: "apiKey", label: "Clé API", type: "password", required: true, placeholder: "re_..." },
      { key: "fromEmail", label: "Email expéditeur", type: "text", required: true, placeholder: "noreply@votredomaine.com" },
      { key: "fromName", label: "Nom expéditeur", type: "text", placeholder: "Automate Forma" },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Plateforme d'envoi d'emails à grande échelle par Twilio",
    logo: "https://cdn.brandfetch.io/idXFHf6q6e/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idXFHf6q6e/w/512/h/512/theme/dark/icon.png",
      "https://sendgrid.com/favicon.ico",
    ],
    category: "email",
    status: "disconnected",
    color: "#1A82E2",
    docsUrl: "https://docs.sendgrid.com/",
    fields: [
      { key: "apiKey", label: "Clé API", type: "password", required: true, placeholder: "SG...." },
      { key: "fromEmail", label: "Email expéditeur vérifié", type: "text", required: true },
      { key: "fromName", label: "Nom expéditeur", type: "text" },
    ],
  },
  {
    id: "mailjet",
    name: "Mailjet",
    description: "Service d'emailing français, conforme RGPD",
    logo: "https://cdn.brandfetch.io/idGlFBcrL5/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idGlFBcrL5/w/512/h/512/theme/dark/icon.png",
      "https://www.mailjet.com/favicon.ico",
    ],
    category: "email",
    status: "disconnected",
    color: "#F5A623",
    docsUrl: "https://dev.mailjet.com/",
    fields: [
      { key: "apiKey", label: "API Key", type: "text", required: true },
      { key: "secretKey", label: "Secret Key", type: "password", required: true },
      { key: "fromEmail", label: "Email expéditeur", type: "text", required: true },
    ],
  },
  // ========== SMS ==========
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS et appels pour rappels et authentification",
    logo: "https://svgl.app/library/twilio.svg",
    logoSources: [
      "https://svgl.app/library/twilio.svg",
      "https://cdn.brandfetch.io/id6O2oGzhU/w/512/h/512/theme/dark/icon.png",
    ],
    category: "sms",
    status: "disconnected",
    color: "#F22F46",
    docsUrl: "https://www.twilio.com/docs",
    fields: [
      { key: "accountSid", label: "Account SID", type: "text", required: true },
      { key: "authToken", label: "Auth Token", type: "password", required: true },
      { key: "phoneNumber", label: "Numéro expéditeur", type: "text", required: true, placeholder: "+33..." },
    ],
  },
  {
    id: "vonage",
    name: "Vonage (Nexmo)",
    description: "API SMS et communications unifiées",
    logo: "https://cdn.brandfetch.io/idSyrHPq6H/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idSyrHPq6H/w/512/h/512/theme/dark/icon.png",
      "https://www.vonage.com/favicon.ico",
    ],
    category: "sms",
    status: "disconnected",
    color: "#7B3F00",
    docsUrl: "https://developer.vonage.com/",
    fields: [
      { key: "apiKey", label: "API Key", type: "text", required: true },
      { key: "apiSecret", label: "API Secret", type: "password", required: true },
      { key: "from", label: "Expéditeur (nom ou numéro)", type: "text", required: true },
    ],
  },
  // ========== PAIEMENT ==========
  {
    id: "stripe",
    name: "Stripe",
    description: "Paiements en ligne et gestion des abonnements",
    logo: "https://svgl.app/library/stripe.svg",
    logoSources: [
      "https://svgl.app/library/stripe.svg",
      "https://cdn.brandfetch.io/idxAg10C0L/w/512/h/512/theme/dark/icon.png",
    ],
    category: "payment",
    status: "disconnected",
    color: "#635BFF",
    docsUrl: "https://stripe.com/docs",
    webhookUrl: "/api/webhooks/stripe",
    fields: [
      { key: "publishableKey", label: "Clé publique", type: "text", required: true, placeholder: "pk_..." },
      { key: "secretKey", label: "Clé secrète", type: "password", required: true, placeholder: "sk_..." },
      { key: "webhookSecret", label: "Secret Webhook", type: "password", placeholder: "whsec_..." },
    ],
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Paiements PayPal et cartes bancaires",
    logo: "https://svgl.app/library/paypal.svg",
    logoSources: [
      "https://svgl.app/library/paypal.svg",
      "https://cdn.brandfetch.io/idnH0lntoD/w/512/h/512/theme/dark/icon.png",
    ],
    category: "payment",
    status: "disconnected",
    color: "#003087",
    docsUrl: "https://developer.paypal.com/docs/",
    fields: [
      { key: "clientId", label: "Client ID", type: "text", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
      { key: "environment", label: "Environnement", type: "select", required: true, options: [
        { value: "sandbox", label: "Sandbox (Test)" },
        { value: "live", label: "Production" },
      ]},
    ],
  },
  {
    id: "mollie",
    name: "Mollie",
    description: "Paiements européens multidevises",
    logo: "https://cdn.brandfetch.io/idhY5E5Hu0/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idhY5E5Hu0/w/512/h/512/theme/dark/icon.png",
      "https://www.mollie.com/favicon.ico",
    ],
    category: "payment",
    status: "disconnected",
    color: "#000000",
    docsUrl: "https://docs.mollie.com/",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "live_..." },
    ],
  },
  // ========== STOCKAGE ==========
  {
    id: "aws-s3",
    name: "Amazon S3",
    description: "Stockage cloud pour fichiers volumineux",
    logo: "https://cdn.brandfetch.io/idexQAQv8I/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idexQAQv8I/w/512/h/512/theme/dark/icon.png",
      "https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png",
    ],
    category: "storage",
    status: "disconnected",
    color: "#FF9900",
    docsUrl: "https://docs.aws.amazon.com/s3/",
    fields: [
      { key: "accessKeyId", label: "Access Key ID", type: "text", required: true },
      { key: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
      { key: "bucket", label: "Nom du bucket", type: "text", required: true },
      { key: "region", label: "Région", type: "select", required: true, options: [
        { value: "eu-west-1", label: "Europe (Irlande)" },
        { value: "eu-west-3", label: "Europe (Paris)" },
        { value: "eu-central-1", label: "Europe (Francfort)" },
        { value: "us-east-1", label: "US East (N. Virginia)" },
      ]},
    ],
  },
  {
    id: "cloudflare-r2",
    name: "Cloudflare R2",
    description: "Stockage compatible S3 sans frais de sortie",
    logo: "https://svgl.app/library/cloudflare.svg",
    logoSources: [
      "https://svgl.app/library/cloudflare.svg",
      "https://cdn.brandfetch.io/id2eofWsmg/w/512/h/512/theme/dark/icon.png",
    ],
    category: "storage",
    status: "disconnected",
    color: "#F38020",
    docsUrl: "https://developers.cloudflare.com/r2/",
    fields: [
      { key: "accountId", label: "Account ID", type: "text", required: true },
      { key: "accessKeyId", label: "Access Key ID", type: "text", required: true },
      { key: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
      { key: "bucketName", label: "Nom du bucket", type: "text", required: true },
    ],
  },
  {
    id: "google-cloud-storage",
    name: "Google Cloud Storage",
    description: "Stockage cloud Google avec CDN intégré",
    logo: "https://cdn.brandfetch.io/id4k5_FADQ/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/id4k5_FADQ/w/512/h/512/theme/dark/icon.png",
      "https://svgl.app/library/gcp.svg",
    ],
    category: "storage",
    status: "disconnected",
    color: "#4285F4",
    docsUrl: "https://cloud.google.com/storage/docs",
    fields: [
      { key: "projectId", label: "Project ID", type: "text", required: true },
      { key: "clientEmail", label: "Service Account Email", type: "text", required: true },
      { key: "privateKey", label: "Private Key (JSON)", type: "password", required: true },
      { key: "bucketName", label: "Nom du bucket", type: "text", required: true },
    ],
  },
  // ========== IA ==========
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4 pour génération de contenu et quiz",
    logo: "https://svgl.app/library/openai.svg",
    logoSources: [
      "https://svgl.app/library/openai.svg",
      "https://cdn.brandfetch.io/idR3duQxYl/w/512/h/512/theme/dark/icon.png",
    ],
    category: "ai",
    status: "disconnected",
    color: "#00A67E",
    docsUrl: "https://platform.openai.com/docs",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-..." },
      { key: "organization", label: "Organization ID", type: "text", helpText: "Optionnel" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    description: "Claude pour génération de contenu pédagogique",
    logo: "https://cdn.brandfetch.io/idgPnRrJjJ/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idgPnRrJjJ/w/512/h/512/theme/dark/icon.png",
      "https://www.anthropic.com/favicon.ico",
    ],
    category: "ai",
    status: "disconnected",
    color: "#D97757",
    docsUrl: "https://docs.anthropic.com/",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-ant-..." },
    ],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "Synthèse vocale IA pour narration de cours",
    logo: "https://cdn.brandfetch.io/idWrIsoFL9/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idWrIsoFL9/w/512/h/512/theme/dark/icon.png",
      "https://elevenlabs.io/favicon.ico",
    ],
    category: "ai",
    status: "disconnected",
    color: "#000000",
    docsUrl: "https://docs.elevenlabs.io/",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },
  // ========== CALENDRIER ==========
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Synchronisation des sessions avec Google Calendar",
    logo: "https://cdn.brandfetch.io/idnrCPuv87/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idnrCPuv87/w/512/h/512/theme/dark/icon.png",
      "https://svgl.app/library/google-calendar.svg",
    ],
    category: "calendar",
    status: "disconnected",
    color: "#4285F4",
    docsUrl: "https://developers.google.com/calendar",
    fields: [
      { key: "clientId", label: "Client ID", type: "text", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
      { key: "refreshToken", label: "Refresh Token", type: "password" },
    ],
  },
  {
    id: "outlook-calendar",
    name: "Outlook Calendar",
    description: "Synchronisation avec Microsoft Outlook",
    logo: "https://cdn.brandfetch.io/idchmboHEZ/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idchmboHEZ/w/512/h/512/theme/dark/icon.png",
      "https://outlook.live.com/favicon.ico",
    ],
    category: "calendar",
    status: "disconnected",
    color: "#0078D4",
    docsUrl: "https://learn.microsoft.com/en-us/graph/outlook-calendar-concept-overview",
    fields: [
      { key: "tenantId", label: "Tenant ID", type: "text", required: true },
      { key: "clientId", label: "Client ID", type: "text", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
  },
  {
    id: "calendly",
    name: "Calendly",
    description: "Planification de rendez-vous et sessions",
    logo: "https://svgl.app/library/calendly.svg",
    logoSources: [
      "https://svgl.app/library/calendly.svg",
      "https://cdn.brandfetch.io/idz9UT3anx/w/512/h/512/theme/dark/icon.png",
    ],
    category: "calendar",
    status: "disconnected",
    color: "#006BFF",
    docsUrl: "https://developer.calendly.com/",
    webhookUrl: "/api/webhooks/calendly",
    fields: [
      { key: "accessToken", label: "Access Token", type: "password", required: true },
      { key: "webhookSigningKey", label: "Webhook Signing Key", type: "password" },
    ],
  },
  // ========== ANALYTICS ==========
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Analyse du trafic et comportement utilisateurs",
    logo: "https://cdn.brandfetch.io/idm3w36s7w/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idm3w36s7w/w/512/h/512/theme/dark/icon.png",
      "https://svgl.app/library/google-analytics.svg",
    ],
    category: "analytics",
    status: "disconnected",
    color: "#E37400",
    docsUrl: "https://developers.google.com/analytics",
    fields: [
      { key: "measurementId", label: "Measurement ID (GA4)", type: "text", required: true, placeholder: "G-XXXXXXXX" },
    ],
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    description: "Analytics produit avancé",
    logo: "https://cdn.brandfetch.io/idMzzeMP6u/w/512/h/512/theme/dark/icon.png",
    logoSources: [
      "https://cdn.brandfetch.io/idMzzeMP6u/w/512/h/512/theme/dark/icon.png",
      "https://mixpanel.com/favicon.ico",
    ],
    category: "analytics",
    status: "disconnected",
    color: "#7856FF",
    docsUrl: "https://developer.mixpanel.com/",
    fields: [
      { key: "projectToken", label: "Project Token", type: "password", required: true },
    ],
  },
];

// Catégories
const categories = [
  { id: "all", label: "Toutes", icon: <Plug className="w-4 h-4" /> },
  { id: "signature", label: "Signature", icon: <FileSignature className="w-4 h-4" /> },
  { id: "video", label: "Visioconférence", icon: <Video className="w-4 h-4" /> },
  { id: "lms", label: "LMS / xAPI", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
  { id: "sms", label: "SMS", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "payment", label: "Paiement", icon: <CreditCard className="w-4 h-4" /> },
  { id: "storage", label: "Stockage", icon: <Cloud className="w-4 h-4" /> },
  { id: "ai", label: "IA", icon: <Bot className="w-4 h-4" /> },
  { id: "calendar", label: "Calendrier", icon: <Calendar className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
];

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, "success" | "error" | null>>({});
  const [loading, setLoading] = useState(true);

  // Charger les configurations existantes
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await fetch("/api/admin/integrations");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || {});
      }
    } catch (error) {
      console.error("Erreur chargement configs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder une configuration
  const saveConfig = async (integrationId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId,
          config: configs[integrationId] || {},
        }),
      });

      if (res.ok) {
        setTestResults({ ...testResults, [integrationId]: null });
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  // Tester une connexion
  const testConnection = async (integrationId: string) => {
    setTesting(integrationId);
    setTestResults({ ...testResults, [integrationId]: null });

    try {
      const res = await fetch("/api/admin/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId,
          config: configs[integrationId] || {},
        }),
      });

      const data = await res.json();
      setTestResults({ ...testResults, [integrationId]: data.success ? "success" : "error" });
    } catch (error) {
      setTestResults({ ...testResults, [integrationId]: "error" });
    } finally {
      setTesting(null);
    }
  };

  // Mettre à jour un champ
  const updateField = (integrationId: string, key: string, value: string) => {
    setConfigs({
      ...configs,
      [integrationId]: {
        ...configs[integrationId],
        [key]: value,
      },
    });
  };

  // Toggle affichage secret
  const toggleSecret = (fieldKey: string) => {
    setShowSecrets({ ...showSecrets, [fieldKey]: !showSecrets[fieldKey] });
  };

  // Vérifier si une intégration est configurée
  const isConfigured = (integration: Integration) => {
    const config = configs[integration.id];
    if (!config) return false;
    return integration.fields
      .filter(f => f.required)
      .every(f => config[f.key] && config[f.key].trim() !== "");
  };

  // Filtrer les intégrations
  const filteredIntegrations = selectedCategory === "all"
    ? integrations
    : integrations.filter(i => i.category === selectedCategory);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Plug className="w-7 h-7 text-orange-500" />
          Intégrations
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Connectez des services externes pour enrichir votre plateforme
        </p>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map(integration => {
          const configured = isConfigured(integration);
          const testResult = testResults[integration.id];

          return (
            <div
              key={integration.id}
              onClick={() => setSelectedIntegration(integration)}
              className={`relative p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${
                configured
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {configured ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium">
                    <Check className="w-3 h-3" />
                    Connecté
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-medium">
                    <X className="w-3 h-3" />
                    Non configuré
                  </span>
                )}
              </div>

              {/* Logo */}
              <div className={`inline-flex p-2 rounded-xl mb-4 ${
                configured
                  ? "bg-green-100 dark:bg-green-900/50"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}>
                <IntegrationLogo integration={integration} size={40} />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {integration.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {integration.description}
              </p>

              {/* Test Result */}
              {testResult && (
                <div className={`mt-4 flex items-center gap-2 text-sm ${
                  testResult === "success" ? "text-green-600" : "text-red-600"
                }`}>
                  {testResult === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {testResult === "success" ? "Connexion réussie" : "Échec de connexion"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedIntegration(null)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <IntegrationLogo integration={selectedIntegration} size={48} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedIntegration.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedIntegration.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Documentation Link */}
              {selectedIntegration.docsUrl && (
                <a
                  href={selectedIntegration.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600"
                >
                  <ExternalLink className="w-4 h-4" />
                  Voir la documentation
                </a>
              )}

              {/* Webhook URL */}
              {selectedIntegration.webhookUrl && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                    <Webhook className="w-4 h-4" />
                    <span className="text-sm font-medium">URL Webhook</span>
                  </div>
                  <code className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                    {typeof window !== "undefined" ? window.location.origin : ""}{selectedIntegration.webhookUrl}
                  </code>
                </div>
              )}

              {/* Fields */}
              <div className="space-y-4">
                {selectedIntegration.fields.map(field => {
                  const fieldKey = `${selectedIntegration.id}_${field.key}`;
                  const value = configs[selectedIntegration.id]?.[field.key] || "";
                  const isSecret = field.type === "password";

                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.type === "select" ? (
                        <select
                          value={value}
                          onChange={(e) => updateField(selectedIntegration.id, field.key, e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Sélectionner...</option>
                          {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            type={isSecret && !showSecrets[fieldKey] ? "password" : "text"}
                            value={value}
                            onChange={(e) => updateField(selectedIntegration.id, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                          />
                          {isSecret && (
                            <button
                              type="button"
                              onClick={() => toggleSecret(fieldKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showSecrets[fieldKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      )}

                      {field.helpText && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => testConnection(selectedIntegration.id)}
                disabled={testing === selectedIntegration.id || !isConfigured(selectedIntegration)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {testing === selectedIntegration.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Tester la connexion
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => saveConfig(selectedIntegration.id)}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
