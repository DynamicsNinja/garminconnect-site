"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MiniSearch from "minisearch";
import { SEARCH_OPTIONS, type SearchDoc } from "@/lib/search-options";

type Hit = Pick<SearchDoc, "route" | "title" | "section" | "kind"> & { id: string };

export function Search() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [engine, setEngine] = useState<MiniSearch | null>(null);
  const [open, setOpen] = useState(false);
  const mac = useSyncExternalStore(() => () => {}, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [active, setActive] = useState(0);


  const show = useCallback(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    setOpen(true);
    if (engine || status === "loading") return;
    setStatus("loading");
    fetch("/search-index.json")
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<SearchDoc[]>; })
      .then((docs) => {
        const ms = new MiniSearch(SEARCH_OPTIONS);
        ms.addAll(docs);
        setEngine(ms);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [engine, status]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  const close = () => {
    dialog.current?.close();
  };

  const hits = useMemo<Hit[]>(
    () => (engine && query.trim() ? (engine.search(query.trim()).slice(0, 10) as unknown as Hit[]) : []),
    [engine, query],
  );
  const sel = Math.min(active, Math.max(hits.length - 1, 0));

  const go = (h: Hit | undefined) => {
    if (!h) return;
    close();
    router.push(h.route);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(sel + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(sel - 1, 0)); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Enter") { e.preventDefault(); go(hits[sel]); }
  };

  return (
    <>
      <button ref={trigger} type="button" className="search-btn" onClick={show} aria-haspopup="dialog" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <span className="search-label">Search</span>
        <kbd className="search-kbd">{mac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-label="Search"
        onClose={() => { setOpen(false); setQuery(""); setActive(0); trigger.current?.focus(); }}
        onClick={(e) => { if (e.target === dialog.current) close(); }}
      >
        {open && (
          <div className="search-panel">
            <input
              type="search"
              autoFocus
              aria-label="Search docs"
              placeholder="Search docs and methods"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onInputKey}
              autoComplete="off"
              spellCheck={false}
            />
            <div aria-live="polite" className="search-status">
              {status === "loading" && "Loading index…"}
              {status === "error" && "Could not load the search index."}
            </div>
            {hits.length > 0 && (
              <ul className="search-results" role="listbox" aria-label="Results">
                {hits.map((h, i) => (
                  <li key={h.id} role="option" aria-selected={i === sel}>
                    <Link
                      href={h.route}
                      className={i === sel ? "active" : undefined}
                      onClick={(e) => { e.preventDefault(); go(h); }}
                      onMouseMove={() => setActive(i)}
                    >
                      <span className="search-title">{h.title}</span>
                      {h.section && <span className="search-section">{h.section}</span>}
                      <span className="search-kind">{h.kind}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {status === "ready" && query.trim() && hits.length === 0 && (
              <p className="search-empty">
                No results — <Link href="/docs/reference" onClick={close}>try the reference</Link>
              </p>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
