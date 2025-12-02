import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Car, CheckCircle } from "lucide-react";
import { isKeycloakUser, proxyFetch } from "@/hooks/useProxyData";

export default function Checkin() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchViaturasDisponiveis();
  }, []);

  const fetchViaturasDisponiveis = async () => {
    setLoading(true);

    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_viaturas");
      if (!error && data) {
        setViaturas(data.filter((v: any) => v.status_operacional === "disponivel"));
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("viaturas")
      .select("*")
      .eq("status_operacional", "disponivel")
      .order("prefixo", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar viaturas",
        description: error.message,
      });
    } else {
      setViaturas(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Check-In</h1>
        <p className="text-muted-foreground">Selecione uma viatura disponível para iniciar o empenho</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {viaturas.map((viatura) => (
            <Card key={viatura.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/checkin/${viatura.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    {viatura.prefixo}
                  </CardTitle>
                  <Badge variant="default" className="bg-success text-success-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Disponível
                  </Badge>
                </div>
                <CardDescription>{viatura.placa}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {viatura.marca} {viatura.modelo}
                </p>
                <Button className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Iniciar Check-In
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && viaturas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma viatura disponível para check-in
        </div>
      )}
    </div>
  );
}
