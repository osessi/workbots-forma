"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Maximize2, Minimize2, RotateCcw, Loader2, AlertCircle } from "lucide-react";

// Types
interface ScormPlayerProps {
  packageId: string;
  launchUrl: string;
  version: "SCORM_1_2" | "SCORM_2004";
  apprenantId?: string;
  apprenantName?: string;
  inscriptionId?: string;
  initialCmiData?: Record<string, any>;
  onProgress?: (progress: number, status: string) => void;
  onComplete?: (data: { status: string; score?: number }) => void;
  onClose?: () => void;
  className?: string;
  previewMode?: boolean;
}

// Codes d'erreur SCORM
const ERROR_CODES: Record<string, string> = {
  "0": "No Error",
  "101": "General Exception",
  "102": "General Initialization Failure",
  "103": "Already Initialized",
  "104": "Content Instance Terminated",
  "111": "General Termination Failure",
  "112": "Termination Before Initialization",
  "113": "Termination After Termination",
  "122": "Retrieve Data Before Initialization",
  "123": "Retrieve Data After Termination",
  "132": "Store Data Before Initialization",
  "133": "Store Data After Termination",
  "142": "Commit Before Initialization",
  "143": "Commit After Termination",
  "201": "General Argument Error",
  "301": "General Get Failure",
  "351": "General Set Failure",
  "391": "General Commit Failure",
  "401": "Undefined Data Model Element",
  "402": "Unimplemented Data Model Element",
  "403": "Data Model Element Value Not Initialized",
  "404": "Data Model Element Is Read Only",
  "405": "Data Model Element Is Write Only",
  "406": "Data Model Element Type Mismatch",
  "407": "Data Model Element Value Out Of Range",
};

// Helper: Retourne les enfants pour un élément _children
function getChildrenFor(element: string): string {
  const childrenMap: Record<string, string> = {
    "cmi.core._children": "student_id,student_name,lesson_location,credit,lesson_status,entry,score,total_time,lesson_mode,exit,session_time",
    "cmi.core.score._children": "raw,min,max",
    "cmi.objectives._children": "id,score,status",
    "cmi.student_data._children": "mastery_score,max_time_allowed,time_limit_action",
    "cmi.student_preference._children": "audio,language,speed,text",
    "cmi.interactions._children": "id,objectives,time,type,correct_responses,weighting,student_response,result,latency",
    "cmi._children": "comments_from_learner,comments_from_lms,completion_status,credit,entry,exit,interactions,launch_data,learner_id,learner_name,learner_preference,location,max_time_allowed,mode,objectives,progress_measure,scaled_passing_score,score,session_time,success_status,suspend_data,time_limit_action,total_time",
    "cmi.score._children": "scaled,raw,min,max",
  };
  return childrenMap[element] || "";
}

