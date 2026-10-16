import hamon from "system/hamon.js";

export default (scope) => hamon`
  <div class="launcher-panel" part="panel">
    <div class="launcher-header">
      <input
        type="text"
        id="launcher-search"
        class="kit-textbox kit-flex-fit"
        placeholder=${() => window.System?.i18n?.t("system.searchPlaceholder") || "アプリを検索…"}
      >
    </div>
    <div class="launcher-grid" id="launcher-grid"></div>
  </div>
`;
