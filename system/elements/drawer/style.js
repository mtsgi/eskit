import { css } from "system/util.js";

export default css`
  /* ─── オーバーレイ ─────────────────────────────────────────── */

  :host {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 200;
    background: var(--eskit-overlay-bg, rgba(0, 0, 0, 0.45));
  }

  :host([open]) {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  /* ─── パネル ─────────────────────────────────────────────────── */

  .drawer-panel {
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border-top: 1px solid var(--eskit-color-border);
    padding-bottom: 2rem;
    max-height: 85dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* ─── ハンドル ───────────────────────────────────────────────── */

  /* ─── トップバー (クイック設定ボタン + 時間) ────────────── */

  .drawer-topbar {
    display: flex;
    gap: var(--kit-space-s);
    align-items: center;
    justify-content: space-between;
    padding: var(--kit-space-m) var(--kit-space-l) 0;
  }

  .drawer-time {
    flex-grow: 1;
    font-size: var(--kit-font-size-s);
    font-variant-numeric: tabular-nums;
    color: var(--eskit-color-text-muted, var(--eskit-color-border));
  }

  .qs-open-btn {
    display: flex;
    align-items: center;
    gap: var(--kit-space-xs);
    border: none;
    border-radius: var(--kit-radius-s);
    background: color-mix(in srgb, var(--eskit-color-text) 8%, transparent);
    color: var(--eskit-color-text);
    font: inherit;
    font-size: var(--kit-font-size-s);
    padding: var(--kit-space-xs) var(--kit-space-m);
    cursor: pointer;
  }

  .qs-open-btn:hover,
  .qs-open-btn:focus-visible {
    background: var(--eskit-color-primary);
    color: var(--eskit-color-on-primary, #fff);
    outline: none;
  }

  .drawer-handle {
    display: flex;
    justify-content: center;
    padding: 0.75rem 0 0.5rem;
    cursor: grab;
  }

  .drawer-handle::before {
    content: "";
    display: block;
    width: 2.5rem;
    height: 0.25rem;
    background: var(--eskit-color-border);
    border-radius: var(--kit-radius-full);
  }

  /* ─── セクション ─────────────────────────────────────────────── */

  .section {
    padding: var(--kit-space-m) var(--kit-space-l) 0;
  }

  .section-header {
    font-size: var(--kit-font-size-xs);
    font-weight: var(--kit-font-weight-bold);
    text-transform: uppercase;
    color: var(--eskit-color-text-muted, var(--eskit-color-border));
    margin: 0 0 var(--kit-space-s);
  }

  /* ─── リスト / グリッド ──────────────────────────────────────── */

  .app-list {
    display: flex;
    flex-direction: column;
    gap: var(--kit-space-xs);
  }

  .app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    gap: var(--kit-space-s);
  }

  /* ─── アプリカード ───────────────────────────────────────────── */

  .app-card {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s);
    background: transparent;
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-s);
    padding: var(--kit-space-s) var(--kit-space-m);
    font: inherit;
    cursor: pointer;
    text-align: left;
    color: var(--eskit-color-text);
  }

  .app-card.grid-card {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--kit-space-xs);
    padding: var(--kit-space-s);
    min-height: 4.5rem;
  }

  .app-card:hover,
  .app-card:focus-visible {
    background: var(--eskit-color-primary);
    border-color: var(--eskit-color-primary);
    color: var(--eskit-color-on-primary, #fff);
    outline: none;
  }

  .app-icon {
    font-size: 1.4rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .app-name {
    font-size: var(--kit-font-size-s);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .grid-card .app-name {
    font-size: var(--kit-font-size-xs);
    text-align: center;
    white-space: normal;
    overflow: visible;
  }

  .empty-message {
    font-size: var(--kit-font-size-s);
    color: var(--eskit-color-text-muted, var(--eskit-color-border));
  }
`;
