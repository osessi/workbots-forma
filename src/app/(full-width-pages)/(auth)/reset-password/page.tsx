import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe | Automate Forma",
  description: "Réinitialisez votre mot de passe Automate Forma",
};

export default function ResetPassword() {
  return <ResetPasswordForm />;
}
