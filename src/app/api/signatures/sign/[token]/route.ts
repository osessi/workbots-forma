// ===========================================
// API SIGNATURE ÉLECTRONIQUE - Accès Public Document
// ===========================================
// GET /api/signatures/[token] - Voir le document à signer
// POST /api/signatures/[token] - Soumettre la signature

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";
import { FileCategory } from "@prisma/client";

// Générer un hash SHA-256
function generateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// Intégrer la signature dans le document HTML
function embedSignatureInDocument(
  contenuHtml: string,
  signatureData: string,
  signataireName: string,
  signedAt: Date
): string {
  const signatureDate = signedAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Zone de signature à ajouter ou remplacer
  const signatureZoneHtml = `
    <div class="signature-zone" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
      <div style="display: flex; justify-content: flex-end; gap: 40px;">
        <div style="text-align: center; min-width: 200px;">
          <p style="font-size: 12px; color: #6B7280; margin-bottom: 8px;">Signature du destinataire</p>
          <div style="border: 1px solid #10B981; border-radius: 8px; padding: 10px; background: #F0FDF4;">
            <img src="${signatureData}" alt="Signature" style="max-width: 180px; max-height: 80px; display: block; margin: 0 auto;" />
          </div>
          <p style="font-size: 11px; font-weight: 600; color: #1F2937; margin-top: 8px;">${signataireName}</p>
          <p style="font-size: 10px; color: #6B7280;">Signé le ${signatureDate}</p>
        </div>
      </div>
      <div style="margin-top: 20px; padding: 15px; background: #F0FDF4; border: 1px solid #10B981; border-radius: 8px;">
        <p style="font-size: 11px; color: #065F46; margin: 0;">
          <strong>✓ Document signé électroniquement</strong><br/>
          Signature conforme au règlement eIDAS et à l'article 1367 du Code civil.<br/>
          Date de signature : ${signatureDate}
        </p>
      </div>
    </div>
  `;

  // Chercher s'il y a une balise de signature existante à remplacer
  const signaturePlaceholderRegex = /<!-- ?SIGNATURE_ZONE ?-->|<div[^>]*class="signature-zone"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;

  if (signaturePlaceholderRegex.test(contenuHtml)) {
    // Remplacer le placeholder par la zone de signature
    return contenuHtml.replace(signaturePlaceholderRegex, signatureZoneHtml);
  }

  // Sinon, ajouter la zone de signature avant la fermeture du body ou à la fin
  if (contenuHtml.includes("</body>")) {
    return contenuHtml.replace("</body>", `${signatureZoneHtml}</body>`);
  }

  // Ajouter à la fin du document
  return contenuHtml + signatureZoneHtml;
}

