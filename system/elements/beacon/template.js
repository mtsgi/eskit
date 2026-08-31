import hamon from "system/hamon.js";

export default (scope) => hamon`
  <div class="beacon-overlay" id="overlay">
    <div class="beacon-panel">
      <div class="beacon-header">
        <span class="beacon-icon"><eskit-icon set="lucide" name="search" size="18"></eskit-icon></span>
        <input
          type="text"
          id="beacon-input"
          class="kit-textbox kit-flex-fit -rounded"
          placeholder=${() => window.System?.i18n?.t("system.searchPlaceholder") || "アプリを検索…"}
          autocomplete="off"
        >
      </div>
      <div class="beacon-results" id="beacon-results"></div>
    </div>
  </div>
`;
