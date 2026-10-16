import { css } from "system/util.js";

export default css`
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--kit-bg);
    color: var(--kit-fg);
    overflow: hidden;
    font-family: var(--kit-font-family, system-ui, sans-serif);
    font-size: 0.875rem;
  }

  .notepad-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--kit-bg-secondary);
    border-bottom: 1px solid var(--kit-border);
    flex-shrink: 0;
  }

  .toolbar-separator {
    width: 1px;
    height: 16px;
    background: var(--kit-border);
    margin: 0 4px;
  }

  .editor-area {
    display: flex;
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
    background: var(--kit-bg);
  }

  .editor-textarea {
    flex: 1;
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    resize: none;
    padding: 8px 12px;
    background: transparent;
    color: var(--kit-fg);
    font-family: var(--kit-font-family-mono, monospace);
    font-size: 0.875rem;
    line-height: 1.5;
    tab-size: 2;
    white-space: pre;
    overflow: auto;
  }

  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 10px;
    background: var(--kit-bg-secondary);
    border-top: 1px solid var(--kit-border);
    font-size: 0.75rem;
    color: var(--kit-fg-muted);
    flex-shrink: 0;
  }

  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dirty-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--kit-color-primary);
  }

  /* ─── レスポンシブ ─── */
  @container (max-width: 480px) {
    .toolbar button span {
      display: none;
    }
    .toolbar {
      overflow-x: auto;
      gap: 2px;
    }
    .status-bar {
      font-size: 0.6875rem;
      padding: 2px 6px;
    }
    .status-left,
    .status-right {
      gap: 6px;
    }
  }

  @media (max-width: 480px) {
    .toolbar button span {
      display: none;
    }
    .toolbar {
      overflow-x: auto;
      gap: 2px;
    }
    .status-bar {
      font-size: 0.6875rem;
      padding: 2px 6px;
    }
    .status-left,
    .status-right {
      gap: 6px;
    }
  }
`;
