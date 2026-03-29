import { html } from "system/util.js";
export default html`
  <div class="launcher-panel" part="panel">
    <div class="launcher-header">
      <input type="text" id="launcher-search" class="kit-textbox kit-flex-fit" placeholder="アプリを検索…">
    </div>
    <div class="launcher-grid" id="launcher-grid"></div>
  </div>
`;
