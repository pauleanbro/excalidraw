type StatsCardProps = {
  readonly label: string;
  readonly value: string | number;
  readonly accent?: "green" | "purple" | "amber" | "blue";
  readonly detail?: React.ReactNode;
};

const ACCENT_DOT = {
  green: "bg-[#6b8364]",
  purple: "bg-[#8b7bb5]",
  amber: "bg-[#c4a262]",
  blue: "bg-[#6094c4]",
} as const;

export default function StatsCard({
  label,
  value,
  accent = "green",
  detail,
}: StatsCardProps) {
  return (
    <article className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-5 shadow-chip">
      <div className="flex items-center gap-2">
        <span className={`h-[7px] w-[7px] rounded-full ${ACCENT_DOT[accent]}`} />
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-[#8a8f83]">
          {label}
        </p>
      </div>
      <strong className="mt-2 block font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-[#20261f]">
        {value}
      </strong>
      {detail && (
        <p className="mt-2 text-[0.78rem] leading-[1.5] text-[#8a8f83]">{detail}</p>
      )}
    </article>
  );
}
