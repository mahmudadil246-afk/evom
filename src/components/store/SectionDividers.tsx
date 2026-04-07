/**
 * Unique SVG section dividers for the homepage.
 * Each divider has a distinct shape and uses semantic color tokens.
 * All dividers use -mt and -mb to overlap adjacent sections and eliminate gaps.
 */

/** Smooth wave — gentle single curve */
export function WaveDivider({ fillClass = "fill-store-background", flip = false }: { fillClass?: string; flip?: boolean }) {
  return (
    <div className={`relative h-8 md:h-10 -mt-px -mb-px ${flip ? "rotate-180" : ""}`}>
      <svg viewBox="0 0 1440 64" fill="none" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
        <path d="M0 64h1440V32C1200 0 960 64 720 32S240 64 0 32v32z" className={fillClass} />
      </svg>
    </div>
  );
}

/** Zigzag / triangle teeth */
export function ZigzagDivider({ fillClass = "fill-store-card" }: { fillClass?: string }) {
  return (
    <div className="relative h-6 md:h-8 -mt-px -mb-px">
      <svg viewBox="0 0 1440 40" fill="none" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
        <path d="M0 40 L60 0 L120 40 L180 0 L240 40 L300 0 L360 40 L420 0 L480 40 L540 0 L600 40 L660 0 L720 40 L780 0 L840 40 L900 0 L960 40 L1020 0 L1080 40 L1140 0 L1200 40 L1260 0 L1320 40 L1380 0 L1440 40 Z" className={fillClass} />
      </svg>
    </div>
  );
}

/** Slanted / diagonal cut */
export function SlantDivider({ fillClass = "fill-store-muted", direction = "left" }: { fillClass?: string; direction?: "left" | "right" }) {
  return (
    <div className="relative h-8 md:h-12 -mt-px -mb-px">
      <svg viewBox="0 0 1440 80" fill="none" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
        {direction === "left" ? (
          <path d="M0 80 L1440 0 L1440 80 Z" className={fillClass} />
        ) : (
          <path d="M0 0 L1440 80 L0 80 Z" className={fillClass} />
        )}
      </svg>
    </div>
  );
}

/** Curved hill — smooth arch */
export function CurveDivider({ fillClass = "fill-store-background" }: { fillClass?: string }) {
  return (
    <div className="relative h-8 md:h-10 -mt-px -mb-px">
      <svg viewBox="0 0 1440 64" fill="none" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
        <path d="M0 64 C360 0, 1080 0, 1440 64 Z" className={fillClass} />
      </svg>
    </div>
  );
}

/** Double wave — layered waves for depth */
export function DoubleWaveDivider({ fillClass = "fill-store-card", accentClass = "fill-store-primary/10" }: { fillClass?: string; accentClass?: string }) {
  return (
    <div className="relative h-10 md:h-12 -mt-px -mb-px">
      <svg viewBox="0 0 1440 80" fill="none" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
        <path d="M0 80 C240 40, 480 80, 720 40 C960 0, 1200 40, 1440 20 L1440 80 Z" className={accentClass} />
        <path d="M0 80 C360 20, 720 60, 1080 30 C1200 20, 1320 40, 1440 40 L1440 80 Z" className={fillClass} />
      </svg>
    </div>
  );
}

/** Tilt with curve — asymmetric */
export function TiltCurveDivider({ fillClass = "fill-store-muted" }: { fillClass?: string }) {
  return (
    <div className="relative h-8 md:h-10 -mt-px -mb-px">
      <svg viewBox="0 0 1440 64" fill="none" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
        <path d="M0 64 L0 40 Q360 0, 720 24 Q1080 48, 1440 16 L1440 64 Z" className={fillClass} />
      </svg>
    </div>
  );
}

/** Rounded bumps / scallop */
export function ScallopDivider({ fillClass = "fill-store-background" }: { fillClass?: string }) {
  return (
    <div className="relative h-6 md:h-8 -mt-px -mb-px">
      <svg viewBox="0 0 1440 48" fill="none" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
        <path d="M0 48 Q120 0 240 48 Q360 0 480 48 Q600 0 720 48 Q840 0 960 48 Q1080 0 1200 48 Q1320 0 1440 48 Z" className={fillClass} />
      </svg>
    </div>
  );
}

/** Arrow / chevron pointing down */
export function ArrowDivider({ fillClass = "fill-store-card" }: { fillClass?: string }) {
  return (
    <div className="relative h-8 md:h-10 -mt-px -mb-px">
      <svg viewBox="0 0 1440 56" fill="none" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
        <path d="M0 0 L720 56 L1440 0 L1440 56 L0 56 Z" className={fillClass} />
      </svg>
    </div>
  );
}
