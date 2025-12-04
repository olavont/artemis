import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, X, Image as ImageIcon } from "lucide-react";
import { useRef } from "react";

interface PhotoData {
  tipo: string;
  file: File;
  preview: string;
}

interface CheckinStep4NewProps {
  data: PhotoData[];
  onChange: (data: PhotoData[]) => void;
}

const photoTypes = [
  { tipo: "frente", label: "Frente do Veículo", required: true },
  { tipo: "lateral_esquerda", label: "Lateral Esquerda", required: true },
  { tipo: "lateral_direita", label: "Lateral Direita", required: true },
  { tipo: "traseira", label: "Traseira do Veículo", required: true },
];

export function CheckinStep4New({ data, onChange }: CheckinStep4NewProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileChange = (tipo: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    // Remove existing photo of same type
    const filteredData = data.filter(p => p.tipo !== tipo);

    // Create preview URL
    const preview = URL.createObjectURL(file);

    // Add new photo
    onChange([...filteredData, { tipo, file, preview }]);
  };

  const removePhoto = (tipo: string) => {
    const photo = data.find(p => p.tipo === tipo);
    if (photo) {
      URL.revokeObjectURL(photo.preview);
    }
    onChange(data.filter(p => p.tipo !== tipo));
  };

  const getPhotoByType = (tipo: string) => {
    return data.find(p => p.tipo === tipo);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessão 4: Galeria de Provas</CardTitle>
        <CardDescription>Etapa 4 de 5 - Fotografe o veículo de todos os ângulos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {photoTypes.map(({ tipo, label, required }) => {
            const photo = getPhotoByType(tipo);

            return (
              <div key={tipo} className="space-y-2">
                <Label className="text-base font-semibold">
                  {label} {required && "*"}
                </Label>
                
                {photo ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border">
                    <img
                      src={photo.preview}
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removePhoto(tipo)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
                    onClick={() => fileInputRefs.current[tipo]?.click()}
                  >
                    <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Clique para adicionar</p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={el => fileInputRefs.current[tipo] = el}
                  onChange={(e) => handleFileChange(tipo, e)}
                  className="hidden"
                />
              </div>
            );
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Dicas para fotos:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Certifique-se de que a foto esteja nítida e bem iluminada</li>
                <li>Capture todo o veículo no enquadramento</li>
                <li>Inclua detalhes de avarias ou danos, se houver</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
