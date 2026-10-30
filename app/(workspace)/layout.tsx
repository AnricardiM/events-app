import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { getVisibleNavigation } from "@/lib/navigation";
import { getProfile, getUserRoles } from "@/lib/services/profiles";
import { SIDEBAR_COOKIE } from "@/lib/sidebar-cookie";
import { createClient } from "@/lib/supabase/server";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main
          aria-busy="true"
          className="grid min-h-screen place-items-center bg-background p-6 text-text-muted"
        >
          <p>Cargando tu cuenta...</p>
        </main>
      }
    >
      <WorkspaceContent>{children}</WorkspaceContent>
    </Suspense>
  );
}

async function WorkspaceContent({ children }: { children: ReactNode }) {
  await connection();

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <p
          className="rounded-[7px] bg-primary-soft px-3 py-[11px] text-xs leading-normal text-primary"
          role="status"
        >
          Configura las variables de Supabase según el archivo{" "}
          <code>.env.example</code> para habilitar tu cuenta.
        </p>
      </main>
    );
  }

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }

  const email = typeof claims.email === "string" ? claims.email : "tu cuenta";
  const [
    { data: profile, error: profileError },
    { data: roles, error: rolesError },
  ] = await Promise.all([
    getProfile(supabase, claims.sub),
    getUserRoles(supabase, claims.sub),
  ]);
  const fullName = profile?.full_name?.trim() || email;

  if (profileError) {
    console.error("No se pudo cargar el perfil de Supabase:", profileError);
  }
  // Si falla, `roles` queda vacío y el menú muestra solo lo que no exige rol.
  if (rolesError) {
    console.error("No se pudieron cargar los roles del usuario:", rolesError);
  }

  const navigation = getVisibleNavigation(roles);

  // Sin cookie (primera visita) el menú empieza expandido.
  const defaultSidebarOpen = cookieStore.get(SIDEBAR_COOKIE)?.value !== "false";

  return (
    <WorkspaceShell
      avatarUrl={profile?.avatar_url ?? null}
      defaultSidebarOpen={defaultSidebarOpen}
      fullName={fullName}
      initials={getInitials(fullName)}
      navigation={navigation}
      profileError={Boolean(profileError)}
    >
      {children}
    </WorkspaceShell>
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? [Array.from(words[0])[0], Array.from(words[words.length - 1])[0]]
      : [Array.from(words[0] ?? "")[0]];

  return initials.join("").toLocaleUpperCase() || "?";
}