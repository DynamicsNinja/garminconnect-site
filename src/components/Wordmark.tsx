/** The README wordmark without its tagline (a tagline is unreadable at header size). One <img> (so the home link always has a name); <picture> swaps in the dark file. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <picture className={`wordmark ${className ?? ""}`}>
      <source srcSet="/brand/name-dark.svg" media="(prefers-color-scheme: dark)" />
      <img src="/brand/name-light.svg" alt="garminconnect-js" width={697} height={89} />
    </picture>
  );
}
