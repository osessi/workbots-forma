// ===========================================
// DRIVE SERVICE
// ===========================================
// Service pour la gestion automatique des fichiers dans le Drive
// - Upload vers dossier "Documents de formation"
// - Duplication vers dossiers apprenants
// - Création de liens d'évaluation

import prisma from "@/lib/db/prisma";
import { FileCategory } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { generatePDFFromHtml, generateFooterTemplate, OrganisationInfo } from "./pdf-generator";

// Client Supabase admin pour le stockage
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ===========================================
// HELPER: Trouver ou créer le dossier "Documents de formation"
// ===========================================
export async function getOrCreateDocumentsDeFormationFolder(
  formationId: string,
  organizationId: string
): Promise<string> {
  // Trouver le dossier racine de la formation
  let formationFolder = await prisma.folder.findFirst({
    where: {
      formationId,
      organizationId,
    },
  });

  // Si pas de dossier racine, le créer
  if (!formationFolder) {
    const formation = await prisma.formation.findUnique({
      where: { id: formationId },
      select: { titre: true },
    });

    formationFolder = await prisma.folder.create({
      data: {
        name: formation?.titre || "Formation",
        color: "#4277FF",
        formationId,
        folderType: "formation",
        organizationId,
      },
    });
  }

  // Trouver ou créer le sous-dossier "Documents de formation"
  let docsFolder = await prisma.folder.findFirst({
    where: {
      parentId: formationFolder.id,
      folderType: "documents_formation",
      organizationId,
    },
  });

  if (!docsFolder) {
    docsFolder = await prisma.folder.create({
      data: {
        name: "Documents de formation",
        color: "#6366F1", // Indigo
        parentId: formationFolder.id,
        folderType: "documents_formation",
        organizationId,
      },
    });
  }

  return docsFolder.id;
}

