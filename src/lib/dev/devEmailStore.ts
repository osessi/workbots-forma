// ===========================================
// DEV EMAIL STORE
// ===========================================
// Store temporaire pour les emails en développement

// Store temporaire pour les emails (en mémoire)
// En production, utilisez une base de données ou un service comme Mailhog
declare global {
  // eslint-disable-next-line no-var
  var devEmails: Array<{
    id: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    sentAt: Date;
    organizationId?: string;
    type?: string;
  }>;
}

if (!global.devEmails) {
  global.devEmails = [];
}

// Fonction utilitaire pour ajouter un email au store
export function addDevEmail(email: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  organizationId?: string;
}) {
  if (process.env.NODE_ENV !== "production") {
    global.devEmails.push({
      id: Math.random().toString(36).substring(7),
      to: Array.isArray(email.to) ? email.to.join(", ") : email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      sentAt: new Date(),
      organizationId: email.organizationId,
    });

    // Garder seulement les 100 derniers
    if (global.devEmails.length > 100) {
      global.devEmails = global.devEmails.slice(-100);
    }
  }
}

// Récupérer tous les emails dev
export function getDevEmails() {
  return global.devEmails;
}

// Effacer un email spécifique
export function deleteDevEmail(emailId: string) {
  global.devEmails = global.devEmails.filter(e => e.id !== emailId);
}

// Effacer tous les emails
export function clearDevEmails() {
  global.devEmails = [];
}
