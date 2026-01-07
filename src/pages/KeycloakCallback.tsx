import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function KeycloakCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
          throw new Error(`Keycloak error: ${error}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        console.log("Processing Keycloak callback with code:", code);

        const redirectUri = Capacitor.isNativePlatform()
          ? "artemis://auth/callback"
          : `${window.location.origin}/auth/callback`;

        // Call edge function to exchange code for tokens
        const { data, error: functionError } = await supabase.functions.invoke(
          "keycloak-callback",
          {
            body: {
              code,
              redirectUri,
            },
          }
        );

        if (functionError) throw functionError;

        if (!data.success) {
          throw new Error(data.error || "Authentication failed");
        }

        console.log("Authentication successful:", data.user);

        // Store user info and tokens in localStorage for session management
        localStorage.setItem("keycloak_user", JSON.stringify(data.user));
        localStorage.setItem("keycloak_tokens", JSON.stringify(data.tokens));

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.user.name}!`,
        });

        navigate("/");
      } catch (err: any) {
        console.error("Keycloak callback error:", err);
        toast({
          variant: "destructive",
          title: "Erro na autenticação",
          description: err.message || "Falha ao processar login com Keycloak",
        });
        navigate("/auth");
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-accent to-accent-light">
      <div className="text-center text-white">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium">
          {processing ? "Processando autenticação..." : "Redirecionando..."}
        </p>
      </div>
    </div>
  );
}
