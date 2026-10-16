import { css } from "system/util.js";

export default css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }

  .terminal {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px 12px;
    box-sizing: border-box;
    overflow: hidden;
    background: var(--eskit-color-surface, var(--kit-bg, #1a1a2e));
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    font-family: var(--kit-font-family-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
    font-size: 13px;
  }

  .output {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
  }

  .output::-webkit-scrollbar {
    width: 6px;
  }

  .output::-webkit-scrollbar-track {
    background: transparent;
  }

  .output::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--eskit-color-text, var(--kit-fg, #888)) 20%, transparent);
    border-radius: 3px;
  }

  .output::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--eskit-color-text, var(--kit-fg, #888)) 35%, transparent);
  }

  .line {
    margin-bottom: 2px;
    line-height: 1.45;
  }

  .line .text {
    white-space: pre-wrap;
    word-break: break-all;
  }

  .line.command {
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary, #8b949e));
  }

  .line.command .prompt {
    color: var(--eskit-color-primary, var(--kit-color-primary, #1e8fff));
    font-weight: 600;
    margin-right: 6px;
  }

  .line.command .text {
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    font-weight: 600;
  }

  .line.error .text {
    color: var(--eskit-color-error, var(--kit-color-danger, #dc3545));
  }

  .line.success .text {
    color: var(--eskit-color-success, var(--kit-color-success, #28a745));
  }

  .line.info .text {
    color: var(--kit-color-info, var(--eskit-color-primary, var(--kit-color-primary, #1e8fff)));
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    flex-shrink: 0;
    line-height: 1.45;
  }

  .input-prompt {
    color: var(--eskit-color-primary, var(--kit-color-primary, #1e8fff));
    font-weight: 600;
    user-select: none;
    flex-shrink: 0;
  }

  .input-field {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 0;
    margin: 0;
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    caret-color: var(--eskit-color-primary, var(--kit-color-primary, #1e8fff));
  }
`;

