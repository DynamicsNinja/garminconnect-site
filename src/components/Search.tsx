"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  const uid = useId();
  const listId = `${uid}-list`;
  const optId = (i: number) => `${uid}-opt-${i}`;

  const started = useRef(false);
  const pending = useRef(false);

  const load = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setStatus("loading");
    fetch("/search-index.json")
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<SearchDoc[]>; })
      .then((docs) => {
        const ms = new MiniSearch(SEARCH_OPTIONS);
        ms.addAll(docs);
        setEngine(ms);
        setStatus("ready");
      })
      .catch(() => { started.current = false; pending.current = false; setStatus("error"); });
  }, []);

  const show = useCallback(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    setOpen(true);
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        const t = e.target instanceof HTMLElement ? e.target : null;
        if (e.repeat || e.defaultPrevented || t?.tagName === "TEXTAREA" || t?.isContentEditable) return;
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
    () => (engine && query.trim() ? (engine.search(query.trim()).slice(0, 10).map((r) => ({ id: r.id as string, route: r.route as string, title: r.title as string, section: r.section as string | undefined, kind: r.kind as Hit["kind"] }))) : []),
    [engine, query],
  );
  const sel = Math.min(active, Math.max(hits.length - 1, 0));

  useEffect(() => {
    if (open) document.getElementById(optId(sel))?.scrollIntoView({ block: "nearest" });
  }, [open, sel, hits]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (h: Hit | undefined) => {
    if (!h) return;
    close();
    router.push(h.route);
  };

  useEffect(() => {
    if (!pending.current || !engine) return;
    pending.current = false;
    go(hits[0]);
  });

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(sel + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(sel - 1, 0)); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Enter") { e.preventDefault(); if (!engine && status !== "error") pending.current = true; else go(hits[sel]); }
  };

  return (
    <>
      <button ref={trigger} type="button" className="search-btn" onClick={show} onPointerEnter={load} onFocus={load} aria-haspopup="dialog" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <span className="search-label">Search</span>
        <kbd className="search-kbd">{mac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-label="Search documentation"
        onClose={() => { pending.current = false; setOpen(false); setQuery(""); setActive(0); trigger.current?.focus(); }}
        onClick={(e) => { if (e.target === dialog.current) close(); }}
      >
        {open && (
          <div className="search-panel">
            <input
              type="search"
              role="combobox"
              aria-controls={hits.length > 0 ? listId : undefined}
              aria-expanded={hits.length > 0}
              aria-autocomplete="list"
              aria-activedescendant={hits.length > 0 ? optId(sel) : undefined}
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
              {status === "ready" && query.trim() && (hits.length > 0 ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "No results")}
            </div>
            {hits.length > 0 && (
              <ul className="search-results" role="listbox" id={listId} aria-label="Results">
                {hits.map((h, i) => (
                  <li key={h.id} role="presentation">
                    <Link
                      href={h.route}
                      role="option"
                      id={optId(i)}
                      aria-selected={i === sel}
                      tabIndex={-1}
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
