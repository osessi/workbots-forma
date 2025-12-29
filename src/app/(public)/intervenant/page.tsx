import { redirect } from "next/navigation";

// Page /intervenant - Redirige vers login ou accueil
export default function IntervenantPage() {
  // Rediriger vers login par défaut
  // Le contexte côté client déterminera si l'utilisateur est connecté
  redirect("/intervenant/login");
}
