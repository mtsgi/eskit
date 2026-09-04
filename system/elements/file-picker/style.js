import { css } from "system/util.js";

export default css`
  :host {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 99999;
    align-items: center;
    justify-content: center;
    background: var(--eskit-overlay-bg, rgba(0, 0, 0, 0.45));
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  :host([open]) {
    display: flex;
    opacity: 1;
  }

  @starting-style {
    :host([open]) {
      opacity: 0;
    }
  }

  .fp-dialog-card {
    background: var(--eskit-color-surface, var(--kit-bg, #1e1e2e));
    border: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    border-radius: var(--kit-radius-m, 8px);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
    width: min(92vw, 560px);
    height: min(85vh, 480px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    transform: scale(0.95);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  :host([open]) .fp-dialog-card {
    transform: scale(1);
  }

  @starting-style {
    :host([open]) .fp-dialog-card {
      transform: scale(0.95);
    }
  }

  .fp-header {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s, 8px);
    padding: var(--kit-space-m, 12px) var(--kit-space-l, 16px);
    border-bottom: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
  }

  .fp-header-icon {
    display: flex;
    align-items: center;
    color: var(--kit-color-primary, #1e8fff);
  }

  .fp-title {
    margin: 0;
    font-size: var(--kit-font-size-l, 1.15rem);
    font-weight: var(--kit-font-weight-bold, 700);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fp-nav {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s, 8px);
    padding: var(--kit-space-s, 8px) var(--kit-space-l, 16px);
    background: rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
  }

  .fp-path-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    background: var(--kit-bg-secondary, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    border-radius: var(--kit-radius-s, 4px);
    padding: 4px 8px;
    font-size: var(--kit-font-size-s, 0.85rem);
    overflow: hidden;
  }

  .fp-path-icon {
    color: var(--kit-color-primary, #1e8fff);
    flex-shrink: 0;
  }

  .fp-path-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: text;
  }

  .fp-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--kit-space-s, 8px);
    position: relative;
  }

  .fp-file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: var(--kit-space-s, 8px);
  }

  .fp-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    border-radius: var(--kit-radius-s, 6px);
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease, border-color 0.15s ease;
    border: 1px solid transparent;
    text-align: center;
  }

  .fp-item:hover {
    background: var(--kit-hover-bg, rgba(255, 255, 255, 0.08));
  }

  .fp-item.-selected {
    background: var(--kit-active-bg, rgba(30, 143, 255, 0.18));
    border-color: var(--kit-color-primary, #1e8fff);
  }

  .fp-item-icon {
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
  }

  .fp-item-name {
    font-size: var(--kit-font-size-xs, 0.75rem);
    line-height: 1.2;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .fp-empty-msg {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--kit-fg-muted, #888);
    font-size: var(--kit-font-size-s, 0.9rem);
  }

  .fp-footer {
    display: flex;
    flex-direction: column;
    gap: var(--kit-space-s, 8px);
    padding: var(--kit-space-m, 12px) var(--kit-space-l, 16px);
    border-top: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    background: rgba(0, 0, 0, 0.08);
  }

  .fp-selection-row {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s, 8px);
  }

  .fp-label {
    font-size: var(--kit-font-size-s, 0.85rem);
    white-space: nowrap;
    color: var(--kit-fg-muted, #aaa);
  }

  .fp-input {
    flex: 1;
  }

  .fp-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--kit-space-s, 8px);
  }
`;