// Sauvegarder le document signé dans le Drive
async function saveSignedDocumentToDrive(params: {
  organizationId: string;
  formationId?: string;
  formationTitre?: string;
  entrepriseId?: string;
  apprenantId?: string;
  documentTitre: string;
  signedContent: string;
  sentBy?: string; // ID de l'utilisateur qui a envoyé le document (sera propriétaire)
}): Promise<{ success: boolean; fileId?: string }> {
  try {
    const { organizationId, formationId, formationTitre, entrepriseId, apprenantId, documentTitre, signedContent, sentBy } = params;

    // Si pas de formationId, on sauvegarde directement au niveau organisation
    let targetFolderId: string | null = null;

    if (formationId) {
      // Chercher ou créer le dossier formation
      let formationFolder = await prisma.folder.findFirst({
        where: {
          formationId,
          organizationId,
          folderType: "formation",
        },
      });

      if (!formationFolder && formationTitre) {
        formationFolder = await prisma.folder.create({
          data: {
            name: formationTitre,
            color: "#4277FF",
            organizationId,
            formationId,
            folderType: "formation",
          },
        });
      }

      if (formationFolder) {
        targetFolderId = formationFolder.id;

        // Si entrepriseId, créer/trouver le sous-dossier
        if (entrepriseId) {
          const entreprise = await prisma.entreprise.findFirst({
            where: { id: entrepriseId, organizationId },
          });

          if (entreprise) {
            let entrepriseFolder = await prisma.folder.findFirst({
              where: {
                parentId: formationFolder.id,
                entrepriseId: entreprise.id,
                organizationId,
              },
            });

            if (!entrepriseFolder) {
              entrepriseFolder = await prisma.folder.create({
                data: {
                  name: entreprise.raisonSociale,
                  color: "#F59E0B",
                  parentId: formationFolder.id,
                  entrepriseId: entreprise.id,
                  folderType: "entreprise",
                  organizationId,
                },
              });
            }

            targetFolderId = entrepriseFolder.id;

            // Si apprenantId aussi
            if (apprenantId) {
              const apprenant = await prisma.apprenant.findFirst({
                where: { id: apprenantId, organizationId },
              });

              if (apprenant) {
                let apprenantFolder = await prisma.folder.findFirst({
                  where: {
                    parentId: entrepriseFolder.id,
                    apprenantId: apprenant.id,
                    organizationId,
                  },
                });

                if (!apprenantFolder) {
                  apprenantFolder = await prisma.folder.create({
                    data: {
                      name: `${apprenant.prenom} ${apprenant.nom}`,
                      color: "#10B981",
                      parentId: entrepriseFolder.id,
                      apprenantId: apprenant.id,
                      folderType: "apprenant",
                      organizationId,
                    },
                  });
                }

                targetFolderId = apprenantFolder.id;
              }
            }
          }
        } else if (apprenantId) {
          // Apprenant sans entreprise
          const apprenant = await prisma.apprenant.findFirst({
            where: { id: apprenantId, organizationId },
          });

          if (apprenant) {
            let apprenantFolder = await prisma.folder.findFirst({
              where: {
                parentId: formationFolder.id,
                apprenantId: apprenant.id,
                organizationId,
              },
            });

            if (!apprenantFolder) {
              apprenantFolder = await prisma.folder.create({
                data: {
                  name: `${apprenant.prenom} ${apprenant.nom}`,
                  color: "#10B981",
                  parentId: formationFolder.id,
                  apprenantId: apprenant.id,
                  folderType: "apprenant",
                  organizationId,
                },
              });
            }

            targetFolderId = apprenantFolder.id;
          }
        }
      }
    }

    // Trouver un utilisateur pour associer le fichier
    // On utilise le sentBy ou on prend le premier utilisateur de l'organisation
    let fileOwnerId = sentBy;
    if (!fileOwnerId) {
      const orgUser = await prisma.user.findFirst({
        where: { organizationId },
        select: { id: true },
      });
      fileOwnerId = orgUser?.id;
    }

    // Si toujours pas d'utilisateur, on ne peut pas créer le fichier
    if (!fileOwnerId) {
      console.warn("[SIGNATURE] Aucun utilisateur trouvé pour associer le fichier signé");
      return { success: false };
    }

    // Générer nom de fichier
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedTitre = documentTitre.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/g, "").substring(0, 50);
    const fileName = `${sanitizedTitre}_SIGNE_${timestamp}.html`;

    // Créer le fichier
    const file = await prisma.file.create({
      data: {
        name: fileName,
        originalName: `${documentTitre} (Signé).html`,
        mimeType: "text/html",
        size: Buffer.byteLength(signedContent, "utf-8"),
        category: "DOCUMENT" as FileCategory,
        storagePath: `documents/${organizationId}/signed/${fileName}`,
        publicUrl: null,
        organizationId,
        userId: fileOwnerId,
        formationId: formationId || null,
        folderId: targetFolderId,
      },
    });

    return { success: true, fileId: file.id };
  } catch (error) {
    console.error("Erreur sauvegarde document signé:", error);
    return { success: false };
  }
}

// GET - Voir le document à signer (accès public via token)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const document = await prisma.signatureDocument.findUnique({
      where: { token },
      include: {
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
        session: {
          select: {
            id: true,
            formation: {
              select: {
                titre: true,
              },
            },
          },
        },
        organization: {
          select: {
            name: true,
            logo: true,
          },
        },
        signatures: {
          select: {
            id: true,
            signedAt: true,
            signataireName: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier le statut
    if (document.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Ce document a été annulé" },
        { status: 410 }
      );
    }

    if (document.status === "SIGNED") {
      return NextResponse.json({
        document: {
          id: document.id,
          titre: document.titre,
          documentType: document.documentType,
          status: document.status,
          isSigned: true,
          signedAt: document.signatures[0]?.signedAt,
          signedBy: document.signatures[0]?.signataireName,
        },
        message: "Ce document a déjà été signé",
      });
    }

    // Vérifier l'expiration
    if (document.expiresAt && new Date() > document.expiresAt) {
      // Mettre à jour le statut si pas déjà fait
      if (document.status !== "EXPIRED") {
        await prisma.signatureDocument.update({
          where: { id: document.id },
          data: { status: "EXPIRED" },
        });
      }
      return NextResponse.json(
        { error: "Le délai de signature a expiré" },
        { status: 410 }
      );
    }

    // Retourner le document pour signature
    return NextResponse.json({
      document: {
        id: document.id,
        titre: document.titre,
        documentType: document.documentType,
        contenuHtml: document.contenuHtml,
        destinataireNom: document.destinataireNom,
        destinataireEmail: document.destinataireEmail,
        authMethod: document.authMethod,
        expiresAt: document.expiresAt,
        status: document.status,
        organization: document.organization,
        formation: document.session?.formation?.titre,
        apprenant: document.apprenant
          ? `${document.apprenant.prenom} ${document.apprenant.nom}`
          : null,
        entreprise: document.entreprise?.raisonSociale,
      },
    });
  } catch (error) {
    console.error("Erreur récupération document signature:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du document" },
      { status: 500 }
    );
  }
}

