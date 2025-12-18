import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, User, FileText, Printer, Fuel, Gauge, Wrench, Package, Camera } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import html2pdf from "html2pdf.js";
export default function ProtocoloDetalhes() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [protocolo, setProtocolo] = useState<any>(null);
  const [fotos, setFotos] = useState<any[]>([]);
  const [itensViatura, setItensViatura] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (id) {
      fetchProtocolo();
      fetchFotos();
    }
  }, [id]);
  useEffect(() => {
    if (protocolo?.viatura_id) {
      fetchItensViatura(protocolo.viatura_id);
    }
  }, [protocolo?.viatura_id]);
  const fetchProtocolo = async () => {
    const {
      data,
      error
    } = await supabase.from("protocolos_empenho").select(`
        *,
        viaturas (prefixo, placa, marca, modelo, km_inicial, km_atual),
        profiles!protocolos_empenho_agente_responsavel_id_fkey (nome, matricula),
        checklists_veiculo (
          id,
          tipo_checklist,
          km_atual,
          nivel_combustivel,
          nivel_oleo,
          condicoes_mecanicas,
          estado_geral,
          observacoes,
          created_at,
          checklist_itens (
            id,
            item_viatura_id,
            situacao,
            observacoes,
            itens_viatura (id, nome, categoria)
          )
        ),
        protocolos_devolucao (
          id,
          nome_agente,
          data_hora_devolucao,
          local_devolucao,
          latitude_devolucao,
          longitude_devolucao,
          observacoes,
          agente_responsavel_id,
          profiles:agente_responsavel_id (nome, matricula),
          checklists_veiculo (
            id,
            tipo_checklist,
            km_atual,
            nivel_combustivel,
            nivel_oleo,
            condicoes_mecanicas,
            estado_geral,
            observacoes,
            created_at,
            checklist_itens (
              id,
              item_viatura_id,
              situacao,
              observacoes,
              itens_viatura (id, nome, categoria)
            )
          )
        )
      `).eq("id", id).maybeSingle();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar protocolo",
        description: error.message
      });
      navigate("/protocolos");
    } else {
      setProtocolo(data);
    }
    setLoading(false);
  };
  const fetchFotos = async () => {
    // Buscar fotos do check-in (protocolo_empenho_id)
    const {
      data: fotosEmpenho
    } = await supabase.from("fotos_checklist").select("*").eq("protocolo_empenho_id", id);

    // Buscar fotos do check-out (protocolo_devolucao_id) se existir devolução
    const {
      data: protocoloDevolucao
    } = await supabase.from("protocolos_devolucao").select("id").eq("protocolo_empenho_id", id).maybeSingle();
    let fotosDevolucao: any[] = [];
    if (protocoloDevolucao) {
      const {
        data
      } = await supabase.from("fotos_checklist").select("*").eq("protocolo_devolucao_id", protocoloDevolucao.id);
      fotosDevolucao = data || [];
    }
    setFotos([...(fotosEmpenho || []), ...fotosDevolucao]);
  };
  const fetchItensViatura = async (viaturaId: string) => {
    const {
      data
    } = await supabase.from("viatura_itens_config").select(`
        *,
        itens_viatura (id, nome, categoria, tipo)
      `).eq("viatura_id", viaturaId);
    setItensViatura(data || []);
  };
  const handlePrintPDF = async () => {
    if (!printRef.current) return;
    toast({
      title: "Gerando PDF...",
      description: "Aguarde enquanto o documento é preparado."
    });
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `protocolo_${protocolo.numero_protocolo}.pdf`,
      image: {
        type: 'jpeg',
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };
    try {
      await html2pdf().set(opt).from(printRef.current).save();
      toast({
        title: "PDF gerado!",
        description: "O arquivo foi baixado com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Tente novamente."
      });
    }
  };
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }> = {
      em_andamento: {
        label: "Em Andamento",
        variant: "secondary"
      },
      concluido: {
        label: "Concluído",
        variant: "default"
      },
      cancelado: {
        label: "Cancelado",
        variant: "destructive"
      }
    };
    const statusInfo = statusMap[status] || {
      label: status,
      variant: "outline" as const
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };
  const getNivelCombustivelLabel = (nivel: number | null) => {
    if (!nivel) return "-";
    if (nivel <= 1) return "1/4";
    if (nivel <= 2) return "2/4";
    if (nivel <= 3) return "3/4";
    return "4/4 (Cheio)";
  };
  const getNivelOleoLabel = (nivel: string | null) => {
    if (!nivel) return "-";
    const labels: Record<string, string> = {
      alto: "Alto",
      medio: "Médio",
      baixo: "Baixo"
    };
    return labels[nivel] || nivel;
  };
  const getCondicoesMecanicasLabel = (condicao: string | null) => {
    if (!condicao) return "-";
    return condicao === "em_condicoes" ? "Em Condições" : "Sem Condições";
  };
  const getSituacaoItemLabel = (situacao: string) => {
    const labels: Record<string, string> = {
      presente: "Presente",
      ausente: "Ausente",
      incompleto: "Incompleto",
      sim: "Sim",
      nao: "Não",
      em_condicoes: "Em Condições",
      bom: "Bom",
      mau: "Mau"
    };
    return labels[situacao] || situacao;
  };
  const getSituacaoItemColor = (situacao: string) => {
    if (["presente", "sim", "em_condicoes", "bom"].includes(situacao)) {
      return "text-green-600";
    }
    if (["incompleto"].includes(situacao)) {
      return "text-orange-500";
    }
    return "text-red-500";
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>;
  }
  if (!protocolo) {
    return null;
  }
  const checklistEmpenho = protocolo.checklists_veiculo?.find((c: any) => c.tipo_checklist === "empenho");
  const devolucao = protocolo.protocolos_devolucao?.[0];
  const checklistDevolucao = devolucao?.checklists_veiculo?.[0] || protocolo.checklists_veiculo?.find((c: any) => c.tipo_checklist === "devolucao");
  const fotosEmpenho = fotos.filter(f => f.protocolo_empenho_id && !f.protocolo_devolucao_id);
  const fotosDevolucao = fotos.filter(f => f.protocolo_devolucao_id);
  return <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/protocolos")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{protocolo.numero_protocolo}</h1>
            <p className="text-muted-foreground">Detalhes do protocolo de empenho</p>
          </div>
        </div>
        <Button onClick={handlePrintPDF} className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimir PDF
        </Button>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="space-y-6 bg-background p-4">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold">PROTOCOLO DE EMPENHO</h1>
          <p className="text-xl font-semibold mt-1">{protocolo.numero_protocolo}</p>
          <div className="mt-2">
            {getStatusBadge(protocolo.status)}
          </div>
        </div>

        {/* Informações Gerais */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Informações do Veículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Prefixo</p>
                <p className="font-semibold">{protocolo.viaturas?.prefixo || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placa</p>
                <p className="font-semibold">{protocolo.viaturas?.placa || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-semibold">{protocolo.viaturas?.marca || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-semibold">{protocolo.viaturas?.modelo || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-In e Check-Out lado a lado */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* CHECK-IN */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
              <CardTitle className="text-lg text-blue-700 dark:text-blue-300">
                CHECK-IN (Retirada)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Data e Local */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Data/Hora:</span>
                  <span className="font-medium">
                    {format(new Date(protocolo.data_hora_empenho), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR
                  })}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-sm text-muted-foreground">Local: </span>
                    <span className="font-medium text-sm">{protocolo.local_empenho || "-"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Agente:</span>
                  <span className="font-medium">{protocolo.nome_agente || protocolo.profiles?.nome || "-"}</span>
                </div>
              </div>

              <Separator />

              {/* Condições do Veículo */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <Gauge className="w-4 h-4" />
                  Condições do Veículo
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">KM</p>
                    <p className="font-semibold">{checklistEmpenho?.km_atual?.toLocaleString('pt-BR') || "-"}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Fuel className="w-3 h-3" /> Combustível
                    </p>
                    <p className="font-semibold">{getNivelCombustivelLabel(checklistEmpenho?.nivel_combustivel)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Nível Óleo</p>
                    <p className="font-semibold">{getNivelOleoLabel(checklistEmpenho?.nivel_oleo)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Mecânica
                    </p>
                    <p className={`font-semibold ${checklistEmpenho?.condicoes_mecanicas === "em_condicoes" ? "text-green-600" : checklistEmpenho?.condicoes_mecanicas ? "text-red-500" : ""}`}>
                      {getCondicoesMecanicasLabel(checklistEmpenho?.condicoes_mecanicas)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itens Verificados */}
              {itensViatura.length > 0 && <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4" />
                      Itens Verificados
                    </h4>
                    <div className="space-y-1">
                      {itensViatura.map((config: any) => {
                    const validacao = checklistEmpenho?.checklist_itens?.find((item: any) => item.item_viatura_id === config.item_viatura_id || item.itens_viatura?.id === config.itens_viatura?.id);
                    return <div key={config.id} className="flex items-center justify-between text-sm p-1 border-b">
                            <span>{config.itens_viatura?.nome}</span>
                            {validacao ? <span className={`font-medium ${getSituacaoItemColor(validacao.situacao)}`}>
                                {getSituacaoItemLabel(validacao.situacao)}
                              </span> : <span className="text-muted-foreground">Não verificado</span>}
                          </div>;
                  })}
                    </div>
                  </div>
                </>}

              {checklistEmpenho?.observacoes && <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Observações:</p>
                    <p className="text-sm">{checklistEmpenho.observacoes}</p>
                  </div>
                </>}

              {/* Fotos do Check-In */}
              {fotosEmpenho.length > 0 && <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      <Camera className="w-4 h-4" />
                      Fotos
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {fotosEmpenho.map(foto => <div key={foto.id} className="space-y-1">
                          <img src={foto.url_foto} alt={foto.descricao || "Foto"} className="w-full h-24 object-cover rounded border" crossOrigin="anonymous" />
                          <p className="text-xs text-center text-muted-foreground capitalize">
                            {foto.descricao?.replace(/_/g, " ") || "Foto"}
                          </p>
                        </div>)}
                    </div>
                  </div>
                </>}
            </CardContent>
          </Card>

          {/* CHECK-OUT */}
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50 dark:bg-green-950/30">
              <CardTitle className="text-lg text-green-700 dark:text-green-300">
                CHECK-OUT (Devolução)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Data e Local */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Data/Hora:</span>
                  <span className="font-medium">
                    {devolucao ? format(new Date(devolucao.data_hora_devolucao), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR
                  }) : "-"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-sm text-muted-foreground">Local: </span>
                    <span className="font-medium text-sm">{devolucao?.local_devolucao || "-"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Agente:</span>
                  <span className="font-medium">{devolucao?.nome_agente || devolucao?.profiles?.nome || "-"}</span>
                </div>
              </div>

              <Separator />

              {/* Condições do Veículo */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <Gauge className="w-4 h-4" />
                  Condições do Veículo
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">KM</p>
                    <p className="font-semibold">{checklistDevolucao?.km_atual?.toLocaleString('pt-BR') || "-"}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Fuel className="w-3 h-3" /> Combustível
                    </p>
                    <p className="font-semibold">{checklistDevolucao ? getNivelCombustivelLabel(checklistDevolucao.nivel_combustivel) : "-"}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Nível Óleo</p>
                    <p className="font-semibold">{checklistDevolucao ? getNivelOleoLabel(checklistDevolucao.nivel_oleo) : "-"}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Mecânica
                    </p>
                    <p className={`font-semibold ${checklistDevolucao?.condicoes_mecanicas === "em_condicoes" ? "text-green-600" : checklistDevolucao?.condicoes_mecanicas ? "text-red-500" : ""}`}>
                      {checklistDevolucao ? getCondicoesMecanicasLabel(checklistDevolucao.condicoes_mecanicas) : "-"}
                    </p>
                  </div>
                </div>

                {/* KM Rodados */}
                {checklistEmpenho?.km_atual && checklistDevolucao?.km_atual && (
                  <div className="p-2 bg-muted rounded col-span-2">
                    <p className="text-xs text-muted-foreground">KM Rodados</p>
                    <p className="font-semibold">
                      {(checklistDevolucao.km_atual - checklistEmpenho.km_atual).toLocaleString('pt-BR')} km
                    </p>
                  </div>
                )}
              </div>

              {/* Itens Verificados */}
              {itensViatura.length > 0 && <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4" />
                      Itens Verificados
                    </h4>
                    <div className="space-y-1">
                      {itensViatura.map((config: any) => {
                    const validacao = checklistDevolucao?.checklist_itens?.find((item: any) => item.item_viatura_id === config.item_viatura_id || item.itens_viatura?.id === config.itens_viatura?.id);
                    return <div key={config.id} className="flex items-center justify-between text-sm p-1 border-b">
                            <span>{config.itens_viatura?.nome}</span>
                            {validacao ? <span className={`font-medium ${getSituacaoItemColor(validacao.situacao)}`}>
                                {getSituacaoItemLabel(validacao.situacao)}
                              </span> : <span className="text-muted-foreground">Não verificado</span>}
                          </div>;
                  })}
                    </div>
                  </div>
                </>}

              {checklistDevolucao?.observacoes && <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Observações:</p>
                    <p className="text-sm">{checklistDevolucao.observacoes}</p>
                  </div>
                </>}

              {/* Fotos do Check-Out */}
              {fotosDevolucao.length > 0 && <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      <Camera className="w-4 h-4" />
                      Fotos
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {fotosDevolucao.map(foto => <div key={foto.id} className="space-y-1">
                          <img src={foto.url_foto} alt={foto.descricao || "Foto"} className="w-full h-24 object-cover rounded border" crossOrigin="anonymous" />
                          <p className="text-xs text-center text-muted-foreground capitalize">
                            {foto.descricao?.replace(/_/g, " ") || "Foto"}
                          </p>
                        </div>)}
                    </div>
                  </div>
                </>}

              {!devolucao && <div className="text-center py-8 text-muted-foreground">
                  <p className="italic">Check-out ainda não realizado</p>
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Observações Gerais */}
        {(protocolo.observacoes || devolucao?.observacoes) && <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {protocolo.observacoes && <div>
                  <p className="text-sm font-medium text-muted-foreground">Empenho:</p>
                  <p className="whitespace-pre-wrap">{protocolo.observacoes}</p>
                </div>}
              {devolucao?.observacoes && <div>
                  <p className="text-sm font-medium text-muted-foreground">Devolução:</p>
                  <p className="whitespace-pre-wrap">{devolucao.observacoes}</p>
                </div>}
            </CardContent>
          </Card>}

        {/* Rodapé para impressão */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", {
            locale: ptBR
          })}</p>
        </div>
      </div>
    </div>;
}