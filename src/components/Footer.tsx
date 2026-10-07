import Link from "next/link";
import pkg from "garminconnect-js/package.json";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div>
          Open source · <a href="https://github.com/DynamicsNinja/garminconnect-js" rel="noopener noreferrer" target="_blank">garminconnect-js on GitHub</a> · Not affiliated with Garmin · <Link href="/privacy">Privacy</Link>
        </div>
        <div style={{ marginTop: "12px", fontSize: "12px" }}>
          Docs for garminconnect-js {pkg.version}
        </div>
      </div>
    </footer>
  );
}
