import { css } from "system/util.js";

export default css`
  .runner {
    font-size: var(--kit-font-size-xs);
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--kit-space-xs);
    padding: var(--kit-space-xs) var(--kit-space-s);
    border-bottom: 1px solid var(--eskit-color-border);
    flex-shrink: 0;
  }

  .summary {
    margin-left: auto;
    color: var(--kit-fg-secondary);
    font-size: var(--kit-font-size-xs);
  }
  .summary.ok   { color: var(--eskit-color-success); }
  .summary.fail { color: var(--eskit-color-error); }

  .results {
    list-style: none;
    margin: 0;
    padding: var(--kit-space-xs) 0;
    overflow-y: auto;
    flex: 1;
  }

  .section-header {
    padding: 0.2rem 0.7rem;
    font-size: var(--kit-font-size-xs);
    font-weight: var(--kit-font-weight-bold);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    list-style: none;
    color: var(--kit-fg-secondary);
  }

  .result {
    display: grid;
    grid-template-columns: 1.2rem 1fr auto;
    gap: var(--kit-space-xs);
    align-items: baseline;
    padding: 0.18rem var(--kit-space-s);
  }

  .result.pass .icon { color: var(--eskit-color-success); }
  .result.fail .icon { color: var(--eskit-color-error); }
  .result.run  .icon { color: var(--eskit-color-warning); }

  .result .name { font-weight: var(--kit-font-weight-bold); }

  .result .detail {
    font-size: var(--kit-font-size-xs);
    color: var(--kit-fg-tertiary);
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .result.fail .detail { color: var(--eskit-color-error); }
`;

