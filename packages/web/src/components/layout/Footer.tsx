import Image from "next/image";
import Link from "next/link";
import { Code2, MessageSquare, FileText } from "lucide-react";

import { Container } from "./Container";
import { HairlineRule } from "./HairlineRule";
import { RegistaMark } from "@/icons/RegistaMark";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-[var(--color-steel-gray)] bg-[var(--color-fog-gray)]">
      {/* Brand stamp — full-bleed dark band hosting the Regista 11 wordmark
          PNG. Next/image converts the 3.3 MB source to AVIF/WebP variants
          at 4 widths (sizes attr below) and lazy-loads when the footer
          scrolls into view — the original PNG is never sent to a browser. */}
      <div className="relative isolate overflow-hidden border-b border-white/5"
           style={{ background: "linear-gradient(180deg, #05070f 0%, #0a0d1f 100%)" }}>
        <Container>
          <div className="relative mx-auto flex h-[180px] w-full max-w-[640px] items-center justify-center md:h-[240px]">
            <Image
              src="/landing/regista11-logo.png"
              alt="Regista 11"
              fill
              quality={88}
              sizes="(min-width: 768px) 640px, 90vw"
              className="object-contain"
              loading="lazy"
              priority={false}
            />
          </div>
        </Container>
      </div>
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-3 md:gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--color-deep-plum)]">
              <RegistaMark />
              <span className="text-sm font-medium uppercase tracking-[0.18em]">
                Regista 11
              </span>
            </div>
            <p className="max-w-xs text-[14px] text-[var(--color-slate-text)]">
              Live football prop markets, made by AI agents.
            </p>
            <span className="inline-flex items-center gap-2 rounded-[2px] border border-[var(--color-steel-gray)] bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-slate-text)]">
              Live on X Layer mainnet
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-slate-text)]">
              Links
            </h2>
            <ul className="space-y-2 text-[14px]">
              <li>
                <Link
                  className="inline-flex items-center gap-2 text-[var(--color-charcoal-text)] hover:text-[var(--color-deep-plum)]"
                  href="/docs"
                >
                  <FileText className="h-4 w-4" /> Docs
                </Link>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-2 text-[var(--color-charcoal-text)] hover:text-[var(--color-deep-plum)]"
                  href="https://github.com/winsznx/regista11"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Code2 className="h-4 w-4" /> GitHub
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-2 text-[var(--color-charcoal-text)] hover:text-[var(--color-deep-plum)]"
                  href="https://x.com/regista11_"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageSquare className="h-4 w-4" /> @regista11_
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-slate-text)]">
              Submission
            </h2>
            <p className="text-[14px] text-[var(--color-charcoal-text)]">
              Built for{" "}
              <span className="text-[var(--color-deep-plum)]">OKX X Cup</span>{" "}
              ×{" "}
              <span className="text-[var(--color-deep-plum)]">
                Hook the Future
              </span>{" "}
              × Flap.
            </p>
            <p className="font-numerals text-[12px] text-[var(--color-slate-text)]">
              @XLayerOfficial · @Uniswap · @flapdotsh · #BuildX
            </p>
          </div>
        </div>

        <HairlineRule />
        <div className="flex flex-col gap-2 py-6 text-[12px] text-[var(--color-slate-text)] md:flex-row md:items-center md:justify-between">
          <span>© 2026 Regista 11. MIT License.</span>
          <span>regista11.xyz</span>
        </div>
      </Container>
    </footer>
  );
}
