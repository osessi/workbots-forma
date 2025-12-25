import { NextResponse } from 'next/server';

export async function GET() {
  // Toujours permettre l'accès à la page de configuration
  // Les clés sont configurées via .env donc cette page sert principalement
  // à voir la configuration actuelle et sélectionner le provider/modèle
  return NextResponse.json({ canChange: true });
}
