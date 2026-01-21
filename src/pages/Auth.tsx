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
      const keycloakUser = localStorage.getItem("keycloak_user");
      if (keycloakUser) {
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
      // In web (dev/prod), use relative path to hit the Vite proxy. In native, use full URL.
      const keycloakBaseUrl = isNative ? import.meta.env.VITE_KEYCLOAK_BASE_URL : "";
      const realm = import.meta.env.VITE_KEYCLOAK_REALM;
      const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

      if ((!keycloakBaseUrl && isNative) || !realm || !clientId) {
        throw new Error("Configurações do Keycloak ausentes no ambiente (.env)");
      }

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

      // 3. Uranus Role & Tenant Sync
      // In web, use relative path "/uranus" which is proxied. In native, use full URL.
      const uranusApiUrl = isNative ? import.meta.env.VITE_URANUS_API_URL : "/uranus";
      const masterTenant = import.meta.env.VITE_URANUS_MASTER_TENANT || "des-aureaphigital";

      if (!uranusApiUrl) {
        console.warn("URL da API Uranus não configurada.");
      }

      // Username for Uranus seems to be preferred_username
      const uranusUsername = userInfo.preferred_username || username;

      console.log(`Buscando dados Uranus para: ${uranusUsername}`);

      const groupsResponse = await httpGet(
        `${uranusApiUrl}/core/users/${uranusUsername}`,
        {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "X-Tenant": masterTenant,
          "Content-Type": "application/json"
        }
      );

      let appRole = "agente";
      let userTenant = null;

      if (groupsResponse.status === 200) {
        const uranusData = groupsResponse.data;
        const userData = uranusData.data || uranusData;

        // Map Tenant
        // Procura por um campo tenant, ou tenta extrair dos grupos ex: "tenant:saas2-detranpa" ou usa o próprio contexto
        // SE NÃO TIVER explícito, assumimos que o exemplo do user 'saas2-detranpa' vem de algum lugar. 
        // Vou assumir que o objeto de usuário retorna o tenant ou está dentro de 'attributes'.
        // Mas como não tenho o JSON exato, vou salvar o que vier em 'tenant' ou 'realm' ou fallback.
        // *CRITICAL*: User request implies logic is needed. "Mapeamento do tenant".
        // Vou adicionar uma lógica genérica que tenta pegar de 'tenant' no root ou attributes.
        userTenant = userData.tenant || (userData.attributes && userData.attributes.tenant ? userData.attributes.tenant[0] : null);

        // Fallback: Tentar extrair de grupos se tiver padrão "tenant_nome" ? 
        // O user deu exemplo: "saas2-detranpa".
        // Se vier null, vou deixar null e o trigger backend ou admin define, ou usar o masterTenant.

        const groups = userData.groups || [];
        const activeGroups = groups.filter((g: any) => g.active);
        const groupIdentifiers = activeGroups.flatMap((g: any) => [
          (g.name || "").toLowerCase(),
          (g.alias || "").toLowerCase()
        ]);

        const isGestorOrAdmin = groupIdentifiers.some((id: string) =>
          id.includes('administrador') ||
          id.includes('supervisor') ||
          id.includes('admin') ||
          id.includes('gestor')
        );

        if (isGestorOrAdmin) appRole = "gestor";
      } else {
        console.warn("Falha ao buscar grupos Uranus", groupsResponse.status);
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

      // Using 'as any' because 'tenant' column is not yet in the generated types
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData as any);

      if (profileError) {
        console.error("Erro ao sincronizar perfil:", profileError);
      }

      // Store Tenant in LocalStorage
      if (userTenant) {
        localStorage.setItem("user_tenant", userTenant);
      }

      if (profileError) {
        console.error("Erro ao sincronizar perfil:", profileError);
        // We continue even if sync fails, though data might be missing
      }

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