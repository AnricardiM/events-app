"use server";

import {
  createClient as createSupabaseClient} from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { isAppRole, validateRoleSet, type AppRole } from "@/lib/models/roles";
import { getAuthorizedAdmin } from "@/lib/services/authorization";

type ActionResult = {
  success: boolean;
  message: string;
  changed?: boolean;
};


function parseRoles(formData: FormData): AppRole[] | null {
  const roles: AppRole[] = [];
  const seen = new Set<AppRole>();

  for (const value of formData.getAll("roles")) {
    if (typeof value !== "string" || !isAppRole(value)) return null;
    if (seen.has(value)) return null;
    seen.add(value);
    roles.push(value);
  }

  return roles;
}

function explainDatabaseError(message: string) {
  const normalized = message.toLocaleLowerCase();

  if (normalized.includes("debe asignarse al menos un rol")) {
    return "Asigna al menos un rol al usuario.";
  }
  if (normalized.includes("no se permiten roles duplicados")) {
    return "No se pueden asignar roles repetidos.";
  }
  if (normalized.includes("editor es exclusivo")) {
    return "El rol Editor no se puede combinar con otros roles.";
  }
  if (normalized.includes("admin y programador son incompatibles")) {
    return "Los roles Administrador y Programador son incompatibles.";
  }
  if (normalized.includes("debe quedar al menos un administrador activo")) {
    return "No se puede completar la operación porque debe quedar al menos un administrador activo.";
  }
  if (normalized.includes("no puedes desactivarte a ti mismo")) {
    return "No puedes desactivar tu propio usuario.";
  }
  if (normalized.includes("solo admin")) {
    return "No tienes permisos para realizar esta operación.";
  }
  if (normalized.includes("usuario inexistente")) {
    return "El usuario ya no existe. Actualiza la lista e inténtalo de nuevo.";
  }

  console.error("Error administrativo de Supabase:", message);
  return "No se pudo completar la operación. Revisa las reglas y vuelve a intentarlo.";
}

async function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return {
      client: null,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el entorno privado del servidor.",
    };
  }

  return {
    client: createSupabaseClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }),
    error: null,
  };
}

export async function createManagedUser(
  formData: FormData,
): Promise<ActionResult> {
  const authorization = await getAuthorizedAdmin();
  if ("error" in authorization) {
    return { success: false, message: authorization.error };
  }

  const emailValue = formData.get("email");
  const nameValue = formData.get("full_name");
  const passwordValue = formData.get("password");
  const activeValue = formData.get("is_active");
  const roles = parseRoles(formData);

  if (
    typeof emailValue !== "string" ||
    typeof nameValue !== "string" ||
    typeof passwordValue !== "string" ||
    (activeValue !== null && activeValue !== "true") ||
    roles === null
  ) {
    return { success: false, message: "Completa los datos requeridos." };
  }

  const email = emailValue.trim().toLocaleLowerCase();
  const fullName = nameValue.trim();
  const password = passwordValue;
  const isActive = activeValue === "true";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Ingresa un correo electrónico válido." };
  }
  if (fullName.length < 2 || fullName.length > 120) {
    return {
      success: false,
      message: "El nombre debe tener entre 2 y 120 caracteres.",
    };
  }
  if (password.length < 8 || password.length > 128) {
    return {
      success: false,
      message: "La contraseña inicial debe tener entre 8 y 128 caracteres.",
    };
  }

 const roleError = validateRoleSet(roles);
  if (roleError) return { success: false, message: roleError };

  const { client: admin, error: adminClientError } = await createAdminClient();
  if (!admin) {
    return { success: false, message: adminClientError ?? "Servicio no disponible." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    console.error("No se pudo crear la cuenta de Auth:", createError);
    if (createError?.message.toLocaleLowerCase().includes("already")) {
      return {
        success: false,
        message: "Ya existe una cuenta con ese correo electrónico.",
      };
    }
    return {
      success: false,
      message: "No se pudo crear el usuario. Verifica el correo y la contraseña.",
    };
  }

  const userId = created.user.id;
  const { data: updatedProfile, error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName, is_active: false })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (profileError || !updatedProfile) {
    console.error("No se pudo completar el perfil recién creado:", profileError);
    revalidatePath("/usuarios");
    return {
      success: false,
      message:
        "La cuenta se creó, pero no se pudo completar el perfil. Quedó inactiva; revisa el perfil en Supabase.",
      changed: true,
    };
  }

  if (roles.length > 0) {
    const { error: roleError } = await authorization.supabase.rpc(
      "set_user_roles",
      { p_user_id: userId, p_roles: roles },
    );

    if (roleError) {
      revalidatePath("/usuarios");
      return {
        success: false,
        message: `La cuenta se creó y quedó inactiva, pero no se asignaron los roles. ${explainDatabaseError(roleError.message)}`,
        changed: true,
      };
    }
  }

  if (isActive) {
    const { error: activationError } = await authorization.supabase.rpc(
      "set_user_active",
      { p_user_id: userId, p_is_active: true },
    );

    if (activationError) {
      revalidatePath("/usuarios");
      return {
        success: false,
        message: `La cuenta y los roles se crearon, pero no se pudo activar. El usuario permanece inactivo. ${explainDatabaseError(activationError.message)}`,
        changed: true,
      };
    }
  }

  revalidatePath("/usuarios");
  return {
    success: true,
    message: "Usuario creado. La cuenta quedó confirmada y el perfil fue configurado.",
    changed: true,
  };
}

