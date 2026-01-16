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

export default function CheckinForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [viatura, setViatura] = useState<any>(null);
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
    if (id) {
      fetchViatura();
      fetchItems();
    }
  }, [id]);

  const fetchViatura = async () => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any>("get_viatura", { id });
      if (error) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
        navigate("/checkin");
      } else {
        setViatura(data);
      }
    } else {
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
    }
    setLoading(false);
  };

  const fetchItems = async () => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_viatura_itens_config", { viatura_id: id });
      if (!error && data) {
        const formattedItems = data
          .filter((item: any) => item.itens_viatura)
          .map((item: any) => ({
            id: item.itens_viatura!.id,
            nome: item.itens_viatura!.nome
          }));
        setItems(formattedItems);
        setHasItems(formattedItems.length > 0);
      }
    } else {
      const { data, error } = await supabase
        .from("viatura_itens_config")
        .select(`
          itens_viatura (id, nome)
        `)
        .eq("viatura_id", id);

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
    }
  };

  const handleStep1Change = (field: string, value: string | string[] | number | null) => {
    setStep1Data(prev => ({ ...prev, [field]: value }));
  };

  const handleStep2Change = (field: string, value: string) => {
    setStep2Data(prev => ({ ...prev, [field]: value }));
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
    const kmMinimo = viatura?.km_atual || viatura?.km_inicial || 0;
    if (kmValue < kmMinimo) {
      toast({ variant: "destructive", title: "Erro", description: `Quilometragem não pode ser menor que ${kmMinimo.toLocaleString('pt-BR')} km` });
      return false;
    }
    if (!step1Data.local.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Local de retirada é obrigatório" });
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

  const uploadPhoto = async (photo: PhotoData, protocoloId: string) => {
    const fileExt = photo.file.name.split('.').pop();
    const fileName = `${protocoloId}/${photo.tipo}.${fileExt}`;

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


      if (isKeycloakUser()) {
        // Proxy flow
        const { data: checkinData, error: checkinError } = await proxyFetch<any>("create_checkin", {
          viatura_id: id,
          nome_agente: step1Data.agente_nome,
          observacoes: `${step1Data.motivo}\n\n${observacaoGeral}`.trim(),
          local_empenho: step1Data.local,
          latitude_empenho: step1Data.latitude,
          longitude_empenho: step1Data.longitude,
          km_atual: parseInt(step1Data.km_atual) || null,
          nivel_oleo: step2Data.nivel_oleo,
          nivel_combustivel: parseFloat(step2Data.nivel_combustivel.replace("/", ".")) || null,
          condicoes_mecanicas: step2Data.condicoes_mecanicas,
          checklist_observacoes: step2Data.condicoes_mecanicas_observacao || null,
          checklist_items: step3Data
            .filter(item => item.situacao)
            .map(item => ({
              item_viatura_id: item.item_id,
              situacao: item.situacao,
              observacoes: item.observacao || null
            }))
        });

        if (checkinError || !checkinData) {
          throw checkinError || new Error("Erro ao criar checkin via proxy");
        }

        const { protocolo, checklist } = checkinData;

        // Upload photos
        const photosToInsert = [];
        for (const photo of step4Data) {
          const url = await uploadPhoto(photo, protocolo.id);
          if (url) {
            photosToInsert.push({
              protocolo_empenho_id: protocolo.id,
              checklist_veiculo_id: checklist?.id || null,
              tipo_foto: "veiculo_geral",
              url_foto: url,
              descricao: photo.tipo
            });
          }
        }

        if (photosToInsert.length > 0) {
          await proxyFetch("save_checkin_photos", { photos: photosToInsert });
        }

        toast({ title: "Check-In realizado!", description: `Protocolo: ${protocolo.numero_protocolo}` });
        navigate("/");
        return;
      }

      // Direct Supabase flow (existing code)
      // Generate protocol number
      const { data: numeroProtocolo } = await supabase.rpc("gerar_numero_protocolo");

      // Create protocol
      const { data: protocolo, error: protocoloError } = await supabase
        .from("protocolos_empenho")
        .insert({
          numero_protocolo: numeroProtocolo,
          viatura_id: id,
          agente_responsavel_id: userId,
          nome_agente: step1Data.agente_nome,
          observacoes: `${step1Data.motivo}\n\n${observacaoGeral}`.trim(),
          local_empenho: step1Data.local,
          latitude_empenho: step1Data.latitude,
          longitude_empenho: step1Data.longitude
        })
        .select()
        .single();

      if (protocoloError) {
        toast({ variant: "destructive", title: "Erro", description: protocoloError.message });
        setSaving(false);
        return;
      }

      // Create checklist
      const { data: checklist, error: checklistError } = await supabase
        .from("checklists_veiculo")
        .insert({
          protocolo_empenho_id: protocolo.id,
          tipo_checklist: "empenho",
          km_atual: parseInt(step1Data.km_atual) || null,
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
        const url = await uploadPhoto(photo, protocolo.id);
        if (url) {
          await supabase.from("fotos_checklist").insert({
            protocolo_empenho_id: protocolo.id,
            checklist_veiculo_id: checklist?.id || null,
            tipo_foto: "veiculo_geral",
            url_foto: url,
            descricao: photo.tipo
          });
        }
      }

      // Update vehicle status and km
      await supabase
        .from("viaturas")
        .update({
          status_operacional: "empenhada",
          km_atual: parseInt(step1Data.km_atual)
        })
        .eq("id", id);

      toast({ title: "Check-In realizado!", description: `Protocolo: ${numeroProtocolo}` });
      navigate("/");
    } catch (error) {
      console.error("Error submitting checkin:", error);
      toast({
        variant: "destructive",
        title: "Erro no Check-in",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao processar o check-in"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12">Carregando...</div>;
  if (!viatura) return null;

  const kmMinimo = viatura.km_atual || viatura.km_inicial || 0;
  const progress = (currentStep / 5) * 100;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/checkin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Check-In</h1>
          <p className="text-muted-foreground">{viatura.prefixo} - {viatura.placa}</p>
        </div>
        <span className="text-sm text-muted-foreground">Etapa {currentStep} de 5</span>
      </div>

      <Progress value={progress} className="h-2" />

      {currentStep === 1 && (
        <CheckinStep1New
          data={step1Data}
          onChange={handleStep1Change}
          vehicleInfo={`${viatura.prefixo} - ${viatura.marca} ${viatura.modelo}`}
          kmMinimo={kmMinimo}
        />
      )}

      {currentStep === 2 && (
        <CheckinStep2New
          data={step2Data}
          onChange={handleStep2Change}
        />
      )}

      {currentStep === 3 && (
        <CheckinStep3New
          viaturaId={id!}
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

      {currentStep === 5 && (
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
                Confirmar Check-In
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
