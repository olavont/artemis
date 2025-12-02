import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CheckoutStep2Props {
  data: {
    pneu_status: string;
    pneu_observacao: string;
    luzes_status: string;
    luzes_observacao: string;
    limpadores_status: string;
    limpadores_observacao: string;
  };
  onChange: (field: string, value: string) => void;
}

export function CheckoutStep2({ data, onChange }: CheckoutStep2Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vistoria Complementar</CardTitle>
        <CardDescription>Etapa 2 de 5 - Continue a inspeção do veículo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="pneu_status">Status dos Pneus *</Label>
          <Select value={data.pneu_status} onValueChange={(value) => onChange("pneu_status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="nok">NOK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.pneu_status === "nok" && (
          <div className="space-y-2">
            <Label htmlFor="pneu_observacao">Observação sobre os Pneus *</Label>
            <Textarea
              id="pneu_observacao"
              value={data.pneu_observacao}
              onChange={(e) => onChange("pneu_observacao", e.target.value)}
              placeholder="Descreva o problema com os pneus"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="luzes_status">Status das Luzes *</Label>
          <Select value={data.luzes_status} onValueChange={(value) => onChange("luzes_status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="nok">NOK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.luzes_status === "nok" && (
          <div className="space-y-2">
            <Label htmlFor="luzes_observacao">Observação sobre as Luzes *</Label>
            <Textarea
              id="luzes_observacao"
              value={data.luzes_observacao}
              onChange={(e) => onChange("luzes_observacao", e.target.value)}
              placeholder="Descreva o problema com as luzes"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="limpadores_status">Status dos Limpadores *</Label>
          <Select value={data.limpadores_status} onValueChange={(value) => onChange("limpadores_status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="nok">NOK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.limpadores_status === "nok" && (
          <div className="space-y-2">
            <Label htmlFor="limpadores_observacao">Observação sobre os Limpadores *</Label>
            <Textarea
              id="limpadores_observacao"
              value={data.limpadores_observacao}
              onChange={(e) => onChange("limpadores_observacao", e.target.value)}
              placeholder="Descreva o problema com os limpadores"
              required
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
