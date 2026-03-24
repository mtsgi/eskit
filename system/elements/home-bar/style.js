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
    padding: 0 1rem;
    align-items: center;
    gap: 0.75rem;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([mode="mobile"]) {
    display: flex;
  }

  /* ─── ホームボタン ─────────────────────────────────────────── */

  .home-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--eskit-color-border);
    background: transparent;
    color: var(--eskit-color-text);
    cursor: pointer;
    font: inherit;
  }

  .home-btn:hover,
  .home-btn:focus-visible {
    outline: none;
    background: var(--eskit-color-primary);
    border-color: var(--eskit-color-primary);
    color: var(--eskit-color-on-primary, #fff);
  }

  /* ─── アクティブアプリ名 ────────────────────────────────────── */

  .current-app {
    font-size: 0.9rem;
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--eskit-color-text);
  }
`;
