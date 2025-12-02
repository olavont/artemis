import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface CheckinStep5Props {
  viaturaInfo: {
    prefixo: string;
    marca: string;
    modelo: string;
    placa: string;
  };
  step1Data: {
    km_atual: string;
    placa_presente: string;
    placa_observacao: string;
    nivel_oleo: string;
    nivel_oleo_observacao: string;
    freio_status: string;
    freio_observacao: string;
    motor_status: string;
    motor_observacao: string;
    combustivel_status: string;
    combustivel_observacao: string;
    estado_geral: string;
    estado_geral_observacao: string;
    condicoes_mecanicas: string;
    condicoes_mecanicas_observacao: string;
    agente_nome: string;
    agentes_acompanhantes: string[];
    latitude: number | null;
    longitude: number | null;
    local: string;
  };
  step2Data: {
    retrovisores_status: string;
    retrovisores_observacao: string;
    limpadores_status: string;
    limpadores_observacao: string;
    farol_status: string;
    farol_observacao: string;
    lanterna_status: string;
    lanterna_observacao: string;
    pneu_status: string;
    pneu_observacao: string;
    cinto_status: string;
    cinto_observacao: string;
    extintor_status: string;
    extintor_observacao: string;
    alertas_status: string;
    alertas_observacao: string;
  };
  step3Data: Array<{
    item_id: string;
    nome_item?: string;
    status: string;
    observacao: string;
  }>;
  step4Data: Array<{
    tipo: string;
    preview: string | null;
  }>;
  observacaoGeral: string;
  onObservacaoChange: (value: string) => void;
  motivoEmpenho: string;
  onMotivoEmpenhoChange: (value: string) => void;
}

const getStatusIcon = (status: string) => {
  if (status === "ok" || status === "em_condicoes" || status === "tem") {
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  }
  if (status === "nok" || status === "sem_condicoes" || status === "nao_tem") {
    return <XCircle className="h-4 w-4 text-red-600" />;
  }
  return <AlertCircle className="h-4 w-4 text-yellow-600" />;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ok: "OK",
    nok: "Não OK",
    em_condicoes: "Em Condições",
    sem_condicoes: "Sem Condições",
    ausente: "Ausente",
    alto: "Alto",
    medio: "Médio",
    baixo: "Baixo",
    tem: "Tem",
    nao_tem: "Não Tem",
  };
  return labels[status] || status;
};

const getTipoFotoLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    frente: "Frente",
    lateral_esquerda: "Lateral Esquerda",
    lateral_direita: "Lateral Direita",
    traseira: "Traseira",
  };
  return labels[tipo] || tipo;
};

