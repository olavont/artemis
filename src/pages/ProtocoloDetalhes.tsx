import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, User, FileText, Printer, Car, Fuel, Gauge, Wrench, Package, Camera } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import html2pdf from "html2pdf.js";

export default function ProtocoloDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [protocolo, setProtocolo] = useState<any>(null);
  const [fotos, setFotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchProtocolo();
      fetchFotos();
    }
  }, [id]);

  const fetchProtocolo = async () => {
    const { data, error } = await supabase
      .from("protocolos_empenho")
      .select(`
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
            situacao,
            observacoes,
            itens_viatura (nome, categoria)
          )
        ),
        protocolos_devolucao (
          id,
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
              situacao,
              observacoes,
              itens_viatura (nome, categoria)
            )
          )
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

  const fetchFotos = async () => {
    const { data } = await supabase
      .from("fotos_checklist")
      .select("*")
      .eq("protocolo_empenho_id", id);
    
    setFotos(data || []);
  };

  const handlePrintPDF = () => {
    if (!printRef.current) return;

    const opt = {
      margin: 10,
      filename: `protocolo_${protocolo.numero_protocolo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printRef.current).save();
    
    toast({
      title: "PDF gerado!",
      description: "O arquivo está sendo baixado.",
    });
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
      incompleto: "Incompleto",
      ausente: "Ausente",
      sim: "Sim",
      nao: "Não",
      tem: "Tem",
      nao_tem: "Não Tem",
      em_condicoes: "Em Condições",
      sem_condicoes: "Sem Condições",
      bom: "Bom",
      mau: "Mau"
    };
    return labels[situacao] || situacao;
  };

  const getSituacaoItemColor = (situacao: string) => {
    if (["presente", "sim", "tem", "em_condicoes", "bom"].includes(situacao)) {
      return "text-green-600";
    }
    if (["incompleto"].includes(situacao)) {
      return "text-orange-500";
    }
    return "text-red-500";
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
  const devolucao = protocolo.protocolos_devolucao?.[0];
  const checklistDevolucao = devolucao?.checklists_veiculo?.[0] || 
    protocolo.checklists_veiculo?.find((c: any) => c.tipo_checklist === "devolucao");

  const fotosEmpenho = fotos.filter(f => f.protocolo_empenho_id && !f.protocolo_devolucao_id);
  const fotosDevolucao = fotos.filter(f => f.protocolo_devolucao_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
      <div ref={printRef} className="space-y-6">
        {/* Header for PDF */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold">Protocolo de Empenho</h1>
          <p className="text-lg">{protocolo.numero_protocolo}</p>
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
                  <p className="text-sm text-muted-foreground">Prefixo</p>
                  <p className="font-medium">{protocolo.viaturas?.prefixo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Placa</p>
                  <p className="font-medium">{protocolo.viaturas?.placa}</p>
                </div>
                <div className="col-span-2">
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
                Agente Responsável (Empenho)
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
                <h3 className="font-semibold text-lg border-b pb-2">Check-In (Empenho)</h3>
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">
                    {format(new Date(protocolo.data_hora_empenho), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {protocolo.local_empenho && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Local de Retirada</p>
                      <p className="font-medium text-sm">{protocolo.local_empenho}</p>
                    </div>
                  </div>
                )}
                {protocolo.latitude_empenho && protocolo.longitude_empenho && (
                  <p className="text-xs text-muted-foreground">
                    Coordenadas: {protocolo.latitude_empenho.toFixed(6)}, {protocolo.longitude_empenho.toFixed(6)}
                  </p>
                )}
              </div>

              {devolucao && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Check-Out (Devolução)</h3>
                  <div>
                    <p className="text-sm text-muted-foreground">Data/Hora</p>
                    <p className="font-medium">
                      {format(new Date(devolucao.data_hora_devolucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {devolucao.local_devolucao && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Local de Devolução</p>
                        <p className="font-medium text-sm">{devolucao.local_devolucao}</p>
                      </div>
                    </div>
                  )}
                  {devolucao.latitude_devolucao && devolucao.longitude_devolucao && (
                    <p className="text-xs text-muted-foreground">
                      Coordenadas: {devolucao.latitude_devolucao.toFixed(6)}, {devolucao.longitude_devolucao.toFixed(6)}
                    </p>
                  )}
                  {devolucao.profiles && (
                    <div>
                      <p className="text-sm text-muted-foreground">Agente Responsável</p>
                      <p className="font-medium">{devolucao.profiles.nome}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Checklists detalhados */}
        {(checklistEmpenho || checklistDevolucao) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Checklists do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={checklistEmpenho ? "empenho" : "devolucao"}>
                <TabsList className="grid w-full grid-cols-2">
                  {checklistEmpenho && <TabsTrigger value="empenho">Check-In</TabsTrigger>}
                  {checklistDevolucao && <TabsTrigger value="devolucao">Check-Out</TabsTrigger>}
                </TabsList>

                {checklistEmpenho && (
                  <TabsContent value="empenho" className="space-y-6 mt-4">
                    {/* Condições do Veículo */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        Condições do Veículo
                      </h4>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Quilometragem</p>
                          <p className="font-medium text-lg">{checklistEmpenho.km_atual?.toLocaleString('pt-BR') || "-"} km</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Fuel className="w-3 h-3" /> Combustível
                          </p>
                          <p className="font-medium text-lg">{getNivelCombustivelLabel(checklistEmpenho.nivel_combustivel)}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Nível de Óleo</p>
                          <p className="font-medium text-lg">{getNivelOleoLabel(checklistEmpenho.nivel_oleo)}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Condições Mecânicas
                          </p>
                          <p className={`font-medium text-lg ${checklistEmpenho.condicoes_mecanicas === "em_condicoes" ? "text-green-600" : "text-red-500"}`}>
                            {getCondicoesMecanicasLabel(checklistEmpenho.condicoes_mecanicas)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Itens Verificados */}
                    {checklistEmpenho.checklist_itens?.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Itens Verificados
                        </h4>
                        <div className="grid gap-2">
                          {checklistEmpenho.checklist_itens.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{item.itens_viatura?.nome}</p>
                                {item.observacoes && (
                                  <p className="text-sm text-muted-foreground">{item.observacoes}</p>
                                )}
                              </div>
                              <Badge variant="outline" className={getSituacaoItemColor(item.situacao)}>
                                {getSituacaoItemLabel(item.situacao)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {checklistEmpenho.observacoes && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Observações</h4>
                        <p className="text-muted-foreground bg-muted p-3 rounded-lg">{checklistEmpenho.observacoes}</p>
                      </div>
                    )}
                  </TabsContent>
                )}

                {checklistDevolucao && (
                  <TabsContent value="devolucao" className="space-y-6 mt-4">
                    {/* Condições do Veículo */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        Condições do Veículo
                      </h4>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Quilometragem</p>
                          <p className="font-medium text-lg">{checklistDevolucao.km_atual?.toLocaleString('pt-BR') || "-"} km</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Fuel className="w-3 h-3" /> Combustível
                          </p>
                          <p className="font-medium text-lg">{getNivelCombustivelLabel(checklistDevolucao.nivel_combustivel)}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Nível de Óleo</p>
                          <p className="font-medium text-lg">{getNivelOleoLabel(checklistDevolucao.nivel_oleo)}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Condições Mecânicas
                          </p>
                          <p className={`font-medium text-lg ${checklistDevolucao.condicoes_mecanicas === "em_condicoes" ? "text-green-600" : "text-red-500"}`}>
                            {getCondicoesMecanicasLabel(checklistDevolucao.condicoes_mecanicas)}
                          </p>
                        </div>
                      </div>

                      {/* KM Rodados */}
                      {checklistEmpenho && checklistDevolucao && (
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm text-muted-foreground">KM Rodados durante o empenho</p>
                          <p className="font-bold text-xl text-primary">
                            {((checklistDevolucao.km_atual || 0) - (checklistEmpenho.km_atual || 0)).toLocaleString('pt-BR')} km
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Itens Verificados */}
                    {checklistDevolucao.checklist_itens?.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Itens Verificados
                        </h4>
                        <div className="grid gap-2">
                          {checklistDevolucao.checklist_itens.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{item.itens_viatura?.nome}</p>
                                {item.observacoes && (
                                  <p className="text-sm text-muted-foreground">{item.observacoes}</p>
                                )}
                              </div>
                              <Badge variant="outline" className={getSituacaoItemColor(item.situacao)}>
                                {getSituacaoItemLabel(item.situacao)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {checklistDevolucao.observacoes && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Observações</h4>
                        <p className="text-muted-foreground bg-muted p-3 rounded-lg">{checklistDevolucao.observacoes}</p>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Fotos */}
        {(fotosEmpenho.length > 0 || fotosDevolucao.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Fotos do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={fotosEmpenho.length > 0 ? "fotos-empenho" : "fotos-devolucao"}>
                <TabsList>
                  {fotosEmpenho.length > 0 && <TabsTrigger value="fotos-empenho">Check-In ({fotosEmpenho.length})</TabsTrigger>}
                  {fotosDevolucao.length > 0 && <TabsTrigger value="fotos-devolucao">Check-Out ({fotosDevolucao.length})</TabsTrigger>}
                </TabsList>

                {fotosEmpenho.length > 0 && (
                  <TabsContent value="fotos-empenho" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {fotosEmpenho.map((foto) => (
                        <div key={foto.id} className="space-y-2">
                          <img 
                            src={foto.url_foto} 
                            alt={foto.descricao || "Foto do veículo"}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          {foto.descricao && (
                            <p className="text-xs text-center text-muted-foreground capitalize">
                              {foto.descricao.replace(/_/g, " ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {fotosDevolucao.length > 0 && (
                  <TabsContent value="fotos-devolucao" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {fotosDevolucao.map((foto) => (
                        <div key={foto.id} className="space-y-2">
                          <img 
                            src={foto.url_foto} 
                            alt={foto.descricao || "Foto do veículo"}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          {foto.descricao && (
                            <p className="text-xs text-center text-muted-foreground capitalize">
                              {foto.descricao.replace(/_/g, " ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Observações Gerais */}
        {protocolo.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações do Empenho</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{protocolo.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {devolucao?.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações da Devolução</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{devolucao.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
