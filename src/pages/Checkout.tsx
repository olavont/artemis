import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Car, Clock } from "lucide-react";
import { format } from "date-fns";
import { isKeycloakUser, proxyFetch } from "@/hooks/useProxyData";

export default function Checkout() {
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProtocolosAtivos();
  }, []);

  const fetchProtocolosAtivos = async () => {
    setLoading(true);

    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_protocolos");
      if (!error && data) {
        const activeProtocolos = data
          .filter((p: any) => p.status === "em_andamento")
          .map((p: any) => ({ ...p, viaturas: p.viatura, profiles: p.agente }));
        setProtocolos(activeProtocolos);
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("protocolos_empenho")
      .select(`*, viaturas (placa, prefixo, marca, modelo), profiles!protocolos_empenho_agente_responsavel_id_fkey (nome)`)
      .eq("status", "em_andamento")
      .order("data_hora_empenho", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      setProtocolos(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Check-Out</h1>
        <p className="text-muted-foreground">Selecione um protocolo para realizar a devolução</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {protocolos.map((protocolo) => (
            <Card key={protocolo.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/checkout/${protocolo.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    {protocolo.viaturas?.prefixo}
                  </CardTitle>
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    Em uso
                  </Badge>
                </div>
                <CardDescription>{protocolo.numero_protocolo}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {protocolo.profiles?.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  Desde: {format(new Date(protocolo.data_hora_empenho), "dd/MM/yyyy HH:mm")}
                </p>
                <Button className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Realizar Devolução
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && protocolos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum protocolo ativo para devolução
        </div>
      )}
    </div>
  );
}
