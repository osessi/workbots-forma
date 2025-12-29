import { redirect } from "next/navigation";

// Redirection vers la page de veille par défaut
export default function OutilsPage() {
  redirect("/automate/outils/veille");
}
