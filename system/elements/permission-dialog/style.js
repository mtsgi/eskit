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
    padding: 1.5rem;
    min-width: 280px;
    max-width: min(90vw, 380px);
    color: var(--eskit-color-text);
  }

  /* ─── テキスト ──────────────────────────────────────────────── */

  .title {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
  }

  .description {
    margin: 0 0 0.75rem;
    font-size: 0.88rem;
    text-align: center;
    line-height: 1.5;
    color: var(--eskit-color-text);
  }

  /* ─── 権限バッジ ─────────────────────────────────────────────── */

  .perm-badge {
    display: block;
    background: var(--eskit-color-background);
    border: 1px solid var(--eskit-color-border);
    color: var(--eskit-color-primary);
    padding: 0.3rem 0.65rem;
    font-size: 0.82rem;
    font-family: ui-monospace, monospace;
    text-align: center;
    margin-bottom: 1.25rem;
  }

  /* ─── ボタン ────────────────────────────────────────────────── */

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .btn {
    font: inherit;
    padding: 0.5rem 1rem;
    cursor: pointer;
    text-align: center;
  }

  .btn-deny {
    background: transparent;
    border: 1px solid var(--eskit-color-border);
    color: var(--eskit-color-text);
  }

  .btn-allow {
    background: var(--eskit-color-primary);
    border: 1px solid var(--eskit-color-primary);
    color: var(--eskit-color-on-primary, #fff);
  }

  .btn-deny:hover  { background: var(--eskit-color-background); border-color: var(--eskit-color-text); }
  .btn-allow:hover { opacity: 0.85; }
`;
