import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUserId } from "@/hooks/useProxyData";

export default function CheckinForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viatura, setViatura] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kmAtual, setKmAtual] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (id) fetchViatura();
  }, [id]);

  const fetchViatura = async () => {
    const { data, error } = await supabase
      .from("viaturas")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
      navigate("/checkin");
    } else {
      setViatura(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const userId = await getCurrentUserId();
    if (!userId) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado" });
      setSaving(false);
      return;
    }

    // Generate protocol number
    const { data: numeroProtocolo } = await supabase.rpc("gerar_numero_protocolo");

    // Create protocol
    const { data: protocolo, error: protocoloError } = await supabase
      .from("protocolos_empenho")
      .insert({
        numero_protocolo: numeroProtocolo,
        viatura_id: id,
        agente_responsavel_id: userId,
        observacoes,
      })
      .select()
      .single();

    if (protocoloError) {
      toast({ variant: "destructive", title: "Erro", description: protocoloError.message });
      setSaving(false);
      return;
    }

    // Create checklist
    await supabase.from("checklists_veiculo").insert({
      protocolo_empenho_id: protocolo.id,
      tipo_checklist: "empenho",
      km_atual: parseInt(kmAtual) || null,
      observacoes,
    });

    // Update vehicle status
    await supabase
      .from("viaturas")
      .update({ status_operacional: "empenhada" })
      .eq("id", id);

    toast({ title: "Check-In realizado!", description: `Protocolo: ${numeroProtocolo}` });
    navigate("/");
  };

  if (loading) return <div className="text-center py-12">Carregando...</div>;
  if (!viatura) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/checkin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Check-In</h1>
          <p className="text-muted-foreground">{viatura.prefixo} - {viatura.placa}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Empenho</CardTitle>
          <CardDescription>Preencha os dados para iniciar o empenho da viatura</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="km">Quilometragem Atual *</Label>
              <Input
                id="km"
                type="number"
                value={kmAtual}
                onChange={(e) => setKmAtual(e.target.value)}
                placeholder="Ex: 50000"
                required
              />
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
            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={saving}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {saving ? "Processando..." : "Confirmar Check-In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
