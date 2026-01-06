"use client";

import { Mail, Phone, Globe, Building2 } from "lucide-react";
import Image from "next/image";

interface CatalogueHeaderProps {
  organization: {
    name: string;
    logo: string | null;
    email: string | null;
    telephone: string | null;
    siteWeb: string | null;
    certifications: string[];
    primaryColor: string;
  };
}

export function CatalogueHeader({ organization }: CatalogueHeaderProps) {
  const primaryColor = organization.primaryColor || "#4277FF";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo et nom */}
          <div className="flex items-center gap-4">
            {organization.logo ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                <Image
                  src={organization.logo}
                  alt={organization.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {organization.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {organization.name}
              </h1>
              <p className="text-sm text-gray-500">Catalogue de formation</p>
            </div>
          </div>

          {/* Contacts */}
          <div className="hidden md:flex items-center gap-6">
            {organization.email && (
              <a
                href={`mailto:${organization.email}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                style={{ ["--hover-color" as string]: primaryColor }}
              >
                <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                <span>{organization.email}</span>
              </a>
            )}

            {organization.telephone && (
              <a
                href={`tel:${organization.telephone}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                <span>{organization.telephone}</span>
              </a>
            )}

            {organization.siteWeb && (
              <a
                href={
                  organization.siteWeb.startsWith("http")
                    ? organization.siteWeb
                    : `https://${organization.siteWeb}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <Globe className="w-4 h-4" />
                <span>Notre site web</span>
              </a>
            )}
          </div>

          {/* Mobile menu - contacts condensés */}
          <div className="md:hidden flex items-center gap-3">
            {organization.email && (
              <a
                href={`mailto:${organization.email}`}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Mail className="w-5 h-5" style={{ color: primaryColor }} />
              </a>
            )}
            {organization.telephone && (
              <a
                href={`tel:${organization.telephone}`}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Phone className="w-5 h-5" style={{ color: primaryColor }} />
              </a>
            )}
            {organization.siteWeb && (
              <a
                href={
                  organization.siteWeb.startsWith("http")
                    ? organization.siteWeb
                    : `https://${organization.siteWeb}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-white transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Certifications */}
        {organization.certifications.length > 0 && (
          <div className="pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {organization.certifications.map((cert, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
