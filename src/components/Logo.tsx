/**
 * Logo — Reese-Reviews logo system.
 *
 * Three size variants, no clipping issues, easily replaceable.
 * To swap in a real logo: replace the <img> src prop or the SVG
 * placeholder below. The LogoPlaceholder renders when no image is
 * supplied and shows upload instructions.
 */

import { User } from "lucide-react";

type LogoSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<LogoSize, { box: string; icon: number; text: string }> = {
  sm: { box: "h-8 w-8",  icon: 16, text: "text-sm" },
  md: { box: "h-10 w-10", icon: 20, text: "text-base" },
  lg: { box: "h-14 w-14", icon: 28, text: "text-lg" },
};

interface LogoProps {
  size?: LogoSize;
  /** Optional src for a real logo image.  Leave undefined to show placeholder. */
  src?: string;
  alt?: string;
  showText?: boolean;
  className?: string;
}

/**
 * Primary Logo component.
 * Uses a steel-toned placeholder box by default.
 */
export function Logo({
  size = "md",
  src,
  alt = "Reese-Reviews logo",
  showText = false,
  className = "",
}: LogoProps) {
  const { box, icon, text } = SIZE_MAP[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${box} object-contain`}
          style={{ borderRadius: "0.5rem" }}
        />
      ) : (
        <LogoPlaceholder size={size} />
      )}
      {showText && (
        <span className={`font-serif font-bold gradient-steel-text ${text}`}>
          Reese-Reviews
        </span>
      )}
    </span>
  );
}

/**
 * Placeholder shown when no real logo image is provided.
 * Displays a User icon in a steel-gradient box.
 */
export function LogoPlaceholder({ size = "md" }: { size?: LogoSize }) {
  const { box, icon } = SIZE_MAP[size];
  return (
    <span
      className={`${box} inline-flex items-center justify-center rounded-lg gradient-steel`}
      title="Logo — replace with your image"
      aria-label="Logo placeholder"
    >
      <User size={icon} className="text-primary-foreground opacity-80" />
    </span>
  );
}

/**
 * Upload-instruction card — visible in dev / admin mode.
 * Place this component wherever you want to remind editors
 * that the logo needs to be replaced.
 */
export function LogoUploadHint() {
  return (
    <div className="rounded-lg border border-dashed border-steel-mid/50 bg-steel-dark/20 px-4 py-3 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground/80 mb-1">Logo Placeholder</p>
      <p>To replace: provide a PNG/SVG file and pass its URL as the <code>src</code> prop to <code>&lt;Logo&gt;</code>.</p>
      <p className="mt-1 opacity-70">Recommended sizes: 64×64 (sm), 80×80 (md), 112×112 (lg).</p>
    </div>
  );
}

export default Logo;
