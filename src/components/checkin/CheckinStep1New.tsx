import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, MapPin } from "lucide-react";
import VehicleLocationMap from "@/components/VehicleLocationMap";
import { useState, useEffect } from "react";
import { Geolocation } from "@capacitor/geolocation";

interface CheckinStep1NewProps {
  data: {
    agente_nome: string;
    agentes_acompanhantes: string[];
    motivo: string;
    km_atual: string;
    latitude: number | null;
    longitude: number | null;
    local: string;
  };
  onChange: (field: string, value: string | string[] | number | null) => void;
  vehicleInfo?: string;
  kmMinimo: number;
  tipo?: "checkin" | "checkout";
}

export function CheckinStep1New({ data, onChange, vehicleInfo, kmMinimo, tipo = "checkin" }: CheckinStep1NewProps) {
  const localLabel = tipo === "checkout" ? "Local de Devolução" : "Local de Retirada";
  const localPlaceholder = tipo === "checkout" ? "Endereço do local de devolução" : "Endereço do local de retirada";
  const motivoPlaceholder = tipo === "checkout" ? "Descreva o motivo/observações da devolução..." : "Descreva o motivo do empenho da viatura...";
  const [kmError, setKmError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    // Auto-get location on mount if not already set
    if (!data.latitude && !data.longitude) {
      getLocation();
    }
  }, []);

  const getLocation = async () => {
    setGettingLocation(true);
    try {
      // Check permissions first
      const permissionStatus = await Geolocation.checkPermissions();

      if (permissionStatus.location === 'denied' || permissionStatus.location === 'prompt') {
        const permission = await Geolocation.requestPermissions();
        if (permission.location === 'denied') {
          throw new Error('Permissão de localização negada');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      onChange("latitude", lat);
      onChange("longitude", lng);

      // Try to get address from coordinates
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();
        if (data.display_name) {
          onChange("local", data.display_name);
        }
      } catch (error) {
        console.error("Error getting address:", error);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      // Fallback to browser geolocation if capacitor fails (e.g. web testing)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            onChange("latitude", lat);
            onChange("longitude", lng);
          },
          (err) => {
            console.error("Browser geolocation also failed:", err);
          }
        );
      }
    } finally {
      setGettingLocation(false);
    }
  };

  const handleKmBlur = () => {
    const kmValue = parseInt(data.km_atual) || 0;
    if (!data.km_atual) {
      setKmError("Quilometragem é obrigatória");
    } else if (kmValue < 0) {
      setKmError("Quilometragem não pode ser negativa");
    } else if (kmValue < kmMinimo) {
      setKmError(`Quilometragem não pode ser menor que ${kmMinimo.toLocaleString('pt-BR')} km`);
    } else {
      setKmError("");
    }
  };

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange("km_atual", e.target.value);
    if (kmError) setKmError("");
  };

  const addAgente = () => {
    if (data.agentes_acompanhantes.length < 4) {
      onChange("agentes_acompanhantes", [...data.agentes_acompanhantes, ""]);
    }
  };

  const removeAgente = (index: number) => {
    const newAgentes = data.agentes_acompanhantes.filter((_, i) => i !== index);
    onChange("agentes_acompanhantes", newAgentes);
  };

  const updateAgente = (index: number, value: string) => {
    const newAgentes = [...data.agentes_acompanhantes];
    newAgentes[index] = value;
    onChange("agentes_acompanhantes", newAgentes);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessão 1: Dados Gerais</CardTitle>
        <CardDescription>Etapa 1 de 5 - Informações do agente e localização</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nome do Agente */}
        <div className="space-y-2">
          <Label htmlFor="agente_nome" className="text-base font-semibold">
            Nome do Agente *
          </Label>
          <Input
            id="agente_nome"
            placeholder="Nome completo do agente responsável"
            value={data.agente_nome}
            onChange={(e) => onChange("agente_nome", e.target.value)}
            required
          />
        </div>

        {/* Agentes Acompanhantes (Copiloto) */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Agente Copiloto (máximo 4)
          </Label>
          {data.agentes_acompanhantes.map((agente, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Copiloto ${index + 1}`}
                value={agente}
                onChange={(e) => updateAgente(index, e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeAgente(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {data.agentes_acompanhantes.length < 4 && (
            <Button
              type="button"
              variant="outline"
              onClick={addAgente}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Copiloto
            </Button>
          )}
        </div>

        {/* Motivo */}
        <div className="space-y-2">
          <Label htmlFor="motivo" className="text-base font-semibold">
            Motivo *
          </Label>
          <Textarea
            id="motivo"
            placeholder={motivoPlaceholder}
            value={data.motivo}
            onChange={(e) => onChange("motivo", e.target.value)}
            rows={3}
            required
          />
        </div>

        {/* Quilometragem Atual */}
        <div className="space-y-2">
          <Label htmlFor="km_atual" className="text-base font-semibold">
            KM Atual *
          </Label>
          <Input
            id="km_atual"
            type="number"
            placeholder={`Mínimo: ${kmMinimo.toLocaleString('pt-BR')} km`}
            value={data.km_atual}
            onChange={handleKmChange}
            onBlur={handleKmBlur}
            className={kmError ? "border-destructive" : ""}
            min={kmMinimo}
            required
          />
          {kmError && <p className="text-sm text-destructive">{kmError}</p>}
          <p className="text-sm text-muted-foreground">
            KM atual registrado: {kmMinimo.toLocaleString('pt-BR')} km
          </p>
        </div>

        {/* Local com GPS */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            {localLabel} *
          </Label>

          <div className="flex gap-2">
            <Input
              placeholder={localPlaceholder}
              value={data.local}
              onChange={(e) => onChange("local", e.target.value)}
              className="flex-1"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={getLocation}
              disabled={gettingLocation}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {gettingLocation ? "Obtendo..." : "GPS"}
            </Button>
          </div>

          {data.latitude && data.longitude && (
            <div className="rounded-lg overflow-hidden border">
              <VehicleLocationMap
                vehicleInfo={vehicleInfo || ""}
                latitude={data.latitude}
                longitude={data.longitude}
              />
            </div>
          )}

          {data.latitude && data.longitude && (
            <p className="text-xs text-muted-foreground">
              Coordenadas: {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
