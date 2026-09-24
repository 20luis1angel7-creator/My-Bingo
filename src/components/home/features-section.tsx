import { Camera, Grid3X3, CircleCheck, Trophy } from "lucide-react";

const features = [
  {
    title: "Tus cartones, a mano",
    description: "Recibe un cartón de 75 bolas, generado y listo para jugar.",
    icon: Grid3X3,
    color: "bg-[#eee8ff] text-[#7552c9]",
  },
  {
    title: "No pierdas un número",
    description:
      "Pulsa los números de tu cartón conforme los escuches. Puedes desmarcarlos si te equivocas.",
    icon: CircleCheck,
    color: "bg-[#e5f2eb] text-[#317655]",
  },
  {
    title: "Celebra cada bingo",
    description:
      "Completa una fila, columna o diagonal y la aplicación anunciará tu bingo.",
    icon: Trophy,
    color: "bg-[#fff2d4] text-[#9d6b13]",
  },
  {
    title: "Del papel a tu móvil",
    description:
      "En el futuro podrás utilizar la cámara para digitalizar tu cartón en segundos.",
    icon: Camera,
    color: "bg-[#e8efff] text-[#4a6fba]",
  },
];

export function FeaturesSection() {
  return (
    <section
      aria-labelledby="features-title"
      className="border-y border-border/70 bg-[#f4f2ee] py-14 sm:py-16"
    >
      <div className="page-container">
        <div className="mb-8 text-center">
          <p className="eyebrow">MENOS COMPLICACIONES, MÁS DIVERSIÓN</p>
          <h2 id="features-title" className="section-title mt-3">
            Todo lo que necesitas para jugar
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Todo lo básico para disfrutar una partida. El escaneo llegará más
            adelante.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, description, icon: Icon, color }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <div
                className={`mb-5 flex size-11 items-center justify-center rounded-xl ${color}`}
              >
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <h3 className="text-base font-bold tracking-tight">{title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
