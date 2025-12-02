import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import VehicleLocationMap from "@/components/VehicleLocationMap";
import { useState } from "react";

interface CheckinStep1Props {
  data: {
    agente_nome: string;
    agentes_acompanhantes: string[];
    latitude: number | null;
    longitude: number | null;
    local: string;
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
  };
  onChange: (field: string, value: string | string[]) => void;
  vehicleInfo?: string;
  onLocationUpdate?: (lat: number, lng: number, local: string) => void;
}

export function CheckinStep1({ data, onChange, vehicleInfo, onLocationUpdate }: CheckinStep1Props) {
  const [kmError, setKmError] = useState("");

  const handleKmBlur = () => {
    if (!data.km_atual) {
      setKmError("Quilometragem é obrigatória");
    } else if (parseInt(data.km_atual) < 0) {
      setKmError("Quilometragem não pode ser negativa");
    } else if (parseInt(data.km_atual) > 9999999) {
      setKmError("Quilometragem inválida");
    } else {
      setKmError("");
    }
  };

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange("km_atual", e.target.value);
    if (kmError) {
      setKmError("");
    }
  };

  const renderStatusField = (
    id: string,
    label: string,
    statusValue: string,
    observacaoValue: string,
    statusField: string,
    observacaoField: string
  ) => (
    <div className="space-y-3">
      <Label className="text-base font-semibold">{label}</Label>
      <RadioGroup value={statusValue} onValueChange={(value) => onChange(statusField, value)}>
        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="em_condicoes" id={`${id}-em-condicoes`} />
          <Label htmlFor={`${id}-em-condicoes`} className="font-normal cursor-pointer flex-1">Em condições</Label>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="sem_condicoes" id={`${id}-sem-condicoes`} />
          <Label htmlFor={`${id}-sem-condicoes`} className="font-normal cursor-pointer flex-1">Sem condições</Label>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="ausente" id={`${id}-ausente`} />
          <Label htmlFor={`${id}-ausente`} className="font-normal cursor-pointer flex-1">Ausente</Label>
        </div>
      </RadioGroup>
      {statusValue && statusValue !== "em_condicoes" && (
        <Textarea
          placeholder={`Descreva a situação ${label.toLowerCase()}...`}
          value={observacaoValue}
          onChange={(e) => onChange(observacaoField, e.target.value)}
          rows={3}
          required
        />
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessão 1: Condição Geral</CardTitle>
        <CardDescription>Etapa 1 de 5 - Informações básicas e condição geral da viatura</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agente Responsável */}
        <div className="space-y-2">
          <Label htmlFor="agente_nome">Agente Responsável</Label>
          <Input
            id="agente_nome"
            placeholder="Nome do agente"
            value={data.agente_nome}
            onChange={(e) => onChange("agente_nome", e.target.value)}
          />
        </div>

        {/* Agentes Acompanhantes */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Agentes Acompanhantes</Label>
          {data.agentes_acompanhantes.map((agente, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Agente acompanhante ${index + 1}`}
                value={agente}
                onChange={(e) => {
                  const newAgentes = [...data.agentes_acompanhantes];
                  newAgentes[index] = e.target.value;
                  onChange("agentes_acompanhantes", newAgentes);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const newAgentes = data.agentes_acompanhantes.filter((_, i) => i !== index);
                  onChange("agentes_acompanhantes", newAgentes);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onChange("agentes_acompanhantes", [...data.agentes_acompanhantes, ""]);
            }}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Agente Acompanhante
          </Button>
        </div>

        {/* Localização GPS */}
        <div className="space-y-2">
          <Label>Localização GPS</Label>
          {vehicleInfo && <VehicleLocationMap vehicleInfo={vehicleInfo} />}
          {data.local && (
            <p className="text-sm text-muted-foreground mt-2">
              Local: {data.local}
            </p>
          )}
        </div>

        {/* Quilometragem Atual */}
        <div className="space-y-2">
          <Label htmlFor="km_atual" className="text-base font-semibold">
            Quilometragem Atual *
          </Label>
          <Input
            id="km_atual"
            type="number"
            placeholder="Ex: 50000"
            value={data.km_atual}
            onChange={handleKmChange}
            onBlur={handleKmBlur}
            className={kmError ? "border-destructive" : ""}
          />
          {kmError && (
            <p className="text-sm text-destructive">{kmError}</p>
          )}
        </div>

        {/* Placa */}
        {renderStatusField(
          "placa",
          "Placa",
          data.placa_presente,
          data.placa_observacao,
          "placa_presente",
          "placa_observacao"
        )}

        {/* Nível de Óleo */}
        {renderStatusField(
          "nivel-oleo",
          "Nível de Óleo",
          data.nivel_oleo,
          data.nivel_oleo_observacao,
          "nivel_oleo",
          "nivel_oleo_observacao"
        )}

        {/* Freio */}
        {renderStatusField(
          "freio",
          "Freio",
          data.freio_status,
          data.freio_observacao,
          "freio_status",
          "freio_observacao"
        )}

        {/* Motor */}
        {renderStatusField(
          "motor",
          "Motor",
          data.motor_status,
          data.motor_observacao,
          "motor_status",
          "motor_observacao"
        )}

        {/* Combustível */}
        {renderStatusField(
          "combustivel",
          "Combustível",
          data.combustivel_status,
          data.combustivel_observacao,
          "combustivel_status",
          "combustivel_observacao"
        )}

        {/* Estado Geral */}
        {renderStatusField(
          "estado-geral",
          "Estado Geral",
          data.estado_geral,
          data.estado_geral_observacao,
          "estado_geral",
          "estado_geral_observacao"
        )}

        {/* Condições Mecânicas */}
        {renderStatusField(
          "condicoes-mecanicas",
          "Condições Mecânicas",
          data.condicoes_mecanicas,
          data.condicoes_mecanicas_observacao,
          "condicoes_mecanicas",
          "condicoes_mecanicas_observacao"
        )}
      </CardContent>
    </Card>
  );
}
