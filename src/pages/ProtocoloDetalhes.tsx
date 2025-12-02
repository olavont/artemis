import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProtocoloDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [protocolo, setProtocolo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProtocolo();
    }
  }, [id]);

  const fetchProtocolo = async () => {
    const { data, error } = await supabase
      .from("protocolos_empenho")
      .select(`
        *,
        viaturas (prefixo, placa, marca, modelo),
        profiles!protocolos_empenho_agente_responsavel_id_fkey (nome, matricula),
        checklists_veiculo (
          id,
          tipo_checklist,
          km_atual,
          placa_presente,
          placa_observacao,
          nivel_oleo,
          freio_status,
          freio_observacao,
          pneu_status,
          pneu_observacao,
          luzes_status,
          luzes_observacao,
          limpadores_status,
          limpadores_observacao,
          observacoes,
          checklist_itens (
            id,
            situacao,
            observacoes,
            itens_viatura (nome)
          )
        ),
        protocolos_devolucao (
          id,
          data_hora_devolucao,
          local_devolucao,
          observacoes
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar protocolo",
        description: error.message,
      });
      navigate("/protocolos");
    } else {
      setProtocolo(data);
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!protocolo) {
    return null;
  }

  const checklistEmpenho = protocolo.checklists_veiculo?.find((c: any) => c.tipo_checklist === "empenho");
  const checklistDevolucao = protocolo.checklists_veiculo?.find((c: any) => c.tipo_checklist === "devolucao");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/protocolos")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{protocolo.numero_protocolo}</h1>
          <p className="text-muted-foreground">Detalhes do protocolo de empenho</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              {getStatusBadge(protocolo.status)}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Viatura</p>
                <p className="font-medium">{protocolo.viaturas?.prefixo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placa</p>
                <p className="font-medium">{protocolo.viaturas?.placa}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Veículo</p>
                <p className="font-medium">{protocolo.viaturas?.marca} {protocolo.viaturas?.modelo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Agente Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{protocolo.profiles?.nome}</p>
            </div>
            {protocolo.profiles?.matricula && (
              <div>
                <p className="text-sm text-muted-foreground">Matrícula</p>
                <p className="font-medium">{protocolo.profiles?.matricula}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Datas e Locais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold">Empenho</h3>
              <div>
                <p className="text-sm text-muted-foreground">Data/Hora</p>
                <p className="font-medium">
                  {format(new Date(protocolo.data_hora_empenho), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {protocolo.local_empenho && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="font-medium">{protocolo.local_empenho}</p>
                  </div>
                </div>
              )}
            </div>

            {protocolo.protocolos_devolucao?.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Devolução</h3>
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">
                    {format(new Date(protocolo.protocolos_devolucao[0].data_hora_devolucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {protocolo.protocolos_devolucao[0].local_devolucao && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Local</p>
                      <p className="font-medium">{protocolo.protocolos_devolucao[0].local_devolucao}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(checklistEmpenho || checklistDevolucao) && (
        <Card>
          <CardHeader>
            <CardTitle>Checklists</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={checklistEmpenho ? "empenho" : "devolucao"}>
              <TabsList>
                {checklistEmpenho && <TabsTrigger value="empenho">Check-In</TabsTrigger>}
                {checklistDevolucao && <TabsTrigger value="devolucao">Check-Out</TabsTrigger>}
              </TabsList>

              {checklistEmpenho && (
                <TabsContent value="empenho" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Quilometragem</p>
                      <p className="font-medium">{checklistEmpenho.km_atual || "-"} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Freios</p>
                      <p className="font-medium">{checklistEmpenho.freio_status || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pneus</p>
                      <p className="font-medium">{checklistEmpenho.pneu_status || "-"}</p>
                    </div>
                  </div>
                  {checklistEmpenho.observacoes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p>{checklistEmpenho.observacoes}</p>
                    </div>
                  )}
                </TabsContent>
              )}

              {checklistDevolucao && (
                <TabsContent value="devolucao" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Quilometragem</p>
                      <p className="font-medium">{checklistDevolucao.km_atual || "-"} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Freios</p>
                      <p className="font-medium">{checklistDevolucao.freio_status || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pneus</p>
                      <p className="font-medium">{checklistDevolucao.pneu_status || "-"}</p>
                    </div>
                  </div>
                  {checklistDevolucao.observacoes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p>{checklistDevolucao.observacoes}</p>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {protocolo.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{protocolo.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
