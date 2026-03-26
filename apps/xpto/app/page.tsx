import {
  Diamond,
  MousePointer2,
  MoveRight,
  Square,
  Type,
} from "lucide-react";
import {
  FaBehance,
  FaInstagram,
  FaLinkedinIn,
  FaSpotify,
  FaYoutube,
} from "react-icons/fa6";
import { SiCalendly } from "react-icons/si";

import ClaimForm from "@/components/ClaimForm";
import LandingNavAuthButton from "@/components/LandingNavAuthButton";
import { auth } from "@/auth";
import { BRAND } from "@/config/brand";

const featureCards = [
  {
    title: "Tudo no mesmo lugar, do seu jeito",
    description:
      "Links, imagens, música e textos organizados em um layout que não parece genérico.",
  },
  {
    title: "Arraste, solte e publique",
    description:
      "Monte seu perfil visual em minutos, sem complicação.",
  },
  {
    title: "Seu estilo, visivel na hora",
    description:
      "Cada perfil é único, sem cara de página igual.",
  },
] as const;

const metrics = [
  { value: "+14k", label: "visualizações" },
  { value: "200+", label: "criadores" },
  { value: "<1 min", label: "para publicar" },
] as const;

const socialPlatforms = [
  { label: "instagram", icon: FaInstagram },
  { label: "behance", icon: FaBehance },
  { label: "linkedin", icon: FaLinkedinIn },
  { label: "youtube", icon: FaYoutube },
  { label: "spotify", icon: FaSpotify },
  { label: "calendly", icon: SiCalendly },
] as const;

