/**
 * ConstellationIcon — custom SVG icon for ROSTER AI nav entry.
 * Designed to match lucide-react's prop interface (size + className)
 * so it slots into the sidebar without special-casing.
 */
export function ConstellationIcon({
  size = 17,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer nodes */}
      <circle cx="32" cy="14" r="3.5" fill="currentColor" />
      <circle cx="52" cy="28" r="3.5" fill="currentColor" />
      <circle cx="44" cy="50" r="3.5" fill="currentColor" />
      <circle cx="20" cy="50" r="3.5" fill="currentColor" />
      <circle cx="12" cy="28" r="3.5" fill="currentColor" />
      {/* Central hub */}
      <circle cx="32" cy="32" r="4.5" fill="currentColor" />
      {/* Spoke lines — hub to outer nodes */}
      <line x1="32" y1="17.5" x2="32" y2="27.5"    stroke="currentColor" strokeWidth="1"    opacity="0.55" strokeLinecap="round" />
      <line x1="34.8" y1="15.2" x2="49.2" y2="26.2" stroke="currentColor" strokeWidth="1"    opacity="0.55" strokeLinecap="round" />
      <line x1="51"   y1="31.2" x2="45.5" y2="46.8" stroke="currentColor" strokeWidth="1"    opacity="0.55" strokeLinecap="round" />
      <line x1="41"   y1="50"   x2="23"   y2="50"   stroke="currentColor" strokeWidth="1"    opacity="0.55" strokeLinecap="round" />
      <line x1="18.5" y1="46.8" x2="13"   y2="31.2" stroke="currentColor" strokeWidth="1"    opacity="0.55" strokeLinecap="round" />
      <line x1="15"   y1="26.2" x2="29.2" y2="15.2" stroke="currentColor" strokeWidth="1"    opacity="0.55" strokeLinecap="round" />
      {/* Cross lines — hub to non-adjacent nodes (lighter) */}
      <line x1="32" y1="27.5" x2="49.2" y2="26.2" stroke="currentColor" strokeWidth="0.75" opacity="0.22" strokeLinecap="round" />
      <line x1="32" y1="27.5" x2="23"   y2="50"   stroke="currentColor" strokeWidth="0.75" opacity="0.22" strokeLinecap="round" />
      <line x1="32" y1="27.5" x2="13"   y2="31.2" stroke="currentColor" strokeWidth="0.75" opacity="0.22" strokeLinecap="round" />
    </svg>
  );
}
