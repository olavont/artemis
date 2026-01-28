import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoData {
  tipo: string;
  file: File | null;
  preview: string | null;
}

interface CheckoutStep4Props {
  data: PhotoData[];
  onChange: (data: PhotoData[]) => void;
}

const photoTypes = [
  { id: "frente", label: "Foto Frontal" },
  { id: "lateral_esquerda", label: "Lateral Esquerda" },
  { id: "lateral_direita", label: "Lateral Direita" },
  { id: "traseira", label: "Foto Traseira" },
];

export function CheckoutStep4({ data, onChange }: CheckoutStep4Props) {
  const { toast } = useToast();

  const handleFileChange = (tipo: string, file: File | null) => {
    if (file && !file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
      });
      return;
    }

    const newData = [...data];
    const existingIndex = newData.findIndex((p) => p.tipo === tipo);

    if (file) {
      const preview = URL.createObjectURL(file);
      const photoData = { tipo, file, preview };

      if (existingIndex >= 0) {
        if (newData[existingIndex].preview) {
          URL.revokeObjectURL(newData[existingIndex].preview!);
        }
        newData[existingIndex] = photoData;
      } else {
        newData.push(photoData);
      }
    } else if (existingIndex >= 0) {
      if (newData[existingIndex].preview) {
        URL.revokeObjectURL(newData[existingIndex].preview!);
      }
      newData.splice(existingIndex, 1);
    }

    onChange(newData);
  };

  const getPhotoData = (tipo: string) => {
    return data.find((p) => p.tipo === tipo);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Galeria de Provas de Devolução</CardTitle>
        <CardDescription>Etapa 4 de 5 - Tire fotos da viatura na devolução</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {photoTypes.map((photoType) => {
          const photoData = getPhotoData(photoType.id);

          return (
            <div key={photoType.id} className="space-y-3">
              <Label className="text-base font-semibold">{photoType.label}</Label>

              {photoData?.preview ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-border">
                  <img
                    src={photoData.preview}
                    alt={photoType.label}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleFileChange(photoType.id, null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col items-center justify-center py-6">
                    <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Clique para adicionar foto
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleFileChange(photoType.id, file);
                      // Reset input to allow re-selecting the same file
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
