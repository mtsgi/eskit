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
    user-select: none;
    font-family: var(--kit-font-family, system-ui, sans-serif);
  }

  .calc-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 8px;
    box-sizing: border-box;
    gap: 8px;
  }

  .calc-display {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    background: var(--kit-bg-secondary);
    border: 1px solid var(--kit-border);
    border-radius: var(--kit-radius, 6px);
    padding: 8px 12px;
    min-height: 52px;
    overflow: hidden;
  }

  .calc-formula {
    font-size: 0.75rem;
    color: var(--kit-fg-muted);
    min-height: 1rem;
    line-height: 1rem;
    font-family: var(--kit-font-family-mono, monospace);
    word-break: break-all;
    text-align: right;
  }

  .calc-main-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--kit-fg);
    font-family: var(--kit-font-family-mono, monospace);
    line-height: 1.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  .calc-keypad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 4px;
    flex: 1;
  }

  .calc-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--kit-bg-secondary);
    border: 1px solid var(--kit-border);
    border-radius: var(--kit-radius, 4px);
    color: var(--kit-fg);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    outline: none;
  }

  .calc-btn:hover {
    background: var(--kit-bg-tertiary, rgba(255, 255, 255, 0.08));
  }

  .calc-btn:active {
    filter: brightness(0.9);
  }

  .calc-btn.-op {
    background: var(--kit-bg-tertiary, #2a2a3e);
    color: var(--kit-color-primary);
    font-weight: 600;
  }

  .calc-btn.-action {
    color: var(--kit-color-warning, #f59e0b);
  }

  .calc-btn.-equals {
    background: var(--kit-color-primary);
    color: #fff;
    font-weight: bold;
    border-color: var(--kit-color-primary);
  }

  .calc-btn.-equals:hover {
    filter: brightness(1.1);
  }

  .calc-btn.-zero {
    grid-column: span 2;
  }

  /* ─── レスポンシブ ─── */
  @container (max-width: 260px) {
    .calc-container {
      padding: 4px;
      gap: 4px;
    }
    .calc-display {
      min-height: 42px;
      padding: 4px 8px;
    }
    .calc-main-value {
      font-size: 1.25rem;
      line-height: 1.4rem;
    }
    .calc-btn {
      font-size: 0.875rem;
    }
  }

  @media (max-width: 260px) {
    .calc-container {
      padding: 4px;
      gap: 4px;
    }
    .calc-display {
      min-height: 42px;
      padding: 4px 8px;
    }
    .calc-main-value {
      font-size: 1.25rem;
      line-height: 1.4rem;
    }
    .calc-btn {
      font-size: 0.875rem;
    }
  }
`;
