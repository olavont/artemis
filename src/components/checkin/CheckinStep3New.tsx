import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EquipmentItem {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  tipo: string;
  quantidade_padrao: number;
  obrigatoriedade: string;
}

interface ItemStatus {
  item_id: string;
  situacao: string;
  observacao: string;
}

interface CheckinStep3NewProps {
  viaturaId: string;
  data: ItemStatus[];
  onChange: (data: ItemStatus[]) => void;
}

export function CheckinStep3New({ viaturaId, data, onChange }: CheckinStep3NewProps) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [viaturaId]);

  const fetchItems = async () => {
    setLoading(true);
    
    const { data: configData, error } = await supabase
      .from("viatura_itens_config")
      .select(`
        id,
        quantidade_padrao,
        obrigatoriedade,
        itens_viatura (
          id,
          nome,
          descricao,
          categoria,
          tipo
        )
      `)
      .eq("viatura_id", viaturaId);

    if (error) {
      console.error("Error fetching items:", error);
      setLoading(false);
      return;
    }

    const formattedItems: EquipmentItem[] = (configData || [])
      .filter(item => item.itens_viatura)
      .map(item => ({
        id: item.itens_viatura!.id,
        nome: item.itens_viatura!.nome,
        descricao: item.itens_viatura!.descricao,
        categoria: item.itens_viatura!.categoria,
        tipo: item.itens_viatura!.tipo,
        quantidade_padrao: item.quantidade_padrao || 1,
        obrigatoriedade: item.obrigatoriedade
      }));

    setItems(formattedItems);

    // Initialize data if empty
    if (data.length === 0 && formattedItems.length > 0) {
      const initialData = formattedItems.map(item => ({
        item_id: item.id,
        situacao: "",
        observacao: ""
      }));
      onChange(initialData);
    }

    setLoading(false);
  };

  const handleStatusChange = (itemId: string, situacao: string) => {
    const newData = data.map(item => 
      item.item_id === itemId ? { ...item, situacao } : item
    );
    
    // Add item if not exists
    if (!newData.find(item => item.item_id === itemId)) {
      newData.push({ item_id: itemId, situacao, observacao: "" });
    }
    
    onChange(newData);
  };

  const handleObservacaoChange = (itemId: string, observacao: string) => {
    const newData = data.map(item => 
      item.item_id === itemId ? { ...item, observacao } : item
    );
    onChange(newData);
  };

  const getItemStatus = (itemId: string) => {
    return data.find(item => item.item_id === itemId) || { item_id: itemId, situacao: "", observacao: "" };
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      seguranca: "Segurança",
      sinalizacao: "Sinalização",
      mecanico: "Mecânico",
      eletrico: "Elétrico",
      comunicacao: "Comunicação",
      outro: "Outro"
    };
    return labels[categoria] || categoria;
  };

  const getObrigatoriedadeBadge = (obrigatoriedade: string) => {
    if (obrigatoriedade === "obrigatorio") {
      return <Badge variant="destructive" className="text-xs">Obrigatório</Badge>;
    }
    if (obrigatoriedade === "recomendado") {
      return <Badge variant="secondary" className="text-xs">Recomendado</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Opcional</Badge>;
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.categoria]) {
      acc[item.categoria] = [];
    }
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, EquipmentItem[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessão 3: Itens do Veículo</CardTitle>
          <CardDescription>Etapa 3 de 5 - Verificação dos itens cadastrados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessão 3: Itens do Veículo</CardTitle>
          <CardDescription>Etapa 3 de 5 - Verificação dos itens cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum item cadastrado para esta viatura.</p>
            <p className="text-sm mt-2">Você pode prosseguir para a próxima etapa.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessão 3: Itens do Veículo</CardTitle>
        <CardDescription>Etapa 3 de 5 - Verificação dos itens cadastrados na viatura</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedItems).map(([categoria, categoryItems]) => (
          <div key={categoria} className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              {getCategoriaLabel(categoria)}
            </h3>
            
            {categoryItems.map(item => {
              const status = getItemStatus(item.id);
              
              return (
                <div key={item.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      {item.descricao && (
                        <p className="text-sm text-muted-foreground">{item.descricao}</p>
                      )}
                    </div>
                    {getObrigatoriedadeBadge(item.obrigatoriedade)}
                  </div>

                  <RadioGroup
                    value={status.situacao}
                    onValueChange={(value) => handleStatusChange(item.id, value)}
                    className="flex flex-wrap gap-3"
                  >
                    <div className="flex items-center space-x-2 p-2 rounded border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="presente" id={`${item.id}-presente`} />
                      <Label htmlFor={`${item.id}-presente`} className="font-normal cursor-pointer text-success">
                        Presente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="incompleto" id={`${item.id}-incompleto`} />
                      <Label htmlFor={`${item.id}-incompleto`} className="font-normal cursor-pointer text-warning">
                        Incompleto
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="ausente" id={`${item.id}-ausente`} />
                      <Label htmlFor={`${item.id}-ausente`} className="font-normal cursor-pointer text-destructive">
                        Ausente
                      </Label>
                    </div>
                  </RadioGroup>

                  {(status.situacao === "incompleto" || status.situacao === "ausente") && (
                    <Textarea
                      placeholder="Descreva a situação do item..."
                      value={status.observacao}
                      onChange={(e) => handleObservacaoChange(item.id, e.target.value)}
                      rows={2}
                      required
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
