import { html } from "system/util.js";
export default html`
  <div class="beacon-overlay" id="overlay">
    <div class="beacon-panel">
      <div class="beacon-header">
        <span class="beacon-icon">🔍</span>
        <input type="text" id="beacon-input" class="kit-textbox kit-flex-fit -rounded" placeholder="アプリを検索…" autocomplete="off">
      </div>
      <div class="beacon-results" id="beacon-results"></div>
    </div>
  </div>
`;
