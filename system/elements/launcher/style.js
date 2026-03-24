import { css } from "system/util.js";

export default css`
  :host {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 0.5rem;
    gap: 0.5rem;
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border-bottom: 1px solid var(--eskit-color-border);
  }

  :host([mode="mobile"]) {
    display: none;
  }

  input, button {
    font: inherit;
    min-width: 0;
    border: 1px solid var(--eskit-color-border);
    background: var(--eskit-color-background);
    color: var(--eskit-color-text);
    padding: 0.25rem 0.5rem;
  }
`;
