import { css } from "system/util.js";

export default css`
  :host {
    display: contents;
  }

  .context-menu {
    position: fixed;
    margin: 0;
    padding: var(--kit-space-xs) 0;
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-m);
    box-shadow: var(--kit-shadow-6);
    min-width: 180px;
    max-width: 280px;
    z-index: 30000;
    overflow: hidden;
    inset: unset;
  }

  .menu-items {
    display: flex;
    flex-direction: column;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s);
    padding: var(--kit-space-xs) var(--kit-space-m);
    border: none;
    background: transparent;
    color: var(--eskit-color-text);
    font: inherit;
    font-size: var(--kit-font-size-s);
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    line-height: var(--kit-line-height-l);
  }

  .menu-item:hover,
  .menu-item:focus-visible {
    background: var(--eskit-color-primary);
    color: var(--eskit-color-on-primary, #fff);
    outline: none;
  }

  .menu-item-icon {
    width: 1.2em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .menu-separator {
    height: 1px;
    background: var(--eskit-color-border);
    margin: var(--kit-space-xs) 0;
  }
`;
