import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CheckoutStep5Props {
  viaturaInfo: {
    prefixo: string;
    marca: string;
    modelo: string;
    placa: string;
  };
  observacaoGeral: string;
  onObservacaoChange: (value: string) => void;
}

export function CheckoutStep5({ viaturaInfo, observacaoGeral, onObservacaoChange }: CheckoutStep5Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisão e Observações Gerais</CardTitle>
        <CardDescription>Etapa 5 de 5 - Finalize a devolução</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-accent/30 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Informações da Viatura</h3>
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

        <div className="space-y-2">
          <Label htmlFor="observacoes_gerais">Observações Gerais sobre a Devolução</Label>
          <Textarea
            id="observacoes_gerais"
            value={observacaoGeral}
            onChange={(e) => onObservacaoChange(e.target.value)}
            placeholder="Adicione observações sobre o estado geral da viatura, ocorrências durante o uso, ou qualquer informação relevante"
            rows={6}
          />
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p className="text-sm text-warning-foreground">
            <strong>Atenção:</strong> Certifique-se de que todas as informações estão corretas antes de finalizar.
            Após a confirmação, o protocolo de devolução será gerado e a viatura ficará disponível novamente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
