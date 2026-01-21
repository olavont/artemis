import { supabase } from "@/integrations/supabase/client";

export function isKeycloakUser(): boolean {
  const keycloakUser = localStorage.getItem("keycloak_user");
  console.log("[useProxyData] isKeycloakUser check:", !!keycloakUser);
  return !!keycloakUser;
}

export function getKeycloakUserId(): string | null {
  const keycloakUser = localStorage.getItem("keycloak_user");
  if (keycloakUser) {
    try {
      const userData = JSON.parse(keycloakUser);
      console.log("[useProxyData] Keycloak user data:", userData);
      return userData.sub || null;
    } catch (e) {
      console.error("[useProxyData] Error parsing keycloak_user:", e);
      return null;
    }
  }
  return null;
}

export async function getCurrentUserId(): Promise<string | null> {
  // Check Keycloak first
  const keycloakUserId = getKeycloakUserId();
  if (keycloakUserId) {
    console.log("[useProxyData] Using Keycloak userId:", keycloakUserId);
    return keycloakUserId;
  }

  // Otherwise check Supabase
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[useProxyData] Using Supabase userId:", user?.id);
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

  console.log("[useProxyData] proxyFetch called:", { action, userId, isKeycloak: isKeycloakUser() });

  if (!userId) {
    console.error("[useProxyData] No userId found");
    return { data: null, error: new Error("User not authenticated") };
  }

  // If Keycloak user, use proxy function
  if (isKeycloakUser()) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const functionUrl = `${supabaseUrl}/functions/v1/proxy-data`;

      console.log("[useProxyData] Calling proxy-data:", { functionUrl, action, userId });

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonKey}`,
          "apikey": anonKey
        },
        body: JSON.stringify({ action, userId, params }),
      });

      const responseData = await response.json();
      console.log("[useProxyData] Proxy response:", responseData);

      if (!response.ok) {
        return {
          data: null,
          error: new Error(responseData.error || `Error ${response.status}: ${JSON.stringify(responseData)}`)
        };
      }

      if (!responseData.success) {
        return { data: null, error: new Error(responseData.error || "Unknown error") };
      }

      return { data: responseData.data, error: null };
    } catch (err) {
      console.error("[useProxyData] Proxy error:", err);
      return { data: null, error: err as Error };
    }
  }

  // For Supabase users, return null to indicate direct query should be used
  return { data: null, error: new Error("USE_DIRECT_QUERY") };
}