// POST - Soumettre la signature
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const {
      signatureData,      // Image base64 de la signature
      verificationCode,   // Code de vérification (si 2FA)
      consentAccepted,    // Acceptation des conditions
    } = body;

    // Validation basique
    if (!signatureData) {
      return NextResponse.json(
        { error: "Signature requise" },
        { status: 400 }
      );
    }

    if (!consentAccepted) {
      return NextResponse.json(
        { error: "Vous devez accepter les conditions pour signer" },
        { status: 400 }
      );
    }

    // Récupérer le document avec les relations pour la sauvegarde
    const document = await prisma.signatureDocument.findUnique({
      where: { token },
      include: {
        session: {
          select: {
            formationId: true,
            formation: {
              select: {
                titre: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Vérifications de statut
    if (document.status === "SIGNED") {
      return NextResponse.json(
        { error: "Ce document a déjà été signé" },
        { status: 400 }
      );
    }

    if (document.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Ce document a été annulé" },
        { status: 410 }
      );
    }

    if (document.status === "EXPIRED" || (document.expiresAt && new Date() > document.expiresAt)) {
      return NextResponse.json(
        { error: "Le délai de signature a expiré" },
        { status: 410 }
      );
    }

    // Vérifier le code si double authentification requise
    if (document.authMethod !== "EMAIL_ONLY") {
      if (!verificationCode) {
        return NextResponse.json(
          { error: "Code de vérification requis" },
          { status: 400 }
        );
      }

      // Vérifier le code
      const verification = await prisma.signatureVerificationCode.findFirst({
        where: {
          documentId: document.id,
          code: verificationCode,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!verification) {
        // Incrémenter les tentatives
        await prisma.signatureVerificationCode.updateMany({
          where: {
            documentId: document.id,
            usedAt: null,
          },
          data: {
            attempts: { increment: 1 },
          },
        });

        return NextResponse.json(
          { error: "Code de vérification invalide ou expiré" },
          { status: 400 }
        );
      }

      // Marquer le code comme utilisé
      await prisma.signatureVerificationCode.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      });
    }

    // Récupérer les infos de la requête
    const ipAddress = request.headers.get("x-forwarded-for") ||
                      request.headers.get("x-real-ip") ||
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Générer les hashes
    const documentHash = generateHash(document.contenuHtml);
    const signatureHash = generateHash(signatureData + document.id + new Date().toISOString());

    // Texte de consentement
    const consentText = `Je, ${document.destinataireNom}, certifie avoir lu et accepté le document "${document.titre}". ` +
      `En apposant ma signature électronique, je reconnais que celle-ci a la même valeur juridique qu'une signature manuscrite ` +
      `conformément à l'article 1367 du Code civil et au règlement eIDAS.`;

    // Créer l'enregistrement de signature
    const signatureRecord = await prisma.signatureRecord.create({
      data: {
        documentId: document.id,
        signataireName: document.destinataireNom,
        signataireEmail: document.destinataireEmail,
        signatureData,
        authMethod: document.authMethod,
        documentHash,
        signatureHash,
        ipAddress,
        userAgent,
        consentText,
        consentAccepted: true,
      },
    });

    // Intégrer la signature dans le contenu HTML du document
    const signedContent = embedSignatureInDocument(
      document.contenuHtml,
      signatureData,
      document.destinataireNom,
      signatureRecord.signedAt
    );

    // Mettre à jour le document avec le contenu signé et le statut
    await prisma.signatureDocument.update({
      where: { id: document.id },
      data: {
        status: "SIGNED",
        signedContenuHtml: signedContent, // Stocker le HTML avec signature intégrée
      },
    });

    // Générer l'URL du certificat
    const certificateUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"}/api/signatures/${document.id}/certificate`;

    // Mettre à jour avec l'URL du certificat
    await prisma.signatureRecord.update({
      where: { id: signatureRecord.id },
      data: { certificateUrl },
    });

    // Sauvegarder le document signé dans le Drive
    let savedFileId: string | undefined;
    if (document.organizationId) {
      const saveResult = await saveSignedDocumentToDrive({
        organizationId: document.organizationId,
        formationId: document.session?.formationId || undefined,
        formationTitre: document.session?.formation?.titre || undefined,
        entrepriseId: document.entrepriseId || undefined,
        apprenantId: document.apprenantId || undefined,
        documentTitre: document.titre,
        signedContent,
        sentBy: document.sentBy || undefined, // Utilisateur qui a envoyé le document
      });

      if (saveResult.success) {
        savedFileId = saveResult.fileId;
        console.log(`[SIGNATURE] Document signé sauvegardé dans le Drive: ${savedFileId}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document signé avec succès",
      signature: {
        id: signatureRecord.id,
        signedAt: signatureRecord.signedAt,
        documentHash,
        signatureHash,
        certificateUrl,
        savedFileId,
      },
    });
  } catch (error) {
    console.error("Erreur signature document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la signature du document" },
      { status: 500 }
    );
  }
}
