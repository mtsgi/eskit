import { html } from "system/util.js";
export default html`
  <div class="taskbar" part="bar">
    <button class="launcher-btn" id="launcher-btn" title="ランチャー">☰</button>
    <div class="taskbar-apps" id="taskbar-apps"></div>
    <div class="taskbar-tray">
      <span class="clock" id="clock"></span>
    </div>
  </div>
`;
