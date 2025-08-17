import { css } from "system/util.js";

export default css`
  :host {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 1rem;
    gap: 0.5rem;
    background: var(--eskit-color-background);
    border-bottom: 1px solid var(--eskit-color-border);
  }

  input, button {
    font: inherit;
    min-width: 0;
    border: 1px solid var(--eskit-color-border);
    border-radius: 0.5rem;
    padding: 0.25rem 0.5rem;
  }
`;
