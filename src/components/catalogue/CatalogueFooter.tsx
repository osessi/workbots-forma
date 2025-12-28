"use client";

import { ExternalLink, FileText } from "lucide-react";
import Image from "next/image";

interface CatalogueFooterProps {
  organization: {
    name: string;
    certifications: string[];
    certificatQualiopiUrl: string | null;
    categorieQualiopi: string | null;
    primaryColor: string;
  };
}

// Composant Logo Qualiopi officiel - Image PNG
function QualiopiLogo() {
  return (
    <div className="flex flex-col items-center">
      {/* Logo Qualiopi officiel - Image PNG */}
      <div className="bg-white rounded-lg p-4">
        <Image
          src="/logoqualiopi.png"
          alt="Certification Qualiopi"
          width={250}
          height={100}
          className="object-contain"
        />
      </div>
    </div>
  );
}

export function CatalogueFooter({ organization }: CatalogueFooterProps) {
  const primaryColor = organization.primaryColor || "#4277FF";

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      {/* Section Qualiopi - TOUJOURS AFFICHÉE (obligation légale) */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Titre */}
          <h3 className="text-center text-lg font-semibold text-gray-900 mb-8">
            Les certifications de notre organisme de formation
          </h3>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Logo Qualiopi */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <QualiopiLogo />

              {/* Bouton voir le certificat */}
              {organization.certificatQualiopiUrl && (
                <a
                  href={organization.certificatQualiopiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  <FileText className="w-4 h-4" />
                  Voir le certificat
                </a>
              )}
            </div>
          </div>

          {/* Catégorie de certification */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Certification délivrée au titre de la catégorie :{" "}
            <span className="font-semibold text-gray-900">
              {organization.categorieQualiopi || "Actions de formation"}
            </span>
          </p>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-gray-500">
            {organization.name} - Tous droits réservés
          </p>

          {/* Powered by */}
          <a
            href="https://workbots.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span>Propulsé par</span>
            <span className="font-medium">WORKBOTS Formation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
