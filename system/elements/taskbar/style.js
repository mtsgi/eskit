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
    box-sizing: border-box;
  }

  :host([mode="mobile"]) {
    display: none;
  }

  /* ─── バー本体 ──────────────────────────────────────────────── */

  .taskbar {
    display: flex;
    align-items: center;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    background: var(--eskit-color-surface, var(--kit-bg, #1a1a2e));
    border-top: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    padding: 0 var(--kit-space-s, 8px);
    gap: var(--kit-space-s, 8px);
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
  }

  /* ─── ランチャーボタン ──────────────────────────────────────── */

  .launcher-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--kit-radius-s, 6px);
    background: color-mix(in srgb, var(--kit-fg, #fff) 5%, transparent);
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  .launcher-btn:hover,
  .launcher-btn:focus-visible {
    background: var(--eskit-color-primary, var(--kit-color-primary, #1e8fff));
    color: var(--eskit-color-on-primary, #fff);
    border-color: var(--eskit-color-primary, var(--kit-color-primary, #1e8fff));
    outline: none;
  }

  /* ─── アプリリスト ──────────────────────────────────────────── */

  .taskbar-apps {
    display: flex;
    align-items: center;
    gap: var(--kit-space-xs, 4px);
    flex: 1;
    min-width: 0;
    height: 100%;
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
    gap: var(--kit-space-xs, 6px);
    height: 2.25rem;
    padding: 0 var(--kit-space-m, 10px);
    border: 1px solid var(--eskit-color-border, var(--kit-border-color, rgba(255, 255, 255, 0.1)));
    border-radius: var(--kit-radius-s, 6px);
    background: color-mix(in srgb, var(--kit-fg, #fff) 4%, transparent);
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    font: inherit;
    font-size: var(--kit-font-size-s, 0.875rem);
    cursor: pointer;
    white-space: nowrap;
    max-width: 12rem;
    overflow: hidden;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;
  }

  .app-btn-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-btn:hover {
    background: color-mix(in srgb, var(--eskit-color-primary, #1e8fff) 15%, transparent);
    border-color: var(--eskit-color-primary, #1e8fff);
  }

  .app-btn:focus-visible {
    outline: 2px solid var(--eskit-color-primary, #1e8fff);
    outline-offset: -2px;
  }

  .app-btn.-active {
    background: color-mix(in srgb, var(--eskit-color-primary, #1e8fff) 25%, transparent);
    border-color: var(--eskit-color-primary, #1e8fff);
    font-weight: 600;
  }

  /* ─── システムトレイ ────────────────────────────────────────── */

  .taskbar-tray {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: var(--kit-space-xs, 4px);
    padding: 0 var(--kit-space-xs, 4px);
    height: 100%;
  }

  .clock {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.25rem;
    font-size: var(--kit-font-size-s, 0.875rem);
    font-variant-numeric: tabular-nums;
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    cursor: pointer;
    padding: 0 var(--kit-space-s, 8px);
    border-radius: var(--kit-radius-s, 6px);
    transition: background 0.15s;
  }

  .clock:hover {
    background: color-mix(in srgb, var(--eskit-color-text, var(--kit-fg, #fff)) 12%, transparent);
  }
`;
