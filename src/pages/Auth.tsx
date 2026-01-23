import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { CapacitorHttp } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, Loader2, User, Lock } from "lucide-react";
import logoColor from "@/assets/logoColor.svg";
import {
  KEYCLOAK_BASE_URL,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_REALM,
} from "@/config/keycloakPublic";
import { getKeycloakUserId } from "@/hooks/useProxyData";

// Helper to make HTTP requests that works in both web and native
async function httpPost(url: string, headers: Record<string, string>, data: string) {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.post({ url, headers, data });
    return { status: response.status, data: response.data };
  } else {
    const response = await fetch(url, { method: "POST", headers, body: data });
    const responseData = await response.json().catch(() => ({}));
    return { status: response.status, data: responseData };
  }
}

async function httpGet(url: string, headers: Record<string, string>) {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({ url, headers });
    return { status: response.status, data: response.data };
  } else {
    const response = await fetch(url, { method: "GET", headers });
    const responseData = await response.json().catch(() => ({}));
    return { status: response.status, data: responseData };
  }
}

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in locally
    const checkSession = async () => {
      // Only consider Keycloak logged-in if payload contains a usable identifier.
      if (getKeycloakUserId()) {
        navigate("/");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkSession();
  }, [navigate]);

  const handleDisplayError = (title: string, message: string) => {
    toast({
      variant: "destructive",
      title,
      description: message,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      handleDisplayError("Campos obrigatórios", "Por favor, preencha usuário e senha.");
      return;
    }

    setIsLoading(true);

    try {
      const isNative = Capacitor.isNativePlatform();
      // Always use centralized public config (Lovable published apps may not have import.meta.env).
      const keycloakBaseUrl = KEYCLOAK_BASE_URL;
      const realm = KEYCLOAK_REALM;
      const clientId = KEYCLOAK_CLIENT_ID;

      // 1. Get Token (Direct Access Grant)
      const tokenParams = new URLSearchParams();
      tokenParams.append("client_id", clientId);
      tokenParams.append("grant_type", "password");
      tokenParams.append("username", username);
      tokenParams.append("password", password);
      tokenParams.append("scope", "openid profile email");

      const tokenResponse = await httpPost(
        `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`,
        { "Content-Type": "application/x-www-form-urlencoded" },
        tokenParams.toString()
      );

      if (tokenResponse.status !== 200) {
        const errorData = tokenResponse.data;
        throw new Error(errorData.error_description || "Falha na autenticação");
      }

      const tokenData = tokenResponse.data;

      // 2. Get User Info
      const userInfoResponse = await httpGet(
        `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/userinfo`,
        { Authorization: `Bearer ${tokenData.access_token}` }
      );

      if (userInfoResponse.status !== 200) {
        throw new Error("Falha ao obter dados do usuário");
      }

      const userInfo = userInfoResponse.data;

      if (!userInfo?.sub) {
        throw new Error("Login inválido: 'sub' não retornado pelo /userinfo");
      }

      // 3. Uranus Role & Tenant Sync
      // Username for Uranus seems to be preferred_username
      const uranusUsername = userInfo.preferred_username || username;

      let appRole = "agente";
      let userTenant = null;

      // IMPORTANT (web): Uranus endpoint can fail due to CORS.
      // Fetch Uranus data via Supabase Edge Function (server-side) to avoid browser CORS issues.
      const { data: uranusResult, error: uranusInvokeError } = await supabase.functions.invoke("proxy-data", {
        body: {
          action: "get_uranus_user",
          userId: userInfo.sub,
          params: {
            access_token: tokenData.access_token,
            username: uranusUsername,
          },
        },
      });

      if (uranusInvokeError || !uranusResult?.success) {
        console.warn("Falha ao buscar dados Uranus via proxy-data", uranusInvokeError || uranusResult);
      } else {
        const uranusData = uranusResult.data;
        const userData = uranusData?.data || uranusData;

        userTenant =
          userData?.tenant ||
          (userData?.attributes?.tenant ? userData.attributes.tenant[0] : null);

        const groups = userData?.groups || [];
        const activeGroups = groups.filter((g: any) => g?.active);
        const groupIdentifiers = activeGroups.flatMap((g: any) => [
          String(g?.name || "").toLowerCase(),
          String(g?.alias || "").toLowerCase(),
        ]);

        const isGestorOrAdmin = groupIdentifiers.some((id: string) =>
          id.includes("administrador") ||
          id.includes("supervisor") ||
          id.includes("admin") ||
          id.includes("gestor")
        );

        if (isGestorOrAdmin) appRole = "gestor";
      }

      // 4. Sync to Supabase Profile with Tenant
      const profileData = {
        id: userInfo.sub,
        nome: userInfo.name || userInfo.preferred_username || "Usuário",
        matricula: userInfo.preferred_username,
        perfil: appRole as "agente" | "gestor" | "admin",
        ativo: true,
        updated_at: new Date().toISOString(),
        tenant: userTenant // New Field
      };

      // IMPORTANT: Keycloak users do not have a Supabase JWT, so direct upsert is blocked by RLS.
      // Sync profile via proxy-data (service role).
      const { data: syncResult, error: syncInvokeError } = await supabase.functions.invoke("proxy-data", {
        body: { action: "sync_profile", userId: userInfo.sub, params: { profile: profileData } },
      });

      if (syncInvokeError || !syncResult?.success) {
        console.error("Erro ao sincronizar perfil via proxy-data:", syncInvokeError || syncResult);
      }

      // Store Tenant in LocalStorage
      if (userTenant) {
        localStorage.setItem("user_tenant", userTenant);
      }

      // We continue even if sync fails, but data may be missing.

      // 5. Store Session
      localStorage.setItem("keycloak_user", JSON.stringify(userInfo));
      localStorage.setItem("keycloak_tokens", JSON.stringify(tokenData));

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${userInfo.name || username}! (${appRole})`,
      });

      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      handleDisplayError(
        "Erro ao entrar",
        `Detalhes: ${error.message || JSON.stringify(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-accent to-accent-light p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white/95 rounded-2xl p-6 mb-4">
            <img src={logoColor} alt="ARTEMIS" className="h-16 w-auto" />
          </div>
          <p className="text-white/95 text-lg font-medium">Gestão de Viaturas Operacionais</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              Acesso ao Sistema
            </CardTitle>
            <CardDescription>
              Entre com suas credenciais Uranus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Digite seu usuário..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 text-base"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-5 w-5" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}