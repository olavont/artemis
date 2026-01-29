import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { isKeycloakUser, proxyFetch, getCurrentUserId } from "@/hooks/useProxyData";

interface ItemViatura {
  id: string;
  nome: string;
  categoria: string;
  tipo: string;
}

interface SelectedItem {
  item_viatura_id: string;
  quantidade: number;
  nome: string;
}

export default function Viaturas() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedViatura, setSelectedViatura] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGestor, setIsGestor] = useState(false);
  const [availableItems, setAvailableItems] = useState<ItemViatura[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [viewViaturaItems, setViewViaturaItems] = useState<SelectedItem[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    placa: "",
    prefixo: "",
    chassi: "",
    renavam: "",
    marca: "",
    modelo: "",
    ano_fabricacao: "",
    especie: "",
    categoria: "",
    tipo: "",
    km_inicial: "",
    status_operacional: "disponivel" as "disponivel" | "empenhada" | "manutencao" | "inoperante" | "devolvida" | "acidentada" | "batida",
    observacoes: "",
  });

  useEffect(() => {
    fetchViaturas();
    fetchAvailableItems();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const userId = await getCurrentUserId();
    if (userId) {
      if (isKeycloakUser()) {
        // Use proxy for Keycloak users
        const { data, error } = await proxyFetch<any>("get_my_profile");
        if (!error && data) {
          setIsGestor(data.perfil === "gestor" || data.perfil === "admin");
        }
      } else {
        const { data } = await supabase
          .from("profiles")
          .select("perfil")
          .eq("id", userId)
          .single();

        if (data) {
          setIsGestor(data.perfil === "gestor" || data.perfil === "admin");
        }
      }
    }
  };

  const fetchViaturas = async () => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_viaturas");
      if (!error && data) {
        setViaturas(data);
      }
      return;
    }

    const { data, error } = await supabase
      .from("viaturas")
      .select("*")
      .order("prefixo", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar viaturas",
        description: error.message,
      });
    } else {
      setViaturas(data || []);
    }
  };

  const fetchAvailableItems = async () => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<ItemViatura[]>("get_itens");
      if (!error && data) {
        setAvailableItems(data);
      }
      return;
    }

    const { data, error } = await supabase
      .from("itens_viatura")
      .select("id, nome, categoria, tipo")
      .order("nome", { ascending: true });

    if (!error && data) {
      setAvailableItems(data);
    }
  };

  const fetchViaturaItems = async (viaturaId: string) => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_viatura_itens_config", { viatura_id: viaturaId });
      if (!error && data) {
        setSelectedItems(
          data.map((item: any) => ({
            item_viatura_id: item.item_viatura_id,
            quantidade: item.quantidade_padrao || 1,
            nome: item.itens_viatura?.nome || "",
          }))
        );
      }
      return;
    }

    const { data, error } = await supabase
      .from("viatura_itens_config")
      .select("item_viatura_id, quantidade_padrao, itens_viatura(nome)")
      .eq("viatura_id", viaturaId);

    if (!error && data) {
      setSelectedItems(
        data.map((item: any) => ({
          item_viatura_id: item.item_viatura_id,
          quantidade: item.quantidade_padrao || 1,
          nome: item.itens_viatura?.nome || "",
        }))
      );
    }
  };

  const addItemToViatura = (itemId: string) => {
    const item = availableItems.find((i) => i.id === itemId);
    if (item && !selectedItems.find((s) => s.item_viatura_id === itemId)) {
      setSelectedItems([
        ...selectedItems,
        { item_viatura_id: itemId, quantidade: 1, nome: item.nome },
      ]);
    }
  };

  const removeItemFromViatura = (itemId: string) => {
    setSelectedItems(selectedItems.filter((s) => s.item_viatura_id !== itemId));
  };

  const updateItemQuantity = (itemId: string, quantidade: number) => {
    setSelectedItems(
      selectedItems.map((s) =>
        s.item_viatura_id === itemId ? { ...s, quantidade } : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      placa: formData.placa,
      prefixo: formData.prefixo,
      chassi: formData.chassi || null,
      renavam: formData.renavam || null,
      marca: formData.marca || null,
      modelo: formData.modelo || null,
      especie: formData.especie || null,
      categoria: formData.categoria || null,
      tipo: formData.tipo || null,
      observacoes: formData.observacoes || null,
      ano_fabricacao: formData.ano_fabricacao ? parseInt(formData.ano_fabricacao) : null,
      km_inicial: formData.km_inicial ? parseInt(formData.km_inicial) : 0,
      status_operacional: formData.status_operacional,
    };

    if (isEditMode && selectedViatura) {
      // Update viatura
      if (isKeycloakUser()) {
        const { error } = await proxyFetch("update_viatura", { id: selectedViatura.id, viatura: dataToSave });
        if (error) {
          toast({ variant: "destructive", title: "Erro ao atualizar viatura", description: error.message });
        } else {
          await saveViaturaItems(selectedViatura.id);
          toast({ title: "Viatura atualizada!", description: "A viatura foi atualizada com sucesso." });
          setDialogOpen(false);
          fetchViaturas();
          resetForm();
        }
      } else {
        const { error } = await supabase.from("viaturas").update(dataToSave).eq("id", selectedViatura.id);
        if (error) {
          toast({ variant: "destructive", title: "Erro ao atualizar viatura", description: error.message });
        } else {
          await saveViaturaItems(selectedViatura.id);
          toast({ title: "Viatura atualizada!", description: "A viatura foi atualizada com sucesso." });
          setDialogOpen(false);
          fetchViaturas();
          resetForm();
        }
      }
    } else {
      // Create viatura
      if (isKeycloakUser()) {
        const { data, error } = await proxyFetch<any>("create_viatura", { viatura: dataToSave });
        if (error) {
          toast({ variant: "destructive", title: "Erro ao criar viatura", description: error.message });
        } else {
          if (data?.id) await saveViaturaItems(data.id);
          toast({ title: "Viatura criada!", description: "A viatura foi cadastrada com sucesso." });
          setDialogOpen(false);
          fetchViaturas();
          resetForm();
        }
      } else {
        const { data, error } = await supabase.from("viaturas").insert([dataToSave]).select().single();
        if (error) {
          toast({ variant: "destructive", title: "Erro ao criar viatura", description: error.message });
        } else {
          if (data?.id) await saveViaturaItems(data.id);
          toast({ title: "Viatura criada!", description: "A viatura foi cadastrada com sucesso." });
          setDialogOpen(false);
          fetchViaturas();
          resetForm();
        }
      }
    }
  };

  const saveViaturaItems = async (viaturaId: string) => {
    if (selectedItems.length > 0) {
      const itemsToInsert = selectedItems.map((item) => ({
        viatura_id: viaturaId,
        item_viatura_id: item.item_viatura_id,
        quantidade_padrao: Math.max(1, item.quantidade || 1),
        obrigatoriedade: "recomendado" as const,
      }));

      if (isKeycloakUser()) {
        await proxyFetch("save_viatura_items", {
          viatura_id: viaturaId,
          items: itemsToInsert
        });
      } else {
        await supabase.from("viatura_itens_config").delete().eq("viatura_id", viaturaId);
        await supabase.from("viatura_itens_config").insert(itemsToInsert);
      }
    } else {
      if (isKeycloakUser()) {
        await proxyFetch("save_viatura_items", { viatura_id: viaturaId, items: [] });
      } else {
        await supabase.from("viatura_itens_config").delete().eq("viatura_id", viaturaId);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedViatura) return;

    if (isKeycloakUser()) {
      const { error } = await proxyFetch("delete_viatura", { id: selectedViatura.id });
      if (error) {
        toast({ variant: "destructive", title: "Erro ao excluir viatura", description: error.message });
      } else {
        toast({ title: "Viatura excluída!", description: "A viatura foi excluída com sucesso." });
        setDeleteDialogOpen(false);
        fetchViaturas();
      }
    } else {
      const { error } = await supabase.from("viaturas").delete().eq("id", selectedViatura.id);
      if (error) {
        toast({ variant: "destructive", title: "Erro ao excluir viatura", description: error.message });
      } else {
        toast({ title: "Viatura excluída!", description: "A viatura foi excluída com sucesso." });
        setDeleteDialogOpen(false);
        fetchViaturas();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      placa: "",
      prefixo: "",
      chassi: "",
      renavam: "",
      marca: "",
      modelo: "",
      ano_fabricacao: "",
      especie: "",
      categoria: "",
      tipo: "",
      km_inicial: "",
      status_operacional: "disponivel",
      observacoes: "",
    });
    setSelectedItems([]);
    setIsEditMode(false);
    setSelectedViatura(null);
  };

  const openEditDialog = async (viatura: any) => {
    setSelectedViatura(viatura);
    setFormData({
      placa: viatura.placa || "",
      prefixo: viatura.prefixo || "",
      chassi: viatura.chassi || "",
      renavam: viatura.renavam || "",
      marca: viatura.marca || "",
      modelo: viatura.modelo || "",
      ano_fabricacao: viatura.ano_fabricacao?.toString() || "",
      especie: viatura.especie || "",
      categoria: viatura.categoria || "",
      tipo: viatura.tipo || "",
      km_inicial: viatura.km_inicial?.toString() || "",
      status_operacional: viatura.status_operacional || "disponivel",
      observacoes: viatura.observacoes || "",
    });
    await fetchViaturaItems(viatura.id);
    setIsEditMode(true);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      disponivel: { label: "Disponível", variant: "default" },
      empenhada: { label: "Empenhada", variant: "secondary" },
      manutencao: { label: "Manutenção", variant: "destructive" },
      inoperante: { label: "Inoperante", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const filteredViaturas = viaturas.filter(
    (v) =>
      v.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.prefixo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Viaturas</h1>
          <p className="text-muted-foreground">Gerencie as viaturas do sistema</p>
        </div>
        {isGestor && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Nova Viatura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Editar Viatura" : "Nova Viatura"}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? "Atualize as informações da viatura" : "Preencha as informações da nova viatura"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placa">Placa *</Label>
                    <Input
                      id="placa"
                      value={formData.placa}
                      onChange={(e) => {
                        // Only allow letters and numbers, max 7 characters
                        const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
                        setFormData({ ...formData, placa: value });
                      }}
                      placeholder="ABC1234"
                      maxLength={7}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prefixo">Prefixo *</Label>
                    <Input
                      id="prefixo"
                      value={formData.prefixo}
                      onChange={(e) => setFormData({ ...formData, prefixo: e.target.value.slice(0, 40) })}
                      placeholder="VTR-001"
                      maxLength={40}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca *</Label>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value.slice(0, 40) })}
                      placeholder="Ex: Toyota"
                      maxLength={40}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo *</Label>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value.slice(0, 40) })}
                      placeholder="Ex: Hilux"
                      maxLength={40}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ano_fabricacao">Ano de Fabricação</Label>
                    <Input
                      id="ano_fabricacao"
                      type="number"
                      value={formData.ano_fabricacao}
                      onChange={(e) => setFormData({ ...formData, ano_fabricacao: e.target.value.slice(0, 4) })}
                      placeholder="2024"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="km_inicial">Quilometragem Inicial *</Label>
                    <Input
                      id="km_inicial"
                      type="number"
                      value={formData.km_inicial}
                      onChange={(e) => setFormData({ ...formData, km_inicial: e.target.value.slice(0, 7) })}
                      placeholder="0"
                      maxLength={7}
                      required
                      disabled={isEditMode}
                    />
                    {isEditMode && (
                      <p className="text-xs text-muted-foreground">KM inicial não pode ser alterado após cadastro</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status_operacional">Status Operacional</Label>
                    <Select
                      value={formData.status_operacional}
                      onValueChange={(value: string) => setFormData({ ...formData, status_operacional: value as typeof formData.status_operacional })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="empenhada">Empenhada</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="inoperante">Inoperante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Itens da Viatura */}
                <div className="space-y-3 border-t pt-4">
                  <Label>Itens da Viatura</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={addItemToViatura}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecionar item para adicionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems
                          .filter((item) => !selectedItems.find((s) => s.item_viatura_id === item.id))
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedItems.map((item) => (
                        <div key={item.item_viatura_id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <span className="flex-1 text-sm">{item.nome}</span>
                          <Input
                            type="number"
                            min="1"
                            maxLength={3}
                            value={item.quantidade || ""}
                            onChange={(e) => {
                              const value = e.target.value.slice(0, 3);
                              updateItemQuantity(item.item_viatura_id, value === "" ? 0 : parseInt(value));
                            }}
                            className="w-20 h-8"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromViatura(item.item_viatura_id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                    {isEditMode ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa, prefixo, marca ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredViaturas.map((viatura) => (
          <Card key={viatura.id} className="hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg break-all flex-1 min-w-0">{viatura.prefixo}</CardTitle>
                <div className="shrink-0">
                  {getStatusBadge(viatura.status_operacional)}
                </div>
              </div>
              <CardDescription>{viatura.placa}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 break-all">
                {viatura.marca} {viatura.modelo} {viatura.ano_fabricacao && `(${viatura.ano_fabricacao})`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setSelectedViatura(viatura);
                    const { data } = await supabase
                      .from("viatura_itens_config")
                      .select("item_viatura_id, quantidade_padrao, itens_viatura(nome)")
                      .eq("viatura_id", viatura.id);
                    if (data) {
                      setViewViaturaItems(data.map((item: any) => ({
                        item_viatura_id: item.item_viatura_id,
                        quantidade: item.quantidade_padrao || 1,
                        nome: item.itens_viatura?.nome || "",
                      })));
                    }
                    setViewDialogOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
                {isGestor && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(viatura)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { setSelectedViatura(viatura); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredViaturas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma viatura encontrada
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Viatura</DialogTitle>
          </DialogHeader>
          {selectedViatura && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Prefixo</p>
                  <p className="font-medium">{selectedViatura.prefixo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Placa</p>
                  <p className="font-medium">{selectedViatura.placa}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marca</p>
                  <p className="font-medium">{selectedViatura.marca || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{selectedViatura.modelo || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ano de Fabricação</p>
                  <p className="font-medium">{selectedViatura.ano_fabricacao || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">KM Inicial (Cadastro)</p>
                  <p className="font-medium">{selectedViatura.km_inicial?.toLocaleString('pt-BR') || "0"} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">KM Atual</p>
                  <p className="font-medium">{selectedViatura.km_atual?.toLocaleString('pt-BR') || selectedViatura.km_inicial?.toLocaleString('pt-BR') || "0"} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status Operacional</p>
                  {getStatusBadge(selectedViatura.status_operacional)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Situação Licenciamento</p>
                  <p className="font-medium">{selectedViatura.situacao_licenciamento || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chassi</p>
                  <p className="font-medium">{selectedViatura.chassi || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renavam</p>
                  <p className="font-medium">{selectedViatura.renavam || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Espécie</p>
                  <p className="font-medium">{selectedViatura.especie || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium">{selectedViatura.categoria || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selectedViatura.tipo || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">{new Date(selectedViatura.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              {selectedViatura.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{selectedViatura.observacoes}</p>
                </div>
              )}
              {viewViaturaItems.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Itens Cadastrados</p>
                  <div className="space-y-2">
                    {viewViaturaItems.map((item) => (
                      <div key={item.item_viatura_id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                        <span className="text-sm">{item.nome}</span>
                        <span className="text-sm font-medium">Qtd: {item.quantidade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a viatura {selectedViatura?.prefixo}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
