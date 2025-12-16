import SignUpWizard from "@/components/auth/SignUpWizard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte | Automate Forma",
  description: "Créez votre compte Automate Forma et simplifiez la création de vos formations",
};

export default function SignUp() {
  return <SignUpWizard />;
}
