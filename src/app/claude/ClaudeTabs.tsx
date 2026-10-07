"use client";
import { useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { TABS, type TabId } from "./tabs";
import styles from "./claude.module.css";

const noop = () => () => {};

export function ClaudeTabs({ initial, panels }: { initial: TabId; panels: Record<TabId, ReactNode> }) {
  const [active, setActive] = useState<TabId>(initial);
  const js = useSyncExternalStore(noop, () => true, () => false);

  function select(id: TabId, focus = false) {
    setActive(id);
    const url = new URL(window.location.href);
    url.searchParams.set("app", id);
    window.history.replaceState(null, "", url);
    if (focus) document.getElementById(`tab-${id}`)?.focus();
  }

  function onKey(e: KeyboardEvent, i: number) {
    const last = TABS.length - 1;
    const next = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    select(TABS[next].id, true);
  }

  return (
    <div>
      {js && (
        <div role="tablist" aria-label="Where do you use Claude?" className={styles.tablist}>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={active === t.id}
              aria-controls={t.id}
              tabIndex={active === t.id ? 0 : -1}
              className={styles.tab}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {TABS.map((t) => (
        <section
          key={t.id}
          id={t.id}
          className={styles.panel}
          role={js ? "tabpanel" : undefined}
          aria-labelledby={js ? `tab-${t.id}` : undefined}
          hidden={js && active !== t.id}
        >
          {!js && <h3>{t.label}</h3>}
          {panels[t.id]}
        </section>
      ))}
    </div>
  );
}