export default async function Page() {
  let session:
    | {
        user?: {
          name?: string | null;
          image?: string | null;
        } | null;
      }
    | null = null;

  try {
    session = await auth();
  } catch {
    session = null;
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f7f5f1] text-text before:pointer-events-none before:fixed before:inset-0 before:-z-10 before:bg-page-noise before:content-['']">
      <nav className="sticky top-0 z-20 mx-auto mt-[18px] flex w-[min(1180px,calc(100%-32px))] items-center justify-between gap-6 rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,251,245,0.72)] px-[18px] py-[14px] shadow-shell backdrop-blur-[18px] max-[720px]:w-[calc(100%-20px)] max-[720px]:rounded-[24px] max-[720px]:px-[14px] max-[720px]:py-3">
        <a
          href="#"
          aria-label={`${BRAND.slug} home`}
          className="inline-flex items-center gap-3 text-[1.05rem] font-bold text-[#293126]"
        >
          <span className="h-[18px] w-[18px] rounded-[6px] bg-mark-accent shadow-[0_10px_24px_rgba(90,112,87,0.28)]" />
          <span className="font-display">{BRAND.slug}</span>
        </a>

        <div className="inline-flex items-center gap-6 text-[#55604f] max-[720px]:hidden">
          <a className="font-medium transition-colors duration-200 hover:text-[#1f271d]" href="#benefits">
            Produto
          </a>
          <a className="font-medium transition-colors duration-200 hover:text-[#1f271d]" href="#builder">
            Editor
          </a>
          <a className="font-medium transition-colors duration-200 hover:text-[#1f271d]" href="#cta">
            Criar página
          </a>
        </div>

        <LandingNavAuthButton user={session?.user} />
      </nav>

      <main>
        <section className="relative mx-auto grid w-[min(1180px,calc(100%-32px))] grid-cols-[minmax(0,540px)_minmax(0,1fr)] items-center gap-16 px-0 pb-16 pt-[5.5rem] max-[1080px]:grid-cols-1 max-[720px]:w-[calc(100%-20px)] max-[720px]:gap-8 max-[720px]:pb-12 max-[720px]:pt-14">
          <div className="pointer-events-none absolute left-[-4rem] top-12 h-[220px] w-[220px] rounded-full bg-[rgba(165,189,152,0.2)] opacity-70 blur-[70px]" />
          <div className="pointer-events-none absolute bottom-[10%] right-[5%] h-[260px] w-[260px] rounded-full bg-[rgba(215,205,180,0.22)] opacity-70 blur-[70px]" />

          <div className="relative z-[1]">
            <h1 className="relative mt-5 font-display text-[clamp(2.8rem,5.2vw,4.9rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-[#20261f] max-[720px]:text-[clamp(2.8rem,15vw,4.2rem)]">
              <span className="relative z-[2]">Pare de usar perfis iguais.</span>
              <span className="relative z-[1] ml-[0.22em] inline rounded-[0.22em] bg-[linear-gradient(135deg,#708568_0%,#90a885_100%)] px-[0.14em] pb-[0.06em] pt-[0.02em] text-white shadow-[0_10px_24px_rgba(112,133,104,0.22)] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                <span className="relative z-[3]"> Seu perfil,</span>
                <span className="relative z-[2]"> do seu jeito.</span>
              </span>
            </h1>

            <p className="mt-5 max-w-[34rem] text-[1.08rem] leading-[1.7] text-[#697163] max-[720px]:text-base">
              Monte um profile visual com links, música, imagens e estilo
              próprio, em minutos.
            </p>

            <p className="mt-3 text-[0.95rem] font-semibold text-[#5f6d58]">
              Mais de 200 perfis já criados - nenhum igual ao outro.
            </p>

            <ClaimForm
              isAuthenticated={Boolean(session?.user)}
              className="mt-[1.8rem] flex max-w-[560px] gap-[0.85rem] rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,255,255,0.84)] p-[0.45rem] shadow-[0_18px_48px_rgba(96,89,72,0.12)] max-[720px]:flex-col max-[720px]:rounded-[24px]"
              inputClassName="min-h-12"
              buttonClassName="inline-flex min-h-[46px] items-center justify-center rounded-full bg-button-accent px-5 font-bold text-[#eff5ea] shadow-button transition-transform duration-200 hover:-translate-y-px max-[720px]:min-h-12"
            />

            <div className="mt-7 flex flex-wrap gap-[0.9rem]">
              {metrics.map((item) => (
                <div
                  key={item.label}
                  className="grid min-w-[150px] gap-[0.18rem] rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.9)] px-4 py-[0.95rem] shadow-chip"
                >
                  <strong className="text-[1.1rem] text-[#20261f]">
                    {item.value}
                  </strong>
                  <span className="text-[0.9rem] text-[#788072]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[620px] max-[1080px]:min-h-0" id="builder">
            <div className="relative overflow-hidden rounded-[36px] border border-[rgba(111,131,103,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,239,230,0.98))] shadow-frame">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-[rgba(111,131,103,0.12)] px-[1.2rem] py-4 max-[720px]:grid-cols-1 max-[720px]:justify-items-start">
                <div className="flex gap-[0.35rem]">
                  <span className="h-[10px] w-[10px] rounded-full bg-[#b8b7af]" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#b8b7af]" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#b8b7af]" />
                </div>
                <div className="justify-self-center text-[0.92rem] text-[#62715b] max-[720px]:justify-self-start">
                  {BRAND.domain}/seunome
                </div>
                  <div className="rounded-full bg-[rgba(126,152,118,0.16)] px-[0.8rem] py-[0.45rem] text-[0.8rem] font-bold text-[#56704f]">
                  publicado
                </div>
              </div>

              <div className="min-h-[600px]">
                <div className="bg-[radial-gradient(circle_at_top_left,rgba(174,198,164,0.18),transparent_30%),linear-gradient(180deg,#fbf8f2_0%,#f0e9de_100%)] p-[1.4rem]">
                  <div className="grid max-w-[360px] grid-cols-[auto_1fr] items-center gap-4 rounded-[24px] border border-[rgba(111,131,103,0.1)] bg-[rgba(255,255,255,0.74)] p-4">
                    <div className="h-[58px] w-[58px] rounded-[20px] bg-[linear-gradient(135deg,#566a52_0%,#8fa787_100%)]" />
                    <div>
                      <strong className="text-[#273023]">XPTO Studio</strong>
                      <p className="mt-1 leading-[1.5] text-[#6e7669]">
                        Monte seu link como se estivesse diagramando um journal.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[28px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.8)]">
                    <div className="flex items-center gap-[0.65rem] border-b border-[rgba(111,131,103,0.1)] bg-[rgba(248,243,236,0.92)] px-4 py-[0.9rem]">
                      <ToolbarButton active ariaLabel="select">
                        <MousePointer2 size={16} strokeWidth={2} />
                      </ToolbarButton>
                      <ToolbarButton ariaLabel="rectangle">
                        <Square size={16} strokeWidth={2} />
                      </ToolbarButton>
                      <ToolbarButton ariaLabel="diamond">
                        <Diamond size={16} strokeWidth={2} />
                      </ToolbarButton>
                      <ToolbarButton ariaLabel="text">
                        <Type size={16} strokeWidth={2} />
                      </ToolbarButton>
                      <ToolbarButton ariaLabel="arrow">
                        <MoveRight size={16} strokeWidth={2} />
                      </ToolbarButton>
                    </div>

                    <div className="relative min-h-[430px] bg-[linear-gradient(rgba(120,138,112,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(120,138,112,0.12)_1px,transparent_1px),linear-gradient(180deg,#e5e0d7_0%,#d7d1c7_100%)] bg-[length:28px_28px,28px_28px,auto] p-[1.4rem] max-[720px]:min-h-[620px]">
                      <article className="absolute left-6 top-5 w-[46%] rotate-[-2.5deg] rounded-[22px] border-[1.5px] border-[rgba(129,151,121,0.22)] bg-[rgba(255,255,255,0.92)] p-4 shadow-board max-[720px]:relative max-[720px]:left-auto max-[720px]:top-auto max-[720px]:w-full max-[720px]:rotate-0">
                        <span className="mb-3 inline-flex text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[#5a7353]">
                          Cover
                        </span>
                        <h3 className="font-display text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-[#20261f]">
                          my links, notes and corners of the internet
                        </h3>
                      </article>

                      <article className="absolute right-8 top-[1.6rem] w-[27%] rotate-[3deg] rounded-[22px] border-[1.5px] border-[rgba(129,151,121,0.22)] bg-[rgba(255,255,255,0.92)] p-4 shadow-board max-[720px]:relative max-[720px]:right-auto max-[720px]:top-auto max-[720px]:mt-4 max-[720px]:w-full max-[720px]:rotate-0">
                        <div className="aspect-[1/1.08] rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0)),linear-gradient(145deg,#91a789_0%,#cbd8c4_100%)]" />
                        <p className="mt-3 text-[0.88rem] text-[#6e7669]">
                          editorial block
                        </p>
                      </article>

                      <article className="absolute bottom-8 left-8 w-[32%] rotate-[1.8deg] rounded-[22px] border-[1.5px] border-[rgba(129,151,121,0.22)] bg-[rgba(255,255,255,0.92)] p-4 shadow-board max-[720px]:relative max-[720px]:bottom-auto max-[720px]:left-auto max-[720px]:mt-4 max-[720px]:w-full max-[720px]:rotate-0">
                        <span className="mb-3 inline-flex text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[#5a7353]">
                          Links
                        </span>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-[14px] border border-[rgba(111,131,103,0.14)] bg-[#fcfaf6] px-[0.85rem] py-3 text-[0.95rem] font-semibold text-[#2a3427]">
                          <span className="h-3 w-3 rounded-full bg-[linear-gradient(135deg,#ff6cab_0%,#ffb36b_100%)]" />
                          <span>instagram archive</span>
                        </div>
                        <div className="mt-[0.65rem] grid grid-cols-[auto_1fr] items-center gap-3 rounded-[14px] border border-[rgba(111,131,103,0.14)] bg-[#fcfaf6] px-[0.85rem] py-3 text-[0.95rem] font-semibold text-[#2a3427]">
                          <span className="h-3 w-3 rounded-full bg-[#1ed760]" />
                          <span>playlist of the month</span>
                        </div>
                        <div className="mt-[0.65rem] grid grid-cols-[auto_1fr] items-center gap-3 rounded-[14px] border border-[rgba(111,131,103,0.14)] bg-[#fcfaf6] px-[0.85rem] py-3 text-[0.95rem] font-semibold text-[#2a3427]">
                          <span className="h-3 w-3 rounded-full bg-[#5873ff]" />
                          <span>personal website</span>
                        </div>
                      </article>

                      <article className="absolute bottom-[2.4rem] right-[2.8rem] w-[34%] rotate-[-2deg] rounded-[22px] border-[1.5px] border-[rgba(129,151,121,0.22)] bg-[rgba(255,255,255,0.92)] p-4 shadow-board max-[720px]:relative max-[720px]:bottom-auto max-[720px]:right-auto max-[720px]:mt-4 max-[720px]:w-full max-[720px]:rotate-0">
                        <span className="mb-3 inline-flex text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[#5a7353]">
                          Note
                        </span>
                        <p className="text-base leading-[1.7] text-[#5f665a]">
                          build a page that feels collected, personal and
                          intentional.
                        </p>
                      </article>

                      <div className="absolute left-[42%] top-[8.2rem] w-[17%] rotate-[11deg] border-t-[1.5px] border-black max-[720px]:hidden">
                        <span className="absolute right-[-2px] top-[-5px] h-2 w-2 rotate-45 border-r-[1.5px] border-t-[1.5px] border-black" />
                      </div>
                      <div className="absolute bottom-[8.8rem] left-[34%] w-[20%] rotate-[-10deg] border-t-[1.5px] border-black max-[720px]:hidden">
                        <span className="absolute right-[-2px] top-[-5px] h-2 w-2 rotate-45 border-r-[1.5px] border-t-[1.5px] border-black" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-wrap justify-center gap-8 px-0 pb-[4.5rem] pt-[1.4rem] text-[0.83rem] font-extrabold uppercase tracking-[0.24em] text-text-soft max-[720px]:w-[calc(100%-20px)] max-[720px]:gap-4 max-[720px]:pb-12 max-[720px]:text-[0.72rem] max-[720px]:tracking-[0.14em]">
          <p className="w-full text-center text-[0.8rem] font-semibold normal-case tracking-[0.02em] text-[#6e7669]">
            funciona com tudo que você já usa
          </p>
          {socialPlatforms.map(({ label, icon: Icon }) => (
            <span key={label} className="inline-flex items-center gap-[0.65rem]">
              <Icon className="h-4 w-4 text-[#5c7255]" />
              {label}
            </span>
          ))}
        </section>

        <section
          className="mx-auto w-[min(1180px,calc(100%-32px))] px-0 py-[4.5rem] max-[720px]:w-[calc(100%-20px)]"
          id="benefits"
        >
          <div className="max-w-[620px]">
            <p className="inline-flex items-center gap-[0.55rem] text-[0.75rem] font-extrabold uppercase tracking-[0.16em] text-[#6d8a66]">
              Make it yours
            </p>
            <h2 className="mt-[0.8rem] font-display text-[clamp(2rem,4vw,3.35rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-[#20261f]">
              Personalização sem limite, sem complicação.
            </h2>
            <p className="mt-5 text-[1.08rem] leading-[1.7] text-[#6f766a] max-[720px]:text-base">
              Crie um perfil com visual único combinando links, mídia e
              elementos do seu jeito, sem precisar saber design.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-[1.2rem] max-[1080px]:grid-cols-1">
            {featureCards.map((feature) => (
              <article
                key={feature.title}
                className="relative min-h-[230px] overflow-hidden rounded-[28px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-card"
              >
                <div className="h-[6px] w-14 rounded-full bg-[linear-gradient(135deg,#647e5e_0%,#8fa787_100%)]" />
                <h3 className="mt-6 text-xl font-semibold text-[#20261f]">
                  {feature.title}
                </h3>
                <p className="mt-[0.9rem] leading-[1.7] text-[#6f766a]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer
        className="mx-auto w-[min(1180px,calc(100%-32px))] px-0 py-[4.5rem] max-[720px]:w-[calc(100%-20px)]"
        id="cta"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-8 rounded-[36px] border border-[rgba(111,131,103,0.12)] bg-footer-base bg-[rgba(252,249,243,0.9)] p-12 shadow-footer max-[1080px]:grid-cols-1 max-[1080px]:items-start max-[720px]:px-5 max-[720px]:py-8">
          <div className="max-w-[620px]">
            <p className="inline-flex items-center gap-[0.55rem] text-[0.75rem] font-extrabold uppercase tracking-[0.16em] text-[#6d8a66]">
              Get started
            </p>
            <h2 className="mt-[0.8rem] font-display text-[clamp(2rem,4vw,3.35rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-[#20261f]">
              Crie seu perfil e comece a se destacar.
            </h2>
            <p className="mt-5 text-[1.08rem] leading-[1.7] text-[#6f766a] max-[720px]:text-base">
              Monte sua página, personalize do seu jeito e publique em minutos.
            </p>
          </div>

          <ClaimForm
            isAuthenticated={Boolean(session?.user)}
            className="flex w-[min(100%,420px)] gap-[0.85rem] rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,255,255,0.84)] p-[0.45rem] shadow-[0_18px_48px_rgba(96,89,72,0.12)] max-[720px]:w-full max-[720px]:flex-col max-[720px]:rounded-[24px]"
            inputClassName="min-h-12"
            buttonClassName="inline-flex min-h-[46px] items-center justify-center rounded-full bg-button-accent px-5 font-bold text-[#eff5ea] shadow-button transition-transform duration-200 hover:-translate-y-px max-[720px]:min-h-12"
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-[rgba(111,131,103,0.12)] pt-6 text-[0.92rem] text-text-soft max-[1080px]:flex-col max-[1080px]:items-start">
          <p>(c) 2026 {BRAND.slug}. Todos os direitos reservados.</p>
          <p>
            Feito para quem quer ter presença de verdade.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ToolbarButton({
  children,
  active = false,
  ariaLabel,
}: {
  children: React.ReactNode;
  active?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={[
        "inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[rgba(111,131,103,0.1)] bg-[rgba(255,255,255,0.72)] text-[#6d8a66]",
        active
          ? "bg-[rgba(193,212,184,0.58)] text-[#31452c] shadow-[inset_0_0_0_1px_rgba(138,162,129,0.34)]"
          : "",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}
