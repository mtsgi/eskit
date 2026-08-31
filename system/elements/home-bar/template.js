import hamon from "system/hamon.js";

export default (scope) => hamon`
  <button class="home-btn kit-button -flat" id="home-btn" title=${() => window.System?.i18n?.t("system.home") || "ホーム / ドロワー"}>
    <eskit-icon set="lucide" name="boxes" size="20"></eskit-icon>
  </button>
  <span class="current-app" id="current-app-name"></span>
`;
