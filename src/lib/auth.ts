import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Upsert local user record on first access so downstream queries have a FK target.
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? "",
      displayName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      avatarUrl:
        (user.user_metadata?.avatar_url as string | undefined) ?? null,
      authProvider: user.app_metadata?.provider ?? "google",
      authProviderUserId:
        (user.user_metadata?.provider_id as string | undefined) ??
        (user.user_metadata?.sub as string | undefined) ??
        null,
    },
    update: {
      email: user.email ?? undefined,
    },
    include: { preferences: true },
  });

  return dbUser;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
