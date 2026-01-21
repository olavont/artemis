import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { getCurrentUserId, isKeycloakUser, proxyFetch } from "@/hooks/useProxyData";
import { Progress } from "@/components/ui/progress";
import { CheckinStep1New } from "@/components/checkin/CheckinStep1New";
import { CheckinStep2New } from "@/components/checkin/CheckinStep2New";
import { CheckinStep3New } from "@/components/checkin/CheckinStep3New";
import { CheckinStep4New } from "@/components/checkin/CheckinStep4New";
import { CheckinStep5New } from "@/components/checkin/CheckinStep5New";

interface PhotoData {
  tipo: string;
  file: File;
  preview: string;
}

interface ItemStatus {
  item_id: string;
  situacao: string;
  observacao: string;
}

export default function CheckoutForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [protocolo, setProtocolo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [items, setItems] = useState<{ id: string; nome: string }[]>([]);

  // Step 1 data
  const [step1Data, setStep1Data] = useState({
    agente_nome: "",
    agentes_acompanhantes: [] as string[],
    motivo: "",
    km_atual: "",
    latitude: null as number | null,
    longitude: null as number | null,
    local: ""
  });

  // Step 2 data
  const [step2Data, setStep2Data] = useState({
    nivel_combustivel: "",
    nivel_oleo: "",
    condicoes_mecanicas: "",
    condicoes_mecanicas_observacao: ""
  });

  // Step 3 data
  const [step3Data, setStep3Data] = useState<ItemStatus[]>([]);
  const [hasItems, setHasItems] = useState(false);

  // Step 4 data
  const [step4Data, setStep4Data] = useState<PhotoData[]>([]);

  // Step 5 data
  const [observacaoGeral, setObservacaoGeral] = useState("");

  useEffect(() => {
    if (id) fetchProtocolo();
  }, [id]);

  const fetchProtocolo = async () => {
    if (isKeycloakUser()) {
      // Use proxy for Keycloak users
      const { data, error } = await proxyFetch<any>("get_protocolo", { id });
      if (error || !data) {
        toast({ variant: "destructive", title: "Erro", description: error?.message || "Protocolo não encontrado" });
        navigate("/checkout");
      } else {
        // Map response to expected format
        const mapped = {
          ...data,
          viaturas: data.viaturas
        };
        setProtocolo(mapped);
        if (data.viaturas) {
          fetchItems(data.viaturas.id);
        }
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("protocolos_empenho")
      .select(`*, viaturas (id, prefixo, placa, marca, modelo, km_inicial, km_atual)`)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
      navigate("/checkout");
    } else if (!data) {
      toast({ variant: "destructive", title: "Erro", description: "Protocolo não encontrado" });
      navigate("/checkout");
    } else {
      setProtocolo(data);
      if (data.viaturas) {
        fetchItems(data.viaturas.id);
      }
    }
    setLoading(false);
  };

  const fetchItems = async (viaturaId: string) => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_viatura_itens_config", { viatura_id: viaturaId });
      if (!error && data) {
        const formattedItems = data
          .filter((item: any) => item.itens_viatura)
          .map((item: any) => ({
            id: item.itens_viatura.id,
            nome: item.itens_viatura.nome
          }));
        setItems(formattedItems);
        setHasItems(formattedItems.length > 0);
      }
      return;
    }

    const { data, error } = await supabase
      .from("viatura_itens_config")
      .select(`
        itens_viatura (id, nome)
      `)
      .eq("viatura_id", viaturaId);

    if (!error && data) {
      const formattedItems = data
        .filter(item => item.itens_viatura)
        .map(item => ({
          id: item.itens_viatura!.id,
          nome: item.itens_viatura!.nome
        }));
      setItems(formattedItems);
      setHasItems(formattedItems.length > 0);
    }
  };

  const handleStep1Change = (field: string, value: string | string[] | number | null) => {
    setStep1Data(prev => ({ ...prev, [field]: value }));
  };

  const handleStep2Change = (field: string, value: string) => {
    setStep2Data(prev => ({ ...prev, [field]: value }));
  };

  const getKmMinimo = () => {
    return protocolo?.viaturas?.km_atual || protocolo?.viaturas?.km_inicial || 0;
  };

  const validateStep1 = () => {
    if (!step1Data.agente_nome.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Nome do agente é obrigatório" });
      return false;
    }
    if (!step1Data.motivo.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Motivo é obrigatório" });
      return false;
    }
    if (!step1Data.km_atual) {
      toast({ variant: "destructive", title: "Erro", description: "Quilometragem é obrigatória" });
      return false;
    }
    const kmValue = parseInt(step1Data.km_atual);
    const kmMinimo = getKmMinimo();
    if (kmValue < kmMinimo) {
      toast({ variant: "destructive", title: "Erro", description: `Quilometragem não pode ser menor que ${kmMinimo.toLocaleString('pt-BR')} km` });
      return false;
    }
    if (!step1Data.local.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Local de devolução é obrigatório" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!step2Data.nivel_combustivel) {
      toast({ variant: "destructive", title: "Erro", description: "Nível de combustível é obrigatório" });
      return false;
    }
    if (!step2Data.nivel_oleo) {
      toast({ variant: "destructive", title: "Erro", description: "Nível de óleo é obrigatório" });
      return false;
    }
    if (!step2Data.condicoes_mecanicas) {
      toast({ variant: "destructive", title: "Erro", description: "Condições mecânicas é obrigatório" });
      return false;
    }
    if (step2Data.condicoes_mecanicas === "sem_condicoes" && !step2Data.condicoes_mecanicas_observacao.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Observação sobre condições mecânicas é obrigatória" });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (hasItems) {
      const missingStatus = step3Data.some(item => !item.situacao);
      if (missingStatus) {
        toast({ variant: "destructive", title: "Erro", description: "Todos os itens devem ser verificados" });
        return false;
      }
      
      const missingObservation = step3Data.some(
        item => (item.situacao === "incompleto" || item.situacao === "ausente") && !item.observacao.trim()
      );
      if (missingObservation) {
        toast({ variant: "destructive", title: "Erro", description: "Observações são obrigatórias para itens incompletos ou ausentes" });
        return false;
      }
    }
    return true;
  };

  const validateStep4 = () => {
    const requiredPhotos = ["frente", "lateral_esquerda", "lateral_direita", "traseira"];
    const uploadedTypes = step4Data.map(p => p.tipo);
    const missing = requiredPhotos.filter(t => !uploadedTypes.includes(t));
    
    if (missing.length > 0) {
      toast({ variant: "destructive", title: "Erro", description: "Todas as 4 fotos são obrigatórias" });
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const uploadPhoto = async (photo: PhotoData, devolucaoId: string) => {
    const fileExt = photo.file.name.split('.').pop();
    const fileName = `devolucao/${devolucaoId}/${photo.tipo}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("fotos-checklist")
      .upload(fileName, photo.file);

    if (uploadError) {
      console.error("Error uploading photo:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("fotos-checklist")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    setSaving(true);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado" });
        setSaving(false);
        return;
      }

      const kmValue = parseInt(step1Data.km_atual);
      const observacoesCompletas = `${step1Data.motivo}\n\n${observacaoGeral}`.trim();

      // For Keycloak users, use proxy
      if (isKeycloakUser()) {
        // First upload photos (storage works without RLS for authenticated uploads)
        const uploadedPhotos: { url: string; tipo: string }[] = [];
        for (const photo of step4Data) {
          const url = await uploadPhoto(photo, `temp-${Date.now()}`);
          if (url) {
            uploadedPhotos.push({ url, tipo: photo.tipo });
          }
        }

        // Create checkout via proxy
        const checklistItems = step3Data
          .filter(item => item.situacao)
          .map(item => ({
            item_viatura_id: item.item_id,
            situacao: item.situacao,
            observacoes: item.observacao || null
          }));

        const { data: result, error: proxyError } = await proxyFetch<any>("create_checkout", {
          protocolo_empenho_id: id,
          viatura_id: protocolo.viaturas.id,
          nome_agente: step1Data.agente_nome,
          observacoes: observacoesCompletas,
          local_devolucao: step1Data.local,
          latitude_devolucao: step1Data.latitude,
          longitude_devolucao: step1Data.longitude,
          km_atual: kmValue,
          nivel_oleo: step2Data.nivel_oleo,
          nivel_combustivel: parseFloat(step2Data.nivel_combustivel.replace("/", ".")) || null,
          condicoes_mecanicas: step2Data.condicoes_mecanicas,
          checklist_observacoes: step2Data.condicoes_mecanicas_observacao || null,
          checklist_items: checklistItems
        });

        if (proxyError) {
          toast({ variant: "destructive", title: "Erro", description: proxyError.message });
          setSaving(false);
          return;
        }

        // Save photos via proxy
        if (uploadedPhotos.length > 0 && result?.devolucao) {
          const photosToSave = uploadedPhotos.map(p => ({
            protocolo_devolucao_id: result.devolucao.id,
            checklist_veiculo_id: result.checklist?.id || null,
            tipo_foto: "veiculo_geral",
            url_foto: p.url,
            descricao: p.tipo
          }));

          await proxyFetch("save_checkout_photos", { photos: photosToSave });
        }

        toast({ title: "Check-Out realizado!", description: "Viatura devolvida com sucesso" });
        navigate("/");
        return;
      }

      // For Supabase users, use direct queries
      const { data: devolucao, error: devolucaoError } = await supabase
        .from("protocolos_devolucao")
        .insert({
          protocolo_empenho_id: id,
          agente_responsavel_id: userId,
          nome_agente: step1Data.agente_nome,
          observacoes: observacoesCompletas,
          local_devolucao: step1Data.local,
          latitude_devolucao: step1Data.latitude,
          longitude_devolucao: step1Data.longitude
        })
        .select()
        .single();

      if (devolucaoError) {
        toast({ variant: "destructive", title: "Erro", description: devolucaoError.message });
        setSaving(false);
        return;
      }

      // Create checklist
      const { data: checklist, error: checklistError } = await supabase
        .from("checklists_veiculo")
        .insert({
          protocolo_devolucao_id: devolucao.id,
          tipo_checklist: "devolucao",
          km_atual: kmValue,
          nivel_oleo: step2Data.nivel_oleo,
          nivel_combustivel: parseFloat(step2Data.nivel_combustivel.replace("/", ".")) || null,
          condicoes_mecanicas: step2Data.condicoes_mecanicas as "em_condicoes" | "sem_condicoes",
          observacoes: step2Data.condicoes_mecanicas_observacao || null
        })
        .select()
        .single();

      if (checklistError) {
        console.error("Checklist error:", checklistError);
      }

      // Insert checklist items
      if (checklist && step3Data.length > 0) {
        const itemsToInsert = step3Data
          .filter(item => item.situacao)
          .map(item => ({
            checklist_veiculo_id: checklist.id,
            item_viatura_id: item.item_id,
            situacao: item.situacao as any,
            observacoes: item.observacao || null
          }));

        if (itemsToInsert.length > 0) {
          await supabase.from("checklist_itens").insert(itemsToInsert);
        }
      }

      // Upload photos
      for (const photo of step4Data) {
        const url = await uploadPhoto(photo, devolucao.id);
        if (url) {
          await supabase.from("fotos_checklist").insert({
            protocolo_devolucao_id: devolucao.id,
            checklist_veiculo_id: checklist?.id || null,
            tipo_foto: "veiculo_geral",
            url_foto: url,
            descricao: photo.tipo
          });
        }
      }

      // Update protocol status
      await supabase
        .from("protocolos_empenho")
        .update({ status: "concluido" })
        .eq("id", id);

      // Update vehicle status and km_atual
      await supabase
        .from("viaturas")
        .update({ 
          status_operacional: "disponivel",
          km_atual: kmValue 
        })
        .eq("id", protocolo.viaturas.id);

      toast({ title: "Check-Out realizado!", description: "Viatura devolvida com sucesso" });
      navigate("/");
    } catch (error) {
      console.error("Error submitting checkout:", error);
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro ao processar o check-out" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12">Carregando...</div>;
  if (!protocolo) return null;

  const viatura = protocolo.viaturas;
  const kmMinimo = getKmMinimo();
  const progress = (currentStep / 5) * 100;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/checkout")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Check-Out (Devolução)</h1>
          <p className="text-muted-foreground">{viatura?.prefixo} - {protocolo.numero_protocolo}</p>
        </div>
        <span className="text-sm text-muted-foreground">Etapa {currentStep} de 5</span>
      </div>

      <Progress value={progress} className="h-2" />

      {currentStep === 1 && (
        <CheckinStep1New
          data={step1Data}
          onChange={handleStep1Change}
          vehicleInfo={`${viatura?.prefixo} - ${viatura?.marca} ${viatura?.modelo}`}
          kmMinimo={kmMinimo}
          tipo="checkout"
        />
      )}

      {currentStep === 2 && (
        <CheckinStep2New
          data={step2Data}
          onChange={handleStep2Change}
        />
      )}

      {currentStep === 3 && viatura && (
        <CheckinStep3New
          viaturaId={viatura.id}
          data={step3Data}
          onChange={setStep3Data}
        />
      )}

      {currentStep === 4 && (
        <CheckinStep4New
          data={step4Data}
          onChange={setStep4Data}
        />
      )}

      {currentStep === 5 && viatura && (
        <CheckinStep5New
          viaturaInfo={{
            prefixo: viatura.prefixo,
            placa: viatura.placa,
            marca: viatura.marca || "",
            modelo: viatura.modelo || ""
          }}
          step1Data={step1Data}
          step2Data={step2Data}
          step3Data={step3Data}
          step4Data={step4Data}
          items={items}
          observacaoGeral={observacaoGeral}
          onObservacaoChange={setObservacaoGeral}
        />
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        {currentStep < 5 ? (
          <Button type="button" onClick={nextStep}>
            Próximo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={saving}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Devolução
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
