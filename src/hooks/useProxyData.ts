import { supabase } from "@/integrations/supabase/client";

export function isKeycloakUser(): boolean {
  return !!localStorage.getItem("keycloak_user");
}

export function getKeycloakUserId(): string | null {
  const keycloakUser = localStorage.getItem("keycloak_user");
  if (keycloakUser) {
    const userData = JSON.parse(keycloakUser);
    return userData.id;
  }
  return null;
}

export async function getCurrentUserId(): Promise<string | null> {
  // Check Keycloak first
  const keycloakUserId = getKeycloakUserId();
  if (keycloakUserId) return keycloakUserId;

  // Otherwise check Supabase
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

interface ProxyResponse<T> {
  data: T | null;
  error: Error | null;
}

export async function proxyFetch<T>(
  action: string,
  params?: Record<string, any>
): Promise<ProxyResponse<T>> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { data: null, error: new Error("User not authenticated") };
  }

  // If Keycloak user, use proxy function
  if (isKeycloakUser()) {
    try {
      const response = await supabase.functions.invoke("proxy-data", {
        body: { action, userId, params },
      });

      if (response.error) {
        return { data: null, error: response.error };
      }

      if (!response.data.success) {
        return { data: null, error: new Error(response.data.error || "Unknown error") };
      }

      return { data: response.data.data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  // For Supabase users, return null to indicate direct query should be used
  return { data: null, error: new Error("USE_DIRECT_QUERY") };
}
