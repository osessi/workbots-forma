"use client";

// ===========================================
// PAGE SUPER ADMIN - Nouvelle audience
// ===========================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, Upload, RefreshCw, Plus, X, Check
} from "lucide-react";

export default function NewAudiencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState<"manual" | "csv">("manual");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contacts: [{ email: "", firstName: "", lastName: "" }],
  });

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { email: "", firstName: "", lastName: "" }],
    });
  };

  const removeContact = (index: number) => {
    setFormData({
      ...formData,
      contacts: formData.contacts.filter((_, i) => i !== index),
    });
  };

  const updateContact = (index: number, field: string, value: string) => {
    const newContacts = [...formData.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData({ ...formData, contacts: newContacts });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Créer l'audience
      const res = await fetch("/api/emailing/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la création");
        return;
      }

      const { audience } = await res.json();

      // Ajouter les contacts si mode manuel
      if (importMode === "manual" && formData.contacts.some(c => c.email)) {
        const validContacts = formData.contacts.filter(c => c.email);
        await fetch(`/api/emailing/audiences/${audience.id}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contacts: validContacts }),
        });
      }

      // Import CSV si mode CSV
      if (importMode === "csv" && csvFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", csvFile);
        await fetch(`/api/emailing/audiences/${audience.id}/import`, {
          method: "POST",
          body: formDataUpload,
        });
      }

      router.push("/admin/emailing/audiences");
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/emailing/audiences"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-500" />
            Nouvelle audience
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Créez une liste de contacts pour vos campagnes
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de l&apos;audience *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Clients actifs"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de cette audience..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Mode d'import */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Ajouter des contacts</h3>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setImportMode("manual")}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                importMode === "manual"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <Plus className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
              <p className="font-medium text-gray-900 dark:text-white">Ajout manuel</p>
              <p className="text-sm text-gray-500">Entrez les contacts un par un</p>
            </button>
            <button
              onClick={() => setImportMode("csv")}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                importMode === "csv"
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
              <p className="font-medium text-gray-900 dark:text-white">Import CSV</p>
              <p className="text-sm text-gray-500">Importez depuis un fichier</p>
            </button>
          </div>

          {/* Mode manuel */}
          {importMode === "manual" && (
            <div className="space-y-3">
              {formData.contacts.map((contact, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, "email", e.target.value)}
                    placeholder="email@exemple.com"
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={contact.firstName}
                    onChange={(e) => updateContact(index, "firstName", e.target.value)}
                    placeholder="Prénom"
                    className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={contact.lastName}
                    onChange={(e) => updateContact(index, "lastName", e.target.value)}
                    placeholder="Nom"
                    className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {formData.contacts.length > 1 && (
                    <button
                      onClick={() => removeContact(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addContact}
                className="flex items-center gap-2 text-brand-600 hover:text-brand-700"
              >
                <Plus className="w-4 h-4" />
                Ajouter un contact
              </button>
            </div>
          )}

          {/* Mode CSV */}
          {importMode === "csv" && (
            <div>
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-brand-500 transition-colors">
                  {csvFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <Check className="w-6 h-6 text-green-500" />
                      <span className="text-gray-900 dark:text-white">{csvFile.name}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCsvFile(null);
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Cliquez ou déposez un fichier CSV
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Colonnes: email, firstName, lastName
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/admin/emailing/audiences"
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Annuler
        </Link>
        <button
          onClick={handleSubmit}
          disabled={loading || !formData.name}
          className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          Créer l&apos;audience
        </button>
      </div>
    </div>
  );
}
