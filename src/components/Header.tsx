import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { Search } from "./Search";

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/">
          <Wordmark className="wordmark-sm" />
        </Link>
        <nav aria-label="Main">
          <Link href="/claude">Claude</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/demo" className="hide-sm">Demo</Link>
          <a href="https://github.com/DynamicsNinja/garminconnect-js" rel="noopener noreferrer" target="_blank" className="hide-sm">GitHub</a>
        </nav>
        <div id="search-slot"><Search /></div>
      </div>
    </header>
  );
}
