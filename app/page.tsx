import type { Metadata } from "next";
import { Brand } from "@/components/ui/brand";
import LoginForm from "@/components/login/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de Events.",
};

const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export default function Home() {
  return (
    <main className="grid min-h-screen grid-cols-1 p-3 md:grid-cols-[minmax(420px,0.92fr)_1.08fr] md:p-6">
      <section
        aria-labelledby="login-title"
        className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-[440px] flex-col justify-center px-4 py-8 md:min-h-0 md:px-6 md:py-11"
      >
        <Brand href="/" />

        <div className="mb-[30px] mt-[52px] md:mt-[62px]">
          <p className="text-[10px] font-bold tracking-[0.16em] text-primary">
            TU EVENTO TE ESPERA
          </p>
          <h1
            className="mb-2.5 mt-3 font-serif text-[clamp(36px,4vw,46px)] font-normal tracking-[-0.04em] text-text"
            id="login-title"
          >
            Qué bueno verte.
          </h1>
          <p className="text-sm leading-[1.7] text-text-muted">
            Inicia sesión para descubrir y organizar tus próximos eventos.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <p
            className="mb-4 rounded-[7px] bg-primary-soft px-3 py-[11px] text-xs leading-normal text-primary"
            role="status"
          >
            Para habilitar el acceso, configura las variables de Supabase según
            el archivo <code>.env.example</code>.
          </p>
        )}

        <LoginForm />

        <p className="mt-[26px] text-center text-xs leading-[1.7] text-text-muted">
          ¿Problemas para entrar? Contacta al equipo de Events.
        </p>
      </section>

      <aside
        aria-hidden="true"
        className="relative hidden min-h-[calc(100vh-48px)] items-center justify-center overflow-hidden rounded-[18px] bg-linear-[145deg] from-navy-950 from-3% to-navy-900 text-white md:flex"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgb(189_144_62/30%),transparent_34%)]" />
        <div className="absolute -right-[70px] -top-[180px] size-[510px] rounded-full border border-white/10" />
        <div className="absolute -bottom-[350px] -right-1 size-[700px] rounded-full border border-white/[0.07]" />

        <div className="relative z-[1] max-w-[480px] p-12">
          <span className="text-[10px] font-bold tracking-[0.16em] text-gold-200">
            ORGANIZA TU PRÓXIMO EVENTO
          </span>
          <p className="my-6 font-serif text-[clamp(38px,5vw,64px)] leading-[1.08] tracking-[-0.03em]">
            Las mejores historias empiezan cuando nos encontramos.
          </p>
          <div className="flex gap-[7px]">
            <span className="h-[3px] w-[42px] rounded-full bg-gold" />
            <span className="h-[3px] w-[22px] rounded-full bg-gold-200" />
            <span className="h-[3px] w-[22px] rounded-full bg-gold-200" />
          </div>
        </div>

        <span className="absolute bottom-[30px] right-[35px] text-[9px] font-bold tracking-[0.16em] text-gold-200">
          CONECTA · COMPARTE · VIVE
        </span>
      </aside>
    </main>
  );
}