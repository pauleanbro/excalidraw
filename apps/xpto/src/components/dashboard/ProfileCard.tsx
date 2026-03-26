import Link from "next/link";

type ProfileCardProps = {
  readonly profile: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly status: "ACTIVE" | "DRAFT";
    readonly updatedAt: Date;
    readonly scene?: { readonly updatedAt: Date } | null;
  };
  readonly handle?: string | null;
  readonly domain: string;
  readonly activateAction: (formData: FormData) => Promise<void>;
  readonly dateFormatter: Intl.DateTimeFormat;
};

export default function ProfileCard({
  profile,
  handle,
  domain,
  activateAction,
  dateFormatter,
}: ProfileCardProps) {
  const isActive = profile.status === "ACTIVE";
  const lastEdited = profile.scene?.updatedAt ?? profile.updatedAt;

  return (
    <article className="group rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-5 shadow-chip transition-shadow duration-200 hover:shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="truncate font-display text-[1.1rem] font-semibold tracking-[-0.02em] text-[#20261f]">
              {profile.name}
            </h3>
            <span
              className={[
                "inline-flex shrink-0 rounded-full px-[8px] py-[3px] text-[0.65rem] font-bold uppercase tracking-[0.1em]",
                isActive
                  ? "bg-[#56704f] text-[#eff5ea]"
                  : "border border-[rgba(111,131,103,0.14)] bg-[rgba(111,131,103,0.06)] text-[#8a8f83]",
              ].join(" ")}
            >
              {isActive ? "Ativo" : "Draft"}
            </span>
          </div>

          <p className="mt-1.5 text-[0.85rem] text-[#8a8f83]">
            /{profile.slug}
            {isActive && handle && (
              <span className="ml-2 text-[0.8rem] font-medium text-[#6d8a66]">
                → {domain}/{handle}
              </span>
            )}
          </p>

          <p className="mt-1 text-[0.78rem] text-[#b0b5ab]">
            Editado {dateFormatter.format(lastEdited)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-button-accent px-4 text-[0.82rem] font-bold text-[#eff5ea] shadow-button transition-transform duration-200 hover:-translate-y-px"
            href={`/dashboard/profiles/${profile.id}/editor`}
          >
            Abrir editor
          </Link>

          {!isActive && (
            <form action={activateAction}>
              <input name="profileId" type="hidden" value={profile.id} />
              <button
                className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,255,255,0.84)] px-4 text-[0.82rem] font-semibold text-[#3d5236] shadow-chip transition-transform duration-200 hover:-translate-y-px"
                type="submit"
              >
                Ativar
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}