export default function ScormPlayer({
  packageId,
  launchUrl,
  version,
  apprenantId = "preview",
  apprenantName = "Prévisualisation",
  inscriptionId,
  initialCmiData = {},
  onProgress,
  onComplete,
  onClose,
  className = "",
  previewMode = false,
}: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<"waiting" | "running">("waiting");

  // Utiliser des refs pour l'état interne de l'API (pas de re-render)
  const isInitializedRef = useRef(false);
  const lastErrorRef = useRef("0");
  const cmiDataRef = useRef<Record<string, string>>({});
  const commitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs pour les callbacks (évite les problèmes de closure)
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  onProgressRef.current = onProgress;
  onCompleteRef.current = onComplete;

  // Initialiser avec les données existantes
  useEffect(() => {
    if (initialCmiData && Object.keys(initialCmiData).length > 0) {
      cmiDataRef.current = { ...initialCmiData };
    }
  }, [initialCmiData]);

  // Commit vers le serveur
  const commitToServer = useCallback(async () => {
    if (previewMode) {
      console.log("[SCORM Preview] Commit simulé (pas de sauvegarde)");
      return true;
    }

    try {
      const response = await fetch("/api/lms/scorm/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          apprenantId,
          inscriptionId,
          cmi: cmiDataRef.current,
        }),
      });

      if (!response.ok) {
        console.error("Erreur commit SCORM:", await response.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error("Erreur commit SCORM:", err);
      return false;
    }
  }, [packageId, apprenantId, inscriptionId, previewMode]);

  // Exposer l'API SCORM sur window AVANT de charger l'iframe
  useEffect(() => {
    const isScorm12 = version === "SCORM_1_2";

    // Fonction pour scheduler un commit différé
    const scheduleCommit = () => {
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current);
      }
      commitTimeoutRef.current = setTimeout(() => {
        commitToServer();
      }, 5000);
    };

    // Créer l'API SCORM
    const api = {
      // SCORM 2004 methods
      Initialize: (param: string) => {
        console.log("[SCORM] Initialize", param);
        if (isInitializedRef.current) {
          lastErrorRef.current = "103";
          return "false";
        }
        isInitializedRef.current = true;
        lastErrorRef.current = "0";
        setDisplayStatus("running");

        // Initialiser les données par défaut
        if (isScorm12) {
          cmiDataRef.current["cmi.core.student_id"] = apprenantId;
          cmiDataRef.current["cmi.core.student_name"] = apprenantName;
          cmiDataRef.current["cmi.core.lesson_status"] =
            cmiDataRef.current["cmi.core.lesson_status"] || "not attempted";
          cmiDataRef.current["cmi.core.entry"] =
            cmiDataRef.current["cmi.suspend_data"] ? "resume" : "ab-initio";
        } else {
          cmiDataRef.current["cmi.learner_id"] = apprenantId;
          cmiDataRef.current["cmi.learner_name"] = apprenantName;
          cmiDataRef.current["cmi.completion_status"] =
            cmiDataRef.current["cmi.completion_status"] || "not attempted";
          cmiDataRef.current["cmi.entry"] =
            cmiDataRef.current["cmi.suspend_data"] ? "resume" : "ab-initio";
        }

        return "true";
      },

      Terminate: (param: string) => {
        console.log("[SCORM] Terminate", param);
        if (!isInitializedRef.current) {
          lastErrorRef.current = "112";
          return "false";
        }

        // Commit final
        if (commitTimeoutRef.current) {
          clearTimeout(commitTimeoutRef.current);
        }
        commitToServer();

        // Notifier la complétion
        const status = isScorm12
          ? cmiDataRef.current["cmi.core.lesson_status"]
          : cmiDataRef.current["cmi.completion_status"];
        const score = isScorm12
          ? parseFloat(cmiDataRef.current["cmi.core.score.raw"] || "0")
          : parseFloat(cmiDataRef.current["cmi.score.raw"] || "0");

        if (status === "completed" || status === "passed") {
          onCompleteRef.current?.({ status, score: isNaN(score) ? undefined : score });
        }

        isInitializedRef.current = false;
        lastErrorRef.current = "0";
        setDisplayStatus("waiting");
        return "true";
      },

      GetValue: (element: string) => {
        console.log("[SCORM] GetValue", element);
        if (!isInitializedRef.current) {
          lastErrorRef.current = "122";
          return "";
        }

        const value = cmiDataRef.current[element];
        if (value !== undefined) {
          lastErrorRef.current = "0";
          return value;
        }

        // Valeurs par défaut
        if (element === "cmi.core.credit" || element === "cmi.credit") return "credit";
        if (element === "cmi.core.lesson_mode" || element === "cmi.mode") return "normal";
        if (element.endsWith("._count")) return "0";
        if (element.endsWith("._children")) {
          lastErrorRef.current = "0";
          return getChildrenFor(element);
        }

        lastErrorRef.current = "0";
        return "";
      },

      SetValue: (element: string, value: string) => {
        console.log("[SCORM] SetValue", element, value);
        if (!isInitializedRef.current) {
          lastErrorRef.current = "132";
          return "false";
        }

        // Éléments en lecture seule
        const readOnlyElements = [
          "cmi.core.student_id", "cmi.core.student_name", "cmi.core.credit",
          "cmi.core.lesson_mode", "cmi.learner_id", "cmi.learner_name",
          "cmi.credit", "cmi.mode", "cmi.entry",
        ];
        if (readOnlyElements.includes(element)) {
          lastErrorRef.current = "404";
          return "false";
        }

        cmiDataRef.current[element] = value;
        lastErrorRef.current = "0";
        scheduleCommit();

        // Notifier la progression
        if (element === "cmi.core.lesson_status" || element === "cmi.completion_status") {
          const progress = value === "completed" || value === "passed" ? 100 :
            value === "incomplete" ? 50 : 0;
          onProgressRef.current?.(progress, value);
        }

        return "true";
      },

      Commit: (param: string) => {
        console.log("[SCORM] Commit", param);
        if (!isInitializedRef.current) {
          lastErrorRef.current = "142";
          return "false";
        }
        commitToServer();
        lastErrorRef.current = "0";
        return "true";
      },

      GetLastError: () => lastErrorRef.current,
      GetErrorString: (errorCode: string) => ERROR_CODES[errorCode] || "Unknown Error",
      GetDiagnostic: (errorCode: string) => ERROR_CODES[errorCode] || "Unknown Error",

      // SCORM 1.2 aliases
      LMSInitialize: function(param: string) { return this.Initialize(param); },
      LMSFinish: function(param: string) { return this.Terminate(param); },
      LMSGetValue: function(element: string) { return this.GetValue(element); },
      LMSSetValue: function(element: string, value: string) { return this.SetValue(element, value); },
      LMSCommit: function(param: string) { return this.Commit(param); },
      LMSGetLastError: function() { return this.GetLastError(); },
      LMSGetErrorString: function(errorCode: string) { return this.GetErrorString(errorCode); },
      LMSGetDiagnostic: function(errorCode: string) { return this.GetDiagnostic(errorCode); },
    };

    // Exposer l'API sur window
    if (isScorm12) {
      (window as any).API = api;
    } else {
      (window as any).API_1484_11 = api;
    }

    // Aussi exposer sur window.parent pour les iframes
    // Le contenu SCORM cherche souvent l'API sur window.parent
    console.log("[SCORM] API exposée sur window", isScorm12 ? "API" : "API_1484_11");

    return () => {
      if (isScorm12) {
        delete (window as any).API;
      } else {
        delete (window as any).API_1484_11;
      }
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current);
      }
    };
  }, [version, apprenantId, apprenantName, commitToServer]);

  // Gestion du fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Restart le module
  const handleRestart = useCallback(() => {
    if (iframeRef.current) {
      cmiDataRef.current = {};
      isInitializedRef.current = false;
      setDisplayStatus("waiting");
      const src = iframeRef.current.src;
      iframeRef.current.src = "";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = src;
        }
      }, 100);
    }
  }, []);

  // Fermer proprement
  const handleClose = useCallback(() => {
    if (isInitializedRef.current) {
      const api = version === "SCORM_1_2" ? (window as any).API : (window as any).API_1484_11;
      if (api?.Terminate) {
        api.Terminate("");
      }
    }
    onClose?.();
  }, [version, onClose]);

  return (
    <div className={`relative flex flex-col bg-gray-900 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${displayStatus === "running" ? "bg-green-500" : "bg-amber-500"}`} />
          <span className="text-sm text-gray-300">
            {displayStatus === "running" ? "Module en cours" : "En attente d'initialisation"}
          </span>
          {previewMode && (
            <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
              Prévisualisation
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Recommencer"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          {onClose && (
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Fermer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
              <p className="text-gray-400">Chargement du module...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="p-4 bg-red-500/20 rounded-full">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">Erreur de chargement</h3>
              <p className="text-gray-400">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                }}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={launchUrl}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Impossible de charger le contenu SCORM");
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
