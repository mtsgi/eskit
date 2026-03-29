import { css } from "system/util.js";

export default css`
  /* ─── オーバーレイ (:host 自体が overlay) ──────────────────────────── */

  :host {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 99990;
    background: var(--eskit-overlay-bg, rgba(0, 0, 0, 0.5));
    align-items: center;
    justify-content: center;
  }

  :host([open]) {
    display: flex;
  }

  /* ─── ダイアログパネル ──────────────────────────────────────── */

  .dialog {
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-m);
    padding: var(--kit-space-xl);
    min-width: 280px;
    max-width: min(90vw, 380px);
    color: var(--eskit-color-text);
  }

  /* ─── テキスト ──────────────────────────────────────────────── */

  .title {
    margin: 0 0 var(--kit-space-s);
    font-size: var(--kit-font-size-m);
    font-weight: var(--kit-font-weight-bold);
    text-align: center;
  }

  .description {
    margin: 0 0 var(--kit-space-m);
    font-size: var(--kit-font-size-s);
    text-align: center;
    line-height: var(--kit-line-height-m);
    color: var(--eskit-color-text);
  }

  /* ─── 権限バッジ ─────────────────────────────────────────────── */

  .perm-badge {
    display: block;
    background: var(--eskit-color-background);
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-s);
    color: var(--eskit-color-primary);
    padding: var(--kit-space-xs) var(--kit-space-m);
    font-size: var(--kit-font-size-xs);
    font-family: var(--kit-font-family-mono);
    text-align: center;
    margin-bottom: var(--kit-space-l);
  }

  /* ─── ボタンコンテナ ──────────────────────────────────────────────── */

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--kit-space-s);
  }
`;
