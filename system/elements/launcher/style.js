import { css } from "system/util.js";

export default css`
  /* ─── オーバーレイ ─────────────────────────────────────────── */

  :host {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: var(--eskit-overlay-bg, rgba(0, 0, 0, 0.45));
    justify-content: center;
    align-items: flex-start;
    padding-top: 4rem;
  }

  :host([open]) {
    display: flex;
  }

  :host([mode="mobile"]) {
    display: none !important;
  }

  /* ─── パネル ─────────────────────────────────────────────────── */

  .launcher-panel {
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-m);
    width: min(32rem, calc(100vw - 2rem));
    max-height: calc(100dvh - 8rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  }

  /* ─── ヘッダー (検索) ──────────────────────────────────────── */

  .launcher-header {
    display: flex;
    padding: var(--kit-space-m);
    border-bottom: 1px solid var(--eskit-color-border);
  }

  /* ─── アプリグリッド ─────────────────────────────────────────── */

  .launcher-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    gap: var(--kit-space-s);
    padding: var(--kit-space-m);
  }

  /* ─── アプリカード ───────────────────────────────────────────── */

  .app-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--kit-space-xs);
    background: transparent;
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-s);
    padding: var(--kit-space-s);
    min-height: 4.5rem;
    font: inherit;
    cursor: pointer;
    text-align: center;
    color: var(--eskit-color-text);
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
  }

  .app-name {
    font-size: var(--kit-font-size-xs);
    white-space: normal;
    overflow: visible;
  }

  .empty-message {
    grid-column: 1 / -1;
    font-size: var(--kit-font-size-s);
    color: var(--eskit-color-text-muted, var(--eskit-color-border));
    text-align: center;
    padding: var(--kit-space-l) 0;
  }
`;
