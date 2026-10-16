import { css } from "system/util.js";

export default css`
  :host {
    position: fixed;
    top: var(--kit-space-l, 16px);
    right: var(--kit-space-l, 16px);
    z-index: 99950;
    display: flex;
    flex-direction: column;
    gap: var(--kit-space-s, 8px);
    pointer-events: none;
    max-width: min(92vw, 360px);
    width: 100%;
  }

  /* モバイルモード時の位置調整 */
  :host([mode="mobile"]) {
    top: var(--kit-space-m, 12px);
    right: var(--kit-space-m, 12px);
    left: var(--kit-space-m, 12px);
    max-width: none;
    width: auto;
  }

  .toast {
    pointer-events: auto;
    background: var(--eskit-color-surface, var(--kit-bg, #1e1e2e));
    border: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    border-left: 4px solid var(--kit-color-primary, #1e8fff);
    border-radius: var(--kit-radius-m, 8px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    padding: var(--kit-space-m, 12px);
    display: flex;
    align-items: flex-start;
    gap: var(--kit-space-s, 8px);
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    cursor: default;
    user-select: none;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, max-height 0.25s ease, margin 0.25s ease;
    transform: translateX(0);
    opacity: 1;
    overflow: hidden;
  }

  .toast.-closing {
    transform: translateX(110%);
    opacity: 0;
    margin-bottom: calc(-1 * var(--kit-space-s, 8px));
  }

  @starting-style {
    .toast {
      transform: translateX(110%);
      opacity: 0;
    }
  }

  /* タイプ別アクセント色 */
  .toast.-info {
    border-left-color: var(--kit-color-primary, #1e8fff);
  }
  .toast.-success {
    border-left-color: var(--kit-color-success, #28a745);
  }
  .toast.-warning {
    border-left-color: var(--kit-color-warning, #f0ad4e);
  }
  .toast.-error {
    border-left-color: var(--kit-color-danger, #dc3545);
  }

  .icon-wrapper {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
  }

  .toast.-info .icon-wrapper {
    color: var(--kit-color-primary, #1e8fff);
  }
  .toast.-success .icon-wrapper {
    color: var(--kit-color-success, #28a745);
  }
  .toast.-warning .icon-wrapper {
    color: var(--kit-color-warning, #f0ad4e);
  }
  .toast.-error .icon-wrapper {
    color: var(--kit-color-danger, #dc3545);
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  .title {
    font-size: var(--kit-font-size-s, 0.875rem);
    font-weight: var(--kit-font-weight-bold, 700);
    margin: 0 0 2px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .message {
    font-size: var(--kit-font-size-xs, 0.75rem);
    line-height: var(--kit-line-height-s, 1.35);
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary, #a0a0b0));
    margin: 0;
    word-break: break-word;
  }

  .action-btn {
    margin-top: var(--kit-space-xs, 4px);
    font-size: var(--kit-font-size-xs, 0.75rem);
    padding: 2px 8px;
  }

  .close-btn {
    flex-shrink: 0;
    background: transparent;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary, #a0a0b0));
    border-radius: var(--kit-radius-s, 4px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, background-color 0.15s;
  }

  .close-btn:hover {
    color: var(--eskit-color-text, #fff);
    background: var(--kit-bg-tertiary, rgba(255, 255, 255, 0.1));
  }
`;
