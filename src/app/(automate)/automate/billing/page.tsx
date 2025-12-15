"use client";
import React, { useState, useEffect, useRef } from "react";

// Icons
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.6667 5L7.50001 14.1667L3.33334 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12.75V14.25C3 15.0784 3.67157 15.75 4.5 15.75H13.5C14.3284 15.75 15 15.0784 15 14.25V12.75M9 11.25V2.25M9 11.25L6 8.25M9 11.25L12 8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 7.5H17.5M5 12.5H7.5M15 4.16667H5C3.61929 4.16667 2.5 5.28595 2.5 6.66667V13.3333C2.5 14.714 3.61929 15.8333 5 15.8333H15C16.3807 15.8333 17.5 14.714 17.5 13.3333V6.66667C17.5 5.28595 16.3807 4.16667 15 4.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const VisaIcon = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="24" rx="4" fill="#1A1F71"/>
    <path d="M16.5 15.5L18 8.5H20L18.5 15.5H16.5Z" fill="white"/>
    <path d="M24.5 8.7C24 8.5 23.3 8.3 22.4 8.3C20.4 8.3 19 9.4 19 10.8C19 11.9 20 12.5 20.8 12.9C21.6 13.3 21.9 13.6 21.9 14C21.9 14.6 21.2 14.9 20.5 14.9C19.6 14.9 19.1 14.8 18.3 14.4L18 14.3L17.7 16C18.3 16.3 19.3 16.5 20.4 16.5C22.5 16.5 23.9 15.4 23.9 13.9C23.9 12.5 22.9 11.8 21.6 11.2C20.9 10.8 20.5 10.5 20.5 10.1C20.5 9.7 20.9 9.3 21.8 9.3C22.5 9.3 23.1 9.5 23.5 9.6L23.7 9.7L24.5 8.7Z" fill="white"/>
    <path d="M27.5 8.5H26C25.5 8.5 25.1 8.7 24.9 9.2L22 15.5H24.1L24.5 14.3H27L27.3 15.5H29.2L27.5 8.5ZM25.1 12.7C25.3 12.2 26 10.3 26 10.3C26 10.3 26.2 9.8 26.3 9.5L26.5 10.2C26.5 10.2 26.9 12.1 27 12.7H25.1Z" fill="white"/>
    <path d="M14.5 8.5L12.5 13.3L12.3 12.3C11.9 11.1 10.8 9.8 9.5 9.1L11.3 15.5H13.4L16.6 8.5H14.5Z" fill="white"/>
    <path d="M11 8.5H7.7L7.7 8.7C10.2 9.3 11.8 10.8 12.3 12.3L11.7 9.2C11.6 8.7 11.3 8.5 11 8.5Z" fill="#F9A533"/>
  </svg>
);

const MastercardIcon = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="24" rx="4" fill="#F5F5F5"/>
    <circle cx="15" cy="12" r="7" fill="#EB001B"/>
    <circle cx="25" cy="12" r="7" fill="#F79E1B"/>
    <path d="M20 6.8C21.8 8.2 23 10.5 23 12C23 13.5 21.8 15.8 20 17.2C18.2 15.8 17 13.5 17 12C17 10.5 18.2 8.2 20 6.8Z" fill="#FF5F00"/>
  </svg>
);

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "payee" | "en_attente";
  description: string;
}

interface PaymentMethod {
  type: "visa" | "mastercard";
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    period: "Gratuit",
    features: [
      "3 formations",
      "10 fiches pédagogiques / mois",
      "Export PDF",
      "Support email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    period: "/ mois",
    features: [
      "Formations illimitées",
      "Fiches pédagogiques illimitées",
      "Présentations PowerPoint",
      "Évaluations & QCM",
      "Documents administratifs",
      "Support prioritaire",
    ],
    popular: true,
    current: true,
  },
  {
    id: "enterprise",
    name: "Entreprise",
    price: 99,
    period: "/ mois",
    features: [
      "Tout le plan Pro",
      "Multi-utilisateurs (5 comptes)",
      "API access",
      "Personnalisation avancée",
      "Formations sur mesure",
      "Account manager dédié",
    ],
  },
];

