import { supabase } from "@/integrations/supabase/client";

export function isKeycloakUser(): boolean {
  return !!localStorage.getItem("keycloak_user");
}

export function getKeycloakUserId(): string | null {
  const keycloakUser = localStorage.getItem("keycloak_user");
  if (keycloakUser) {
    const userData = JSON.parse(keycloakUser);
    return userData.sub;
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/proxy-data`;

      // Get the session token if available, or just send without auth if we're relying on internal logic (though Supabase functions usually require a key)
      // For invoke, supabase-js adds the Authorization header. We need to match that.
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ action, userId, params }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Now we can see the actual error message!
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
      return { data: null, error: err as Error };
    }
  }

  // For Supabase users, return null to indicate direct query should be used
  return { data: null, error: new Error("USE_DIRECT_QUERY") };
}
