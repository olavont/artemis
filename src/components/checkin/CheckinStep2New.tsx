import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface CheckinStep2NewProps {
  data: {
    nivel_combustivel: string;
    nivel_oleo: string;
    condicoes_mecanicas: string;
    condicoes_mecanicas_observacao: string;
  };
  onChange: (field: string, value: string) => void;
}

export function CheckinStep2New({ data, onChange }: CheckinStep2NewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessão 2: Condições do Veículo</CardTitle>
        <CardDescription>Etapa 2 de 5 - Combustível, óleo e condições mecânicas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nível de Combustível */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Nível de Combustível *</Label>
          <RadioGroup 
            value={data.nivel_combustivel} 
            onValueChange={(value) => onChange("nivel_combustivel", value)}
            className="grid grid-cols-2 gap-3"
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="1/4" id="combustivel-1" />
              <Label htmlFor="combustivel-1" className="font-normal cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 border rounded flex">
                    <div className="w-1/4 bg-destructive rounded-l" />
                  </div>
                  <span>1/4</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="2/4" id="combustivel-2" />
              <Label htmlFor="combustivel-2" className="font-normal cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 border rounded flex">
                    <div className="w-2/4 bg-warning rounded-l" />
                  </div>
                  <span>2/4</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="3/4" id="combustivel-3" />
              <Label htmlFor="combustivel-3" className="font-normal cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 border rounded flex">
                    <div className="w-3/4 bg-success rounded-l" />
                  </div>
                  <span>3/4</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="4/4" id="combustivel-4" />
              <Label htmlFor="combustivel-4" className="font-normal cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 border rounded flex">
                    <div className="w-full bg-success rounded" />
                  </div>
                  <span>4/4 (Cheio)</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Nível de Óleo */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Nível de Óleo *</Label>
          <RadioGroup 
            value={data.nivel_oleo} 
            onValueChange={(value) => onChange("nivel_oleo", value)}
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="alto" id="oleo-alto" />
              <Label htmlFor="oleo-alto" className="font-normal cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span>Alto</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="medio" id="oleo-medio" />
              <Label htmlFor="oleo-medio" className="font-normal cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span>Médio</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="baixo" id="oleo-baixo" />
              <Label htmlFor="oleo-baixo" className="font-normal cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span>Baixo</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Condições Mecânicas */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Condições Mecânicas *</Label>
          <RadioGroup 
            value={data.condicoes_mecanicas} 
            onValueChange={(value) => onChange("condicoes_mecanicas", value)}
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="em_condicoes" id="mecanica-ok" />
              <Label htmlFor="mecanica-ok" className="font-normal cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span>Em condições</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="sem_condicoes" id="mecanica-nok" />
              <Label htmlFor="mecanica-nok" className="font-normal cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span>Sem condições</span>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {data.condicoes_mecanicas === "sem_condicoes" && (
            <Textarea
              placeholder="Descreva as condições mecânicas do veículo..."
              value={data.condicoes_mecanicas_observacao}
              onChange={(e) => onChange("condicoes_mecanicas_observacao", e.target.value)}
              rows={3}
              required
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
