// ===========================================
// API ADMIN EMAIL TEMPLATES SEED - Initialiser les templates par défaut
// ===========================================

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Templates emails par défaut
const defaultTemplates = [
  // LMS Templates
  {
    id: "lms-invitation",
    name: "Invitation LMS",
    subject: "Bienvenue sur votre espace de formation - {{formation.titre}}",
    category: "lms",
    variables: ["apprenant.prenom", "apprenant.nom", "formation.titre", "formation.description", "lien_acces", "organisation.nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Bienvenue sur votre formation</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{apprenant.prenom}} {{apprenant.nom}}</strong>,</p>
      <p>Vous êtes inscrit(e) à la formation :</p>
      <h2 style="color: #667eea;">{{formation.titre}}</h2>
      <p>{{formation.description}}</p>
      <p>Votre espace de formation est maintenant accessible. Vous pouvez suivre les modules à votre rythme.</p>
      <center>
        <a href="{{lien_acces}}" class="button">Accéder à ma formation</a>
      </center>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      <p>Bonne formation !</p>
    </div>
    <div class="footer">
      <p>{{organisation.nom}} - Cet email a été envoyé automatiquement.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: "lms-rappel",
    name: "Rappel début formation LMS",
    subject: "Votre formation {{formation.titre}} commence bientôt !",
    category: "lms",
    variables: ["apprenant.prenom", "formation.titre", "date_debut", "lien_acces", "organisation.nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .info-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Rappel - Votre formation commence !</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{apprenant.prenom}}</strong>,</p>
      <p>Nous vous rappelons que votre formation <strong>{{formation.titre}}</strong> est disponible.</p>
      <div class="info-box">
        <strong>📅 Date de début prévue :</strong> {{date_debut}}
      </div>
      <p>N'oubliez pas de vous connecter pour commencer votre parcours de formation.</p>
      <center>
        <a href="{{lien_acces}}" class="button">Commencer ma formation</a>
      </center>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: "lms-completion",
    name: "Formation terminée LMS",
    subject: "Félicitations ! Vous avez terminé {{formation.titre}}",
    category: "lms",
    variables: ["apprenant.prenom", "apprenant.nom", "formation.titre", "note_finale", "temps_total", "lien_certificat", "organisation.nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #11998e; }
    .button { display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Félicitations !</h1>
    </div>
    <div class="content">
      <p>Bravo <strong>{{apprenant.prenom}} {{apprenant.nom}}</strong> !</p>
      <p>Vous avez terminé avec succès la formation <strong>{{formation.titre}}</strong>.</p>
      <table width="100%" style="margin: 20px 0; text-align: center;">
        <tr>
          <td style="padding: 15px; background: #f8f9fa; border-radius: 6px;">
            <div style="font-size: 28px; font-weight: bold; color: #11998e;">{{note_finale}}%</div>
            <div style="color: #666;">Score obtenu</div>
          </td>
          <td style="width: 20px;"></td>
          <td style="padding: 15px; background: #f8f9fa; border-radius: 6px;">
            <div style="font-size: 28px; font-weight: bold; color: #11998e;">{{temps_total}}</div>
            <div style="color: #666;">Temps de formation</div>
          </td>
        </tr>
      </table>
      <p>Votre certificat de réussite est maintenant disponible.</p>
      <center>
        <a href="{{lien_certificat}}" class="button">📜 Télécharger mon certificat</a>
      </center>
    </div>
  </div>
</body>
</html>`,
  },

  // Signature Templates
  {
    id: "signature-demande",
    name: "Demande de signature",
    subject: "Document à signer : {{document.titre}}",
    category: "signature",
    variables: ["destinataire.nom", "document.titre", "document.type", "expediteur.nom", "lien_signature", "date_expiration", "organisation.nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .document-info { background: #f8f9fa; border-left: 4px solid #4facfe; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; font-size: 13px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✍️ Document à signer</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{destinataire.nom}}</strong>,</p>
      <p><strong>{{expediteur.nom}}</strong> vous a envoyé un document à signer électroniquement.</p>
      <div class="document-info">
        <strong>📄 Document :</strong> {{document.titre}}<br>
        <strong>📋 Type :</strong> {{document.type}}
      </div>
      <center>
        <a href="{{lien_signature}}" class="button">Signer le document</a>
      </center>
      <div class="warning">
        ⚠️ Ce lien expire le <strong>{{date_expiration}}</strong>. Veuillez signer avant cette date.
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: "signature-rappel",
    name: "Rappel signature",
    subject: "Rappel : Document en attente de signature - {{document.titre}}",
    category: "signature",
    variables: ["destinataire.nom", "document.titre", "lien_signature", "date_expiration", "jours_restants"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .urgence { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Rappel de signature</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{destinataire.nom}}</strong>,</p>
      <p>Nous vous rappelons qu'un document attend votre signature :</p>
      <h3 style="color: #fa709a;">{{document.titre}}</h3>
      <div class="urgence">
        <strong>Il vous reste {{jours_restants}} jour(s)</strong> pour signer ce document.<br>
        Date limite : {{date_expiration}}
      </div>
      <center>
        <a href="{{lien_signature}}" class="button">Signer maintenant</a>
      </center>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: "signature-confirmee",
    name: "Signature confirmée",
    subject: "✅ Document signé avec succès - {{document.titre}}",
    category: "signature",
    variables: ["destinataire.nom", "document.titre", "date_signature", "lien_document", "organisation.nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Signature confirmée</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{destinataire.nom}}</strong>,</p>
      <div class="success">
        <strong>Votre signature a été enregistrée avec succès !</strong>
      </div>
      <p><strong>Document :</strong> {{document.titre}}</p>
      <p><strong>Date de signature :</strong> {{date_signature}}</p>
      <p>Une copie du document signé est disponible ci-dessous :</p>
      <center>
        <a href="{{lien_document}}" class="button">📥 Télécharger le document signé</a>
      </center>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        Ce document a valeur légale de signature électronique conformément au règlement eIDAS.
      </p>
    </div>
  </div>
</body>
</html>`,
  },

  // Classe virtuelle Templates
  {
    id: "classe-virtuelle-convocation",
    name: "Convocation classe virtuelle",
    subject: "📹 Convocation : {{session.titre}} - {{session.date}}",
    category: "classe-virtuelle",
    variables: ["participant.prenom", "participant.nom", "session.titre", "session.date", "session.heure_debut", "session.heure_fin", "session.formateur", "lien_connexion", "organisation.nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .session-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .session-info table { width: 100%; }
    .session-info td { padding: 8px 0; }
    .session-info .label { color: #666; width: 120px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .tips { background: #e7f3ff; border: 1px solid #b6d4fe; padding: 15px; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📹 Classe Virtuelle</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{participant.prenom}} {{participant.nom}}</strong>,</p>
      <p>Vous êtes convoqué(e) à une session de formation en classe virtuelle :</p>
      <div class="session-info">
        <table>
          <tr>
            <td class="label">📚 Formation</td>
            <td><strong>{{session.titre}}</strong></td>
          </tr>
          <tr>
            <td class="label">📅 Date</td>
            <td><strong>{{session.date}}</strong></td>
          </tr>
          <tr>
            <td class="label">🕐 Horaires</td>
            <td>{{session.heure_debut}} - {{session.heure_fin}}</td>
          </tr>
          <tr>
            <td class="label">👨‍🏫 Formateur</td>
            <td>{{session.formateur}}</td>
          </tr>
        </table>
      </div>
      <center>
        <a href="{{lien_connexion}}" class="button">🎥 Rejoindre la classe virtuelle</a>
      </center>
      <div class="tips">
        <strong>💡 Conseils :</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Testez votre connexion avant la session</li>
          <li>Utilisez un casque pour une meilleure qualité audio</li>
          <li>Installez-vous dans un endroit calme</li>
        </ul>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: "classe-virtuelle-rappel",
    name: "Rappel classe virtuelle (1h avant)",
    subject: "⏰ Rappel : Votre classe virtuelle commence dans 1 heure !",
    category: "classe-virtuelle",
    variables: ["participant.prenom", "session.titre", "session.heure_debut", "lien_connexion"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .countdown { font-size: 48px; text-align: center; color: #f5576c; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ C'est bientôt l'heure !</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{participant.prenom}}</strong>,</p>
      <div class="countdown">1h</div>
      <p style="text-align: center;">Votre classe virtuelle <strong>{{session.titre}}</strong> commence à <strong>{{session.heure_debut}}</strong>.</p>
      <center>
        <a href="{{lien_connexion}}" class="button">🎥 Rejoindre maintenant</a>
      </center>
    </div>
  </div>
</body>
</html>`,
  },

  // Émargement Templates
  {
    id: "emargement-invitation",
    name: "Invitation émargement",
    subject: "📝 Émargement requis - {{session.titre}}",
    category: "emargement",
    variables: ["participant.prenom", "participant.nom", "session.titre", "session.date", "periode", "lien_emargement", "organisation.nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .button { display: inline-block; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .info { background: #f0fff4; border-left: 4px solid #43e97b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 Émargement</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{participant.prenom}} {{participant.nom}}</strong>,</p>
      <p>Merci de bien vouloir émarger pour confirmer votre présence à la formation.</p>
      <div class="info">
        <strong>📚 Formation :</strong> {{session.titre}}<br>
        <strong>📅 Date :</strong> {{session.date}}<br>
        <strong>🕐 Période :</strong> {{periode}}
      </div>
      <center>
        <a href="{{lien_emargement}}" class="button">✍️ Émarger maintenant</a>
      </center>
      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        Ce lien est personnel et sécurisé. Il permet de valider votre présence de manière électronique.
      </p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: "emargement-recapitulatif",
    name: "Récapitulatif émargement",
    subject: "📊 Récapitulatif de présence - {{session.titre}}",
    category: "emargement",
    variables: ["destinataire.nom", "session.titre", "session.dates", "nb_participants", "taux_presence", "lien_rapport", "organisation.nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; flex: 1; margin: 0 10px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #667eea; }
    .stat-label { color: #666; font-size: 14px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Récapitulatif de présence</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{destinataire.nom}}</strong>,</p>
      <p>Voici le récapitulatif des émargements pour la formation :</p>
      <h3 style="color: #667eea;">{{session.titre}}</h3>
      <p><strong>Dates :</strong> {{session.dates}}</p>
      <table width="100%" style="margin: 20px 0;">
        <tr>
          <td style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea;">{{nb_participants}}</div>
            <div style="color: #666;">Participants</div>
          </td>
          <td style="width: 20px;"></td>
          <td style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 32px; font-weight: bold; color: #11998e;">{{taux_presence}}%</div>
            <div style="color: #666;">Taux de présence</div>
          </td>
        </tr>
      </table>
      <center>
        <a href="{{lien_rapport}}" class="button">📄 Voir le rapport complet</a>
      </center>
    </div>
  </div>
</body>
</html>`,
  },

  // Utilisateur Templates
  {
    id: "user-welcome",
    name: "Bienvenue utilisateur",
    subject: "Bienvenue sur {{organisation.nom}} !",
    category: "utilisateur",
    variables: ["user.prenom", "user.nom", "user.email", "organisation.nom", "lien_connexion"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .features { margin: 20px 0; }
    .feature { display: flex; align-items: center; padding: 10px 0; }
    .feature-icon { width: 40px; height: 40px; background: #f0f0ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 20px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenue !</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{user.prenom}} {{user.nom}}</strong>,</p>
      <p>Votre compte sur <strong>{{organisation.nom}}</strong> a été créé avec succès.</p>
      <p><strong>Email de connexion :</strong> {{user.email}}</p>
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📚</div>
          <div>Gérez vos formations et modules</div>
        </div>
        <div class="feature">
          <div class="feature-icon">👥</div>
          <div>Suivez vos apprenants</div>
        </div>
        <div class="feature">
          <div class="feature-icon">📄</div>
          <div>Générez des documents automatiquement</div>
        </div>
      </div>
      <center>
        <a href="{{lien_connexion}}" class="button">Se connecter</a>
      </center>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: "user-invitation",
    name: "Invitation organisation",
    subject: "Invitation à rejoindre {{organisation.nom}}",
    category: "utilisateur",
    variables: ["inviteur.nom", "organisation.nom", "role", "lien_invitation", "date_expiration"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .invitation-box { background: #f0f9ff; border: 2px dashed #4facfe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Vous êtes invité(e) !</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p><strong>{{inviteur.nom}}</strong> vous invite à rejoindre <strong>{{organisation.nom}}</strong>.</p>
      <div class="invitation-box">
        <p style="margin: 0;">Vous avez été invité(e) en tant que</p>
        <p style="font-size: 24px; font-weight: bold; color: #4facfe; margin: 10px 0;">{{role}}</p>
      </div>
      <center>
        <a href="{{lien_invitation}}" class="button">Accepter l'invitation</a>
      </center>
      <p style="font-size: 13px; color: #666; margin-top: 20px; text-align: center;">
        Cette invitation expire le {{date_expiration}}
      </p>
    </div>
  </div>
</body>
</html>`,
  },

  // Notification Templates
  {
    id: "notification-generic",
    name: "Notification générique",
    subject: "{{notification.titre}}",
    category: "notification",
    variables: ["destinataire.nom", "notification.titre", "notification.message", "lien_action", "bouton_texte", "organisation.nom"],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{notification.titre}}</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{destinataire.nom}}</strong>,</p>
      <p>{{notification.message}}</p>
      <center>
        <a href="{{lien_action}}" class="button">{{bouton_texte}}</a>
      </center>
    </div>
    <div class="footer">
      <p>{{organisation.nom}}</p>
    </div>
  </div>
</body>
</html>`,
  },
];

// Vérifier que l'utilisateur est super admin
async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );

  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  if (!user?.isSuperAdmin) return null;
  return user;
}

// POST - Initialiser les templates par défaut
export async function POST() {
  try {
    const user = await checkSuperAdmin();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    let created = 0;
    let skipped = 0;

    for (const template of defaultTemplates) {
      const key = `email_template_${template.id}`;

      // Vérifier si le template existe déjà
      const existing = await prisma.globalConfig.findUnique({
        where: { key },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Créer le template
      const templateData = {
        name: template.name,
        subject: template.subject,
        category: template.category,
        content: template.content,
        variables: template.variables,
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await prisma.globalConfig.create({
        data: {
          key,
          value: JSON.stringify(templateData),
          description: `Template email par défaut: ${template.name}`,
        },
      });

      created++;
    }

    // Log l'action
    await prisma.auditLog.create({
      data: {
        action: "SEED_EMAIL_TEMPLATES",
        entity: "EmailTemplate",
        userId: user.id,
        details: { created, skipped, total: defaultTemplates.length },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${created} templates créés, ${skipped} déjà existants`,
      created,
      skipped,
    });
  } catch (error) {
    console.error("Erreur seed templates email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation des templates" },
      { status: 500 }
    );
  }
}
