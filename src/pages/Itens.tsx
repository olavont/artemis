import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isKeycloakUser, proxyFetch } from "@/hooks/useProxyData";

export default function Itens() {
  const [itens, setItens] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<{
    nome: string;
    tipo: "equipamento" | "ferramenta" | "epi" | "documento" | "acessorio" | "outro";
    categoria: "seguranca" | "sinalizacao" | "mecanico" | "eletrico" | "comunicacao" | "outro";
    descricao: string;
  }>({
    nome: "",
    tipo: "equipamento",
    categoria: "seguranca",
    descricao: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchItens();
  }, []);

  const fetchItens = async () => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_itens");
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar itens",
          description: error.message,
        });
      } else {
        setItens(data || []);
      }
      return;
    }

    const { data, error } = await supabase
      .from("itens_viatura")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar itens",
        description: error.message,
      });
    } else {
      setItens(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingItem) {
      if (isKeycloakUser()) {
        const { error } = await proxyFetch("update_item", {
          id: editingItem.id,
          item: formData
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao atualizar item",
            description: error.message,
          });
        } else {
          toast({
            title: "Item atualizado!",
            description: "O item foi atualizado com sucesso.",
          });
          setDialogOpen(false);
          fetchItens();
          resetForm();
        }
      } else {
        const { error } = await supabase
          .from("itens_viatura")
          .update(formData)
          .eq("id", editingItem.id);

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao atualizar item",
            description: error.message,
          });
        } else {
          toast({
            title: "Item atualizado!",
            description: "O item foi atualizado com sucesso.",
          });
          setDialogOpen(false);
          fetchItens();
          resetForm();
        }
      }
    } else {
      if (isKeycloakUser()) {
        const { error } = await proxyFetch("create_item", {
          item: formData
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao criar item",
            description: error.message,
          });
        } else {
          toast({
            title: "Item criado!",
            description: "O item foi cadastrado com sucesso.",
          });
          setDialogOpen(false);
          fetchItens();
          resetForm();
        }
      } else {
        const { error } = await supabase
          .from("itens_viatura")
          .insert([formData]);

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao criar item",
            description: error.message,
          });
        } else {
          toast({
            title: "Item criado!",
            description: "O item foi cadastrado com sucesso.",
          });
          setDialogOpen(false);
          fetchItens();
          resetForm();
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "equipamento",
      categoria: "seguranca",
      descricao: "",
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      tipo: item.tipo,
      categoria: item.categoria,
      descricao: item.descricao || "",
    });
    setDialogOpen(true);
  };

  const getTipoBadge = (tipo: string) => {
    const tipoMap: Record<string, string> = {
      equipamento: "Equipamento",
      ferramenta: "Ferramenta",
      epi: "EPI",
      documento: "Documento",
      acessorio: "Acessório",
      outro: "Outro",
    };
    return <Badge variant="outline">{tipoMap[tipo] || tipo}</Badge>;
  };

  const getCategoriaBadge = (categoria: string) => {
    const categoriaMap: Record<string, string> = {
      seguranca: "Segurança",
      sinalizacao: "Sinalização",
      mecanico: "Mecânico",
      eletrico: "Elétrico",
      comunicacao: "Comunicação",
      outro: "Outro",
    };
    return <Badge variant="secondary">{categoriaMap[categoria] || categoria}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Itens</h1>
          <p className="text-muted-foreground">Gerencie os itens que podem ser vinculados às viaturas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Atualize as informações do item" : "Preencha as informações do novo item"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do item"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipamento">Equipamento</SelectItem>
                      <SelectItem value="ferramenta">Ferramenta</SelectItem>
                      <SelectItem value="epi">EPI</SelectItem>
                      <SelectItem value="documento">Documento</SelectItem>
                      <SelectItem value="acessorio">Acessório</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value: any) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seguranca">Segurança</SelectItem>
                      <SelectItem value="sinalizacao">Sinalização</SelectItem>
                      <SelectItem value="mecanico">Mecânico</SelectItem>
                      <SelectItem value="eletrico">Elétrico</SelectItem>
                      <SelectItem value="comunicacao">Comunicação</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do item"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  {editingItem ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, tipo ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {itens
          .filter((item) =>
            item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.nome}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  {getTipoBadge(item.tipo)}
                  {getCategoriaBadge(item.categoria)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {item.descricao || "Sem descrição"}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {itens.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum item cadastrado
        </div>
      )}
    </div>
  );
}
