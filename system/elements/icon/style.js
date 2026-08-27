import { css } from "system/util.js";

export default css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    line-height: 0;
    width: var(--eskit-icon-size, 1em);
    height: var(--eskit-icon-size, 1em);
    color: inherit;
    box-sizing: border-box;
    pointer-events: none;
    user-select: none;
  }

  svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }
`;
