import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUserId } from "@/hooks/useProxyData";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CheckoutForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [protocolo, setProtocolo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kmAtual, setKmAtual] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [kmError, setKmError] = useState("");
  const [kmMinimo, setKmMinimo] = useState(0);

  useEffect(() => {
    if (id) fetchProtocolo();
  }, [id]);

  const fetchProtocolo = async () => {
    const { data, error } = await supabase
      .from("protocolos_empenho")
      .select(`*, viaturas (id, prefixo, placa, marca, modelo, km_inicial)`)
      .eq("id", id)
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
      navigate("/checkout");
    } else {
      setProtocolo(data);
      setKmMinimo(data.viaturas?.km_inicial || 0);
    }
    setLoading(false);
  };

  const handleKmChange = (value: string) => {
    setKmAtual(value);
    const kmValue = parseInt(value) || 0;
    if (kmValue < kmMinimo) {
      setKmError(`A quilometragem não pode ser menor que ${kmMinimo.toLocaleString('pt-BR')} km (atual da viatura)`);
    } else {
      setKmError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const kmValue = parseInt(kmAtual) || 0;
    if (kmValue < kmMinimo) {
      toast({ variant: "destructive", title: "Erro", description: `A quilometragem não pode ser menor que ${kmMinimo.toLocaleString('pt-BR')} km` });
      return;
    }

    setSaving(true);

    const userId = await getCurrentUserId();
    if (!userId) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado" });
      setSaving(false);
      return;
    }

    // Create return protocol
    const { data: devolucao, error: devolucaoError } = await supabase
      .from("protocolos_devolucao")
      .insert({
        protocolo_empenho_id: id,
        agente_responsavel_id: userId,
        observacoes,
      })
      .select()
      .single();

    if (devolucaoError) {
      toast({ variant: "destructive", title: "Erro", description: devolucaoError.message });
      setSaving(false);
      return;
    }

    // Create checklist
    await supabase.from("checklists_veiculo").insert({
      protocolo_devolucao_id: devolucao.id,
      tipo_checklist: "devolucao",
      km_atual: kmValue,
      observacoes,
    });

    // Update protocol status
    await supabase
      .from("protocolos_empenho")
      .update({ status: "concluido" })
      .eq("id", id);

    // Update vehicle status and km_inicial
    await supabase
      .from("viaturas")
      .update({ 
        status_operacional: "disponivel",
        km_inicial: kmValue 
      })
      .eq("id", protocolo.viaturas.id);

    toast({ title: "Check-Out realizado!", description: "Viatura devolvida com sucesso" });
    navigate("/");
  };

  if (loading) return <div className="text-center py-12">Carregando...</div>;
  if (!protocolo) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/checkout")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Check-Out</h1>
          <p className="text-muted-foreground">{protocolo.viaturas?.prefixo} - {protocolo.numero_protocolo}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Devolução</CardTitle>
          <CardDescription>Preencha os dados para finalizar a devolução</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="km">Quilometragem Atual *</Label>
              <Input
                id="km"
                type="number"
                value={kmAtual}
                onChange={(e) => handleKmChange(e.target.value)}
                placeholder={`Mínimo: ${kmMinimo.toLocaleString('pt-BR')} km`}
                required
                min={kmMinimo}
              />
              {kmError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{kmError}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">
                KM atual da viatura: {kmMinimo.toLocaleString('pt-BR')} km
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações gerais..."
                rows={4}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" 
              disabled={saving || !!kmError}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {saving ? "Processando..." : "Confirmar Devolução"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
