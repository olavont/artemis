import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Search, Filter } from "lucide-react";
import { isKeycloakUser, proxyFetch } from "@/hooks/useProxyData";

export default function Protocolos() {
  const navigate = useNavigate();
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [filteredProtocolos, setFilteredProtocolos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const { toast } = useToast();

  useEffect(() => {
    fetchProtocolos();
  }, []);

  useEffect(() => {
    filterProtocolos();
  }, [searchTerm, statusFilter, protocolos]);

  const fetchProtocolos = async () => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_protocolos");
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar protocolos",
          description: error.message,
        });
      } else {
        const transformed = (data || []).map((p: any) => ({
          ...p,
          viaturas: p.viatura,
          profiles: p.agente,
        }));
        setProtocolos(transformed);
      }
      return;
    }

    const { data, error } = await supabase
      .from("protocolos_empenho")
      .select(`
        *,
        viaturas (placa, prefixo),
        profiles!protocolos_empenho_agente_responsavel_id_fkey (nome)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar protocolos",
        description: error.message,
      });
    } else {
      setProtocolos(data || []);
    }
  };

  const filterProtocolos = () => {
    let filtered = [...protocolos];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.numero_protocolo?.toLowerCase().includes(term) ||
        p.viaturas?.prefixo?.toLowerCase().includes(term) ||
        p.viaturas?.placa?.toLowerCase().includes(term) ||
        p.profiles?.nome?.toLowerCase().includes(term) ||
        p.local_empenho?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== "todos") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredProtocolos(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      em_andamento: { label: "Em Andamento", variant: "secondary" },
      concluido: { label: "Concluído", variant: "default" },
      cancelado: { label: "Cancelado", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Protocolos</h1>
        <p className="text-muted-foreground">Histórico de protocolos de empenho</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo, viatura, placa, agente ou local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {filteredProtocolos.length} protocolo(s) encontrado(s)
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredProtocolos.map((protocolo) => (
          <Card key={protocolo.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{protocolo.numero_protocolo}</CardTitle>
                {getStatusBadge(protocolo.status)}
              </div>
              <CardDescription>
                {protocolo.viaturas?.prefixo} - {protocolo.viaturas?.placa}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Agente: {protocolo.profiles?.nome || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Data: {format(new Date(protocolo.data_hora_empenho), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                  {protocolo.local_empenho && (
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      Local: {protocolo.local_empenho}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/protocolos/${protocolo.id}`)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProtocolos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm || statusFilter !== "todos" 
            ? "Nenhum protocolo encontrado com os filtros aplicados"
            : "Nenhum protocolo encontrado"
          }
        </div>
      )}
    </div>
  );
}
