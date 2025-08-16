import { css } from "system/util.js";

export default css`
  :host {
    display: block;
    border: 1px solid var(--eskit-color-border);
    background: var(--eskit-color-background);
    margin: 1rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
  }

  .app-header {
    display: grid;
    grid-template-columns: 1fr auto;
    margin-bottom: 0.5rem;
  }

  .app-header button {
    background: var(--eskit-color-error);
    border: none;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    color: #fff;
  }

  .app-template {
    background: #fff;
    border: 1px solid var(--eskit-color-border);
    border-radius: 0.25rem;
  }
`;
