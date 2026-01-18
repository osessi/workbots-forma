// ===========================================
// API GÉNÉRATION PDF ÉMARGEMENT
// ===========================================
// GET /api/emargement/pdf/[sessionId] - Générer le PDF d'émargement pour une session
// Génère un document HTML avec les signatures réelles des participants et formateurs

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

// Types
interface SignatureData {
  id: string;
  signataire: string;
  participantId: string | null;
  intervenantId: string | null;
  periode: string;
  signedAt: Date;
  signatureData: string | null;
}

interface JourneeData {
  id: string;
  date: Date;
  heureDebutMatin: string | null;
  heureFinMatin: string | null;
  heureDebutAprem: string | null;
  heureFinAprem: string | null;
  feuillesEmargement: {
    id: string;
    signatures: SignatureData[];
  }[];
}

interface ParticipantInfo {
  id: string;
  nom: string;
  prenom: string;
  entreprise?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer l'organisation complète pour le PDF
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    // Récupérer la session avec toutes ses données
    const session = await prisma.documentSession.findUnique({
      where: { id: sessionId },
      include: {
        formation: {
          select: {
            titre: true,
          },
        },
        formateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        lieu: {
          select: {
            nom: true,
            lieuFormation: true,
            codePostal: true,
            ville: true,
          },
        },
        clients: {
          include: {
            entreprise: {
              select: {
                raisonSociale: true,
              },
            },
            participants: {
              include: {
                apprenant: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                  },
                },
              },
            },
          },
        },
        journees: {
          orderBy: { date: "asc" },
          include: {
            feuillesEmargement: {
              include: {
                signatures: {
                  select: {
                    id: true,
                    signataire: true,
                    participantId: true,
                    intervenantId: true,
                    periode: true,
                    signedAt: true,
                    signatureData: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    if (session.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Extraire tous les participants de la session
    const participants: ParticipantInfo[] = [];
    session.clients.forEach((client) => {
      client.participants.forEach((p) => {
        participants.push({
          id: p.id,
          nom: p.apprenant.nom,
          prenom: p.apprenant.prenom,
          entreprise: client.entreprise?.raisonSociale,
        });
      });
    });

    // Calculer les dates de début et fin à partir des journées
    const journeesSorted = session.journees.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const dateDebut = journeesSorted[0]?.date || new Date();
    const dateFin = journeesSorted[journeesSorted.length - 1]?.date || new Date();

    // Calculer la durée totale en heures (approximatif basé sur les journées)
    const dureeHeures = journeesSorted.length * 7; // 7h par jour en moyenne

    // Générer le HTML du document
    const html = generateEmargementHTML({
      organization: organization!,
      formation: {
        titre: session.formation.titre,
        dureeHeures,
      },
      session: {
        dateDebut,
        dateFin,
        lieu: session.lieu,
        formateur: session.formateur,
        modalite: session.modalite,
      },
      participants,
      journees: session.journees as unknown as JourneeData[],
    });

    // Retourner le HTML (le frontend pourra le convertir en PDF)
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Erreur génération PDF émargement:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}

// Fonction pour générer le HTML d'émargement
function generateEmargementHTML(data: {
  organization: {
    name: string;
    nomCommercial?: string | null;
    logo: string | null;
    cachet: string | null;
    signature?: string | null;
    numeroFormateur: string | null;
    prefectureRegion?: string | null;
    siret: string | null;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
    telephone: string | null;
    email: string | null;
    siteWeb?: string | null;
  };
  formation: {
    titre: string;
    dureeHeures: number;
  };
  session: {
    dateDebut: Date;
    dateFin: Date;
    lieu: {
      nom: string;
      lieuFormation: string;
      codePostal: string | null;
      ville: string | null;
    } | null;
    formateur: {
      id: string;
      nom: string;
      prenom: string;
    } | null;
    modalite: string;
  };
  participants: ParticipantInfo[];
  journees: JourneeData[];
}): string {
  const { organization, formation, session, participants, journees } = data;

  // Helper pour formater les dates
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateShort = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  // Fonction pour obtenir la signature d'un participant pour une journée/période
  const getSignature = (
    journee: JourneeData,
    participantId: string,
    periode: "matin" | "apres_midi"
  ): string | null => {
    for (const feuille of journee.feuillesEmargement) {
      const sig = feuille.signatures.find(
        (s) => s.signataire === "participant" && s.participantId === participantId && s.periode === periode
      );
      if (sig?.signatureData) {
        return sig.signatureData;
      }
    }
    return null;
  };

  // Fonction pour obtenir la signature du formateur pour une journée/période
  const getFormateurSignature = (
    journee: JourneeData,
    periode: "matin" | "apres_midi"
  ): string | null => {
    for (const feuille of journee.feuillesEmargement) {
      const sig = feuille.signatures.find(
        (s) => s.signataire === "formateur" && s.periode === periode
      );
      if (sig?.signatureData) {
        return sig.signatureData;
      }
    }
    return null;
  };

  // Générer les colonnes pour chaque demi-journée
  const generateColumns = () => {
    const columns: { journee: JourneeData; periode: "matin" | "apres_midi"; label: string }[] = [];

    journees.forEach((j) => {
      const dateLabel = formatDateShort(j.date);
      if (j.heureDebutMatin && j.heureFinMatin) {
        columns.push({ journee: j, periode: "matin", label: `${dateLabel}\nMatin` });
      }
      if (j.heureDebutAprem && j.heureFinAprem) {
        columns.push({ journee: j, periode: "apres_midi", label: `${dateLabel}\nAprès-midi` });
      }
    });

    return columns;
  };

  const columns = generateColumns();

  // Générer le tableau des participants avec signatures
  const generateParticipantRows = () => {
    return participants.map((p, index) => {
      const cells = columns.map((col) => {
        const sig = getSignature(col.journee, p.id, col.periode);
        if (sig) {
          return `<td class="signature-cell signed"><img src="${sig}" alt="Signature" class="signature-img" /></td>`;
        }
        return '<td class="signature-cell empty"></td>';
      }).join("");

      return `
        <tr>
          <td class="participant-num">${index + 1}</td>
          <td class="participant-name">${p.prenom} ${p.nom}</td>
          <td class="participant-company">${p.entreprise || "-"}</td>
          ${cells}
        </tr>
      `;
    }).join("");
  };

  // Générer la ligne formateur avec signatures
  const generateFormateurRow = () => {
    if (!session.formateur) return "";

    const cells = columns.map((col) => {
      const sig = getFormateurSignature(col.journee, col.periode);
      if (sig) {
        return `<td class="signature-cell signed"><img src="${sig}" alt="Signature formateur" class="signature-img" /></td>`;
      }
      return '<td class="signature-cell empty"></td>';
    }).join("");

    return `
      <tr class="formateur-row">
        <td colspan="3" class="formateur-label">
          <strong>Formateur :</strong> ${session.formateur.prenom} ${session.formateur.nom}
        </td>
        ${cells}
      </tr>
    `;
  };

  // Construire le nom de l'organisation (nom commercial ou raison sociale)
  const orgDisplayName = organization.nomCommercial || organization.name;
  const orgLegalName = organization.nomCommercial && organization.name !== organization.nomCommercial
    ? organization.name
    : null;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feuille d'émargement - ${formation.titre}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10px;
      line-height: 1.4;
      color: #333;
      background: white;
    }

    .container {
      max-width: 100%;
      padding: 15px;
    }

    /* Header avec logo seulement */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: 12px;
      border-bottom: 2px solid #4F46E5;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      max-height: 50px;
      max-width: 120px;
      object-fit: contain;
    }

    .org-header-info {
      font-size: 9px;
      color: #666;
    }

    .org-header-info h1 {
      font-size: 13px;
      color: #333;
      margin-bottom: 2px;
    }

    .org-header-info .legal-name {
      font-size: 8px;
      color: #888;
      font-style: italic;
    }

    .header-right {
      text-align: right;
      font-size: 8px;
      color: #666;
    }

    /* Titre du document */
    .document-title {
      text-align: center;
      margin-bottom: 15px;
    }

    .document-title h2 {
      font-size: 16px;
      color: #4F46E5;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 3px;
    }

    /* Informations formation */
    .formation-info {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 15px;
    }

    .formation-info h3 {
      font-size: 12px;
      color: #1E293B;
      margin-bottom: 8px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .info-item {
      font-size: 9px;
    }

    .info-item label {
      font-weight: 600;
      color: #64748B;
      display: block;
      margin-bottom: 1px;
    }

    .info-item span {
      color: #1E293B;
    }

    /* Tableau d'émargement */
    .emargement-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 9px;
    }

    .emargement-table th,
    .emargement-table td {
      border: 1px solid #CBD5E1;
      padding: 5px 3px;
      text-align: center;
      vertical-align: middle;
    }

    .emargement-table th {
      background: #4F46E5;
      color: white;
      font-weight: 600;
      font-size: 8px;
    }

    .emargement-table th.date-header {
      white-space: pre-line;
      min-width: 65px;
    }

    .participant-num {
      width: 25px;
      font-weight: 600;
      background: #F8FAFC;
    }

    .participant-name {
      text-align: left;
      padding-left: 6px !important;
      min-width: 130px;
      font-weight: 500;
    }

    .participant-company {
      text-align: left;
      padding-left: 6px !important;
      min-width: 100px;
      color: #64748B;
      font-size: 8px;
    }

    .signature-cell {
      width: 65px;
      height: 35px;
      background: #FAFAFA;
      padding: 2px !important;
    }

    .signature-cell.empty {
      background: #F1F5F9;
    }

    .signature-cell.signed {
      background: #F0FDF4;
    }

    .signature-img {
      max-width: 60px;
      max-height: 30px;
      object-fit: contain;
    }

    .formateur-row {
      background: #EEF2FF;
    }

    .formateur-row td {
      border-top: 2px solid #4F46E5;
    }

    .formateur-label {
      text-align: left !important;
      padding-left: 8px !important;
      font-size: 9px;
    }

    /* Section cachet et signature en bas */
    .bottom-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
    }

    .cachet-signature-section {
      display: flex;
      gap: 30px;
      align-items: flex-start;
    }

    .stamp-box {
      text-align: center;
    }

    .stamp-box .label {
      font-size: 8px;
      color: #64748B;
      margin-bottom: 5px;
    }

    .stamp-box .stamp-area {
      border: 1px dashed #CBD5E1;
      min-width: 100px;
      min-height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FAFAFA;
      border-radius: 4px;
    }

    .stamp-box .stamp-area img {
      max-width: 95px;
      max-height: 65px;
      object-fit: contain;
    }

    .stamp-box .stamp-area.empty {
      font-size: 7px;
      color: #94A3B8;
    }

    /* Footer avec infos organisation */
    .footer {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #E2E8F0;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .footer-org-info {
      font-size: 7px;
      color: #64748B;
      line-height: 1.5;
    }

    .footer-org-info .org-name {
      font-weight: 600;
      color: #1E293B;
      font-size: 8px;
    }

    .footer-org-info .legal-info {
      margin-top: 3px;
    }

    .footer-legal {
      font-size: 7px;
      color: #94A3B8;
      max-width: 40%;
      text-align: right;
    }

    .footer-legal p {
      margin-bottom: 2px;
    }

    .footer-date {
      font-size: 7px;
      color: #94A3B8;
      margin-top: 5px;
    }

    /* Print styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .container {
        padding: 0;
        min-height: auto;
      }

      .emargement-table th {
        background: #4F46E5 !important;
        color: white !important;
      }

      .signature-cell.signed {
        background: #F0FDF4 !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header avec logo -->
    <header class="header">
      <div class="logo-section">
        ${organization.logo ? `<img src="${organization.logo}" alt="Logo" class="logo" />` : ""}
        <div class="org-header-info">
          <h1>${orgDisplayName}</h1>
          ${orgLegalName ? `<div class="legal-name">${orgLegalName}</div>` : ""}
        </div>
      </div>
      <div class="header-right">
        ${organization.numeroFormateur ? `<div>N° d'activité : ${organization.numeroFormateur}</div>` : ""}
        ${organization.prefectureRegion ? `<div>Enregistré auprès de la préfecture ${organization.prefectureRegion}</div>` : ""}
      </div>
    </header>

    <!-- Titre -->
    <div class="document-title">
      <h2>Feuille d'émargement</h2>
    </div>

    <!-- Informations formation -->
    <div class="formation-info">
      <h3>${formation.titre}</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>Période</label>
          <span>${formatDate(session.dateDebut)}${session.dateFin && session.dateFin !== session.dateDebut ? ` au ${formatDate(session.dateFin)}` : ""}</span>
        </div>
        <div class="info-item">
          <label>Durée</label>
          <span>${formation.dureeHeures} heures</span>
        </div>
        <div class="info-item">
          <label>Modalité</label>
          <span>${session.modalite === "PRESENTIEL" ? "Présentiel" : session.modalite === "DISTANCIEL" ? "Distanciel" : "Mixte"}</span>
        </div>
        ${session.lieu ? `
        <div class="info-item">
          <label>Lieu</label>
          <span>${session.lieu.lieuFormation}${session.lieu.ville ? `, ${session.lieu.ville}` : ""}</span>
        </div>
        ` : ""}
        ${session.formateur ? `
        <div class="info-item">
          <label>Formateur</label>
          <span>${session.formateur.prenom} ${session.formateur.nom}</span>
        </div>
        ` : ""}
        <div class="info-item">
          <label>Nombre de participants</label>
          <span>${participants.length}</span>
        </div>
      </div>
    </div>

    <!-- Tableau d'émargement -->
    <table class="emargement-table">
      <thead>
        <tr>
          <th>N°</th>
          <th>Nom et Prénom</th>
          <th>Entreprise</th>
          ${columns.map((col) => `<th class="date-header">${col.label}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${generateParticipantRows()}
        ${generateFormateurRow()}
      </tbody>
    </table>

    <!-- Section cachet et signature en bas -->
    <div class="bottom-section">
      <div class="cachet-signature-section">
        <div class="stamp-box">
          <div class="label">Cachet de l'organisme</div>
          <div class="stamp-area ${organization.cachet ? "" : "empty"}">
            ${organization.cachet
              ? `<img src="${organization.cachet}" alt="Cachet" />`
              : "Emplacement cachet"}
          </div>
        </div>
        <div class="stamp-box">
          <div class="label">Signature du responsable</div>
          <div class="stamp-area ${organization.signature ? "" : "empty"}">
            ${organization.signature
              ? `<img src="${organization.signature}" alt="Signature" />`
              : "Emplacement signature"}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer avec infos organisation complètes -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-org-info">
          <div class="org-name">${orgDisplayName}${orgLegalName ? ` (${orgLegalName})` : ""}</div>
          ${organization.adresse || organization.codePostal || organization.ville ? `
          <div>${[organization.adresse, `${organization.codePostal || ""} ${organization.ville || ""}`.trim()].filter(Boolean).join(" - ")}</div>
          ` : ""}
          <div class="legal-info">
            ${organization.siret ? `SIRET : ${organization.siret}` : ""}
            ${organization.siret && organization.numeroFormateur ? " | " : ""}
            ${organization.numeroFormateur ? `N° de déclaration d'activité : ${organization.numeroFormateur}` : ""}
            ${organization.prefectureRegion ? ` (Préfecture ${organization.prefectureRegion})` : ""}
          </div>
          ${organization.telephone || organization.email ? `
          <div>
            ${organization.telephone ? `Tél : ${organization.telephone}` : ""}
            ${organization.telephone && organization.email ? " | " : ""}
            ${organization.email ? `Email : ${organization.email}` : ""}
          </div>
          ` : ""}
          ${organization.siteWeb ? `<div>Site web : ${organization.siteWeb}</div>` : ""}
        </div>
        <div class="footer-legal">
          <p>Les signataires reconnaissent avoir assisté à la formation aux dates et heures indiquées.</p>
          <p>Ce document ne peut être modifié après signature et fait foi en cas de contrôle.</p>
          <div class="footer-date">
            Document généré le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>
  `;
}
