import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section aria-labelledby="cta-title" className="page-container">
      <div className="relative isolate overflow-hidden rounded-3xl bg-[#30254d] px-6 py-12 text-center text-white sm:py-14">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 -z-10 size-72 rounded-full border-[40px] border-white/4"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 -left-20 -z-10 size-64 rounded-full border-[40px] border-white/4"
        />
        <Sparkles
          aria-hidden="true"
          className="mx-auto mb-4 size-7 text-[#ffd56b]"
        />
        <h2 id="cta-title" className="section-title">
          ¿Listo para tu próxima partida?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#d3cbe1] sm:text-base">
          Lleva tus cartones contigo y disfruta del bingo desde cualquier
          dispositivo.
        </p>
        <Link
          href="/salas"
          className="inline-flex items-center justify-center gap-2 rounded-lg mt-7 h-12 bg-[#ffd56b] px-7 font-bold text-[#30254d] hover:bg-[#ffe094]"
        >
          Comenzar <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
