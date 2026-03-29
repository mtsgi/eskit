import { css } from "system/util.js";

export default css`
  /* ─── desktop モード (default) ─────────────────────────── */

  :host {
    display: block;
    border: 1px solid var(--eskit-color-border);
    background: var(--eskit-color-surface, var(--eskit-color-background));
    overflow: hidden;
  }

  /* ─── mobile モード ──────────────────────────────────────── */

  :host([mode="mobile"]) {
    display: none;
    position: fixed;
    inset: 0;
    bottom: var(--eskit-home-bar-height, 3.5rem);
    z-index: 10;
    flex-direction: column;
    border: none;
  }

  :host([mode="mobile"][active]) {
    display: flex;
  }

  /* ─── ヘッダー ───────────────────────────────────────────── */

  .app-header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: var(--kit-space-xs) var(--kit-space-s);
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border-bottom: 1px solid var(--eskit-color-border);
    flex-shrink: 0;
  }

  .app-title {
    font-size: var(--kit-font-size-s);
    font-weight: var(--kit-font-weight-bold);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :host([mode="mobile"]) .app-header {
    padding: var(--kit-space-m) var(--kit-space-l);
  }

  /* ─── アプリコンテンツ領域 ───────────────────────────────── */

  .app-template {
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border-top: 1px solid var(--eskit-color-border);
  }

  :host([mode="mobile"]) .app-template {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    border-top: none;
  }
`;
