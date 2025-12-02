import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CheckoutStep1Props {
  data: {
    placa_presente: string;
    placa_observacao: string;
    nivel_oleo: string;
    freio_status: string;
    freio_observacao: string;
    km_atual: string;
    local: string;
  };
  onChange: (field: string, value: string) => void;
  vehicleInfo: string;
}

export function CheckoutStep1({ data, onChange, vehicleInfo }: CheckoutStep1Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vistoria Inicial de Devolução</CardTitle>
        <CardDescription>Etapa 1 de 5 - {vehicleInfo}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="km_atual">Quilometragem Atual *</Label>
          <Input
            id="km_atual"
            type="number"
            value={data.km_atual}
            onChange={(e) => onChange("km_atual", e.target.value)}
            placeholder="Ex: 50000"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="placa_presente">Situação da Placa *</Label>
          <Select value={data.placa_presente} onValueChange={(value) => onChange("placa_presente", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="em_condicoes">Em Condições</SelectItem>
              <SelectItem value="danificada">Danificada</SelectItem>
              <SelectItem value="ausente">Ausente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.placa_presente !== "em_condicoes" && data.placa_presente && (
          <div className="space-y-2">
            <Label htmlFor="placa_observacao">Observação sobre a Placa *</Label>
            <Textarea
              id="placa_observacao"
              value={data.placa_observacao}
              onChange={(e) => onChange("placa_observacao", e.target.value)}
              placeholder="Descreva o problema com a placa"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="nivel_oleo">Nível de Óleo *</Label>
          <Select value={data.nivel_oleo} onValueChange={(value) => onChange("nivel_oleo", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="baixo">Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="freio_status">Status dos Freios *</Label>
          <Select value={data.freio_status} onValueChange={(value) => onChange("freio_status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="nok">NOK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.freio_status === "nok" && (
          <div className="space-y-2">
            <Label htmlFor="freio_observacao">Observação sobre os Freios *</Label>
            <Textarea
              id="freio_observacao"
              value={data.freio_observacao}
              onChange={(e) => onChange("freio_observacao", e.target.value)}
              placeholder="Descreva o problema com os freios"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="local">Local de Devolução</Label>
          <Input
            id="local"
            type="text"
            value={data.local}
            onChange={(e) => onChange("local", e.target.value)}
            placeholder="Ex: Garagem Central"
          />
        </div>
      </CardContent>
    </Card>
  );
}
