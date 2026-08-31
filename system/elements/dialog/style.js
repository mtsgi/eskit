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

  .dialog-card {
    background: var(--eskit-color-surface, var(--kit-bg, #1e1e2e));
    border: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    border-radius: var(--kit-radius-m, 8px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    width: min(92vw, 460px);
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    transform: scale(0.95);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  :host([open]) .dialog-card {
    transform: scale(1);
  }

  @starting-style {
    :host([open]) .dialog-card {
      transform: scale(0.95);
    }
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s, 8px);
    padding: var(--kit-space-l, 16px) var(--kit-space-l, 16px) var(--kit-space-s, 8px);
    font-size: var(--kit-font-size-l, 1.25rem);
    font-weight: var(--kit-font-weight-bold, 700);
  }

  .header-icon {
    display: flex;
    align-items: center;
    color: var(--eskit-color-primary, var(--kit-color-primary, #1e8fff));
  }

  .title {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .body {
    padding: var(--kit-space-s, 8px) var(--kit-space-l, 16px);
    overflow-y: auto;
    font-size: var(--kit-font-size-m, 1rem);
    line-height: var(--kit-line-height-m, 1.5);
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
  }

  .message {
    margin: 0 0 var(--kit-space-m, 12px);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .prompt-field {
    margin-top: var(--kit-space-s, 8px);
    display: flex;
    flex-direction: column;
  }

  .prompt-input {
    width: 100%;
  }

  .custom-content {
    margin-top: var(--kit-space-s, 8px);
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--kit-space-s, 8px);
    padding: var(--kit-space-m, 12px) var(--kit-space-l, 16px) var(--kit-space-l, 16px);
    border-top: 1px solid var(--kit-border-color-light, rgba(255, 255, 255, 0.08));
    background: var(--kit-bg-secondary, rgba(0, 0, 0, 0.15));
  }
`;
