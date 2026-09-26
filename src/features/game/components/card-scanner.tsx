import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inspectCardPhoto, scanSelectedCard } from "../scan-card";
import { project, validQuad, type Quad, type Point } from "../card-photo";

type Photo = Awaited<ReturnType<typeof inspectCardPhoto>>;
const cornerNames = [
  "superior izquierda",
  "superior derecha",
  "inferior derecha",
  "inferior izquierda",
];

export function CardScanner({
  onRead,
  onStatus,
}: {
  onRead: (card: string[]) => void;
  onStatus: (message: string) => void;
}) {
  const upload = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dragging = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [corners, setCorners] = useState<Quad | null>(null);
  const [picking, setPicking] = useState<number | null>(null);

  useEffect(() => {
    if (photo && !dialog.current?.open) dialog.current?.showModal();
    else if (!photo && dialog.current?.open) dialog.current.close();
  }, [photo]);

  function closePhoto() {
    setPhoto(null);
    setCorners(null);
    setPicking(null);
    dragging.current = null;
    onStatus("");
  }

  async function openPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) {
      onStatus("Elige una imagen de hasta 20 MB.");
      return;
    }
    setBusy(true);
    setMessage("Buscando los cartones de la foto…");
    onStatus("Buscando los cartones de la foto…");
    setPhoto(null);
    setCorners(null);
    setPicking(null);
    try {
      const next = await inspectCardPhoto(file);
      setPhoto(next);
      onStatus("");
      const w = next.canvas.width,
        h = next.canvas.height;
      setCorners(
        next.panels[0] ?? [
          { x: w * 0.15, y: h * 0.15 },
          { x: w * 0.85, y: h * 0.15 },
          { x: w * 0.85, y: h * 0.85 },
          { x: w * 0.15, y: h * 0.85 },
        ],
      );
      setMessage(
        next.panels.length
          ? "Comprueba que el contorno encierre solo las 25 casillas."
          : "Marca las cuatro esquinas de las casillas para localizar el cartón.",
      );
      if (!next.panels.length) setPicking(0);
    } catch {
      onStatus("No pude abrir la foto. Prueba con una imagen JPG, PNG o WebP.");
    } finally {
      setBusy(false);
    }
  }

  async function read() {
    if (!photo || !corners || busy || picking !== null || !validQuad(corners))
      return;
    setBusy(true);
    try {
      const card = await scanSelectedCard(photo.canvas, corners, setMessage);
      onRead(card);
      onStatus(
        `Se leyeron ${card.filter(Boolean).length} de 24 números. El centro es libre. Revisa las casillas antes de guardar.`,
      );
      setPhoto(null);
      setCorners(null);
      setPicking(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo leer el cartón. Revisa el área seleccionada e inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  function moveCorner(index: number, point: Point) {
    if (!photo) return;
    const { width, height } = photo.canvas;
    setCorners(
      (current) =>
        current?.map((p, i) =>
          i === index
            ? {
                x: Math.max(0, Math.min(width - 1, point.x)),
                y: Math.max(0, Math.min(height - 1, point.y)),
              }
            : p,
        ) as Quad,
    );
  }
  function pointerPoint(event: PointerEvent<SVGSVGElement>): Point {
    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transform = svg.getScreenCTM();
    if (!transform) return { x: 0, y: 0 };
    const local = point.matrixTransform(transform.inverse());
    return { x: local.x, y: local.y };
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-11"
        disabled={busy}
        onClick={() => upload.current?.click()}
      >
        <ImagePlus aria-hidden="true" /> Subir imagen
      </Button>
      <input
        ref={upload}
        type="file"
        accept="image/*"
        aria-label="Subir imagen del cartón"
        className="hidden"
        onChange={openPhoto}
        disabled={busy}
      />
      <dialog
        ref={dialog}
        aria-labelledby="scanner-title"
        aria-describedby="scanner-help"
        aria-busy={busy}
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-[460px] overflow-y-auto rounded-2xl border bg-background p-4 text-foreground shadow-xl backdrop:bg-black/50 sm:p-5"
        onCancel={(event) => {
          event.preventDefault();
          if (!busy) closePhoto();
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="scanner-title" className="text-lg font-bold">
            Ajustar cartón
          </h2>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            className="size-9 p-0"
            aria-label="Cerrar ajuste de imagen"
            onClick={closePhoto}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        {photo && corners && (
          <div className="mt-3 space-y-3">
            {photo.panels.length > 1 && (
              <div
                className="flex flex-wrap gap-2"
                aria-label="Cartones encontrados"
              >
                {photo.panels.map((panel, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setCorners(panel);
                      setPicking(null);
                      setMessage(
                        `Cartón ${i + 1} seleccionado. Comprueba el contorno y pulsa Leer este cartón.`,
                      );
                    }}
                  >
                    Cartón {i + 1}
                  </Button>
                ))}
              </div>
            )}
            <p id="scanner-help" className="text-xs text-muted-foreground">
              El contorno debe encerrar las 25 casillas, sin el título BINGO ni
              el borde exterior. Puedes mover las esquinas. Si hay varios
              cartones, lee uno a la vez.
            </p>
            {picking !== null && (
              <p role="status" className="text-sm font-medium">
                Toca la esquina {cornerNames[picking]} de la cuadrícula (
                {picking + 1}/4).
              </p>
            )}
            <svg
              viewBox={`0 0 ${photo.canvas.width} ${photo.canvas.height}`}
              className="mx-auto block h-auto max-w-full touch-none rounded-lg border"
              style={{
                width: `min(100%, ${(photo.canvas.width / photo.canvas.height) * 42}dvh)`,
              }}
              aria-label="Área del cartón en la foto"
              onPointerDown={(event) => {
                if (busy || picking === null) return;
                moveCorner(picking, pointerPoint(event));
                setPicking(picking === 3 ? null : picking + 1);
              }}
              onPointerMove={(event) => {
                if (!busy && dragging.current !== null)
                  moveCorner(dragging.current, pointerPoint(event));
              }}
              onPointerUp={() => {
                dragging.current = null;
              }}
              onPointerCancel={() => {
                dragging.current = null;
              }}
            >
              <image
                href={photo.preview}
                width={photo.canvas.width}
                height={photo.canvas.height}
              />
              <polygon
                points={corners.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="rgb(16 185 129 / .12)"
                stroke="#10b981"
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
              />
              {validQuad(corners) &&
                [1, 2, 3, 4].flatMap((i) => {
                  const a = project(corners, i / 5, 0),
                    b = project(corners, i / 5, 1);
                  const c = project(corners, 0, i / 5),
                    d = project(corners, 1, i / 5);
                  return [
                    <line
                      key={`v${i}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#10b981"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />,
                    <line
                      key={`h${i}`}
                      x1={c.x}
                      y1={c.y}
                      x2={d.x}
                      y2={d.y}
                      stroke="#10b981"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />,
                  ];
                })}
              {corners.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={photo.canvas.width * 0.022}
                  fill="#10b981"
                  stroke="white"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  role="button"
                  tabIndex={busy ? -1 : 0}
                  aria-label={`Mover esquina ${cornerNames[i]} con las flechas`}
                  aria-disabled={busy}
                  onPointerDown={(event) => {
                    if (busy || picking !== null) return;
                    event.stopPropagation();
                    dragging.current = i;
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onKeyDown={(event) => {
                    if (
                      busy ||
                      ![
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                      ].includes(event.key)
                    )
                      return;
                    event.preventDefault();
                    const step =
                      photo.canvas.width * (event.shiftKey ? 0.02 : 0.002);
                    moveCorner(i, {
                      x:
                        p.x +
                        (event.key === "ArrowRight"
                          ? step
                          : event.key === "ArrowLeft"
                            ? -step
                            : 0),
                      y:
                        p.y +
                        (event.key === "ArrowDown"
                          ? step
                          : event.key === "ArrowUp"
                            ? -step
                            : 0),
                    });
                  }}
                />
              ))}
            </svg>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy || picking !== null || !validQuad(corners)}
                onClick={read}
              >
                Leer este cartón
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setPicking(0)}
              >
                Marcar cuatro esquinas
              </Button>
              <Button variant="ghost" disabled={busy} onClick={closePhoto}>
                Cerrar foto
              </Button>
            </div>
          </div>
        )}
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {message}
        </p>
      </dialog>
    </>
  );
}
