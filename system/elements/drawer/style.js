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
  }

  /* ─── セクション ─────────────────────────────────────────────── */

  .section {
    padding: 0.75rem 1rem 0;
  }

  .section-header {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--eskit-color-text-muted, var(--eskit-color-border));
    margin: 0 0 0.5rem;
  }

  /* ─── リスト / グリッド ──────────────────────────────────────── */

  .app-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    gap: 0.5rem;
  }

  /* ─── アプリカード ───────────────────────────────────────────── */

  .app-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: 1px solid var(--eskit-color-border);
    padding: 0.5rem 0.75rem;
    font: inherit;
    cursor: pointer;
    text-align: left;
    color: var(--eskit-color-text);
  }

  .app-card.grid-card {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
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
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .grid-card .app-name {
    font-size: 0.72rem;
    text-align: center;
    white-space: normal;
    overflow: visible;
  }

  .empty-message {
    font-size: 0.85rem;
    color: var(--eskit-color-text-muted, var(--eskit-color-border));
  }
`;
