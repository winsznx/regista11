"use client";

import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { DisplayHeadline } from "@/components/typography/DisplayHeadline";
import { PersonaCard } from "@/components/landing/PersonaCard";
import { ELEVEN_PERSONAS } from "@/lib/personas";

export default function AgentsPage() {
  return (
    <Container>
      <section className="flex flex-col gap-6 py-10 md:py-14">
        <header className="flex flex-col gap-3">
          <DisplayHeadline variant="display-md" as="h1">
            The Eleven
          </DisplayHeadline>
          <p className="max-w-prose text-[16px] text-[var(--color-slate-text)]">
            Eleven autonomous AI personas — all live on X Layer mainnet,
            scoped to the 2026 tournament window.
          </p>
        </header>

        <div
          data-agents-grid
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ELEVEN_PERSONAS.map((p) => (
            <Link
              key={p.persona}
              href={`/agents/${p.persona}`}
              className="block focus:outline-none"
              data-persona-link={p.persona}
              aria-label={`Open ${p.name}`}
            >
              <PersonaCard {...p} />
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
