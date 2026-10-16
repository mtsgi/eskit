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

  .clock-app {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .nav-tabs {
    display: flex;
    gap: 4px;
    padding: 4px 8px;
    background: var(--kit-bg-secondary);
    border-bottom: 1px solid var(--kit-border);
    flex-shrink: 0;
  }

  .nav-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: transparent;
    border: none;
    border-radius: var(--kit-radius, 4px);
    color: var(--kit-fg-muted);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    outline: none;
  }

  .nav-tab:hover {
    color: var(--kit-fg);
    background: var(--kit-bg-tertiary, rgba(255, 255, 255, 0.05));
  }

  .nav-tab.-active {
    color: var(--kit-color-primary);
    background: var(--kit-bg-tertiary, rgba(255, 255, 255, 0.08));
    font-weight: 600;
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 0;
    padding: 12px;
    box-sizing: border-box;
    overflow-y: auto;
  }

  /* ─── 時計タブ ─── */
  .analog-clock-svg {
    width: 130px;
    height: 130px;
    margin-bottom: 8px;
  }

  .digital-time {
    font-size: 2rem;
    font-weight: 700;
    font-family: var(--kit-font-family-mono, monospace);
    letter-spacing: 0.05em;
    color: var(--kit-fg);
    line-height: 1.2;
  }

  .digital-date {
    font-size: 0.875rem;
    color: var(--kit-fg-muted);
    margin-top: 4px;
  }

  /* ─── ストップウォッチタブ ─── */
  .stopwatch-time {
    font-size: 2.25rem;
    font-weight: 700;
    font-family: var(--kit-font-family-mono, monospace);
    color: var(--kit-fg);
    margin-bottom: 12px;
  }

  .stopwatch-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .laps-container {
    width: 100%;
    max-width: 280px;
    max-height: 120px;
    overflow-y: auto;
    border: 1px solid var(--kit-border);
    border-radius: var(--kit-radius, 4px);
    background: var(--kit-bg-secondary);
  }

  .laps-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
    font-family: var(--kit-font-family-mono, monospace);
  }

  .laps-table td {
    padding: 3px 8px;
    border-bottom: 1px solid var(--kit-border);
  }

  .laps-table tr:last-child td {
    border-bottom: none;
  }

  /* ─── タイマータブ ─── */
  .timer-picker {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
  }

  .timer-input-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .timer-input {
    width: 48px;
    padding: 4px;
    text-align: center;
    background: var(--kit-bg-secondary);
    border: 1px solid var(--kit-border);
    border-radius: var(--kit-radius, 4px);
    color: var(--kit-fg);
    font-family: var(--kit-font-family-mono, monospace);
    font-size: 1.125rem;
    font-weight: 600;
    outline: none;
  }

  .timer-input-label {
    font-size: 0.6875rem;
    color: var(--kit-fg-muted);
  }

  .timer-colon {
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--kit-fg-muted);
    margin-bottom: 12px;
  }

  .timer-display {
    font-size: 2.25rem;
    font-weight: 700;
    font-family: var(--kit-font-family-mono, monospace);
    color: var(--kit-color-primary);
    margin-bottom: 12px;
  }

  .timer-controls {
    display: flex;
    gap: 8px;
  }

  /* ─── レスポンシブ ─── */
  @container (max-width: 360px) {
    .analog-clock-svg {
      width: 90px;
      height: 90px;
    }
    .digital-time {
      font-size: 1.5rem;
    }
    .stopwatch-time {
      font-size: 1.75rem;
    }
    .timer-display {
      font-size: 1.75rem;
    }
    .nav-tab {
      padding: 4px 8px;
      font-size: 0.75rem;
    }
  }

  @media (max-width: 360px) {
    .analog-clock-svg {
      width: 90px;
      height: 90px;
    }
    .digital-time {
      font-size: 1.5rem;
    }
    .stopwatch-time {
      font-size: 1.75rem;
    }
    .timer-display {
      font-size: 1.75rem;
    }
    .nav-tab {
      padding: 4px 8px;
      font-size: 0.75rem;
    }
  }
`;
