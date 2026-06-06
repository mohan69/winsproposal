import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

type DemoVideoSectionProps = {
  title?: string;
  subtitle?: string;
  videoSrc?: string;
  posterSrc?: string;
  ctaLabel?: string;
  ctaHref?: string;
  compact?: boolean;
};

export function DemoVideoSection({
  title = "See WinsProposal in Action",
  subtitle = "Watch how WinsProposal converts a severe-service valve RFP into structured proposal intelligence, TBE, technical visuals, and customer-ready PDF/DOCX exports.",
  videoSrc = "/videos/WinsProposal_60sec_Website_Optimized_1280x720.mp4",
  posterSrc = "/videos/WinsProposal_60sec_Website_Poster.jpg",
  ctaLabel = "Book a 30-minute pilot walkthrough",
  ctaHref = "/demo",
  compact = false,
}: DemoVideoSectionProps) {
  return (
    <section
      id="demo-video"
      aria-labelledby={compact ? "demo-video-title-compact" : "demo-video-title"}
      className={compact ? "overflow-hidden py-8" : "overflow-hidden bg-[#071526] py-16 text-white md:py-20"}
    >
      <div className={compact ? "mx-auto min-w-0 max-w-5xl" : "mx-auto min-w-0 max-w-6xl px-4 md:px-6"}>
        <div className={compact ? "min-w-0 rounded-lg border border-slate-700 bg-[#071526] p-5 text-white shadow-xl shadow-slate-950/15 md:p-7" : ""}>
          <div className={compact ? "mb-5 max-w-3xl" : "mx-auto mb-8 max-w-3xl text-center"}>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-cyan-300">
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              60-second demo
            </p>
            <h2
              id={compact ? "demo-video-title-compact" : "demo-video-title"}
              className={compact ? "mt-3 break-words text-2xl font-bold text-white" : "mt-3 break-words text-3xl font-bold text-white md:text-4xl"}
            >
              {title}
            </h2>
            <p className={compact ? "mt-3 text-sm leading-relaxed text-slate-300 md:text-base" : "mt-4 text-base leading-relaxed text-slate-300 md:text-lg"}>
              {subtitle}
            </p>
          </div>

          <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-cyan-400/20 bg-slate-950 shadow-2xl shadow-cyan-950/25">
            <video
              className="block aspect-video h-auto w-full max-w-full bg-slate-950 object-contain"
              controls
              playsInline
              preload="metadata"
              poster={posterSrc}
              aria-label="WinsProposal 60-second product demo video"
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className={compact ? "mt-5" : "mt-8 text-center"}>
            <Link
              href={ctaHref}
              className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-lg transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:px-6"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
