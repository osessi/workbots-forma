import AcceptInviteForm from "@/components/auth/AcceptInviteForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rejoindre l'organisation | Automate Forma",
  description: "Acceptez votre invitation pour rejoindre une organisation sur Automate Forma",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  return <AcceptInviteForm token={token} />;
}
