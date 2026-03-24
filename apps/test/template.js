import { html } from "system/util.js";

export default html`
  <div class="runner">
    <div class="toolbar">
      <button id="btn-run">▶ Run All Tests</button>
      <button id="btn-notify">🔔 Test Notification</button>
      <span id="summary" class="summary"></span>
    </div>
    <ol id="results" class="results"></ol>
  </div>
`;

