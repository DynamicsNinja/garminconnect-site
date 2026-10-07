/** The README wordmark. One <img> (so the home link always has a name); <picture> swaps in the dark file. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <picture className={`wordmark ${className ?? ""}`}>
      <source srcSet="/brand/title-dark.svg" media="(prefers-color-scheme: dark)" />
      <img src="/brand/title-light.svg" alt="garminconnect-js" width={705} height={136} />
    </picture>
  );
}
