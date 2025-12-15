import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  // Récupère le secret webhook depuis les variables d'environnement
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "CLERK_WEBHOOK_SECRET manquant dans les variables d'environnement"
    );
  }

  // Récupère les headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Vérifie les headers
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Headers de webhook manquants", { status: 400 });
  }

  // Récupère le body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Vérifie la signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Erreur de vérification du webhook:", err);
    return new Response("Erreur de vérification", { status: 400 });
  }

  // Traite l'événement
  const eventType = evt.type;

  switch (eventType) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const email = email_addresses[0]?.email_address || `${id}@temp.local`;

      await prisma.user.create({
        data: {
          clerkId: id,
          email,
          firstName: first_name,
          lastName: last_name,
          avatar: image_url,
          role: UserRole.FORMATEUR,
        },
      });

      console.log(`Utilisateur créé: ${email}`);
      break;
    }

    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const email = email_addresses[0]?.email_address;

      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email,
          firstName: first_name,
          lastName: last_name,
          avatar: image_url,
        },
      });

      console.log(`Utilisateur mis à jour: ${email}`);
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;

      if (id) {
        // Soft delete - on désactive plutôt que supprimer
        await prisma.user.update({
          where: { clerkId: id },
          data: { isActive: false },
        });

        console.log(`Utilisateur désactivé: ${id}`);
      }
      break;
    }

    case "session.created": {
      const { user_id } = evt.data;

      if (user_id) {
        // Met à jour la dernière connexion
        await prisma.user.update({
          where: { clerkId: user_id },
          data: { lastLoginAt: new Date() },
        });
      }
      break;
    }

    default:
      console.log(`Événement webhook non géré: ${eventType}`);
  }

  return new Response("Webhook traité", { status: 200 });
}
