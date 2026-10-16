import { css } from "system/util.js";

export default css`
  /* ─── オーバーレイ ──────────────────────────────────────── */

  :host {
    display: none;
  }

  :host([open]) {
    display: contents;
  }

  .beacon-overlay {
    position: fixed;
    inset: 0;
    z-index: 20000;
    background: var(--eskit-overlay-bg, rgba(0, 0, 0, 0.45));
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 15vh;
  }

  /* ─── パネル ──────────────────────────────────────────────── */

  .beacon-panel {
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-l);
    width: min(36rem, calc(100vw - 2rem));
    max-height: min(28rem, 60vh);
    box-shadow: var(--kit-shadow-8);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ─── ヘッダー (検索バー) ──────────────────────────────── */

  .beacon-header {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s);
    padding: var(--kit-space-m) var(--kit-space-l);
    border-bottom: 1px solid var(--eskit-color-border);
  }

  .beacon-icon {
    font-size: var(--kit-font-size-l);
    flex-shrink: 0;
    line-height: 1;
  }

  .beacon-header .kit-textbox {
    font-size: var(--kit-font-size-l);
    border: none;
    background: transparent;
    box-shadow: none;
    padding: var(--kit-space-xs) 0;
  }

  .beacon-header .kit-textbox:focus {
    box-shadow: none;
    border-color: transparent;
  }

  /* ─── 候補リスト ──────────────────────────────────────────── */

  .beacon-results {
    overflow-y: auto;
    overscroll-behavior: contain;
    flex: 1;
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: var(--kit-space-m);
    padding: var(--kit-space-s) var(--kit-space-l);
    border: none;
    background: transparent;
    color: var(--eskit-color-text);
    font: inherit;
    font-size: var(--kit-font-size-m);
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .result-item:hover,
  .result-item:focus-visible,
  .result-item.-selected {
    background: var(--eskit-color-primary);
    color: var(--eskit-color-on-primary, #fff);
    outline: none;
  }

  .result-icon {
    font-size: 1.25rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--kit-radius-s);
    background: color-mix(in srgb, var(--eskit-color-primary) 12%, transparent);
    flex-shrink: 0;
  }

  .result-item:hover .result-icon,
  .result-item:focus-visible .result-icon,
  .result-item.-selected .result-icon {
    background: color-mix(in srgb, #fff 20%, transparent);
  }

  .result-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .result-name {
    font-weight: var(--kit-font-weight-bold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-desc {
    font-size: var(--kit-font-size-xs);
    opacity: 0.7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty-message {
    font-size: var(--kit-font-size-s);
    color: var(--eskit-color-text-muted, var(--eskit-color-border));
    text-align: center;
    padding: var(--kit-space-xl) 0;
  }
`;
