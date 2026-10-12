import Link from "next/link";
import pkg from "garminconnect-js/package.json";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div>
          <p>Open source, free, and not affiliated with Garmin.</p>
          <p className="fine">Docs for garminconnect-js {pkg.version}</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/claude">Use it in Claude</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/demo">Live demo</Link>
          <Link href="/privacy">Privacy</Link>
          <a href="https://github.com/DynamicsNinja/garminconnect-js" rel="noopener noreferrer" target="_blank">garminconnect-js on GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
