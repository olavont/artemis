import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, MapPin, Fuel, Droplets, Wrench, Image } from "lucide-react";

interface PhotoData {
  tipo: string;
  file: File;
  preview: string;
}

interface ItemStatus {
  item_id: string;
  situacao: string;
  observacao: string;
}

interface CheckinStep5NewProps {
  viaturaInfo: {
    prefixo: string;
    placa: string;
    marca: string;
    modelo: string;
  };
  step1Data: {
    agente_nome: string;
    agentes_acompanhantes: string[];
    motivo: string;
    km_atual: string;
    local: string;
    latitude: number | null;
    longitude: number | null;
  };
  step2Data: {
    nivel_combustivel: string;
    nivel_oleo: string;
    condicoes_mecanicas: string;
    condicoes_mecanicas_observacao: string;
  };
  step3Data: ItemStatus[];
  step4Data: PhotoData[];
  items: { id: string; nome: string }[];
  observacaoGeral: string;
  onObservacaoChange: (value: string) => void;
}

export function CheckinStep5New({ 
  viaturaInfo, 
  step1Data, 
  step2Data, 
  step3Data, 
  step4Data,
  items,
  observacaoGeral, 
  onObservacaoChange 
}: CheckinStep5NewProps) {

  const getStatusIcon = (situacao: string) => {
    if (situacao === "tem" || situacao === "em_condicoes") {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    if (situacao === "sem_condicoes") {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    if (situacao === "nao_tem") {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    return null;
  };

  const getSituacaoLabel = (situacao: string) => {
    const labels: Record<string, string> = {
      tem: "Presente",
      sem_condicoes: "Incompleto",
      nao_tem: "Ausente",
      em_condicoes: "Em condições"
    };
    return labels[situacao] || situacao;
  };

  const getFuelLabel = (value: string) => {
    const labels: Record<string, string> = {
      "1/4": "1/4 (Baixo)",
      "2/4": "2/4 (Médio)",
      "3/4": "3/4 (Alto)",
      "4/4": "4/4 (Cheio)"
    };
    return labels[value] || value;
  };

  const getOilLabel = (value: string) => {
    const labels: Record<string, string> = {
      alto: "Alto",
      medio: "Médio",
      baixo: "Baixo"
    };
    return labels[value] || value;
  };

  const getPhotoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      frente: "Frente",
      lateral_esquerda: "Lateral Esquerda",
      lateral_direita: "Lateral Direita",
      traseira: "Traseira"
    };
    return labels[tipo] || tipo;
  };

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item?.nome || "Item desconhecido";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessão 5: Revisão</CardTitle>
        <CardDescription>Etapa 5 de 5 - Revise todas as informações antes de confirmar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações da Viatura */}
        <div className="bg-accent/30 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Badge variant="outline">Viatura</Badge>
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Prefixo:</span>
              <p className="font-medium">{viaturaInfo.prefixo}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Placa:</span>
              <p className="font-medium">{viaturaInfo.placa}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Veículo:</span>
              <p className="font-medium">{viaturaInfo.marca} {viaturaInfo.modelo}</p>
            </div>
          </div>
        </div>

        {/* Dados Gerais (Step 1) */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Dados Gerais</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agente Responsável:</span>
              <span className="font-medium">{step1Data.agente_nome || "-"}</span>
            </div>
            {step1Data.agentes_acompanhantes.filter(a => a).length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Copilotos:</span>
                <span className="font-medium">{step1Data.agentes_acompanhantes.filter(a => a).join(", ")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Motivo:</span>
              <span className="font-medium text-right max-w-[60%]">{step1Data.motivo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KM Atual:</span>
              <span className="font-medium">{parseInt(step1Data.km_atual || "0").toLocaleString('pt-BR')} km</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Local:
              </span>
              <span className="font-medium text-right max-w-[60%]">{step1Data.local || "-"}</span>
            </div>
          </div>
        </div>

        {/* Condições do Veículo (Step 2) */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Condições do Veículo</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Fuel className="h-3 w-3" />
                Combustível:
              </span>
              <span className="font-medium">{getFuelLabel(step2Data.nivel_combustivel) || "-"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                Nível de Óleo:
              </span>
              <span className="font-medium">{getOilLabel(step2Data.nivel_oleo) || "-"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                Condições Mecânicas:
              </span>
              <span className="font-medium flex items-center gap-1">
                {getStatusIcon(step2Data.condicoes_mecanicas)}
                {step2Data.condicoes_mecanicas === "em_condicoes" ? "Em condições" : "Sem condições"}
              </span>
            </div>
            {step2Data.condicoes_mecanicas === "sem_condicoes" && step2Data.condicoes_mecanicas_observacao && (
              <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-xs">
                {step2Data.condicoes_mecanicas_observacao}
              </div>
            )}
          </div>
        </div>

        {/* Itens Verificados (Step 3) */}
        {step3Data.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Itens Verificados</h3>
            <div className="space-y-2">
              {step3Data.filter(item => item.situacao).map((item) => (
                <div key={item.item_id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <span>{getItemName(item.item_id)}</span>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(item.situacao)}
                    <span>{getSituacaoLabel(item.situacao)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fotos (Step 4) */}
        {step4Data.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Image className="h-4 w-4" />
              Fotos Registradas ({step4Data.length}/4)
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {step4Data.map((photo) => (
                <div key={photo.tipo} className="space-y-1">
                  <img
                    src={photo.preview}
                    alt={getPhotoLabel(photo.tipo)}
                    className="aspect-square object-cover rounded"
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    {getPhotoLabel(photo.tipo)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observação Geral */}
        <div className="space-y-2">
          <Label htmlFor="observacao_geral">Observações Gerais</Label>
          <Textarea
            id="observacao_geral"
            placeholder="Adicione observações gerais sobre o check-in..."
            value={observacaoGeral}
            onChange={(e) => onObservacaoChange(e.target.value)}
            rows={4}
          />
        </div>

        {/* Confirmação */}
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p className="text-sm text-warning-foreground">
            <strong>Atenção:</strong> Revise todas as informações antes de confirmar. Após a confirmação, o protocolo será gerado e a viatura ficará empenhada.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
