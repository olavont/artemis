import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Clock, AlertTriangle, CheckCircle2, TrendingUp, Gauge } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isKeycloakUser, proxyFetch } from "@/hooks/useProxyData";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalViaturas: 0,
    disponiveis: 0,
    empenhadas: 0,
    manutencao: 0,
  });

  const [protocolosPorDia, setProtocolosPorDia] = useState<{ data: string; quantidade: number }[]>([]);
  const [tempoMedioEmpenho, setTempoMedioEmpenho] = useState<string>("0h 0min");
  const [mediaKmPercorridos, setMediaKmPercorridos] = useState<string>("0.0");
  const [periodo, setPeriodo] = useState(7);

  useEffect(() => {
    fetchStats();
    fetchProtocolosStats();
  }, [periodo]);

  const fetchStats = async () => {
    if (isKeycloakUser()) {
      const { data, error } = await proxyFetch<any>("get_dashboard_stats", { periodo });
      if (!error && data) {
        if (data.viaturas) {
          const viaturas = data.viaturas;
          setStats({
            totalViaturas: viaturas.length,
            disponiveis: viaturas.filter((v: any) => v.status_operacional === "disponivel").length,
            empenhadas: viaturas.filter((v: any) => v.status_operacional === "empenhada").length,
            manutencao: viaturas.filter(
              (v: any) =>
                v.status_operacional === "manutencao" ||
                v.status_operacional === "inoperante"
            ).length,
          });
        }
        
        // Process tempo médio from proxy
        if (data.tempoMedioMinutos !== undefined && data.tempoMedioMinutos > 0) {
          const horas = Math.floor(data.tempoMedioMinutos / 60);
          const minutos = data.tempoMedioMinutos % 60;
          setTempoMedioEmpenho(`${horas}h ${minutos}min`);
        } else {
          setTempoMedioEmpenho("0h 0min");
        }
        
        // Process média km from proxy
        if (data.mediaKm !== undefined && data.mediaKm > 0) {
          setMediaKmPercorridos(data.mediaKm.toFixed(1));
        } else {
          setMediaKmPercorridos("0.0");
        }
        
        // Process protocolos por dia from proxy
        if (data.protocolosPorDia) {
          const contagemPorDia: Record<string, number> = {};
          for (let i = 0; i < periodo; i++) {
            const dia = format(subDays(new Date(), periodo - i - 1), "dd/MM", { locale: ptBR });
            contagemPorDia[dia] = 0;
          }
          data.protocolosPorDia.forEach((p: any) => {
            const dia = format(new Date(p.data_hora_empenho), "dd/MM", { locale: ptBR });
            if (contagemPorDia[dia] !== undefined) {
              contagemPorDia[dia]++;
            }
          });
          const dadosGrafico = Object.entries(contagemPorDia).map(([data, quantidade]) => ({
            data,
            quantidade,
          }));
          setProtocolosPorDia(dadosGrafico);
        }
      }
      return;
    }

    const { data: viaturas } = await supabase
      .from("viaturas")
      .select("status_operacional");

    if (viaturas) {
      setStats({
        totalViaturas: viaturas.length,
        disponiveis: viaturas.filter((v) => v.status_operacional === "disponivel").length,
        empenhadas: viaturas.filter((v) => v.status_operacional === "empenhada").length,
        manutencao: viaturas.filter(
          (v) =>
            v.status_operacional === "manutencao" ||
            v.status_operacional === "inoperante"
        ).length,
      });
    }
  };

  const fetchProtocolosStats = async () => {
    // Skip if Keycloak user - already handled in fetchStats
    if (isKeycloakUser()) {
      return;
    }

    const dataInicio = startOfDay(subDays(new Date(), periodo));

    const { data: protocolos } = await supabase
      .from("protocolos_empenho")
      .select("data_hora_empenho")
      .gte("data_hora_empenho", dataInicio.toISOString());

    if (protocolos) {
      const contagemPorDia: Record<string, number> = {};

      for (let i = 0; i < periodo; i++) {
        const dia = format(subDays(new Date(), periodo - i - 1), "dd/MM", { locale: ptBR });
        contagemPorDia[dia] = 0;
      }

      protocolos.forEach((p) => {
        const dia = format(new Date(p.data_hora_empenho), "dd/MM", { locale: ptBR });
        if (contagemPorDia[dia] !== undefined) {
          contagemPorDia[dia]++;
        }
      });

      const dadosGrafico = Object.entries(contagemPorDia).map(([data, quantidade]) => ({
        data,
        quantidade,
      }));

      setProtocolosPorDia(dadosGrafico);
    }

    const { data: protocolosCompletos } = await supabase
      .from("protocolos_empenho")
      .select(`
        data_hora_empenho,
        protocolos_devolucao(data_hora_devolucao)
      `)
      .gte("data_hora_empenho", dataInicio.toISOString())
      .not("protocolos_devolucao", "is", null);

    if (protocolosCompletos && protocolosCompletos.length > 0) {
      let totalMinutos = 0;
      let count = 0;

      protocolosCompletos.forEach((p: any) => {
        if (p.protocolos_devolucao && p.protocolos_devolucao.length > 0) {
          const empenho = new Date(p.data_hora_empenho);
          const devolucao = new Date(p.protocolos_devolucao[0].data_hora_devolucao);
          const diffMinutos = Math.floor((devolucao.getTime() - empenho.getTime()) / (1000 * 60));

          if (diffMinutos > 0) {
            totalMinutos += diffMinutos;
            count++;
          }
        }
      });

      if (count > 0) {
        const mediaMinutos = Math.floor(totalMinutos / count);
        const horas = Math.floor(mediaMinutos / 60);
        const minutos = mediaMinutos % 60;
        setTempoMedioEmpenho(`${horas}h ${minutos}min`);
      }
    }

    const { data: checklistsEmpenho } = await supabase
      .from("checklists_veiculo")
      .select(`
        km_atual,
        protocolo_empenho_id,
        protocolos_empenho!inner(data_hora_empenho)
      `)
      .eq("tipo_checklist", "empenho")
      .gte("protocolos_empenho.data_hora_empenho", dataInicio.toISOString());

    const { data: checklistsDevolucao } = await supabase
      .from("checklists_veiculo")
      .select(`
        km_atual,
        protocolo_devolucao_id,
        protocolos_devolucao!inner(protocolo_empenho_id)
      `)
      .eq("tipo_checklist", "devolucao");

    if (checklistsEmpenho && checklistsDevolucao) {
      let totalKm = 0;
      let count = 0;

      checklistsEmpenho.forEach((empenho: any) => {
        const devolucao = checklistsDevolucao.find(
          (d: any) => d.protocolo_devolucao_id &&
            d.protocolos_devolucao?.protocolo_empenho_id === empenho.protocolo_empenho_id
        );

        if (devolucao && devolucao.km_atual > empenho.km_atual) {
          totalKm += devolucao.km_atual - empenho.km_atual;
          count++;
        }
      });

      if (count > 0) {
        const media = totalKm / count;
        setMediaKmPercorridos(media.toFixed(1));
      }
    }
  };

  const statCards = [
    {
      title: "Total de Viaturas",
      value: stats.totalViaturas,
      icon: Car,
      color: "text-foreground",
      bgColor: "bg-muted",
    },
    {
      title: "Disponíveis",
      value: stats.disponiveis,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Empenhadas",
      value: stats.empenhadas,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Manutenção",
      value: stats.manutencao,
      icon: AlertTriangle,
      color: "text-danger",
      bgColor: "bg-danger/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão de viaturas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tempo Médio de Empenho</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tempoMedioEmpenho}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos {periodo} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Média de KM Percorridos</CardTitle>
            <Gauge className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaKmPercorridos} km</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos {periodo} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Viaturas por Status</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Disponíveis</span>
              <span className="text-xs text-success font-bold">{stats.disponiveis}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Empenhadas</span>
              <span className="text-xs text-warning font-bold">{stats.empenhadas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Manutenção</span>
              <span className="text-xs text-danger font-bold">{stats.manutencao}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Protocolos por Dia</CardTitle>
              <CardDescription>Quantidade de protocolos registrados nos últimos {periodo} dias</CardDescription>
            </div>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value))}
              className="text-sm border rounded-md px-3 py-1 bg-background"
            >
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {protocolosPorDia.length > 0 ? (
            <ChartContainer
              config={{
                quantidade: {
                  label: "Protocolos",
                  color: "hsl(var(--secondary))",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={protocolosPorDia}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="data"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--foreground))" }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="quantidade"
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem dados para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
