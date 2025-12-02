import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Car, CheckCircle, Clock, Grid, List, Info, Filter, X } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { isKeycloakUser, proxyFetch } from "@/hooks/useProxyData";

type Viatura = Tables<"viaturas">;
type Profile = Tables<"profiles">;

export default function Checkin() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [filteredViaturas, setFilteredViaturas] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [motoristas, setMotoristas] = useState<Profile[]>([]);

  // Filtros
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const itemsPerPage = 50;

  useEffect(() => {
    fetchViaturasDisponiveis();
    fetchMotoristas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [viaturas, searchText, statusFilter, dateFrom, dateTo]);

  const fetchViaturasDisponiveis = async () => {
    setLoading(true);

    if (isKeycloakUser()) {
      const { data: viaturasData, error } = await proxyFetch<any[]>("get_viaturas_disponiveis");
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar viaturas",
          description: error.message,
        });
        setLoading(false);
        return;
      }
      setViaturas(viaturasData || []);
      setLoading(false);
      return;
    }

    const { data: viaturasData, error: viaturasError } = await supabase
      .from("viaturas")
      .select("*")
      .eq("status_operacional", "disponivel")
      .order("prefixo");

    if (viaturasError) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar viaturas",
        description: viaturasError.message,
      });
      setLoading(false);
      return;
    }

    const { data: protocolos, error: protocolosError } = await supabase
      .from("protocolos_empenho")
      .select("viatura_id")
      .eq("status", "em_andamento");

    if (!protocolosError && protocolos) {
      const viaturasEmpenhadas = new Set(protocolos.map(p => p.viatura_id));
      const viaturasDisponiveis = (viaturasData || []).filter(
        v => !viaturasEmpenhadas.has(v.id)
      );
      setViaturas(viaturasDisponiveis);
    } else {
      setViaturas(viaturasData || []);
    }

    setLoading(false);
  };

  const fetchMotoristas = async () => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any[]>("get_profiles");
      if (!error && data) {
        setMotoristas(data.filter((p: any) => p.ativo));
      }
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (!error && data) {
      setMotoristas(data);
    }
  };

  const applyFilters = () => {
    let filtered = [...viaturas];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(v =>
        v.placa?.toLowerCase().includes(search) ||
        v.prefixo?.toLowerCase().includes(search) ||
        v.marca?.toLowerCase().includes(search) ||
        v.modelo?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter(v => v.status_operacional === statusFilter);
    }

    setFilteredViaturas(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("todos");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleSelectViatura = (viatura: Viatura) => {
    navigate(`/checkin/${viatura.id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      disponivel: "bg-success text-success-foreground",
      empenhada: "bg-warning text-warning-foreground",
      manutencao: "bg-danger text-danger-foreground",
    };
    return colors[status] || "bg-muted";
  };

  const totalPages = Math.ceil(filteredViaturas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentViaturas = filteredViaturas.slice(startIndex, endIndex);

  const ViaturaDetailsDialog = ({ viatura }: { viatura: Viatura }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="w-4 h-4" />
          Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Viatura - {viatura.prefixo}</DialogTitle>
          <DialogDescription>Informações completas do veículo</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Prefixo</h3>
              <p className="text-foreground">{viatura.prefixo}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Placa</h3>
              <p className="text-foreground">{viatura.placa}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Marca</h3>
              <p className="text-foreground">{viatura.marca || "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Modelo</h3>
              <p className="text-foreground">{viatura.modelo || "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Ano</h3>
              <p className="text-foreground">{viatura.ano_fabricacao || "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Categoria</h3>
              <p className="text-foreground">{viatura.categoria || "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Chassi</h3>
              <p className="text-foreground">{viatura.chassi || "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Renavam</h3>
              <p className="text-foreground">{viatura.renavam || "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Status</h3>
              <Badge className={getStatusColor(viatura.status_operacional)}>
                {viatura.status_operacional}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Tipo</h3>
              <p className="text-foreground">{viatura.tipo || "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Espécie</h3>
              <p className="text-foreground">{viatura.especie || "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Licenciamento</h3>
              <p className="text-foreground">{viatura.situacao_licenciamento || "-"}</p>
            </div>
          </div>
          {viatura.observacoes && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Observações</h3>
              <p className="text-foreground">{viatura.observacoes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Check-In de Viaturas</h1>
          <p className="text-muted-foreground">Selecione uma viatura disponível para iniciar o empenho</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-accent" : ""}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-accent" : ""}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("table")}
            className={viewMode === "table" ? "bg-accent" : ""}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <Input
                  placeholder="Placa, prefixo, marca, modelo..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="empenhada">Empenhada</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando viaturas disponíveis...</div>
      ) : filteredViaturas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Nenhuma viatura encontrada</p>
            <p className="text-muted-foreground">Tente ajustar os filtros de busca</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentViaturas.map((viatura) => (
                <Card key={viatura.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-lg">
                          <Car className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{viatura.prefixo}</CardTitle>
                          <CardDescription>{viatura.placa}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(viatura.status_operacional)}>
                        Disponível
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Car className="w-4 h-4" />
                        <span>{viatura.marca} {viatura.modelo}</span>
                      </div>
                      {viatura.ano_fabricacao && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Ano: {viatura.ano_fabricacao}</span>
                        </div>
                      )}
                      {viatura.categoria && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="w-4 h-4" />
                          <span>{viatura.categoria}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-secondary hover:bg-secondary/90" onClick={() => handleSelectViatura(viatura)}>
                        Iniciar Check-In
                      </Button>
                      <ViaturaDetailsDialog viatura={viatura} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prefixo</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentViaturas.map((viatura) => (
                      <TableRow key={viatura.id}>
                        <TableCell className="font-medium">{viatura.prefixo}</TableCell>
                        <TableCell>{viatura.placa}</TableCell>
                        <TableCell>{viatura.marca} {viatura.modelo}</TableCell>
                        <TableCell>{viatura.ano_fabricacao || "-"}</TableCell>
                        <TableCell>{viatura.categoria || "-"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(viatura.status_operacional)}>
                            Disponível
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => handleSelectViatura(viatura)}>
                              Check-In
                            </Button>
                            <ViaturaDetailsDialog viatura={viatura} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredViaturas.length)} de {filteredViaturas.length} viaturas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
