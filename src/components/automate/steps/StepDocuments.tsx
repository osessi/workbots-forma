"use client";
import React, { useState, useRef, useEffect } from "react";

// Icon Plus
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3.33333V12.6667M3.33333 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Trash
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.75 3.5H12.25M5.25 3.5V2.33333C5.25 1.8731 5.6231 1.5 6.08333 1.5H7.91667C8.3769 1.5 8.75 1.8731 8.75 2.33333V3.5M10.5 3.5V11.6667C10.5 12.1269 10.1269 12.5 9.66667 12.5H4.33333C3.8731 12.5 3.5 12.1269 3.5 11.6667V3.5H10.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Calendar
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 1.33333V3.33333M11 1.33333V3.33333M2.33333 6H13.6667M3.33333 2.66667H12.6667C13.219 2.66667 13.6667 3.11438 13.6667 3.66667V13.3333C13.6667 13.8856 13.219 14.3333 12.6667 14.3333H3.33333C2.78105 14.3333 2.33333 13.8856 2.33333 13.3333V3.66667C2.33333 3.11438 2.78105 2.66667 3.33333 2.66667Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Organisme (Building)
const OrganismeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17V5C3 4.44772 3.44772 4 4 4H10C10.5523 4 11 4.44772 11 5V17M3 17H17M3 17H1M11 17H17M11 17V9C11 8.44772 11.4477 8 12 8H16C16.5523 8 17 8.44772 17 9V17M17 17H19M6 7H8M6 10H8M6 13H8M14 11H15M14 14H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Client (Briefcase)
const ClientIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6V4C6 2.89543 6.89543 2 8 2H12C13.1046 2 14 2.89543 14 4V6M3 6H17C17.5523 6 18 6.44772 18 7V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V7C2 6.44772 2.44772 6 3 6ZM10 10V14M7 12H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Salarié (User)
const SalarieIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 5C13 6.65685 11.6569 8 10 8C8.34315 8 7 6.65685 7 5C7 3.34315 8.34315 2 10 2C11.6569 2 13 3.34315 13 5ZM4 16.5C4 13.4624 6.46243 11 9.5 11H10.5C13.5376 11 16 13.4624 16 16.5V17C16 17.5523 15.5523 18 15 18H5C4.44772 18 4 17.5523 4 17V16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Particulier (UserCircle)
const ParticulierIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12C11.6569 12 13 10.6569 13 9C13 7.34315 11.6569 6 10 6C8.34315 6 7 7.34315 7 9C7 10.6569 8.34315 12 10 12ZM10 12C7.23858 12 5 13.7909 5 16M10 12C12.7614 12 15 13.7909 15 16M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Formateur (Academic Cap)
const FormateurIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L1 7L10 12L19 7L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 9V14L10 17L15 14V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Infos Pratiques (Calendar)
const InfosPratiquesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2V4M14 2V4M3 8H17M5 4H15C16.1046 4 17 4.89543 17 6V16C17 17.1046 16.1046 18 15 18H5C3.89543 18 3 17.1046 3 16V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 12H9M11 12H13M7 15H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface OrganismeFormation {
  raisonSociale: string;
  representantLegal: string;
  numeroDA: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
}

interface ClientInfo {
  type: "entreprise" | "independant";
  raisonSociale: string;
  nomDirigeant: string;
  adresse: string;
  codePostal: string;
  ville: string;
  siret: string;
  telephone: string;
  email: string;
}

interface Salarie {
  id: string;
  nomPrenom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  dateNaissance: string;
  villeNaissance: string;
}

interface Particulier {
  id: string;
  nom: string;
  prenom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  statut: string;
}

interface Formateur {
  id: string;
  nomPrenom: string;
  fonction: string;
}

interface JourneeFormation {
  id: string;
  date: string;
  horaireMatin: string;
  horaireApresMidi: string;
}

interface InfosPratiques {
  lieu: string;
  adresse: string;
  codePostal: string;
  ville: string;
  journees: JourneeFormation[];
}

