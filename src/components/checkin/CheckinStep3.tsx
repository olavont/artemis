import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface EquipmentItem {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  tipo: string;
}

interface EquipmentStatus {
  item_id: string;
  nome_item?: string;
  status: string;
  observacao: string;
}

interface CheckinStep3Props {
  viaturaId: string;
  data: EquipmentStatus[];
  onChange: (data: EquipmentStatus[]) => void;
}

export function CheckinStep3({ viaturaId, data, onChange }: CheckinStep3Props) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipments();
  }, [viaturaId]);

  const fetchEquipments = async () => {
    const { data: configData, error: configError } = await supabase
      .from("viatura_itens_config")
      .select(`
        quantidade_padrao,
        obrigatoriedade,
        item_viatura_id,
        itens_viatura (
          id,
          nome,
          descricao,
          categoria,
          tipo
        )
      `)
      .eq("viatura_id", viaturaId);

    if (!configError && configData) {
      const itemsData = configData
        .filter(config => config.itens_viatura)
        .map(config => ({
          ...(config.itens_viatura as any),
          quantidade_padrao: config.quantidade_padrao,
          obrigatoriedade: config.obrigatoriedade
        }));

      setItems(itemsData as any);

      if (data.length === 0) {
        const initialData = itemsData.map(item => ({
          item_id: (item as any).id,
          status: "",
          observacao: "",
        }));
        onChange(initialData);
      }
    }
    setLoading(false);
  };

  const handleStatusChange = (itemId: string, status: string, itemName: string) => {
    const newData = [...data];
    const index = newData.findIndex(d => d.item_id === itemId);

    if (index >= 0) {
      newData[index].status = status;
      newData[index].nome_item = itemName;
      if (status === "tem") {
        newData[index].observacao = "";
      }
    } else {
      newData.push({ item_id: itemId, nome_item: itemName, status, observacao: "" });
    }

    onChange(newData);
  };

  const handleObservationChange = (itemId: string, observacao: string, itemName: string) => {
    const newData = [...data];
    const index = newData.findIndex(d => d.item_id === itemId);

    if (index >= 0) {
      newData[index].observacao = observacao;
      newData[index].nome_item = itemName;
    } else {
      newData.push({ item_id: itemId, nome_item: itemName, status: "", observacao });
    }

    onChange(newData);
  };

  const getItemStatus = (itemId: string) => {
    return data.find(d => d.item_id === itemId) || { status: "", observacao: "" };
  };

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, JSX.Element> = {
      equipamento: <Badge variant="default">Equipamento</Badge>,
      ferramenta: <Badge variant="secondary">Ferramenta</Badge>,
      epi: <Badge className="bg-info text-info-foreground">EPI</Badge>,
      documento: <Badge className="bg-warning text-warning-foreground">Documento</Badge>,
    };
    return badges[tipo] || <Badge>{tipo}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carregando equipamentos...</p>
        </CardContent>
      </Card>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, EquipmentItem[]>);

  const categoriaLabels: Record<string, string> = {
    equipamento: "Equipamentos",
    ferramenta: "Ferramentas",
    epi: "EPIs",
    documento: "Documentos",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessão 3: Itens de Checklist</CardTitle>
        <CardDescription>Etapa 3 de 5 - Itens associados ao veículo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedItems).map(([categoria, categoryItems]) => (
          <div key={categoria} className="space-y-3">
            <h3 className="text-lg font-semibold">{categoriaLabels[categoria] || categoria}</h3>
            {categoryItems.map((item) => {
              const status = getItemStatus(item.id);
              return (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="text-base font-medium">{item.nome}</Label>
                        {getTipoBadge(item.tipo)}
                      </div>
                      {item.descricao && (
                        <p className="text-sm text-muted-foreground">{item.descricao}</p>
                      )}
                    </div>
                  </div>

                  <RadioGroup
                    value={status.status}
                    onValueChange={(value) => handleStatusChange(item.id, value, item.nome)}
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="tem" id={`${item.id}-tem`} />
                      <Label htmlFor={`${item.id}-tem`} className="font-normal cursor-pointer flex-1">
                        Presente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="sem_condicoes" id={`${item.id}-sem_condicoes`} />
                      <Label htmlFor={`${item.id}-sem_condicoes`} className="font-normal cursor-pointer flex-1">
                        Incompleto
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="nao_tem" id={`${item.id}-nao_tem`} />
                      <Label htmlFor={`${item.id}-nao_tem`} className="font-normal cursor-pointer flex-1">
                        Ausente
                      </Label>
                    </div>
                  </RadioGroup>

                  {(status.status === "sem_condicoes" || status.status === "nao_tem") && (
                    <div className="space-y-2">
                      <Label htmlFor={`${item.id}-obs`}>Observações *</Label>
                      <Textarea
                        id={`${item.id}-obs`}
                        placeholder="Descreva o problema (obrigatório)..."
                        value={status.observacao}
                        onChange={(e) => handleObservationChange(item.id, e.target.value, item.nome)}
                        rows={2}
                        required
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum item cadastrado. Cadastre itens na tela "Itens" primeiro.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
