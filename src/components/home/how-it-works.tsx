const steps = [
  {
    number: "01",
    title: "Comienza tu partida",
    description: "Pulsa Comenzar, elige una sala y juega con sus cartones.",
  },
  {
    number: "02",
    title: "Marca los números",
    description:
      "Pulsa en tu cartón los números que vayan saliendo en tu partida.",
  },
  {
    number: "03",
    title: "¡Haz bingo!",
    description:
      "Completa tu combinación y prepárate para celebrar ese momento.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="steps-title"
      className="page-container py-16 sm:py-20"
    >
      <div className="text-center">
        <p className="eyebrow">TRES PASOS. TODA LA EMOCIÓN.</p>
        <h2 id="steps-title" className="section-title mt-3">
          Jugar es muy sencillo
        </h2>
      </div>
      <ol className="relative mt-10 grid gap-9 md:grid-cols-3 md:gap-12">
        {steps.map((step) => (
          <li key={step.number} className="relative text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-xl font-extrabold text-primary">
              {step.number}
            </span>
            <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
            <p className="mx-auto mt-2 max-w-[270px] text-sm leading-6 text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
