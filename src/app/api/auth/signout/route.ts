// ===========================================
// API ROUTE - Sign Out
// ===========================================

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/signin", request.url), {
    status: 302,
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/signin", request.url), {
    status: 302,
  });
}
