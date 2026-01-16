"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

// Types
interface QuestionEntreprise {
  id: string;
  field: string;
  question: string;
  description?: string;
  type: "rating" | "text";
  required: boolean;
  section: string;
}

interface EvaluationData {
  id: string;
  token: string;
  status: string;
  organisme: {
    nom: string;
    logo: string | null;
  };
  formation: {
    titre: string;
  };
  session: {
    dateDebut: string | null;
    dateFin: string | null;
    nombreParticipants: number;
  };
  entreprise: {
    raisonSociale: string;
    contactNom: string | null;
    contactPrenom: string | null;
    contactFonction: string | null;
  };
  questions: QuestionEntreprise[];
  existingReponse: Record<string, unknown> | null;
}

// Icons
const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

// Section titles
const SECTION_TITLES: Record<string, string> = {
  "Préparation de la formation": "Préparation de la formation",
  "Qualité de la formation": "Qualité de la formation",
  "Suivi et communication": "Suivi et communication",
  "Satisfaction globale": "Satisfaction globale",
  "Impact": "Impact",
  "Commentaires": "Vos commentaires",
};

// Rating Slider Component
function RatingSlider({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const displayValue = hoveredValue ?? value;

  return (
    <div className="mt-3">
      {/* Scale display */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">Pas du tout d&apos;accord</span>
        <span className="text-xs text-gray-500">Tout à fait d&apos;accord</span>
      </div>

      {/* Interactive buttons */}
      <div className="flex justify-between gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => onChange(num)}
            onMouseEnter={() => setHoveredValue(num)}
            onMouseLeave={() => setHoveredValue(null)}
            className={`
              w-full aspect-square rounded-lg text-sm font-medium transition-all
              flex items-center justify-center
              ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"}
              ${
                displayValue !== null && num <= displayValue
                  ? num <= 3
                    ? "bg-red-500 text-white"
                    : num <= 6
                    ? "bg-yellow-500 text-white"
                    : "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Current value display */}
      {displayValue !== null && (
        <div className="text-center mt-2">
          <span
            className={`
            inline-block px-3 py-1 rounded-full text-sm font-bold
            ${displayValue <= 3 ? "bg-red-100 text-red-700" : displayValue <= 6 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}
          `}
          >
            {displayValue}/10
          </span>
        </div>
      )}
    </div>
  );
}

// Progress bar component
function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function EvaluationEntreprisePage() {
  const params = useParams();
  const token = params.token as string;

  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reponses, setReponses] = useState<Record<string, number | string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [contactInfo, setContactInfo] = useState({
    nom: "",
    prenom: "",
    fonction: "",
  });
  const [contactVerified, setContactVerified] = useState(false);

  // Load evaluation data
  useEffect(() => {
    async function loadEvaluation() {
      try {
        const res = await fetch(`/api/evaluation-entreprise/${token}`);
        const data = await res.json();

        if (!res.ok) {
          if (data.completed) {
            setSubmitted(true);
          }
          throw new Error(data.error || "Erreur de chargement");
        }

        setEvaluation(data);

        // Pre-fill contact info from entreprise
        if (data.entreprise) {
          setContactInfo({
            nom: data.entreprise.contactNom || "",
            prenom: data.entreprise.contactPrenom || "",
            fonction: data.entreprise.contactFonction || "",
          });
        }

        // Load existing responses if any
        if (data.existingReponse) {
          const existingData: Record<string, number | string> = {};
          Object.entries(data.existingReponse).forEach(([key, value]) => {
            if (value !== null && key !== "id" && key !== "evaluationId") {
              existingData[key] = value as number | string;
            }
          });
          setReponses(existingData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadEvaluation();
    }
  }, [token]);

  // Get all rating questions
  const getRatingQuestions = useCallback(() => {
    if (!evaluation) return [];
    return evaluation.questions.filter(q => q.type === "rating");
  }, [evaluation]);

  // Get unique sections
  const getSections = useCallback(() => {
    if (!evaluation) return [];
    const sectionSet = new Set(evaluation.questions.map(q => q.section));
    return Array.from(sectionSet);
  }, [evaluation]);

  // Get questions for current section
  const getCurrentSectionQuestions = useCallback(() => {
    if (!evaluation) return [];
    const sections = getSections();
    if (currentSection >= sections.length) return [];
    const sectionName = sections[currentSection];
    return evaluation.questions.filter(q => q.section === sectionName);
  }, [evaluation, currentSection, getSections]);

  // Calculate progress
  const getProgress = useCallback(() => {
    const ratingQuestions = getRatingQuestions();
    const answeredCount = ratingQuestions.filter((q) => reponses[q.field] !== undefined).length;
    return { answered: answeredCount, total: ratingQuestions.length };
  }, [getRatingQuestions, reponses]);

  // Handle rating change
  const handleRatingChange = (field: string, value: number) => {
    setReponses((prev) => ({ ...prev, [field]: value }));
  };

  // Handle text change
  const handleTextChange = (field: string, value: string) => {
    setReponses((prev) => ({ ...prev, [field]: value }));
  };

  // Verify contact
  const handleVerifyContact = () => {
    setContactVerified(true);
  };

  // Submit evaluation
  const handleSubmit = async () => {
    if (!evaluation) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/evaluation-entreprise/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomContact: contactInfo.nom || undefined,
          prenomContact: contactInfo.prenom || undefined,
          fonctionContact: contactInfo.fonction || undefined,
          reponses,
          partial: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la soumission");
      }

      setSubmitted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Chargement de l&apos;évaluation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-6xl mb-4">
            <svg className="w-20 h-20 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-600">Le lien d&apos;évaluation n&apos;est plus valide ou a expiré.</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre retour !</h1>
          <p className="text-gray-600">
            Votre évaluation a été enregistrée avec succès. Elle nous aide à améliorer la qualité de nos formations.
          </p>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  const sections = getSections();
  const progress = getProgress();
  const isComplete = progress.answered >= progress.total;
  const currentQuestions = getCurrentSectionQuestions();
  const isLastSection = currentSection >= sections.length - 1;

  // Contact verification screen
  if (!contactVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-100 flex items-center justify-center">
                <BuildingIcon />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Évaluation Entreprise</h1>
              <p className="text-gray-600 mt-2">Votre avis sur cette formation</p>
            </div>

            {/* Logo organisme */}
            {evaluation.organisme.logo && (
              <div className="flex justify-center mb-6">
                <img
                  src={evaluation.organisme.logo}
                  alt={evaluation.organisme.nom}
                  className="h-12 object-contain"
                />
              </div>
            )}

            <div className="bg-sky-50 rounded-xl p-4 mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">{evaluation.formation.titre}</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  Dates : {formatDate(evaluation.session.dateDebut)}
                  {evaluation.session.dateFin && evaluation.session.dateFin !== evaluation.session.dateDebut && (
                    <> au {formatDate(evaluation.session.dateFin)}</>
                  )}
                </p>
                <p>Participants : {evaluation.session.nombreParticipants} collaborateur(s)</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-1">Entreprise</p>
              <p className="text-lg font-semibold text-gray-900">{evaluation.entreprise.raisonSociale}</p>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm font-medium text-gray-700">
                Confirmez vos informations pour commencer :
              </p>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nom</label>
                <input
                  type="text"
                  value={contactInfo.nom}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Prénom</label>
                <input
                  type="text"
                  value={contactInfo.prenom}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, prenom: e.target.value }))}
                  placeholder="Votre prénom"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fonction</label>
                <input
                  type="text"
                  value={contactInfo.fonction}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, fonction: e.target.value }))}
                  placeholder="Votre fonction (ex: RH, Responsable formation...)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            <button
              onClick={handleVerifyContact}
              className="w-full py-3 px-4 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition-colors"
            >
              Commencer l&apos;évaluation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main evaluation form
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                Évaluation Entreprise
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {progress.answered}/{progress.total} questions
              </p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">{evaluation.formation.titre}</h1>

          <ProgressBar current={progress.answered} total={progress.total} />

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <span>{evaluation.entreprise.raisonSociale}</span>
            <span>|</span>
            <span>{evaluation.session.nombreParticipants} participant(s)</span>
          </div>
        </div>

        {/* Section navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sections.map((sectionName, index) => (
            <button
              key={sectionName}
              onClick={() => setCurrentSection(index)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                currentSection === index
                  ? "bg-sky-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {index + 1}. {SECTION_TITLES[sectionName] || sectionName}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            {SECTION_TITLES[sections[currentSection]] || sections[currentSection]}
          </h2>

          <div className="space-y-8">
            {currentQuestions.map((question, qIndex) => (
              <div key={question.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                <p className="text-gray-800 font-medium mb-1">
                  <span className="text-sky-600 mr-2">{qIndex + 1}.</span>
                  {question.question}
                </p>
                {question.description && (
                  <p className="text-sm text-gray-500 mb-2">{question.description}</p>
                )}

                {question.type === "rating" ? (
                  <RatingSlider
                    value={reponses[question.field] as number | null ?? null}
                    onChange={(value) => handleRatingChange(question.field, value)}
                  />
                ) : (
                  <textarea
                    value={(reponses[question.field] as string) || ""}
                    onChange={(e) => handleTextChange(question.field, e.target.value)}
                    rows={4}
                    className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
                    placeholder="Votre réponse..."
                  />
                )}
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentSection((prev) => Math.max(0, prev - 1))}
              disabled={currentSection === 0}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>

            {!isLastSection ? (
              <button
                onClick={() => setCurrentSection((prev) => prev + 1)}
                className="px-6 py-3 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition-colors"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isComplete || submitting}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    Soumettre l&apos;évaluation
                  </>
                )}
              </button>
            )}
          </div>

          {!isComplete && isLastSection && (
            <p className="text-center text-amber-600 text-sm mt-4">
              Veuillez répondre à toutes les questions avant de soumettre ({progress.total - progress.answered} restantes)
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Vos réponses sont confidentielles et nous aident à améliorer nos formations
        </p>
      </div>
    </div>
  );
}
