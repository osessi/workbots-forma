"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

// Types
interface Question {
  id: string;
  label: string;
}

interface QuestionSection {
  [key: string]: Question[];
}

interface EvaluationData {
  id: string;
  token: string;
  status: string;
  formation: {
    titre: string;
    objectifs: string[] | string | null;
  };
  session: {
    dateDebut: string | null;
    dateFin: string | null;
    lieu: string;
    nombreParticipants: number;
  };
  intervenant: {
    nom: string;
    prenom: string;
  };
  questions: QuestionSection;
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

// Section titles
const SECTION_TITLES: Record<string, string> = {
  organisation: "Organisation et logistique",
  contenu: "Contenu, méthodes et dynamique de groupe",
  objectifs: "Atteinte des objectifs et ressenti global",
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
        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function EvaluationIntervenantPage() {
  const params = useParams();
  const token = params.token as string;

  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reponses, setReponses] = useState<Record<string, number | string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // Load evaluation data
  useEffect(() => {
    async function loadEvaluation() {
      try {
        const res = await fetch(`/api/evaluation-intervenant/${token}`);
        const data = await res.json();

        if (!res.ok) {
          if (data.completed) {
            setSubmitted(true);
          }
          throw new Error(data.error || "Erreur de chargement");
        }

        setEvaluation(data);

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

  // Get all questions as flat array
  const getAllQuestions = useCallback(() => {
    if (!evaluation) return [];
    return Object.values(evaluation.questions).flat();
  }, [evaluation]);

  // Get sections
  const getSections = useCallback(() => {
    if (!evaluation) return [];
    return Object.entries(evaluation.questions);
  }, [evaluation]);

  // Calculate progress
  const getProgress = useCallback(() => {
    const allQuestions = getAllQuestions();
    const answeredCount = allQuestions.filter((q) => reponses[q.id] !== undefined).length;
    return { answered: answeredCount, total: allQuestions.length };
  }, [getAllQuestions, reponses]);

  // Handle rating change
  const handleRatingChange = (questionId: string, value: number) => {
    setReponses((prev) => ({ ...prev, [questionId]: value }));
  };

  // Handle suggestions change
  const handleSuggestionsChange = (value: string) => {
    setReponses((prev) => ({ ...prev, suggestions: value }));
  };

  // Verify email
  const handleVerifyEmail = () => {
    if (!evaluation) return;
    setEmailVerified(true);
  };

  // Submit evaluation
  const handleSubmit = async () => {
    if (!evaluation) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/evaluation-intervenant/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
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
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre retour !</h1>
          <p className="text-gray-600">
            Votre évaluation a été enregistrée avec succès. Elle nous aide à améliorer l&apos;organisation de nos formations.
          </p>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  const sections = getSections();
  const progress = getProgress();
  const isComplete = progress.answered >= progress.total;

  // Email verification screen
  if (!emailVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Évaluation Intervenant</h1>
              <p className="text-gray-600 mt-2">Votre retour sur cette session de formation</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">{evaluation.formation.titre}</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  Dates : {formatDate(evaluation.session.dateDebut)}
                  {evaluation.session.dateFin && evaluation.session.dateFin !== evaluation.session.dateDebut && (
                    <> au {formatDate(evaluation.session.dateFin)}</>
                  )}
                </p>
                <p>Lieu : {evaluation.session.lieu}</p>
                <p>Participants : {evaluation.session.nombreParticipants} stagiaire(s)</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmez votre email pour commencer
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Intervenant : {evaluation.intervenant.prenom} {evaluation.intervenant.nom}
              </p>
            </div>

            <button
              onClick={handleVerifyEmail}
              className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Évaluation Intervenant
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
            <span>Lieu : {evaluation.session.lieu}</span>
            <span>|</span>
            <span>{evaluation.session.nombreParticipants} participant(s)</span>
          </div>
        </div>

        {/* Section navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sections.map(([key], index) => (
            <button
              key={key}
              onClick={() => setCurrentSection(index)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                currentSection === index
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {index + 1}. {SECTION_TITLES[key] || key}
            </button>
          ))}
          <button
            onClick={() => setCurrentSection(sections.length)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              currentSection === sections.length
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Suggestions
          </button>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {currentSection < sections.length ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                {SECTION_TITLES[sections[currentSection][0]] || sections[currentSection][0]}
              </h2>

              <div className="space-y-8">
                {sections[currentSection][1].map((question, qIndex) => (
                  <div key={question.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                    <p className="text-gray-800 font-medium mb-1">
                      <span className="text-purple-600 mr-2">{qIndex + 1}.</span>
                      {question.label}
                    </p>
                    <RatingSlider
                      value={reponses[question.id] as number | null ?? null}
                      onChange={(value) => handleRatingChange(question.id, value)}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-6">Suggestions d&apos;amélioration</h2>
              <p className="text-gray-600 mb-4">
                Si vous deviez suggérer une ou deux améliorations pour vos prochaines interventions (organisation, supports, informations en amont, accompagnement…), lesquelles proposeriez-vous ?
              </p>
              <textarea
                value={(reponses.suggestions as string) || ""}
                onChange={(e) => handleSuggestionsChange(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                placeholder="Partagez vos suggestions..."
              />
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentSection((prev) => Math.max(0, prev - 1))}
              disabled={currentSection === 0}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>

            {currentSection < sections.length ? (
              <button
                onClick={() => setCurrentSection((prev) => prev + 1)}
                className="px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
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

          {!isComplete && currentSection === sections.length && (
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
