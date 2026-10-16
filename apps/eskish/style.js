import { css } from "system/util.js";

export default css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    color: #c9d1d9;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 13px;
    box-sizing: border-box;
  }

  .terminal {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px 12px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .output {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
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
    color: #8b949e;
  }

  .line.command .prompt {
    color: var(--kit-color-primary, #58a6ff);
    font-weight: 600;
    margin-right: 6px;
  }

  .line.command .text {
    color: #f0f6fc;
    font-weight: 600;
  }

  .line.error .text {
    color: #f85149;
  }

  .line.success .text {
    color: #7ee787;
  }

  .line.info .text {
    color: #79c0ff;
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
    color: var(--kit-color-primary, #58a6ff);
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
    color: #f0f6fc;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    caret-color: #58a6ff;
  }
`;

