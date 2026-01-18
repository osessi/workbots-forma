// ===========================================
// API GENERATION DE DOCUMENTS
// ===========================================
// POST /api/documents/generate
// Génère un document à partir d'un template et des données de formation

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { renderTemplate, generateTestContext } from "@/lib/templates";
import { DocumentType } from "@prisma/client";
import { authenticateUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Authentification (avec support impersonation)
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { formationId, documentType, templateId } = body;

    if (!formationId || !documentType) {
      return NextResponse.json(
        { error: "formationId et documentType sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que la formation appartient à l'organisation de l'utilisateur
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      include: {
        modules: {
          orderBy: { ordre: "asc" },
        },
        user: true,
        organization: true,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Trouver le template à utiliser
    // Priorité: templateId spécifié > template org > template système
    let template = null;

    if (templateId) {
      template = await prisma.template.findFirst({
        where: {
          id: templateId,
          isActive: true,
          OR: [
            { organizationId: user.organizationId },
            { isSystem: true },
          ],
        },
      });
    }

    if (!template) {
      // Chercher un template pour ce type de document
      template = await prisma.template.findFirst({
        where: {
          documentType: documentType as DocumentType,
          isActive: true,
          OR: [
            { organizationId: user.organizationId },
            { isSystem: true },
          ],
        },
        orderBy: [
          // Priorité aux templates de l'organisation
          { organizationId: "desc" },
          { createdAt: "desc" },
        ],
      });
    }

    if (!template) {
      return NextResponse.json(
        { error: `Aucun template trouvé pour le type ${documentType}` },
        { status: 404 }
      );
    }

    // Construire le contexte avec les vraies données
    const fichePedagogique = formation.fichePedagogique as Record<string, unknown> || {};

    const context = {
      formation: {
        titre: formation.titre,
        description: formation.description || "",
        duree: fichePedagogique.duree as string || "",
        duree_heures: fichePedagogique.dureeHeures as number || 0,
        duree_jours: fichePedagogique.dureeJours as number || 0,
        prix: fichePedagogique.prix as number || 0,
        prix_ttc: fichePedagogique.prixTTC as number || 0,
        objectifs: fichePedagogique.objectifs as string[] || [],
        prerequis: fichePedagogique.prerequis as string[] || [],
        public_vise: fichePedagogique.publicVise as string[] || [],
        modalites: fichePedagogique.modalites as string || "Présentiel",
        lieu: fichePedagogique.lieu as string || "",
        accessibilite: fichePedagogique.accessibilite as string || "",
        evaluation: fichePedagogique.evaluation as string || "",
        certification: fichePedagogique.certification as string || "",
        dates: {
          debut: "",
          fin: "",
        },
        participants_max: fichePedagogique.participantsMax as number || 12,
      },
      // Filtrer les modules normaux (exclure Module 0)
      modules: formation.modules
        .filter((m) => !m.isModuleZero)
        .map((m, index) => ({
          numero: index + 1,
          titre: m.titre,
          duree: m.duree ? `${Math.floor(m.duree / 60)}h${m.duree % 60 > 0 ? (m.duree % 60).toString().padStart(2, '0') : ''}` : "",
          duree_heures: m.duree || 0,
          objectifs: (m.contenu as Record<string, unknown>)?.objectifs as string[] || [],
          contenu: (m.contenu as Record<string, unknown>)?.contenu as string[] || [],
        })),
      // Module 0 de mise à niveau (Qualiopi IND 10) - non comptabilisé dans la durée
      module_zero: (() => {
        const moduleZero = formation.modules.find((m) => m.isModuleZero);
        if (!moduleZero) return null;
        return {
          titre: moduleZero.titre,
          description: moduleZero.description || "",
          duree: moduleZero.duree ? `${Math.floor(moduleZero.duree / 60)}h${moduleZero.duree % 60 > 0 ? (moduleZero.duree % 60).toString().padStart(2, '0') : ''}` : "",
          objectifs: (moduleZero.contenu as Record<string, unknown>)?.prerequisCibles as string[] || [],
          contenu: (moduleZero.contenu as Record<string, unknown>)?.contenu as Array<{section: string; points: string[]}> || [],
          note: "Ce module de mise à niveau est proposé aux apprenants dont le score de positionnement est insuffisant. Sa durée n'est pas comptabilisée dans la durée totale de la formation.",
        };
      })(),
      organisation: {
        nom: formation.organization.name,
        siret: formation.organization.siret || "",
        numero_da: formation.organization.numeroFormateur || "",
        adresse: formation.organization.adresse || "",
        code_postal: formation.organization.codePostal || "",
        ville: formation.organization.ville || "",
        telephone: formation.organization.telephone || "",
        email: formation.organization.email || "",
        logo: formation.organization.logo || "",
        representant: formation.organization.representantLegal || "",
        prefecture_region: formation.organization.prefectureRegion || "",
      },
      formateur: {
        nom: formation.user.lastName || "",
        prenom: formation.user.firstName || "",
        email: formation.user.email,
        telephone: formation.user.phone || "",
        specialite: "",
      },
      dates: {
        jour: new Date().getDate().toString(),
        mois: (new Date().getMonth() + 1).toString().padStart(2, "0"),
        annee: new Date().getFullYear().toString(),
        date_complete: new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        date_courte: new Date().toLocaleDateString("fr-FR"),
      },
      document: {
        titre: template.name,
        type: documentType,
        version: "1",
        date_creation: new Date().toLocaleDateString("fr-FR"),
      },
      // Ces champs seront remplis si une session/entreprise est spécifiée
      entreprise: {
        nom: "",
        siret: "",
        adresse: "",
        code_postal: "",
        ville: "",
        representant: "",
      },
      participants: [],
      signature: {
        responsable_organisme: formation.organization.signature || "",
      },
    };

    // Rendre le template avec les données
    const templateContent = typeof template.content === "string"
      ? template.content
      : JSON.stringify(template.content);

    // Cast to TemplateContext pour compatibilité avec l'ancien format
    const renderedContent = renderTemplate(templateContent, context as unknown as Parameters<typeof renderTemplate>[1], { previewMode: false });

    // Rendre le header et footer si présents
    let renderedHeader = "";
    let renderedFooter = "";

    if (template.headerContent) {
      const headerStr = typeof template.headerContent === "string"
        ? template.headerContent
        : JSON.stringify(template.headerContent);
      renderedHeader = renderTemplate(headerStr, context as unknown as Parameters<typeof renderTemplate>[1], { previewMode: false });
    }

    if (template.footerContent) {
      const footerStr = typeof template.footerContent === "string"
        ? template.footerContent
        : JSON.stringify(template.footerContent);
      renderedFooter = renderTemplate(footerStr, context as unknown as Parameters<typeof renderTemplate>[1], { previewMode: false });
    }

    // Créer ou mettre à jour le document en base
    const existingDocument = await prisma.document.findFirst({
      where: {
        formationId,
        type: documentType as DocumentType,
      },
    });

    let document;

    // S'assurer que le content est bien un objet valide pour Prisma
    const templateContent_json = template.content as object;

    if (existingDocument) {
      // Mettre à jour
      document = await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          content: templateContent_json,
          templateId: template.id,
          version: existingDocument.version + 1,
          isGenerated: true,
          generatedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Créer
      document = await prisma.document.create({
        data: {
          type: documentType as DocumentType,
          titre: template.name,
          content: templateContent_json,
          formationId,
          templateId: template.id,
          isGenerated: true,
          generatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        type: document.type,
        titre: document.titre,
        version: document.version,
        content: template.content, // JSON TipTap original
        renderedContent, // HTML rendu
        renderedHeader,
        renderedFooter,
        generatedAt: document.generatedAt,
      },
      template: {
        id: template.id,
        name: template.name,
      },
      context, // Pour debug ou réédition
    });
  } catch (error) {
    console.error("Erreur génération document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du document" },
      { status: 500 }
    );
  }
}
