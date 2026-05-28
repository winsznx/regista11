import Link from "next/link";

import { PersonaCard } from "@/components/landing/PersonaCard";
import type { PersonaSlug } from "@/components/landing/pitch/PositionGrid";
import { getPersona } from "@/lib/personas";

/**
 * The eleven personas arranged in a 4-3-3, read top-to-bottom like a
 * tactical board:
 *
 *   ATTACK   3 forwards
 *   MID      3 midfielders
 *   DEF      4 defenders
 *   GK       1 keeper
 *
 * Cards are the same `<PersonaCard>` used in the legacy grid layout —
 * only the layout changes. The Link wrappers keep each card navigable
 * to /agents/[slug].
 *
 * Responsive strategy:
 *   - md+ : true 4-3-3 grid with each row spanning equal width
 *   - <md : the 4-card defensive row stops fitting at typical card
 *           widths, so we collapse to a single column but preserve
 *           formation reading order (attack → mid → def → keeper).
 */

const FORMATION_4_3_3_BY_LINE: readonly (readonly PersonaSlug[])[] = [
  // Attack (3) — left forward, false 9, right forward
  ["il-numero-dieci", "il-falso-nove", "il-bomber"],
  // Midfield (3) — left mid, regista, right mid
  ["il-mediano", "il-regista", "il-trequartista"],
  // Defense (4) — left back, two centre backs, right back
  ["il-capitano", "il-libero", "il-catenaccio", "l-ala"],
  // Goalkeeper (1)
  ["l-ultimo"],
];

interface FormationGridProps {
  /** If true (default), each card wraps in a <Link href="/agents/[slug]">.
   *  Set false on landing where the section is read-only. */
  linkToAgent?: boolean;
}

function CardWrap({
  slug,
  linkToAgent,
}: {
  slug: PersonaSlug;
  linkToAgent: boolean;
}) {
  const p = getPersona(slug);
  if (!p) return null;
  const inner = <PersonaCard {...p} />;
  if (!linkToAgent) return inner;
  return (
    <Link
      href={`/agents/${slug}`}
      className="block focus:outline-none"
      data-persona-link={slug}
      aria-label={`Open ${p.name}`}
    >
      {inner}
    </Link>
  );
}

export function FormationGrid({ linkToAgent = true }: FormationGridProps) {
  return (
    <div
      data-formation-grid
      className="mx-auto flex w-full max-w-[1080px] flex-col gap-4 md:gap-6"
    >
      {FORMATION_4_3_3_BY_LINE.map((line, i) => (
        <div
          key={i}
          data-formation-line={["ATT", "MID", "DEF", "GK"][i]}
          className={[
            "grid gap-4",
            // On mobile: 1 column for every row. On md+: each row
            // becomes its own grid sized to its card count.
            "grid-cols-1",
            line.length === 1 && "md:grid-cols-1 md:mx-auto md:w-[min(33%,360px)]",
            line.length === 3 && "md:grid-cols-3",
            line.length === 4 && "md:grid-cols-4",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {line.map((slug) => (
            <CardWrap key={slug} slug={slug} linkToAgent={linkToAgent} />
          ))}
        </div>
      ))}
    </div>
  );
}