export function CheckinStep5({
  viaturaInfo,
  step1Data,
  step2Data,
  step3Data,
  step4Data,
  observacaoGeral,
  onObservacaoChange,
  motivoEmpenho,
  onMotivoEmpenhoChange
}: CheckinStep5Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !step1Data.latitude || !step1Data.longitude) return;

    mapInstance.current = L.map(mapRef.current).setView([step1Data.latitude, step1Data.longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstance.current);

    L.marker([step1Data.latitude, step1Data.longitude], { icon: DefaultIcon })
      .addTo(mapInstance.current)
      .bindPopup(step1Data.local);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [step1Data.latitude, step1Data.longitude, step1Data.local]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisão Final do Check-in</CardTitle>
        <CardDescription>Etapa 5 de 5 - Confirme todas as informações antes de finalizar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações da Viatura */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-primary">📋</span> Informações da Viatura
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
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
            <div>
              <span className="text-muted-foreground">Quilometragem:</span>
              <p className="font-medium">{step1Data.km_atual} km</p>
            </div>
          </div>
        </div>

        {/* Localização e Agentes */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-primary">📍</span> Localização e Responsáveis
          </h3>

          {step1Data.latitude && step1Data.longitude && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Local de Empenho:</span>
                <p className="font-medium">{step1Data.local}</p>
              </div>
              <div
                ref={mapRef}
                className="w-full h-[250px] rounded-lg overflow-hidden border"
              />
            </div>
          )}

          {step1Data.agentes_acompanhantes.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Agentes Acompanhantes:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {step1Data.agentes_acompanhantes.map((agente, index) => (
                  <Badge key={index} variant="secondary">{agente}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Checklist Técnico - Step 1 */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-primary">🔧</span> Checklist Técnico (Parte 1)
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Placa:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step1Data.placa_presente)}
                <span className="font-medium">{getStatusLabel(step1Data.placa_presente)}</span>
              </div>
            </div>
            {step1Data.placa_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step1Data.placa_observacao}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nível de Óleo:</span>
              <span className="font-medium">{getStatusLabel(step1Data.nivel_oleo)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Freios:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step1Data.freio_status)}
                <span className="font-medium">{getStatusLabel(step1Data.freio_status)}</span>
              </div>
            </div>
            {step1Data.freio_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step1Data.freio_observacao}</p>
            )}
          </div>
        </div>

        {/* Checklist Técnico - Step 2 */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-primary">🛡️</span> Checklist de Segurança
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Retrovisores:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step2Data.retrovisores_status)}
                <span className="font-medium">{getStatusLabel(step2Data.retrovisores_status)}</span>
              </div>
            </div>
            {step2Data.retrovisores_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step2Data.retrovisores_observacao}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Limpadores:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step2Data.limpadores_status)}
                <span className="font-medium">{getStatusLabel(step2Data.limpadores_status)}</span>
              </div>
            </div>
            {step2Data.limpadores_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step2Data.limpadores_observacao}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Farol:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step2Data.farol_status)}
                <span className="font-medium">{getStatusLabel(step2Data.farol_status)}</span>
              </div>
            </div>
            {step2Data.farol_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step2Data.farol_observacao}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Lanterna:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step2Data.lanterna_status)}
                <span className="font-medium">{getStatusLabel(step2Data.lanterna_status)}</span>
              </div>
            </div>
            {step2Data.lanterna_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step2Data.lanterna_observacao}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pneus:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step2Data.pneu_status)}
                <span className="font-medium">{getStatusLabel(step2Data.pneu_status)}</span>
              </div>
            </div>
            {step2Data.pneu_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step2Data.pneu_observacao}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cinto de Segurança:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step2Data.cinto_status)}
                <span className="font-medium">{getStatusLabel(step2Data.cinto_status)}</span>
              </div>
            </div>
            {step2Data.cinto_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step2Data.cinto_observacao}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Extintor:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step2Data.extintor_status)}
                <span className="font-medium">{getStatusLabel(step2Data.extintor_status)}</span>
              </div>
            </div>
            {step2Data.extintor_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step2Data.extintor_observacao}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Alertas/Sinalização:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(step2Data.alertas_status)}
                <span className="font-medium">{getStatusLabel(step2Data.alertas_status)}</span>
              </div>
            </div>
            {step2Data.alertas_observacao && (
              <p className="text-xs text-muted-foreground ml-4">Obs: {step2Data.alertas_observacao}</p>
            )}
          </div>
        </div>

        {/* Itens Verificados */}
        {step3Data.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-primary">📦</span> Itens Verificados ({step3Data.length})
            </h3>
            <div className="space-y-2">
              {step3Data.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.nome_item || `Item ${index + 1}`}:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium">{getStatusLabel(item.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fotos */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-primary">📷</span> Fotos da Viatura ({step4Data.length})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {step4Data.map((photo, index) => (
              <div key={index} className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{getTipoFotoLabel(photo.tipo)}</p>
                {photo.preview && (
                  <img
                    src={photo.preview}
                    alt={getTipoFotoLabel(photo.tipo)}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Motivo de Empenho */}
        <div className="space-y-2">
          <Label htmlFor="motivo-empenho">Motivo de Empenho *</Label>
          <Textarea
            id="motivo-empenho"
            placeholder="Descreva o motivo pelo qual a viatura está sendo empenhada..."
            value={motivoEmpenho}
            onChange={(e) => onMotivoEmpenhoChange(e.target.value)}
            rows={3}
            required
            className={!motivoEmpenho ? "border-destructive" : ""}
          />
        </div>

        {/* Observação Geral */}
        <div className="space-y-2">
          <Label htmlFor="observacao-geral">Observação Geral (Opcional)</Label>
          <Textarea
            id="observacao-geral"
            placeholder="Digite aqui qualquer observação adicional sobre o check-in desta viatura..."
            value={observacaoGeral}
            onChange={(e) => onObservacaoChange(e.target.value)}
            rows={4}
          />
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-center">
            Ao finalizar, você estará confirmando que todas as informações do checklist estão corretas
            e a viatura será marcada como <strong>empenhada</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
