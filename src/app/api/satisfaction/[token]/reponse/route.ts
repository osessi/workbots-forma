// ===========================================
// API: SOUMETTRE UNE RÉPONSE D'ENQUÊTE
// POST /api/satisfaction/[token]/reponse - Enregistrer la réponse
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    // Récupérer l'enquête par token
    const enquete = await prisma.evaluationSatisfaction.findUnique({
      where: { token },
      include: {
        reponse: true,
      },
    });

    if (!enquete) {
      return NextResponse.json(
        { error: "Enquête non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier l'expiration
    if (enquete.expiresAt && new Date() > enquete.expiresAt) {
      return NextResponse.json(
        { error: "Cette enquête a expiré" },
        { status: 410 }
      );
    }

    // Vérifier si déjà complétée
    if (enquete.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Vous avez déjà répondu à cette enquête" },
        { status: 409 }
      );
    }

    const body = await request.json();

    // Extraire les métadonnées de la requête
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                      request.headers.get("x-real-ip") ||
                      "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Calculer le score moyen et le taux de satisfaction
    const notes: number[] = [];

    // Collecter toutes les notes selon le type d'évaluation
    if (enquete.type === "CHAUD") {
      // Notes évaluation à chaud
      if (body.preparationInfos) notes.push(body.preparationInfos);
      if (body.preparationMessages) notes.push(body.preparationMessages);
      if (body.preparationPrerequis) notes.push(body.preparationPrerequis);
      if (body.organisationCalendrier) notes.push(body.organisationCalendrier);
      if (body.organisationConditions) notes.push(body.organisationConditions);
      if (body.animationExplications) notes.push(body.animationExplications);
      if (body.animationEchanges) notes.push(body.animationEchanges);
      if (body.animationAmbiance) notes.push(body.animationAmbiance);
      if (body.animationRythme) notes.push(body.animationRythme);
      if (body.contenuCoherence) notes.push(body.contenuCoherence);
      if (body.contenuUtilite) notes.push(body.contenuUtilite);
      if (body.contenuSupports) notes.push(body.contenuSupports);
      if (body.contenuNiveau) notes.push(body.contenuNiveau);
      if (body.objectifsAtteints) notes.push(body.objectifsAtteints);
    } else {
      // Notes évaluation à froid
      if (body.froidAttentesInitiales) notes.push(body.froidAttentesInitiales);
      if (body.froidCompetencesUtiles) notes.push(body.froidCompetencesUtiles);
      if (body.froidMiseEnPratique) notes.push(body.froidMiseEnPratique);
      if (body.froidImpactTravail) notes.push(body.froidImpactTravail);
      if (body.froidPertinenceActuelle) notes.push(body.froidPertinenceActuelle);
      if (body.froidUtiliteFuture) notes.push(body.froidUtiliteFuture);
      if (body.froidObjectifsPratique) notes.push(body.froidObjectifsPratique);
      if (body.recommandation) notes.push(body.recommandation);
    }

    // Ajouter la note globale
    if (body.noteGlobale) notes.push(body.noteGlobale);

    const scoreMoyen = notes.length > 0
      ? notes.reduce((sum, n) => sum + n, 0) / notes.length
      : null;

    // Taux de satisfaction = note globale convertie en pourcentage
    const tauxSatisfaction = body.noteGlobale
      ? (body.noteGlobale / 10) * 100
      : null;

    // Créer ou mettre à jour la réponse
    const reponseData = {
      // Section préparation (chaud)
      preparationInfos: body.preparationInfos || null,
      preparationMessages: body.preparationMessages || null,
      preparationPrerequis: body.preparationPrerequis || null,

      // Section organisation (chaud)
      organisationCalendrier: body.organisationCalendrier || null,
      organisationConditions: body.organisationConditions || null,

      // Section animation (chaud)
      animationExplications: body.animationExplications || null,
      animationEchanges: body.animationEchanges || null,
      animationAmbiance: body.animationAmbiance || null,
      animationRythme: body.animationRythme || null,

      // Section contenu (chaud)
      contenuCoherence: body.contenuCoherence || null,
      contenuUtilite: body.contenuUtilite || null,
      contenuSupports: body.contenuSupports || null,
      contenuNiveau: body.contenuNiveau || null,

      // Objectifs atteints (commun)
      objectifsAtteints: body.objectifsAtteints || null,

      // Note globale (commun)
      noteGlobale: body.noteGlobale || null,

      // Sections froid
      froidAttentesInitiales: body.froidAttentesInitiales || null,
      froidCompetencesUtiles: body.froidCompetencesUtiles || null,
      froidMiseEnPratique: body.froidMiseEnPratique || null,
      froidImpactTravail: body.froidImpactTravail || null,
      froidPertinenceActuelle: body.froidPertinenceActuelle || null,
      froidUtiliteFuture: body.froidUtiliteFuture || null,
      froidObjectifsPratique: body.froidObjectifsPratique || null,
      recommandation: body.recommandation || null,

      // Commentaires
      suggestions: body.suggestions || null,

      // Scores calculés
      scoreMoyen,
      tauxSatisfaction,

      // Métadonnées
      ipAddress,
      userAgent,
    };

    if (enquete.reponse) {
      // Mettre à jour la réponse existante
      await prisma.evaluationSatisfactionReponse.update({
        where: { id: enquete.reponse.id },
        data: reponseData,
      });
    } else {
      // Créer une nouvelle réponse
      await prisma.evaluationSatisfactionReponse.create({
        data: {
          evaluationId: enquete.id,
          ...reponseData,
        },
      });
    }

    // Mettre à jour l'enquête comme complétée
    await prisma.evaluationSatisfaction.update({
      where: { token },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Merci pour votre participation !",
      scoreMoyen: scoreMoyen ? Math.round(scoreMoyen * 10) / 10 : null,
      tauxSatisfaction: tauxSatisfaction ? Math.round(tauxSatisfaction) : null,
    });
  } catch (error) {
    console.error("[API] POST /api/satisfaction/[token]/reponse error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
