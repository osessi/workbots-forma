"use client";

// ===========================================
// Page de passage d'évaluation QCM/Progression
// ===========================================

import React, { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileQuestion,
  Target,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";

interface Question {
  index: number;
  question: string;
  answers: string[];
  correctAnswer?: number;
  explanation?: string;
}

interface EvaluationData {
  id: string;
  titre: string;
  type: string;
  description: string | null;
  dureeEstimee: number | null;
  scoreMinimum: number | null;
  instructions: string | null;
  questionsCount: number;
  questions: Question[];
  formation: {
    id: string;
    titre: string;
  };
  module: {
    id: string;
    titre: string;
    ordre: number;
  } | null;
}

interface ResultatData {
  id: string;
  status: string;
  score: number | null;
  reponses: Array<{ questionIndex: number; selectedAnswer: number }>;
  tentative: number;
  completedAt: string | null;
}

export default function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, selectedSession } = useApprenantPortal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId") || selectedSession?.sessionId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [resultat, setResultat] = useState<ResultatData | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // État du QCM
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  // Charger l'évaluation
  useEffect(() => {
    if (!token || !id) return;

    const fetchEvaluation = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ token });
        if (sessionId) params.append("sessionId", sessionId);

        const response = await fetch(`/api/apprenant/evaluations/${id}?${params}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Erreur de chargement");
          return;
        }

        setEvaluation(data.evaluation);
        setResultat(data.resultat);
        setIsCompleted(data.isCompleted);

        // Si déjà complété, afficher les résultats
        if (data.isCompleted && data.resultat?.reponses) {
          const existingAnswers = new Map<number, number>();
          data.resultat.reponses.forEach((r: { questionIndex: number; selectedAnswer: number }) => {
            existingAnswers.set(r.questionIndex, r.selectedAnswer);
          });
          setAnswers(existingAnswers);
          setShowResults(true);
          setSubmittedScore(data.resultat.score);
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [token, id, sessionId]);

  // Sélectionner une réponse
  const selectAnswer = (questionIndex: number, answerIndex: number) => {
    if (showResults) return;
    setAnswers(new Map(answers.set(questionIndex, answerIndex)));
  };

  // Navigation
  const goToQuestion = (index: number) => {
    if (index >= 0 && evaluation && index < evaluation.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Soumettre le QCM
  const submitQCM = async () => {
    if (!token || !evaluation || submitting) return;

    // Vérifier que toutes les questions sont répondues
    const allAnswered = evaluation.questions.every((_, idx) => answers.has(idx));
    if (!allAnswered) {
      setError("Veuillez répondre à toutes les questions avant de soumettre.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reponses = Array.from(answers.entries()).map(([questionIndex, selectedAnswer]) => ({
        questionIndex,
        selectedAnswer,
      }));

      const response = await fetch(`/api/apprenant/evaluations/submit?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationId: evaluation.id,
          reponses,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la soumission");
        return;
      }

      // Recharger l'évaluation pour avoir les réponses correctes
      const evalResponse = await fetch(
        `/api/apprenant/evaluations/${id}?token=${token}${sessionId ? `&sessionId=${sessionId}` : ""}`
      );
      const evalData = await evalResponse.json();

      if (evalResponse.ok) {
        setEvaluation(evalData.evaluation);
        setResultat(evalData.resultat);
        setIsCompleted(true);
      }

      setSubmittedScore(data.resultat.score);
      setShowResults(true);
    } catch (err) {
      console.error("Erreur soumission:", err);
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  // Recommencer (si autorisé)
  const restartQCM = () => {
    setAnswers(new Map());
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setSubmittedScore(null);
    setIsCompleted(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-gray-500">Chargement de l'évaluation...</p>
        </div>
      </div>
    );
  }

  if (error && !evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Erreur</h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <Link
            href="/apprenant/evaluations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux évaluations
          </Link>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Évaluation non trouvée
          </h2>
          <Link
            href="/apprenant/evaluations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux évaluations
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = evaluation.questions[currentQuestionIndex];
  const answeredCount = answers.size;
  const totalQuestions = evaluation.questions.length;
  const progress = (answeredCount / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/apprenant/evaluations"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-brand-500 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux évaluations
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                <FileQuestion className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {evaluation.titre}
                </h1>
                {evaluation.module && (
                  <p className="text-sm text-brand-600 dark:text-brand-400 mb-1">
                    Module {evaluation.module.ordre} - {evaluation.module.titre}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {evaluation.formation.titre}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {evaluation.dureeEstimee && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {evaluation.dureeEstimee} min
                  </span>
                )}
                {evaluation.scoreMinimum && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Target className="w-4 h-4" />
                    Min. {evaluation.scoreMinimum}%
                  </span>
                )}
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>{answeredCount} / {totalQuestions} questions répondues</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Résultats finaux */}
        {showResults && submittedScore !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-6 rounded-xl p-6 ${
              submittedScore >= (evaluation.scoreMinimum || 50)
                ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30"
                : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                submittedScore >= (evaluation.scoreMinimum || 50)
                  ? "bg-green-100 dark:bg-green-500/20"
                  : "bg-red-100 dark:bg-red-500/20"
              }`}>
                {submittedScore >= (evaluation.scoreMinimum || 50) ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                  <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className={`text-lg font-semibold ${
                  submittedScore >= (evaluation.scoreMinimum || 50)
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}>
                  {submittedScore >= (evaluation.scoreMinimum || 50) ? "Bravo !" : "Score insuffisant"}
                </h2>
                <p className={`text-sm ${
                  submittedScore >= (evaluation.scoreMinimum || 50)
                    ? "text-green-600 dark:text-green-300"
                    : "text-red-600 dark:text-red-300"
                }`}>
                  {submittedScore >= (evaluation.scoreMinimum || 50)
                    ? "Vous avez réussi cette évaluation."
                    : `Le score minimum requis est de ${evaluation.scoreMinimum || 50}%.`}
                </p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  submittedScore >= (evaluation.scoreMinimum || 50)
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {Math.round(submittedScore)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Score obtenu</div>
              </div>
            </div>
            {submittedScore < (evaluation.scoreMinimum || 50) && !isCompleted && (
              <button
                onClick={restartQCM}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Recommencer
              </button>
            )}
          </motion.div>
        )}

        {/* Question actuelle */}
        {currentQuestion && (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 rounded-full text-sm font-medium">
                Question {currentQuestionIndex + 1} / {totalQuestions}
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.answers.map((answer, idx) => {
                const isSelected = answers.get(currentQuestionIndex) === idx;
                const isCorrect = showResults && currentQuestion.correctAnswer === idx;
                const isWrong = showResults && isSelected && currentQuestion.correctAnswer !== idx;

                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(currentQuestionIndex, idx)}
                    disabled={showResults}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      showResults
                        ? isCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-500/10"
                          : isWrong
                          ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                          : "border-gray-200 dark:border-gray-700"
                        : isSelected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-500/50"
                    } ${showResults ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        showResults
                          ? isCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : isWrong
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-gray-300 dark:border-gray-600"
                          : isSelected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}>
                        {showResults && isCorrect ? (
                          <Check className="w-4 h-4" />
                        ) : showResults && isWrong ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">
                            {String.fromCharCode(65 + idx)}
                          </span>
                        )}
                      </div>
                      <span className={`flex-1 ${
                        showResults
                          ? isCorrect
                            ? "text-green-700 dark:text-green-400"
                            : isWrong
                            ? "text-red-700 dark:text-red-400"
                            : "text-gray-700 dark:text-gray-300"
                          : "text-gray-700 dark:text-gray-300"
                      }`}>
                        {answer}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explication si terminé */}
            {showResults && currentQuestion.explanation && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Explication :</strong> {currentQuestion.explanation}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </button>

          <div className="flex items-center gap-2">
            {evaluation.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToQuestion(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  idx === currentQuestionIndex
                    ? "bg-brand-500 text-white"
                    : answers.has(idx)
                    ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <button
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : !showResults ? (
            <button
              onClick={submitQCM}
              disabled={submitting || answeredCount < totalQuestions}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Terminer
                </>
              )}
            </button>
          ) : (
            <Link
              href="/apprenant/evaluations"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Terminer
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}