interface DocumentsData {
  organisme: OrganismeFormation;
  client: ClientInfo;
  salaries: Salarie[];
  particuliers: Particulier[];
  formateur: Formateur;
  infosPratiques: InfosPratiques;
}

interface StepDocumentsProps {
  data: DocumentsData;
  onChange: (data: DocumentsData) => void;
  onGenerateConvention: () => void;
  onGenerateContrat: () => void;
  onGenerateProgramme?: () => void;
  onGenerateConvocation?: () => void;
  onGenerateEmargement?: () => void;
  onGenerateEvalChaud?: () => void;
  onGenerateEvalFroid?: () => void;
  onGenerateEvalFormateur?: () => void;
  onGenerateAttestation?: () => void;
}

// Composant Section Header avec icône
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, description, color }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${color} flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
        {description}
      </p>
    </div>
  </div>
);

// Composant DatePicker personnalisé
interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = "Sélectionner une date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const selectedDate = new Date(year, month, day);
    const formattedDate = selectedDate.toISOString().split("T")[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const isSelectedDate = (day: number) => {
    if (!value) return false;
    const selectedDate = new Date(value);
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer flex items-center justify-between"
      >
        <span className={value ? "" : "text-gray-400 dark:text-gray-500"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <CalendarIcon />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((day, index) => (
              <div key={index} className="aspect-square">
                {day !== null && (
                  <button
                    onClick={() => handleDateSelect(day)}
                    className={`w-full h-full flex items-center justify-center text-sm rounded-lg transition-colors ${
                      isSelectedDate(day)
                        ? "bg-brand-500 text-white"
                        : isToday(day)
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant Document Card
interface DocumentCardProps {
  title: string;
  description: string;
  buttonText: string;
  onGenerate: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ title, description, buttonText, onGenerate }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
      {description}
    </p>
    <button
      onClick={onGenerate}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
    >
      {buttonText}
    </button>
  </div>
);

export const StepDocuments: React.FC<StepDocumentsProps> = ({
  data,
  onChange,
  onGenerateConvention,
  onGenerateContrat,
  onGenerateProgramme,
  onGenerateConvocation,
  onGenerateEmargement,
  onGenerateEvalChaud,
  onGenerateEvalFroid,
  onGenerateEvalFormateur,
  onGenerateAttestation,
}) => {
  // Initialiser les données si vides
  const organisme = data.organisme || {
    raisonSociale: "",
    representantLegal: "",
    numeroDA: "",
    siret: "",
    adresse: "",
    codePostal: "",
    ville: "",
    email: "",
    telephone: "",
  };

  const client = data.client || {
    type: "entreprise" as const,
    raisonSociale: "",
    nomDirigeant: "",
    adresse: "",
    codePostal: "",
    ville: "",
    siret: "",
    telephone: "",
    email: "",
  };

  const salaries = data.salaries || [{
    id: "1",
    nomPrenom: "",
    adresse: "",
    codePostal: "",
    ville: "",
    telephone: "",
    email: "",
    dateNaissance: "",
    villeNaissance: "",
  }];

  const particuliers = data.particuliers || [{
    id: "1",
    nom: "",
    prenom: "",
    adresse: "",
    codePostal: "",
    ville: "",
    email: "",
    telephone: "",
    statut: "",
  }];

  const formateur = data.formateur || {
    id: "1",
    nomPrenom: "",
    fonction: "",
  };

  const infosPratiques = data.infosPratiques || {
    lieu: "",
    adresse: "",
    codePostal: "",
    ville: "",
    journees: [{
      id: "1",
      date: "",
      horaireMatin: "09:00 - 12:30",
      horaireApresMidi: "14:00 - 17:30",
    }],
  };

  // S'assurer que journees existe
  const journees = infosPratiques.journees || [{
    id: "1",
    date: "",
    horaireMatin: "09:00 - 12:30",
    horaireApresMidi: "14:00 - 17:30",
  }];

  // Fonctions de mise à jour
  const updateOrganisme = (field: keyof OrganismeFormation, value: string) => {
    onChange({
      ...data,
      organisme: { ...organisme, [field]: value },
    });
  };

  const updateClient = (field: keyof ClientInfo, value: string) => {
    onChange({
      ...data,
      client: { ...client, [field]: value },
    });
  };

  const updateSalarie = (id: string, field: keyof Salarie, value: string) => {
    onChange({
      ...data,
      salaries: salaries.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const addSalarie = () => {
    const newSalarie: Salarie = {
      id: Date.now().toString(),
      nomPrenom: "",
      adresse: "",
      codePostal: "",
      ville: "",
      telephone: "",
      email: "",
      dateNaissance: "",
      villeNaissance: "",
    };
    onChange({
      ...data,
      salaries: [...salaries, newSalarie],
    });
  };

  const deleteSalarie = (id: string) => {
    if (salaries.length <= 1) return;
    onChange({
      ...data,
      salaries: salaries.filter((s) => s.id !== id),
    });
  };

  const updateParticulier = (id: string, field: keyof Particulier, value: string) => {
    onChange({
      ...data,
      particuliers: particuliers.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const addParticulier = () => {
    const newParticulier: Particulier = {
      id: Date.now().toString(),
      nom: "",
      prenom: "",
      adresse: "",
      codePostal: "",
      ville: "",
      email: "",
      telephone: "",
      statut: "",
    };
    onChange({
      ...data,
      particuliers: [...particuliers, newParticulier],
    });
  };

  const deleteParticulier = (id: string) => {
    if (particuliers.length <= 1) return;
    onChange({
      ...data,
      particuliers: particuliers.filter((p) => p.id !== id),
    });
  };

  const updateFormateur = (field: keyof Omit<Formateur, "id">, value: string) => {
    onChange({
      ...data,
      formateur: { ...formateur, [field]: value },
    });
  };

  const updateInfosPratiquesField = (field: "lieu" | "adresse" | "codePostal" | "ville", value: string) => {
    onChange({
      ...data,
      infosPratiques: { ...infosPratiques, [field]: value },
    });
  };

  const updateJournee = (id: string, field: keyof JourneeFormation, value: string) => {
    onChange({
      ...data,
      infosPratiques: {
        ...infosPratiques,
        journees: journees.map((j) =>
          j.id === id ? { ...j, [field]: value } : j
        ),
      },
    });
  };

  const addJournee = () => {
    const newJournee: JourneeFormation = {
      id: Date.now().toString(),
      date: "",
      horaireMatin: "09:00 - 12:30",
      horaireApresMidi: "14:00 - 17:30",
    };
    onChange({
      ...data,
      infosPratiques: {
        ...infosPratiques,
        journees: [...journees, newJournee],
      },
    });
  };

  const deleteJournee = (id: string) => {
    if (journees.length <= 1) return;
    onChange({
      ...data,
      infosPratiques: {
        ...infosPratiques,
        journees: journees.filter((j) => j.id !== id),
      },
    });
  };

  const inputClassName = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500";
  const selectClassName = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none cursor-pointer";

  // Documents à générer
  const documents = [
    {
      title: "Convention de formation",
      description: "Document contractuel signé entre votre organisme de formation et l'entreprise cliente ou un indépendant, définissant les conditions de réalisation de l'action de formation.",
      buttonText: "Générer la convention de formation",
      onGenerate: onGenerateConvention,
    },
    {
      title: "Contrat de formation",
      description: "Document contractuel signé entre votre organisme de formation et un particulier, définissant les conditions de réalisation de l'action de formation.",
      buttonText: "Générer le contrat de formation",
      onGenerate: onGenerateContrat,
    },
    {
      title: "Programme de formation",
      description: "Document détaillant les objectifs, le contenu et l'organisation de la formation (modules, séquences, durées, modalités pédagogiques).",
      buttonText: "Générer le programme de formation",
      onGenerate: onGenerateProgramme || (() => console.log("Générer programme")),
    },
    {
      title: "Convocation",
      description: "Document adressé à chaque participant pour lui communiquer les informations pratiques de la formation (dates, horaires, lieu ou lien de connexion, consignes éventuelles).",
      buttonText: "Générer la convocation",
      onGenerate: onGenerateConvocation || (() => console.log("Générer convocation")),
    },
    {
      title: "Feuilles d'émargement",
      description: "Documents de présence à faire signer par les participants (et, le cas échéant, par le formateur) à chaque demi-journée de formation.",
      buttonText: "Générer les feuilles d'émargement",
      onGenerate: onGenerateEmargement || (() => console.log("Générer émargement")),
    },
    {
      title: "Évaluation à chaud",
      description: "Questionnaire remis aux participants en fin de formation afin de recueillir leur niveau de satisfaction et leurs retours immédiats sur le contenu, l'animation et les conditions de déroulement.",
      buttonText: "Générer l'évaluation à chaud",
      onGenerate: onGenerateEvalChaud || (() => console.log("Générer éval chaud")),
    },
    {
      title: "Évaluation à froid",
      description: "Questionnaire envoyé aux participants plusieurs semaines après la formation afin d'évaluer la mise en pratique des acquis, l'évolution de leurs compétences et l'impact de la formation sur leur activité.",
      buttonText: "Générer l'évaluation à froid",
      onGenerate: onGenerateEvalFroid || (() => console.log("Générer éval froid")),
    },
    {
      title: "Évaluation formateur",
      description: "Questionnaire destiné au formateur, lui permettant de faire un retour sur le déroulement de la formation (profil des participants, adéquation du programme, conditions matérielles, points forts, axes d'amélioration).",
      buttonText: "Générer l'évaluation formateur",
      onGenerate: onGenerateEvalFormateur || (() => console.log("Générer éval formateur")),
    },
    {
      title: "Attestation de fin de formation",
      description: "Document nominatif remis à chaque participant à l'issue de la formation, attestant de sa participation et de la réalisation de l'action de formation.",
      buttonText: "Générer l'attestation de fin de formation",
      onGenerate: onGenerateAttestation || (() => console.log("Générer attestation")),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Bloc 1 - Organisme de formation */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            icon={<OrganismeIcon />}
            title="Organisme de formation"
            description="Renseignez ici les informations de votre organisme de formation. Elles sont indispensables pour générer correctement vos documents officiels."
            color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Raison sociale de l'organisme
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={organisme.raisonSociale}
                onChange={(e) => updateOrganisme("raisonSociale", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom et prénom du représentant légal
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={organisme.representantLegal}
                onChange={(e) => updateOrganisme("representantLegal", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numéro de déclaration d'activité
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={organisme.numeroDA}
                onChange={(e) => updateOrganisme("numeroDA", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numéro SIRET
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={organisme.siret}
                onChange={(e) => updateOrganisme("siret", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={organisme.adresse}
                onChange={(e) => updateOrganisme("adresse", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={organisme.codePostal}
                  onChange={(e) => updateOrganisme("codePostal", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={organisme.ville}
                  onChange={(e) => updateOrganisme("ville", e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email de contact
              </label>
              <input
                type="email"
                placeholder="Écrivez ici..."
                value={organisme.email}
                onChange={(e) => updateOrganisme("email", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                placeholder="Écrivez ici..."
                value={organisme.telephone}
                onChange={(e) => updateOrganisme("telephone", e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Bloc 2 - Entreprise ou indépendant (Client) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            icon={<ClientIcon />}
            title="Entreprise ou indépendant"
            description="Complétez ici les informations de votre client. Elles seront utilisées pour établir la convention de formation."
            color="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de client
              </label>
              <select
                value={client.type}
                onChange={(e) => updateClient("type", e.target.value as "entreprise" | "independant")}
                className={selectClassName}
              >
                <option value="entreprise">Entreprise</option>
                <option value="independant">Indépendant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Raison sociale
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={client.raisonSociale}
                onChange={(e) => updateClient("raisonSociale", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom et prénom du dirigeant
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={client.nomDirigeant}
                onChange={(e) => updateClient("nomDirigeant", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={client.adresse}
                onChange={(e) => updateClient("adresse", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={client.codePostal}
                  onChange={(e) => updateClient("codePostal", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={client.ville}
                  onChange={(e) => updateClient("ville", e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numéro SIRET
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={client.siret}
                onChange={(e) => updateClient("siret", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                placeholder="Écrivez ici..."
                value={client.telephone}
                onChange={(e) => updateClient("telephone", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email de contact
              </label>
              <input
                type="email"
                placeholder="Écrivez ici..."
                value={client.email}
                onChange={(e) => updateClient("email", e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Bloc 3 - Salarié(s) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            icon={<SalarieIcon />}
            title="Salarié(s)"
            description="Ajoutez ici les salariés de l'entreprise cliente qui bénéficieront de la formation. Leurs informations seront utilisées pour les feuilles d'émargement."
            color="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />

          {salaries.map((salarie, index) => (
            <div key={salarie.id} className="relative space-y-3 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
              {salaries.length > 1 && (
                <button
                  onClick={() => deleteSalarie(salarie.id)}
                  className="absolute -top-1 -right-1 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                  title="Supprimer ce salarié"
                >
                  <TrashIcon />
                </button>
              )}
              {salaries.length > 1 && (
                <span className="text-xs font-medium text-gray-400">Salarié #{index + 1}</span>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom et prénom
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={salarie.nomPrenom}
                  onChange={(e) => updateSalarie(salarie.id, "nomPrenom", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={salarie.adresse}
                  onChange={(e) => updateSalarie(salarie.id, "adresse", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={salarie.codePostal}
                    onChange={(e) => updateSalarie(salarie.id, "codePostal", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={salarie.ville}
                    onChange={(e) => updateSalarie(salarie.id, "ville", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="Écrivez ici..."
                    value={salarie.telephone}
                    onChange={(e) => updateSalarie(salarie.id, "telephone", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Écrivez ici..."
                    value={salarie.email}
                    onChange={(e) => updateSalarie(salarie.id, "email", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de naissance
                  </label>
                  <DatePicker
                    value={salarie.dateNaissance}
                    onChange={(value) => updateSalarie(salarie.id, "dateNaissance", value)}
                    placeholder="Sélectionner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ville de naissance
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={salarie.villeNaissance}
                    onChange={(e) => updateSalarie(salarie.id, "villeNaissance", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addSalarie}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 mt-3"
          >
            <PlusIcon />
          </button>
        </div>

        {/* Bloc 4 - Particulier */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            icon={<ParticulierIcon />}
            title="Particulier"
            description="Renseignez ici les informations du participant lorsqu'il s'agit d'un particulier. Elles seront utilisées pour générer le contrat de formation."
            color="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
          />

          {particuliers.map((particulier, index) => (
            <div key={particulier.id} className="relative space-y-3 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
              {particuliers.length > 1 && (
                <button
                  onClick={() => deleteParticulier(particulier.id)}
                  className="absolute -top-1 -right-1 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                  title="Supprimer ce particulier"
                >
                  <TrashIcon />
                </button>
              )}
              {particuliers.length > 1 && (
                <span className="text-xs font-medium text-gray-400">Particulier #{index + 1}</span>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={particulier.nom}
                    onChange={(e) => updateParticulier(particulier.id, "nom", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={particulier.prenom}
                    onChange={(e) => updateParticulier(particulier.id, "prenom", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={particulier.adresse}
                  onChange={(e) => updateParticulier(particulier.id, "adresse", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={particulier.codePostal}
                    onChange={(e) => updateParticulier(particulier.id, "codePostal", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={particulier.ville}
                    onChange={(e) => updateParticulier(particulier.id, "ville", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Écrivez ici..."
                    value={particulier.email}
                    onChange={(e) => updateParticulier(particulier.id, "email", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="Écrivez ici..."
                    value={particulier.telephone}
                    onChange={(e) => updateParticulier(particulier.id, "telephone", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Statut du participant
                </label>
                <select
                  value={particulier.statut}
                  onChange={(e) => updateParticulier(particulier.id, "statut", e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Sélectionnez un statut</option>
                  <option value="employe">Employé</option>
                  <option value="recherche_emploi">En recherche d'emploi</option>
                  <option value="etudiant">Étudiant</option>
                  <option value="retraite">Retraité</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
          ))}

          <button
            onClick={addParticulier}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 mt-3"
          >
            <PlusIcon />
          </button>
        </div>

        {/* Bloc 5 - Formateur */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            icon={<FormateurIcon />}
            title="Formateur"
            description="Renseignez ici les informations du formateur qui animera cette formation, afin que l'intervenant soit identifié dans l'ensemble des documents."
            color="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400"
          />
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom et prénom
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={formateur.nomPrenom}
                onChange={(e) => updateFormateur("nomPrenom", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fonction / spécialité
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={formateur.fonction}
                onChange={(e) => updateFormateur("fonction", e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Bloc 6 - Informations pratiques */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            icon={<InfosPratiquesIcon />}
            title="Informations pratiques"
            description="Renseignez ici les informations pratiques de la session (lieu, dates, horaires). Elles seront utilisées pour les convocations et les feuilles d'émargement."
            color="bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400"
          />
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lieu de la formation
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={infosPratiques.lieu}
                onChange={(e) => updateInfosPratiquesField("lieu", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse
              </label>
              <input
                type="text"
                placeholder="Écrivez ici..."
                value={infosPratiques.adresse}
                onChange={(e) => updateInfosPratiquesField("adresse", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={infosPratiques.codePostal}
                  onChange={(e) => updateInfosPratiquesField("codePostal", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={infosPratiques.ville}
                  onChange={(e) => updateInfosPratiquesField("ville", e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            {/* Journées de formation */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                Journées de formation
              </label>

              {journees.map((journee, index) => (
                <div key={journee.id} className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-3 last:mb-0">
                  {journees.length > 1 && (
                    <button
                      onClick={() => deleteJournee(journee.id)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                      title="Supprimer cette journée"
                    >
                      <TrashIcon />
                    </button>
                  )}

                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Jour {index + 1}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Date
                      </label>
                      <DatePicker
                        value={journee.date}
                        onChange={(value) => updateJournee(journee.id, "date", value)}
                        placeholder="Sélectionner la date"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Horaires matin
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 09:00 - 12:30"
                          value={journee.horaireMatin}
                          onChange={(e) => updateJournee(journee.id, "horaireMatin", e.target.value)}
                          className={inputClassName}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Horaires après-midi
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 14:00 - 17:30"
                          value={journee.horaireApresMidi}
                          onChange={(e) => updateJournee(journee.id, "horaireApresMidi", e.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addJournee}
                className="flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors mt-2"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-500/10">
                  <PlusIcon />
                </div>
                Ajouter une journée
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents à générer */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Documents à générer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {documents.map((doc, index) => (
            <DocumentCard
              key={index}
              title={doc.title}
              description={doc.description}
              buttonText={doc.buttonText}
              onGenerate={doc.onGenerate}
            />
          ))}
        </div>

        {/* Bouton générer tous les documents */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              documents.forEach((doc) => doc.onGenerate());
            }}
            className="inline-flex items-center gap-3 px-8 py-4 text-base font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-all shadow-lg hover:shadow-xl hover:shadow-brand-500/25 active:scale-[0.98]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 3V8C13 8.55228 13.4477 9 14 9H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Générer tous mes documents
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepDocuments;