// ===========================================
// UPLOAD VERS "DOCUMENTS DE FORMATION"
// ===========================================
export interface UploadToDocsResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export async function uploadToDocumentsDeFormation(
  formationId: string,
  documentType: string,
  titre: string,
  content: string, // HTML
  organizationId: string,
  userId: string,
  organisationInfo?: OrganisationInfo
): Promise<UploadToDocsResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Obtenir le dossier "Documents de formation"
    const docsFolderId = await getOrCreateDocumentsDeFormationFolder(formationId, organizationId);

    // Vérifier si un fichier avec le même nom existe déjà
    const existingFile = await prisma.file.findFirst({
      where: {
        folderId: docsFolderId,
        originalName: `${titre}.pdf`,
        organizationId,
      },
    });

    // Si le fichier existe, on le supprime pour le remplacer
    if (existingFile) {
      // Supprimer de Supabase Storage
      await supabaseAdmin.storage
        .from("files")
        .remove([existingFile.storagePath]);

      // Supprimer de la DB
      await prisma.file.delete({
        where: { id: existingFile.id },
      });
    }

    // Générer le PDF avec footer si organisationInfo fourni
    let fileBuffer: Buffer;
    const footerTemplate = organisationInfo ? generateFooterTemplate(organisationInfo) : undefined;

    try {
      fileBuffer = await generatePDFFromHtml(content, titre, {
        footerTemplate,
      });
    } catch (pdfError) {
      console.error("Erreur génération PDF, fallback HTML:", pdfError);
      // Fallback en HTML si PDF échoue
      fileBuffer = Buffer.from(content, "utf-8");
    }

    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedTitre = titre.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/g, "").substring(0, 50);
    const fileName = `${sanitizedTitre}_${timestamp}.pdf`;
    const storagePath = `documents/${organizationId}/${formationId}/${fileName}`;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("files")
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Erreur upload Supabase Storage:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // URL proxy
    const proxyUrl = `/api/fichiers/${storagePath}`;

    // Mapper le type de document vers FileCategory
    const categoryMap: Record<string, FileCategory> = {
      fiche_pedagogique: "FICHE_PEDAGOGIQUE",
      test_positionnement: "EVALUATION",
      evaluation_finale: "EVALUATION",
      qcm: "EVALUATION",
      correlation: "EVALUATION",
      slides: "SLIDES",
    };
    const category = categoryMap[documentType] || "DOCUMENT";

    // Créer l'enregistrement File
    const file = await prisma.file.create({
      data: {
        name: fileName,
        originalName: `${titre}.pdf`,
        mimeType: "application/pdf",
        size: fileBuffer.length,
        category,
        storagePath,
        publicUrl: proxyUrl,
        organizationId,
        userId,
        formationId,
        folderId: docsFolderId,
      },
    });

    // Stocker le contenu HTML pour édition future
    await prisma.fileContent.create({
      data: {
        fileId: file.id,
        content,
      },
    });

    return { success: true, fileId: file.id };
  } catch (error) {
    console.error("Erreur uploadToDocumentsDeFormation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===========================================
// DUPLICATION DES DOCUMENTS VERS DOSSIERS APPRENANTS
// ===========================================
export interface DuplicateResult {
  success: boolean;
  copiedCount: number;
  errors: string[];
}

export async function duplicateDocumentsToApprenantFolders(
  formationFolderId: string,
  apprenantFolderIds: string[],
  organizationId: string,
  userId: string
): Promise<DuplicateResult> {
  const errors: string[] = [];
  let copiedCount = 0;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Trouver le dossier "Documents de formation"
    const docsFolder = await prisma.folder.findFirst({
      where: {
        parentId: formationFolderId,
        folderType: "documents_formation",
        organizationId,
      },
    });

    if (!docsFolder) {
      return {
        success: true,
        copiedCount: 0,
        errors: ["Dossier 'Documents de formation' non trouvé - rien à copier"],
      };
    }

    // Récupérer tous les fichiers du dossier "Documents de formation"
    const files = await prisma.file.findMany({
      where: {
        folderId: docsFolder.id,
        organizationId,
      },
      include: {
        fileContent: true,
      },
    });

    if (files.length === 0) {
      return {
        success: true,
        copiedCount: 0,
        errors: [],
      };
    }

    // Pour chaque dossier apprenant
    for (const apprenantFolderId of apprenantFolderIds) {
      // Vérifier que le dossier apprenant existe
      const apprenantFolder = await prisma.folder.findUnique({
        where: { id: apprenantFolderId },
      });

      if (!apprenantFolder) {
        errors.push(`Dossier apprenant ${apprenantFolderId} non trouvé`);
        continue;
      }

      // Pour chaque fichier
      for (const file of files) {
        try {
          // Vérifier si ce fichier existe déjà dans le dossier apprenant
          const existingCopy = await prisma.file.findFirst({
            where: {
              folderId: apprenantFolderId,
              originalName: file.originalName,
              organizationId,
            },
          });

          if (existingCopy) {
            // Le fichier existe déjà, on passe
            continue;
          }

          // Télécharger le fichier depuis Supabase Storage
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from("files")
            .download(file.storagePath);

          if (downloadError || !fileData) {
            errors.push(`Erreur téléchargement ${file.name}: ${downloadError?.message}`);
            continue;
          }

          // Générer un nouveau chemin de stockage
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const newStoragePath = `documents/${organizationId}/apprenants/${apprenantFolderId}/${timestamp}_${file.name}`;

          // Convertir Blob en Buffer
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload la copie
          const { error: uploadError } = await supabaseAdmin.storage
            .from("files")
            .upload(newStoragePath, buffer, {
              contentType: file.mimeType,
              upsert: true,
            });

          if (uploadError) {
            errors.push(`Erreur upload copie ${file.name}: ${uploadError.message}`);
            continue;
          }

          // Créer l'enregistrement File pour la copie
          const newFile = await prisma.file.create({
            data: {
              name: file.name,
              originalName: file.originalName,
              mimeType: file.mimeType,
              size: file.size,
              category: file.category,
              storagePath: newStoragePath,
              publicUrl: `/api/fichiers/${newStoragePath}`,
              organizationId,
              userId,
              formationId: file.formationId,
              folderId: apprenantFolderId,
            },
          });

          // Copier aussi le contenu HTML si présent
          if (file.fileContent) {
            await prisma.fileContent.create({
              data: {
                fileId: newFile.id,
                content: file.fileContent.content,
              },
            });
          }

          copiedCount++;
        } catch (fileError) {
          errors.push(`Erreur copie ${file.name}: ${fileError instanceof Error ? fileError.message : "Unknown"}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      copiedCount,
      errors,
    };
  } catch (error) {
    console.error("Erreur duplicateDocumentsToApprenantFolders:", error);
    return {
      success: false,
      copiedCount,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// ===========================================
// CRÉATION DE LIEN D'ÉVALUATION DANS UN DOSSIER
// ===========================================
export interface CreateEvalLinkResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export async function createEvaluationLinkInFolder(
  folderId: string,
  evaluationType: "CHAUD" | "FROID" | "INTERVENANT" | "ENTREPRISE" | "FINANCEUR",
  evaluationUrl: string,
  organizationId: string,
  userId: string,
  formationId?: string
): Promise<CreateEvalLinkResult> {
  try {
    // Mapper le type vers un nom lisible
    const typeNames: Record<string, string> = {
      CHAUD: "Évaluation à chaud",
      FROID: "Évaluation à froid",
      INTERVENANT: "Évaluation intervenant",
      ENTREPRISE: "Évaluation entreprise",
      FINANCEUR: "Évaluation financeur",
    };
    const displayName = typeNames[evaluationType] || `Évaluation ${evaluationType}`;

    // Vérifier si un lien existe déjà pour ce type dans ce dossier
    const existingLink = await prisma.file.findFirst({
      where: {
        folderId,
        category: "EVALUATION_LINK",
        name: {
          contains: evaluationType,
        },
        organizationId,
      },
    });

    if (existingLink) {
      // Mettre à jour le lien existant
      await prisma.file.update({
        where: { id: existingLink.id },
        data: {
          publicUrl: evaluationUrl,
          updatedAt: new Date(),
        },
      });
      return { success: true, fileId: existingLink.id };
    }

    // Créer un nouveau "fichier" de type lien
    const file = await prisma.file.create({
      data: {
        name: `${evaluationType}_link`,
        originalName: displayName,
        mimeType: "application/link",
        size: 0,
        category: "EVALUATION_LINK",
        storagePath: "", // Pas de fichier réel
        publicUrl: evaluationUrl, // L'URL de l'évaluation
        organizationId,
        userId,
        formationId,
        folderId,
      },
    });

    return { success: true, fileId: file.id };
  } catch (error) {
    console.error("Erreur createEvaluationLinkInFolder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===========================================
// HELPER: Trouver le dossier d'un apprenant
// ===========================================
export async function findApprenantFolder(
  formationId: string,
  apprenantId: string,
  organizationId: string
): Promise<string | null> {
  // Trouver le dossier racine de la formation
  const formationFolder = await prisma.folder.findFirst({
    where: {
      formationId,
      organizationId,
    },
  });

  if (!formationFolder) {
    return null;
  }

  // Chercher le dossier de l'apprenant (peut être sous une entreprise ou directement sous la formation)
  const apprenantFolder = await prisma.folder.findFirst({
    where: {
      apprenantId,
      organizationId,
      OR: [
        { parentId: formationFolder.id }, // Directement sous formation
        {
          parent: {
            parentId: formationFolder.id, // Sous une entreprise
          },
        },
      ],
    },
  });

  return apprenantFolder?.id || null;
}

// ===========================================
// HELPER: Trouver le dossier d'un intervenant
// ===========================================
export async function findIntervenantFolder(
  formationId: string,
  intervenantId: string,
  organizationId: string
): Promise<string | null> {
  // Trouver le dossier racine de la formation
  const formationFolder = await prisma.folder.findFirst({
    where: {
      formationId,
      organizationId,
    },
  });

  if (!formationFolder) {
    return null;
  }

  // Chercher le dossier de l'intervenant
  const intervenantFolder = await prisma.folder.findFirst({
    where: {
      intervenantId,
      parentId: formationFolder.id,
      organizationId,
    },
  });

  return intervenantFolder?.id || null;
}

// ===========================================
// UPLOAD UN DOCUMENT VERS LE DOSSIER D'UN DESTINATAIRE
// ===========================================
export interface UploadToRecipientResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export async function uploadDocumentToRecipientFolder(
  formationId: string,
  recipientType: "apprenant" | "intervenant",
  recipientId: string,
  documentType: string,
  titre: string,
  content: string,
  organizationId: string,
  userId: string,
  organisationInfo?: OrganisationInfo
): Promise<UploadToRecipientResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Trouver le dossier du destinataire
    let folderId: string | null = null;

    if (recipientType === "apprenant") {
      folderId = await findApprenantFolder(formationId, recipientId, organizationId);
    } else {
      folderId = await findIntervenantFolder(formationId, recipientId, organizationId);
    }

    if (!folderId) {
      return {
        success: false,
        error: `Dossier ${recipientType} non trouvé pour ${recipientId}`,
      };
    }

    // Vérifier si un fichier similaire existe déjà
    const existingFile = await prisma.file.findFirst({
      where: {
        folderId,
        originalName: `${titre}.pdf`,
        organizationId,
      },
    });

    if (existingFile) {
      // Supprimer l'ancien fichier
      await supabaseAdmin.storage
        .from("files")
        .remove([existingFile.storagePath]);
      await prisma.file.delete({ where: { id: existingFile.id } });
    }

    // Générer le PDF
    let fileBuffer: Buffer;
    const footerTemplate = organisationInfo ? generateFooterTemplate(organisationInfo) : undefined;

    try {
      fileBuffer = await generatePDFFromHtml(content, titre, { footerTemplate });
    } catch {
      fileBuffer = Buffer.from(content, "utf-8");
    }

    // Upload
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedTitre = titre.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/g, "").substring(0, 50);
    const fileName = `${sanitizedTitre}_${timestamp}.pdf`;
    const storagePath = `documents/${organizationId}/${recipientType}s/${recipientId}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("files")
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Créer l'enregistrement
    const file = await prisma.file.create({
      data: {
        name: fileName,
        originalName: `${titre}.pdf`,
        mimeType: "application/pdf",
        size: fileBuffer.length,
        category: "DOCUMENT",
        storagePath,
        publicUrl: `/api/fichiers/${storagePath}`,
        organizationId,
        userId,
        formationId,
        folderId,
      },
    });

    // Stocker le contenu HTML
    await prisma.fileContent.create({
      data: {
        fileId: file.id,
        content,
      },
    });

    return { success: true, fileId: file.id };
  } catch (error) {
    console.error("Erreur uploadDocumentToRecipientFolder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