export async function updateManagedUser(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  const authorization = await getAuthorizedAdmin();
  if ("error" in authorization) {
    return { success: false, message: authorization.error };
  }

  if (!isUuid(userId)) {
    return {
      success: false,
      message: "El identificador del usuario no es válido.",
    };
  }

  const activeValue = formData.get("is_active");
  const roles = parseRoles(formData);
  if (
    (activeValue !== null && activeValue !== "true") ||
    roles === null
  ) {
    return { success: false, message: "Los datos enviados no son válidos." };
  }
  const isActive = activeValue === "true";

  if (userId === authorization.userId && !isActive) {
    return { success: false, message: "No puedes desactivar tu propio usuario." };
  }

  const roleError = validateRoleSet(roles);
  if (roleError) return { success: false, message: roleError };

  const { error: roleUpdateError } = await authorization.supabase.rpc(
    "set_user_roles",
    { p_user_id: userId, p_roles: roles },
  );

  if (roleUpdateError) {
    return {
      success: false,
      message: explainDatabaseError(roleUpdateError.message),
    };
  }

  const { error: activeUpdateError } = await authorization.supabase.rpc(
    "set_user_active",
    { p_user_id: userId, p_is_active: isActive },
  );

  revalidatePath("/usuarios");
  if (activeUpdateError) {
    return {
      success: false,
      message: `Los roles se guardaron, pero no se pudo cambiar el estado. ${explainDatabaseError(activeUpdateError.message)}`,
      changed: true,
    };
  }

  return {
    success: true,
    message: "Los roles y el estado se actualizaron.",
    changed: true,
  };
}

export async function setManagedUserActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const authorization = await getAuthorizedAdmin();
  if ("error" in authorization) {
    return { success: false, message: authorization.error };
  }
  if (!isUuid(userId) || typeof isActive !== "boolean") {
    return { success: false, message: "El identificador del usuario no es válido." };
  }

  const { error } = await authorization.supabase.rpc("set_user_active", {
    p_user_id: userId,
    p_is_active: isActive,
  });

  if (error) {
    return { success: false, message: explainDatabaseError(error.message) };
  }

  revalidatePath("/usuarios");
  return {
    success: true,
    message: isActive ? "Usuario activado." : "Usuario desactivado.",
  };
}

function isUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
