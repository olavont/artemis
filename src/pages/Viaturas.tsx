import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { isKeycloakUser, proxyFetch, getCurrentUserId } from "@/hooks/useProxyData";

export default function Viaturas() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedViatura, setSelectedViatura] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGestor, setIsGestor] = useState(false);
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
    status_operacional: "disponivel" as "disponivel" | "empenhada" | "manutencao" | "inoperante" | "devolvida" | "acidentada" | "batida",
    observacoes: "",
  });

  useEffect(() => {
    fetchViaturas();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const userId = await getCurrentUserId();
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("perfil")
        .eq("id", userId)
        .single();
      
      if (data) {
        setIsGestor(data.perfil === "gestor" || data.perfil === "admin");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      ...formData,
      ano_fabricacao: formData.ano_fabricacao ? parseInt(formData.ano_fabricacao) : null,
    };

    if (isEditMode && selectedViatura) {
      const { error } = await supabase
        .from("viaturas")
        .update(dataToSave)
        .eq("id", selectedViatura.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar viatura",
          description: error.message,
        });
      } else {
        toast({
          title: "Viatura atualizada!",
          description: "A viatura foi atualizada com sucesso.",
        });
        setDialogOpen(false);
        fetchViaturas();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("viaturas")
        .insert([dataToSave]);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao criar viatura",
          description: error.message,
        });
      } else {
        toast({
          title: "Viatura criada!",
          description: "A viatura foi cadastrada com sucesso.",
        });
        setDialogOpen(false);
        fetchViaturas();
        resetForm();
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedViatura) return;

    const { error } = await supabase
      .from("viaturas")
      .delete()
      .eq("id", selectedViatura.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir viatura",
        description: error.message,
      });
    } else {
      toast({
        title: "Viatura excluída!",
        description: "A viatura foi excluída com sucesso.",
      });
      setDeleteDialogOpen(false);
      fetchViaturas();
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
      status_operacional: "disponivel",
      observacoes: "",
    });
    setIsEditMode(false);
    setSelectedViatura(null);
  };

  const openEditDialog = (viatura: any) => {
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
      status_operacional: viatura.status_operacional || "disponivel",
      observacoes: viatura.observacoes || "",
    });
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
                      onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                      placeholder="ABC1234"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prefixo">Prefixo *</Label>
                    <Input
                      id="prefixo"
                      value={formData.prefixo}
                      onChange={(e) => setFormData({ ...formData, prefixo: e.target.value })}
                      placeholder="VTR-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca</Label>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      placeholder="Ex: Toyota"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      placeholder="Ex: Hilux"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ano_fabricacao">Ano de Fabricação</Label>
                    <Input
                      id="ano_fabricacao"
                      type="number"
                      value={formData.ano_fabricacao}
                      onChange={(e) => setFormData({ ...formData, ano_fabricacao: e.target.value })}
                      placeholder="2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status_operacional">Status Operacional</Label>
                    <Select
                      value={formData.status_operacional}
                      onValueChange={(value) => setFormData({ ...formData, status_operacional: value })}
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
          <Card key={viatura.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{viatura.prefixo}</CardTitle>
                {getStatusBadge(viatura.status_operacional)}
              </div>
              <CardDescription>{viatura.placa}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {viatura.marca} {viatura.modelo} {viatura.ano_fabricacao && `(${viatura.ano_fabricacao})`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedViatura(viatura); setViewDialogOpen(true); }}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Viatura</DialogTitle>
          </DialogHeader>
          {selectedViatura && (
            <div className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">Ano</p>
                  <p className="font-medium">{selectedViatura.ano_fabricacao || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedViatura.status_operacional)}
                </div>
              </div>
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
