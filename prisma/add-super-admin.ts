// Script pour ajouter un super admin
// Usage: npx ts-node prisma/add-super-admin.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = "fruchon@outlook.fr";

async function addSuperAdmin() {
  console.log(`🔐 Ajout du super admin: ${SUPER_ADMIN_EMAIL}\n`);

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
    });

    if (existingUser) {
      // Mettre à jour l'utilisateur existant en super admin
      const updatedUser = await prisma.user.update({
        where: { email: SUPER_ADMIN_EMAIL },
        data: {
          role: "SUPER_ADMIN",
          isSuperAdmin: true,
          isActive: true,
        },
      });

      console.log(`✅ Utilisateur existant mis à jour en super admin:`);
      console.log(`   - ID: ${updatedUser.id}`);
      console.log(`   - Email: ${updatedUser.email}`);
      console.log(`   - Role: ${updatedUser.role}`);
      console.log(`   - isSuperAdmin: ${updatedUser.isSuperAdmin}`);
    } else {
      console.log(`⚠️  L'utilisateur ${SUPER_ADMIN_EMAIL} n'existe pas encore dans la base de données.`);
      console.log(`   L'utilisateur doit d'abord se connecter via l'authentification Supabase.`);
      console.log(`   Une fois connecté, relancez ce script pour lui attribuer le rôle super admin.`);
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addSuperAdmin();
