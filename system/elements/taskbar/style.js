import { css } from "system/util.js";

export default css`
  /* ─── ホスト ──────────────────────────────────────────────── */

  :host {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--eskit-taskbar-height, 48px);
    z-index: 9999;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([mode="mobile"]) {
    display: none;
  }

  /* ─── バー本体 ──────────────────────────────────────────────── */

  .taskbar {
    display: flex;
    align-items: center;
    height: 100%;
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border-top: 1px solid var(--eskit-color-border);
    padding: 0 var(--kit-space-s);
    gap: var(--kit-space-xs);
  }

  /* ─── ランチャーボタン ──────────────────────────────────────── */

  .launcher-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    border-radius: var(--kit-radius-s);
    background: transparent;
    color: var(--eskit-color-text);
    font-size: 1.25rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .launcher-btn:hover,
  .launcher-btn:focus-visible {
    background: var(--eskit-color-primary);
    color: var(--eskit-color-on-primary, #fff);
    outline: none;
  }

  /* ─── アプリリスト ──────────────────────────────────────────── */

  .taskbar-apps {
    display: flex;
    align-items: center;
    gap: var(--kit-space-xs);
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .taskbar-apps::-webkit-scrollbar {
    display: none;
  }

  .app-btn {
    display: flex;
    align-items: center;
    gap: var(--kit-space-xs);
    height: 2.25rem;
    padding: 0 var(--kit-space-m);
    border: 1px solid transparent;
    border-radius: var(--kit-radius-s);
    background: transparent;
    color: var(--eskit-color-text);
    font: inherit;
    font-size: var(--kit-font-size-s);
    cursor: pointer;
    white-space: nowrap;
    max-width: 12rem;
    overflow: hidden;
    flex-shrink: 0;
  }

  .app-btn-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-btn:hover {
    background: color-mix(in srgb, var(--eskit-color-primary) 15%, transparent);
    border-color: var(--eskit-color-border);
  }

  .app-btn:focus-visible {
    outline: 2px solid var(--eskit-color-primary);
    outline-offset: -2px;
  }

  .app-btn.-active {
    background: color-mix(in srgb, var(--eskit-color-primary) 25%, transparent);
    border-color: var(--eskit-color-primary);
  }

  /* ─── システムトレイ ────────────────────────────────────────── */

  .taskbar-tray {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding: 0 var(--kit-space-s);
  }

  .clock {
    font-size: var(--kit-font-size-s);
    font-variant-numeric: tabular-nums;
    color: var(--eskit-color-text);
    cursor: pointer;
    padding: var(--kit-space-xs) var(--kit-space-s);
    border-radius: var(--kit-radius-s);
  }

  .clock:hover {
    background: color-mix(in srgb, var(--eskit-color-text) 12%, transparent);
  }
`;
