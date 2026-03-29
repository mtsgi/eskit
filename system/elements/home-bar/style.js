import { css } from "system/util.js";

export default css`
  :host {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--eskit-home-bar-height, 3.5rem);
    z-index: 150;
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border-top: 1px solid var(--eskit-color-border);
    padding: 0 var(--kit-space-l);
    align-items: center;
    gap: var(--kit-space-m);
    user-select: none;
    -webkit-user-select: none;
  }

  :host([mode="mobile"]) {
    display: flex;
  }

  /* ─── ホームボタン ─────────────────────────────────────────── */

  /* ─── アクティブアプリ名 ────────────────────────────────────── */

  .current-app {
    font-size: var(--kit-font-size-s);
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--eskit-color-text);
  }
`;
