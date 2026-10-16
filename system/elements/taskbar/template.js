import hamon from "system/hamon.js";

export default (scope) => hamon`
  <div class="taskbar" part="taskbar">
    <button
      class="launcher-btn"
      id="launcher-btn"
      title=${() => window.System?.i18n?.t("system.launcher") || "ランチャー"}
      aria-label=${() => window.System?.i18n?.t("system.launcher") || "ランチャー"}
    >
      <eskit-icon set="lucide" name="boxes" size="20"></eskit-icon>
    </button>
    <div class="taskbar-apps" id="taskbar-apps"></div>
    <div class="taskbar-tray">
      <div class="clock" id="clock"></div>
    </div>
  </div>
`;