const invoices: Invoice[] = [
  {
    id: "INV-2025-012",
    date: "01/12/2025",
    amount: "29,00 €",
    status: "payee",
    description: "Abonnement Pro - Décembre 2025",
  },
  {
    id: "INV-2025-011",
    date: "01/11/2025",
    amount: "29,00 €",
    status: "payee",
    description: "Abonnement Pro - Novembre 2025",
  },
  {
    id: "INV-2025-010",
    date: "01/10/2025",
    amount: "29,00 €",
    status: "payee",
    description: "Abonnement Pro - Octobre 2025",
  },
  {
    id: "INV-2025-009",
    date: "01/09/2025",
    amount: "29,00 €",
    status: "payee",
    description: "Abonnement Pro - Septembre 2025",
  },
];

// Modal de modification de carte bancaire
const EditCardModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: PaymentMethod;
  onSave: (data: PaymentMethod) => void;
}> = ({ isOpen, onClose, paymentMethod, onSave }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState(`${paymentMethod.expiryMonth}/${paymentMethod.expiryYear.slice(-2)}`);
  const [cvv, setCvv] = useState("");
  const [holderName, setHolderName] = useState(paymentMethod.holderName);
  const [cardType, setCardType] = useState<"visa" | "mastercard">(paymentMethod.type);
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Formatage du numéro de carte
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Formatage de la date d'expiration
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  // Détection du type de carte
  const detectCardType = (number: string) => {
    const cleanNumber = number.replace(/\s/g, "");
    if (cleanNumber.startsWith("4")) {
      setCardType("visa");
    } else if (cleanNumber.startsWith("5") || cleanNumber.startsWith("2")) {
      setCardType("mastercard");
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
      detectCardType(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value.replace("/", ""));
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulation d'une sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1500));

    const [month, year] = expiryDate.split("/");
    onSave({
      type: cardType,
      lastFour: cardNumber.slice(-4),
      expiryMonth: month,
      expiryYear: `20${year}`,
      holderName,
    });

    setIsSaving(false);
    onClose();
  };

  // Fermer avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Clic à l'extérieur
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl dark:bg-gray-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Modifier le moyen de paiement
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Prévisualisation de la carte */}
          <div className="relative h-44 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-7 bg-yellow-400/90 rounded" />
                {cardType === "visa" ? (
                  <svg width="50" height="16" viewBox="0 0 50 16" fill="white">
                    <path d="M19.5 15.5L22 0.5H26L23.5 15.5H19.5ZM35 0.8C34 0.4 32.5 0 30.8 0C26.8 0 24 2.2 24 5.4C24 7.8 26.2 9.1 27.8 9.9C29.5 10.7 30.1 11.3 30.1 12C30.1 13.2 28.6 13.8 27.2 13.8C25.3 13.8 24.3 13.5 22.7 12.8L22.1 12.5L21.5 16.4C22.7 17 24.8 17.5 27 17.5C31.2 17.5 34 15.3 34 11.9C34 9.1 32.2 7.6 29.6 6.3C28.2 5.5 27.3 4.9 27.3 4.1C27.3 3.4 28.1 2.6 29.9 2.6C31.4 2.6 32.5 3 33.4 3.3L33.8 3.5L35 0.8ZM42.5 0.5H39.5C38.4 0.5 37.6 0.8 37.2 2L31 15.5H35.2L36 13.1H41.2L41.7 15.5H45.5L42.5 0.5ZM37.1 10C37.5 9 39.3 4.6 39.3 4.6C39.3 4.6 39.7 3.5 40 2.9L40.4 4.4C40.4 4.4 41.4 8.8 41.6 10H37.1ZM17 0.5L13 10.7L12.6 8.7C11.7 5.9 9.2 2.8 6.5 1.2L10 15.5H14.2L21.2 0.5H17Z"/>
                  </svg>
                ) : (
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-red-500 rounded-full opacity-90" />
                    <div className="w-8 h-8 bg-yellow-500 rounded-full opacity-90" />
                  </div>
                )}
              </div>

              <div className="font-mono text-xl tracking-widest">
                {cardNumber || "•••• •••• •••• ••••"}
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-white/60 uppercase">Titulaire</p>
                  <p className="font-medium">{holderName || "VOTRE NOM"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60 uppercase">Expire</p>
                  <p className="font-medium">{expiryDate || "MM/AA"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Numéro de carte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Numéro de carte
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 pr-14 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white font-mono"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {cardType === "visa" ? <VisaIcon /> : <MastercardIcon />}
              </div>
            </div>
          </div>

          {/* Date d'expiration et CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date d'expiration
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={handleExpiryChange}
                placeholder="MM/AA"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={handleCvvChange}
                placeholder="123"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          {/* Nom du titulaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom du titulaire
            </label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value.toUpperCase())}
              placeholder="JEAN DUPONT"
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white uppercase"
              required
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function FacturationPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: "visa",
    lastFour: "4242",
    expiryMonth: "12",
    expiryYear: "2027",
    holderName: "FABIEN DURAND",
  });

  const handleSaveCard = (newPaymentMethod: PaymentMethod) => {
    setPaymentMethod(newPaymentMethod);
  };

  return (
    <div className="space-y-6">
      {/* Modal de modification de carte */}
      <EditCardModal
        isOpen={isEditCardModalOpen}
        onClose={() => setIsEditCardModalOpen(false)}
        paymentMethod={paymentMethod}
        onSave={handleSaveCard}
      />

      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Facturation
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gérez votre abonnement et consultez vos factures
        </p>
      </div>

      {/* Abonnement actuel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Abonnement actuel
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vous êtes actuellement sur le plan <span className="font-medium text-brand-500">Pro</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full dark:bg-green-500/10 dark:text-green-400">
              Actif
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
              Renouvellement le 01/01/2026
            </span>
          </div>
        </div>

        {/* Méthode de paiement */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white rounded-xl dark:bg-gray-700 shadow-sm">
              {paymentMethod.type === "visa" ? <VisaIcon /> : <MastercardIcon />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {paymentMethod.type === "visa" ? "Visa" : "Mastercard"} •••• {paymentMethod.lastFour}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                Expire {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditCardModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg active:scale-[0.98] transition-all dark:text-brand-400 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
          >
            Modifier
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Changer de plan
          </h2>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl dark:bg-gray-800">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                billingPeriod === "monthly"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                billingPeriod === "yearly"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50"
              }`}
            >
              Annuel <span className="text-green-500 font-semibold">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 transition-all duration-300 ${
                plan.current
                  ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/5 shadow-sm"
                  : "border-gray-200 dark:border-gray-700 hover:border-brand-200 hover:shadow-md dark:hover:border-brand-500/30"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-brand-500 text-white rounded-full shadow-sm">
                  Populaire
                </span>
              )}
              {plan.current && (
                <span className="absolute -top-3 right-4 px-3 py-1 text-xs font-medium bg-green-500 text-white rounded-full shadow-sm">
                  Actuel
                </span>
              )}

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {billingPeriod === "yearly" && plan.price > 0
                    ? Math.round(plan.price * 0.8)
                    : plan.price}€
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">
                      <CheckIcon />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2.5 text-sm font-medium rounded-xl transition-all ${
                  plan.current
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                    : "bg-brand-500 text-white hover:bg-brand-600 active:scale-[0.98] shadow-sm hover:shadow-md"
                }`}
                disabled={plan.current}
              >
                {plan.current ? "Plan actuel" : "Choisir ce plan"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Historique des factures */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historique des factures
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Facture
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Montant
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Statut
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {invoice.description}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                    {invoice.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      invoice.status === "payee"
                        ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                    }`}>
                      {invoice.status === "payee" ? "Payée" : "En attente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg active:scale-[0.98] transition-all dark:text-brand-400 dark:bg-brand-500/10 dark:hover:bg-brand-500/20">
                      <DownloadIcon />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
