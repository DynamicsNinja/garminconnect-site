/** The README wordmark; the dark variant is swapped in by CSS (prefers-color-scheme). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`wordmark ${className ?? ""}`}>
      <img src="/brand/title-light.svg" alt="garminconnect-js" className="wordmark-light" width={705} height={136} />
      <img src="/brand/title-dark.svg" alt="" aria-hidden="true" className="wordmark-dark" width={705} height={136} />
    </span>
  );
}
