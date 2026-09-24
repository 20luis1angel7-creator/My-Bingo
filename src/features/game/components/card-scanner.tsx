import { useRef, useState, type ChangeEvent } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scanCard } from "../scan-card";

export function CardScanner({ onRead }: { onRead: (card: string[]) => void }) {
  const upload = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function read(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) {
      setMessage("Elige una imagen de hasta 20 MB.");
      return;
    }
    setBusy(true);
    setMessage(
      "Leyendo cartón… La primera lectura puede tardar mientras se descarga el lector.",
    );
    try {
      const card = await scanCard(file, setMessage);
      onRead(card);
      setMessage(
        `Se detectaron ${card.filter(Boolean).length} de 24 números. Revisa cada casilla y completa las vacías antes de guardar.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo leer la imagen. Revisa tu conexión y prueba con una foto nítida en JPG o PNG.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mb-4" aria-busy={busy}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-11"
          disabled={busy}
          onClick={() => upload.current?.click()}
        >
          <ImagePlus aria-hidden="true" /> Subir imagen
        </Button>
        <Button
          variant="outline"
          className="h-11"
          disabled={busy}
          onClick={() => camera.current?.click()}
        >
          <Camera aria-hidden="true" /> Tomar foto
        </Button>
      </div>
      <input
        ref={upload}
        type="file"
        accept="image/*"
        aria-label="Subir imagen del cartón"
        className="hidden"
        onChange={read}
        disabled={busy}
      />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Fotografiar cartón"
        className="hidden"
        onChange={read}
        disabled={busy}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Fotografía un solo cartón completo, de frente y con buena luz. En
        móviles compatibles, «Tomar foto» abre la cámara.
      </p>
      <p role="status" className="mt-2 text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
