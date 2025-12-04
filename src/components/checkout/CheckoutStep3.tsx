import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Item {
  item_viatura_id: string;
  nome: string;
  descricao: string;
  checkin_situacao: string;
}

interface CheckoutStep3Props {
  protocoloId: string;
  data: Array<{
    item_id: string;
    status: string;
    observacao: string;
  }>;
  onChange: (data: Array<{ item_id: string; status: string; observacao: string }>) => void;
}

export function CheckoutStep3({ protocoloId, data, onChange }: CheckoutStep3Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [protocoloId]);

  const fetchItems = async () => {
    const { data: checklist, error: checklistError } = await supabase
      .from("checklists_veiculo")
      .select("id")
      .eq("protocolo_empenho_id", protocoloId)
      .eq("tipo_checklist", "empenho")
      .maybeSingle();

    if (checklistError) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar checklist",
        description: checklistError.message,
      });
      setLoading(false);
      return;
    }

    if (!checklist) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: checklistItems, error: itemsError } = await supabase
      .from("checklist_itens")
      .select(`
        item_viatura_id,
        situacao,
        itens_viatura(nome, descricao)
      `)
      .eq("checklist_veiculo_id", checklist.id);

    if (itemsError) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar itens",
        description: itemsError.message,
      });
    } else {
      const formattedItems = checklistItems.map((item: any) => ({
        item_viatura_id: item.item_viatura_id,
        nome: item.itens_viatura.nome,
        descricao: item.itens_viatura.descricao,
        checkin_situacao: item.situacao,
      }));
      setItems(formattedItems);

      if (data.length === 0) {
        const initialData = formattedItems.map((item) => ({
          item_id: item.item_viatura_id,
          status: "",
          observacao: "",
        }));
        onChange(initialData);
      }
    }
    setLoading(false);
  };

  const handleStatusChange = (itemId: string, status: string) => {
    const newData = data.map((item) =>
      item.item_id === itemId ? { ...item, status } : item
    );
    onChange(newData);
  };

  const handleObservacaoChange = (itemId: string, observacao: string) => {
    const newData = data.map((item) =>
      item.item_id === itemId ? { ...item, observacao } : item
    );
    onChange(newData);
  };

  const getItemData = (itemId: string) => {
    return data.find((item) => item.item_id === itemId) || { status: "", observacao: "" };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando itens...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist de Itens</CardTitle>
        <CardDescription>Etapa 3 de 5 - Verifique o status dos itens da viatura</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum item foi registrado no check-in desta viatura.</p>
            <p className="text-sm mt-2">Você pode continuar para as próximas etapas.</p>
          </div>
        ) : (
          items.map((item) => {
          const itemData = getItemData(item.item_viatura_id);
          const hasDiscrepancy = itemData.status && itemData.status !== item.checkin_situacao && !(itemData.status === "tem" && item.checkin_situacao === "tem");

          return (
            <div key={item.item_viatura_id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{item.nome}</h3>
                  <p className="text-sm text-muted-foreground">{item.descricao}</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Check-in: {item.checkin_situacao === "tem" ? "Presente" : item.checkin_situacao === "nao_tem" ? "Ausente" : item.checkin_situacao === "sem_condicoes" ? "Incompleto" : item.checkin_situacao.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {hasDiscrepancy && (
                  <Badge variant="destructive">Discrepância</Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status Atual *</Label>
                <Select
                  value={itemData.status}
                  onValueChange={(value) => handleStatusChange(item.item_viatura_id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tem">Presente</SelectItem>
                    <SelectItem value="sem_condicoes">Incompleto</SelectItem>
                    <SelectItem value="nao_tem">Ausente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(itemData.status === "sem_condicoes" || itemData.status === "nao_tem") && (
                <div className="space-y-2">
                  <Label>Observações *</Label>
                  <Textarea
                    value={itemData.observacao}
                    onChange={(e) => handleObservacaoChange(item.item_viatura_id, e.target.value)}
                    placeholder="Descreva o problema ou discrepância"
                    required
                  />
                </div>
              )}
            </div>
          );
        }))}
      </CardContent>
    </Card>
  );
}
