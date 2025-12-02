import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface CheckinStep2Props {
  data: {
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
  onChange: (field: string, value: string) => void;
}

export function CheckinStep2({ data, onChange }: CheckinStep2Props) {
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
        <CardTitle>Sessão 2: Condições de Segurança</CardTitle>
        <CardDescription>Etapa 2 de 5 - Itens de segurança da viatura</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Retrovisores */}
        {renderStatusField(
          "retrovisores",
          "Retrovisores",
          data.retrovisores_status,
          data.retrovisores_observacao,
          "retrovisores_status",
          "retrovisores_observacao"
        )}

        {/* Limpadores */}
        {renderStatusField(
          "limpadores",
          "Limpadores",
          data.limpadores_status,
          data.limpadores_observacao,
          "limpadores_status",
          "limpadores_observacao"
        )}

        {/* Farol */}
        {renderStatusField(
          "farol",
          "Farol",
          data.farol_status,
          data.farol_observacao,
          "farol_status",
          "farol_observacao"
        )}

        {/* Lanterna */}
        {renderStatusField(
          "lanterna",
          "Lanterna",
          data.lanterna_status,
          data.lanterna_observacao,
          "lanterna_status",
          "lanterna_observacao"
        )}

        {/* Pneus */}
        {renderStatusField(
          "pneus",
          "Pneus",
          data.pneu_status,
          data.pneu_observacao,
          "pneu_status",
          "pneu_observacao"
        )}

        {/* Cinto */}
        {renderStatusField(
          "cinto",
          "Cinto de Segurança",
          data.cinto_status,
          data.cinto_observacao,
          "cinto_status",
          "cinto_observacao"
        )}

        {/* Extintor */}
        {renderStatusField(
          "extintor",
          "Extintor",
          data.extintor_status,
          data.extintor_observacao,
          "extintor_status",
          "extintor_observacao"
        )}

        {/* Alertas */}
        {renderStatusField(
          "alertas",
          "Alertas/Sinalização",
          data.alertas_status,
          data.alertas_observacao,
          "alertas_status",
          "alertas_observacao"
        )}
      </CardContent>
    </Card>
  );
}
