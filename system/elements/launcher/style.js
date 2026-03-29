import { css } from "system/util.js";

export default css`
  :host {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: var(--kit-space-s);
    gap: var(--kit-space-s);
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border-bottom: 1px solid var(--eskit-color-border);
  }

  :host([mode="mobile"]) {
    display: none;
  }
`;
