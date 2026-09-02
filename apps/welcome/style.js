import { css } from "system/util.js";

export default css`
  .welcome-wrap {
    padding: 20px;
    color: var(--kit-fg, #e0e0e0);
    line-height: 1.6;
  }

  .welcome-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .welcome-header eskit-icon {
    color: var(--kit-color-primary, #1e8fff);
    flex-shrink: 0;
  }

  .welcome-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .welcome-desc {
    font-size: 0.9rem;
    opacity: 0.85;
    margin: 0;
  }
`;

