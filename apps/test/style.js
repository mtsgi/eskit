import { css } from "system/util.js";

export default css`
  .runner {
    font-size: 0.82rem;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid #313244;
    flex-shrink: 0;
  }

  .toolbar button {
    padding: 0.25rem 0.65rem;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .summary {
    margin-left: auto;
    color: #a6adc8;
    font-size: 0.78rem;
  }
  .summary.ok   { color: #a6e3a1; }
  .summary.fail { color: #f38ba8; }

  .results {
    list-style: none;
    margin: 0;
    padding: 0.25rem 0;
    overflow-y: auto;
    flex: 1;
  }

  .result {
    display: grid;
    grid-template-columns: 1.2rem 1fr auto;
    gap: 0.4rem;
    align-items: baseline;
    padding: 0.18rem 0.7rem;
  }

  .result.pass .icon { color: #a6e3a1; }
  .result.fail .icon { color: #f38ba8; }
  .result.run  .icon { color: #fab387; }

  .result .name { font-weight: 500; }

  .result .detail {
    font-size: 0.72rem;
    color: #6c7086;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .result.fail .detail { color: #f38ba8; }
`;

