"use client";

import React, { useState, useEffect } from "react";

interface CustomDomainSectionProps {
  organizationSlug: string;
  currentDomain?: string | null;
  customDomainVerified?: boolean;
  isPro: boolean;
  onDomainUpdate: () => void;
}

type DnsStatus = "pending" | "checking" | "verified" | "error";

interface DnsRecord {
  type: "CNAME" | "TXT";
  name: string;
  value: string;
  status: DnsStatus;
}

// Icons
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
    <path d="M8 2C4.68629 2 2 4.68629 2 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3333 6H7.33333C6.59695 6 6 6.59695 6 7.33333V13.3333C6 14.0697 6.59695 14.6667 7.33333 14.6667H13.3333C14.0697 14.6667 14.6667 14.0697 14.6667 13.3333V7.33333C14.6667 6.59695 14.0697 6 13.3333 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.33333 10H2.66667C2.31304 10 1.97391 9.85952 1.72386 9.60948C1.47381 9.35943 1.33333 9.02029 1.33333 8.66667V2.66667C1.33333 2.31304 1.47381 1.97391 1.72386 1.72386C1.97391 1.47381 2.31304 1.33333 2.66667 1.33333H8.66667C9.02029 1.33333 9.35943 1.47381 9.60948 1.72386C9.85952 1.97391 10 2.31304 10 2.66667V3.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 10H18M10 2C12.5 4.5 13.5 7 13.5 10C13.5 13 12.5 15.5 10 18M10 2C7.5 4.5 6.5 7 6.5 10C6.5 13 7.5 15.5 10 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function CustomDomainSection({
  organizationSlug,
  currentDomain,
  customDomainVerified = false,
  isPro,
  onDomainUpdate,
}: CustomDomainSectionProps) {
  const [domain, setDomain] = useState(currentDomain || "");
  const [isEditing, setIsEditing] = useState(!currentDomain);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);
  const [isConfigured, setIsConfigured] = useState(customDomainVerified);
  const [copied, setCopied] = useState<string | null>(null);

  // Générer les enregistrements DNS requis
  useEffect(() => {
    if (domain && !isEditing) {
      const records: DnsRecord[] = [
        {
          type: "CNAME",
          name: domain, // Le domaine complet
          value: "app.automate-forma.com",
          status: "pending",
        },
        {
          type: "TXT",
          name: `_automate-forma-verify.${domain}`,
          value: `automate-forma-verify=${organizationSlug}`,
          status: "pending",
        },
      ];
      setDnsRecords(records);
    }
  }, [domain, isEditing, organizationSlug]);

  const handleSaveDomain = async () => {
    if (!domain) {
      setError("Veuillez entrer un domaine");
      return;
    }

    // Validation basique du domaine
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      setError("Format de domaine invalide (ex: app.votre-domaine.com)");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la sauvegarde");
        return;
      }

      setIsEditing(false);
      onDomainUpdate();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyDns = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/custom-domain/verify", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la vérification");
        // Update DNS records status
        setDnsRecords((prev) =>
          prev.map((r) => ({
            ...r,
            status: "error" as DnsStatus,
          }))
        );
        return;
      }

      // Update DNS records status based on verification result
      const verification = data.verification;
      setDnsRecords((prev) =>
        prev.map((r) => ({
          ...r,
          status: r.type === "CNAME"
            ? (verification.cname.verified ? "verified" : "error")
            : (verification.txt.verified ? "verified" : "error"),
        }))
      );

      // Afficher les erreurs DNS spécifiques
      const errors: string[] = [];
      if (!verification.cname.verified && verification.cname.error) {
        errors.push(`CNAME: ${verification.cname.error}`);
      }
      if (!verification.txt.verified && verification.txt.error) {
        errors.push(`TXT: ${verification.txt.error}`);
      }
      if (errors.length > 0 && !verification.allVerified) {
        setError(errors.join(" | "));
      }

      if (verification.allVerified) {
        setIsConfigured(true);
        onDomainUpdate();
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce domaine personnalisé ?")) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/custom-domain", {
        method: "DELETE",
      });

      if (response.ok) {
        setDomain("");
        setIsEditing(true);
        setDnsRecords([]);
        setIsConfigured(false);
        onDomainUpdate();
      }
    } catch {
      setError("Erreur lors de la suppression");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusIcon = (status: DnsStatus) => {
    switch (status) {
      case "verified":
        return <span className="text-green-500"><CheckIcon /></span>;
      case "checking":
        return <span className="text-blue-500"><LoaderIcon /></span>;
      case "error":
        return <span className="text-red-500"><AlertIcon /></span>;
      default:
        return <span className="text-gray-400"><AlertIcon /></span>;
    }
  };

  // Si pas plan Pro, afficher message
  if (!isPro) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <GlobeIcon />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Domaine personnalisé
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Utilisez votre propre domaine pour accéder à votre espace
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-full">
            Plan Pro requis
          </span>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="formation.votre-domaine.com"
            disabled
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-100 dark:bg-gray-900 dark:border-gray-700 text-gray-400 cursor-not-allowed"
            readOnly
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Passez au plan Pro pour utiliser votre propre domaine et offrir une expérience 100% personnalisée à vos apprenants.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400">
            <GlobeIcon />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Domaine personnalisé
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Utilisez votre propre domaine pour accéder à votre espace
            </p>
          </div>
        </div>
        {isConfigured && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Actif
          </span>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Input domaine */}
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value.toLowerCase());
                setError(null);
              }}
              placeholder="formation.votre-domaine.com"
              className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            />
            <button
              onClick={handleSaveDomain}
              disabled={isSaving || !domain}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Exemple : formation.votre-entreprise.com, app.votre-domaine.fr
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Domaine configuré */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {domain}
              </span>
              {isConfigured && (
                <a
                  href={`https://${domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:text-brand-700"
                >
                  Visiter
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                Modifier
              </button>
              <button
                onClick={handleRemoveDomain}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>

          {/* Instructions DNS */}
          {!isConfigured && dnsRecords.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Configuration DNS requise
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ajoutez les enregistrements DNS suivants chez votre registrar de domaine :
              </p>

              <div className="space-y-2">
                {dnsRecords.map((record, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded">
                          {record.type}
                        </span>
                        {getStatusIcon(record.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 mb-1">Nom / Host</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded font-mono truncate">
                            {record.name}
                          </code>
                          <button
                            onClick={() => copyToClipboard(record.name, `name-${idx}`)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Copier"
                          >
                            {copied === `name-${idx}` ? <CheckIcon /> : <CopyIcon />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 mb-1">Valeur</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded font-mono truncate">
                            {record.value}
                          </code>
                          <button
                            onClick={() => copyToClipboard(record.value, `value-${idx}`)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Copier"
                          >
                            {copied === `value-${idx}` ? <CheckIcon /> : <CopyIcon />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleVerifyDns}
                  disabled={isVerifying}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {isVerifying ? (
                    <>
                      <LoaderIcon />
                      Vérification...
                    </>
                  ) : (
                    "Vérifier la configuration DNS"
                  )}
                </button>
                <p className="text-xs text-gray-500">
                  La propagation DNS peut prendre jusqu&apos;à 48h
                </p>
              </div>
            </div>
          )}

          {/* Domaine vérifié */}
          {isConfigured && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">
                  <CheckIcon />
                </span>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Domaine configuré avec succès !
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Vos apprenants peuvent maintenant accéder à votre espace via{" "}
                    <a
                      href={`https://${domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      {domain}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
