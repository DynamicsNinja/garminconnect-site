import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/">
          <Wordmark className="wordmark-sm" />
        </Link>
        <nav>
          <a href="/claude">Claude</a>
          <a href="/docs">Docs</a>
          <a href="/demo" className="hide-sm">Demo</a>
          <a href="https://github.com/DynamicsNinja/garminconnect-js" rel="noopener noreferrer" className="hide-sm">GitHub</a>
        </nav>
        <div id="search-slot" />
      </div>
    </header>
  );
}
