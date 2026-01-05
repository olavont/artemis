import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key } from "lucide-react";
import logoColor from "@/assets/logoColor.svg";

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
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

  const handleKeycloakLogin = () => {
    const keycloakBaseUrl = "https://account.des.aureaphigital.com:8443";
    const realm = "des-aureaphigital";
    const clientId = "portal_helios_des_authorization_code";
    const redirectUri = `${window.location.origin}/auth/callback`;

    const authUrl = new URL(`${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/auth`);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("scope", "openid profile email");

    window.location.href = authUrl.toString();
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
              Utilize sua conta Uranus para acessar o portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 text-base"
              type="button"
              onClick={handleKeycloakLogin}
            >
              <Key className="mr-2 h-5 w-5" />
              Entrar com conta Uranus
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}