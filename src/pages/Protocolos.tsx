import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye } from "lucide-react";
import { isKeycloakUser, proxyFetch } from "@/hooks/useProxyData";

export default function Protocolos() {
  const navigate = useNavigate();
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchProtocolos();
  }, []);

  const fetchProtocolos = async () => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_protocolos");
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar protocolos",
          description: error.message,
        });
      } else {
        const transformed = (data || []).map((p: any) => ({
          ...p,
          viaturas: p.viatura,
          profiles: p.agente,
        }));
        setProtocolos(transformed);
      }
      return;
    }

    const { data, error } = await supabase
      .from("protocolos_empenho")
      .select(`
        *,
        viaturas (placa, prefixo),
        profiles!protocolos_empenho_agente_responsavel_id_fkey (nome)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar protocolos",
        description: error.message,
      });
    } else {
      setProtocolos(data || []);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      em_andamento: { label: "Em Andamento", variant: "secondary" },
      concluido: { label: "Concluído", variant: "default" },
      cancelado: { label: "Cancelado", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Protocolos</h1>
        <p className="text-muted-foreground">Histórico de protocolos de empenho</p>
      </div>

      <div className="grid gap-4">
        {protocolos.map((protocolo) => (
          <Card key={protocolo.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{protocolo.numero_protocolo}</CardTitle>
                {getStatusBadge(protocolo.status)}
              </div>
              <CardDescription>
                {protocolo.viaturas?.prefixo} - {protocolo.viaturas?.placa}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Agente: {protocolo.profiles?.nome || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Data: {format(new Date(protocolo.data_hora_empenho), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                  {protocolo.local_empenho && (
                    <p className="text-sm text-muted-foreground">
                      Local: {protocolo.local_empenho}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/protocolos/${protocolo.id}`)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {protocolos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum protocolo encontrado
        </div>
      )}
    </div>
  );
}
