"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DocumentsWizard, FormationInfo, InitialSessionData } from "@/components/documents/wizard";
import { ArrowLeft, Loader2, Calendar, MapPin, User, Info } from "lucide-react";

interface SessionDetails {
  id: string;
  reference: string;
  nom: string | null;
  status: string;
  modalite: string;
  formation: {
    id: string;
    titre: string;
    fichePedagogique: Record<string, unknown> | null;
  };
  journees: Array<{
    id: string;
    date: string;
    heureDebutMatin: string;
    heureFinMatin: string;
    heureDebutAprem: string;
    heureFinAprem: string;
  }>;
  lieu: {
    id: string;
    nom: string;
    typeLieu: string;
    lieuFormation?: string;
  } | null;
  formateur: {
    id: string;
    prenom: string;
    nom: string;
    email?: string;
  } | null;
  lieuTexteLibre: string | null;
  lienConnexion: string | null;
  tarifParDefautHT: number | null;
  tauxTVA: number;
}

export default function ConfigureSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session details
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/training-sessions/${resolvedParams.id}`);
      if (!res.ok) {
        throw new Error("Session non trouvée");
      }
      const data = await res.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Get formation info for the wizard
  const getFormationInfo = useCallback((): FormationInfo => {
    if (!session) {
      return {
        id: undefined,
        titre: "Formation",
        tarifEntreprise: 0,
        tarifIndependant: 0,
        tarifParticulier: 0,
        dureeHeures: 14,
        dureeJours: 2,
      };
    }

    // Extract tarifs from fichePedagogique if available
    const fiche = session.formation.fichePedagogique || {};
    const parseTarif = (val: unknown): number => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const match = val.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    };

    return {
      id: session.formation.id,
      titre: session.formation.titre,
      tarifEntreprise: parseTarif(fiche.tarifEntreprise) || session.tarifParDefautHT || 0,
      tarifIndependant: parseTarif(fiche.tarifIndependant) || session.tarifParDefautHT || 0,
      tarifParticulier: parseTarif(fiche.tarifParticulier) || session.tarifParDefautHT || 0,
      dureeHeures: typeof fiche.dureeHeures === "number" ? fiche.dureeHeures : 14,
      dureeJours: session.journees.length || 2,
      // Pass session-specific data
      sessionId: session.id,
      sessionReference: session.reference,
    };
  }, [session]);

  // Get initial session data for pre-filling the wizard (lieu, dates, formateur)
  const getInitialSessionData = useCallback((): InitialSessionData | undefined => {
    if (!session) return undefined;

    // Convertir la modalité
    const modaliteMap: Record<string, "PRESENTIEL" | "DISTANCIEL" | "MIXTE"> = {
      PRESENTIEL: "PRESENTIEL",
      DISTANCIEL: "DISTANCIEL",
      MIXTE: "MIXTE",
    };

    return {
      lieu: {
        modalite: modaliteMap[session.modalite] || "PRESENTIEL",
        lieuId: session.lieu?.id || null,
        lieu: session.lieu ? {
          id: session.lieu.id,
          nom: session.lieu.nom,
          typeLieu: session.lieu.typeLieu,
          lieuFormation: session.lieu.lieuFormation,
        } : undefined,
        adresseLibre: session.lieuTexteLibre || "",
        lienConnexion: session.lienConnexion || "",
        journees: session.journees.map((j) => ({
          id: j.id,
          date: j.date.split("T")[0], // Format YYYY-MM-DD
          horaireMatin: j.heureDebutMatin && j.heureFinMatin
            ? `${j.heureDebutMatin} - ${j.heureFinMatin}`
            : "09:00 - 12:30",
          horaireApresMidi: j.heureDebutAprem && j.heureFinAprem
            ? `${j.heureDebutAprem} - ${j.heureFinAprem}`
            : "14:00 - 17:30",
        })),
      },
      formateurs: {
        formateurPrincipalId: session.formateur?.id || null,
        formateurPrincipal: session.formateur ? {
          id: session.formateur.id,
          nom: session.formateur.nom,
          prenom: session.formateur.prenom,
          email: session.formateur.email,
        } : undefined,
        coformateursIds: [],
        coformateurs: [],
      },
    };
  }, [session]);

  // Callback when wizard is complete
  const handleComplete = useCallback(async () => {
    // Update session status to PLANIFIEE if it was BROUILLON
    if (session?.status === "BROUILLON") {
      try {
        await fetch(`/api/training-sessions/${resolvedParams.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PLANIFIEE" }),
        });
      } catch (err) {
        console.error("Erreur mise à jour statut:", err);
      }
    }

    // Redirect to session detail
    router.push(`/automate/sessions/${resolvedParams.id}`);
  }, [session, resolvedParams.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-brand-500" />
          <span className="text-gray-500 dark:text-gray-400">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || "Session non trouvée"}</p>
        <Link
          href="/automate/sessions"
          className="text-brand-500 hover:underline"
        >
          Retour aux sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/automate/sessions/${resolvedParams.id}`}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft size={16} />
            Retour à la session
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
              {session.reference}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              Configuration en cours
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configurer la session
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {session.formation.titre}
          </p>
        </div>
      </div>

      {/* Session info summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dates */}
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Calendar size={16} />
            <span className="text-sm font-medium">Dates</span>
          </div>
          {session.journees.length > 0 ? (
            <div className="space-y-1">
              {session.journees.slice(0, 3).map((j) => (
                <p key={j.id} className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(j.date), "EEEE d MMMM", { locale: fr })}
                </p>
              ))}
              {session.journees.length > 3 && (
                <p className="text-sm text-gray-500">
                  +{session.journees.length - 3} autres journées
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Non planifiée</p>
          )}
        </div>

        {/* Lieu */}
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <MapPin size={16} />
            <span className="text-sm font-medium">Lieu</span>
          </div>
          {session.lieu ? (
            <p className="text-sm text-gray-900 dark:text-white">{session.lieu.nom}</p>
          ) : session.modalite === "DISTANCIEL" ? (
            <p className="text-sm text-gray-900 dark:text-white">Distanciel</p>
          ) : (
            <p className="text-sm text-gray-500">Non défini</p>
          )}
        </div>

        {/* Formateur */}
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <User size={16} />
            <span className="text-sm font-medium">Formateur</span>
          </div>
          {session.formateur ? (
            <p className="text-sm text-gray-900 dark:text-white">
              {session.formateur.prenom} {session.formateur.nom}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Non assigné</p>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-brand-600 dark:text-brand-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-800 dark:text-brand-200">
              Configurez votre session en quelques étapes
            </p>
            <p className="text-sm text-brand-600 dark:text-brand-400 mt-1">
              Ajoutez les clients et participants, définissez les tarifs,
              puis générez tous les documents administratifs de votre session.
            </p>
          </div>
        </div>
      </div>

      {/* Documents Wizard */}
      <DocumentsWizard
        formation={getFormationInfo()}
        initialSessionData={getInitialSessionData()}
        onComplete={handleComplete}
      />
    </div>
  );
}
